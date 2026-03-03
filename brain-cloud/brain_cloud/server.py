import json
import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from mcp.server.fastmcp import FastMCP, Context

from brain_cloud.config import Settings
from brain_cloud.stores import StoreManager
from brain_cloud.pipelines.write import write_pipeline
from brain_cloud.pipelines.read import read_pipeline
from brain_cloud.pipelines.export import export_pipeline
from brain_cloud.coaching import SignalDetector, TurnRegistry, PromptAssembler

logging.basicConfig(level=logging.INFO, format="%(name)s %(levelname)s: %(message)s")
logger = logging.getLogger(__name__)


@asynccontextmanager
async def app_lifespan(server: FastMCP) -> AsyncIterator[StoreManager]:
    """Initialize all 4 store connections on startup, close on shutdown."""
    settings = Settings()
    store_manager = await StoreManager.create(settings)
    logger.info("Brain Cloud: all 4 stores connected")
    try:
        yield store_manager
    finally:
        await store_manager.close()
        logger.info("Brain Cloud: all stores closed")


mcp = FastMCP(
    "Brain Cloud",
    instructions="Four-store cognitive memory architecture for personal AI coaching",
    lifespan=app_lifespan,
)


@mcp.tool()
async def brain_create_profile(
    display_name: str,
    ctx: Context,
    first_name: str | None = None,
    coaching_style: str = "balanced",
) -> str:
    """Create a new user profile for Brain Cloud. Required before storing
    or recalling memories for a new user. Returns the user slug and UUID.
    Use the slug as user_id in other brain_* tools."""
    stores: StoreManager = ctx.request_context.lifespan_context
    # first_name defaults to first word of display_name
    fname = first_name or display_name.split()[0]
    user_data = {
        "display_name": display_name,
        "first_name": fname,
        "coaching_style": coaching_style,
        "is_demo_user": False,
        "onboarding_completed": False,
    }
    result = await stores.supabase.insert_user(user_data)
    user_uuid = result["id"]
    slug = fname.lower()
    # Handle slug collision — append number if slug already exists
    if slug in stores._slug_to_uuid:
        counter = 2
        while f"{slug}_{counter}" in stores._slug_to_uuid:
            counter += 1
        slug = f"{slug}_{counter}"
    # Cache the slug -> UUID mapping
    stores._slug_to_uuid[slug] = user_uuid
    # Create the :User node in Neo4j
    await stores.neo4j.create_user_node(user_uuid, display_name)
    return json.dumps({
        "slug": slug,
        "user_id": user_uuid,
        "display_name": display_name,
        "message": f"Profile created. Use user_id='{slug}' in other tools.",
    }, indent=2)


@mcp.tool()
async def brain_remember(
    content: str,
    user_id: str,
    ctx: Context,
    session_id: str | None = None,
) -> str:
    """Store a memory across all four cognitive stores (Supabase, Neo4j, Mem0,
    Qdrant). Extracts facts, entities, and relationships from natural language
    input. user_id is the slug (e.g. 'theo') — create a profile first with
    brain_create_profile if the user doesn't exist yet.
    Returns memory IDs and per-store sync status."""
    stores: StoreManager = ctx.request_context.lifespan_context
    result = await write_pipeline(content, user_id, stores, session_id=session_id)
    return result.model_dump_json(indent=2)


@mcp.tool()
async def brain_recall(
    query: str,
    user_id: str,
    ctx: Context,
    limit: int = 10,
    category: str | None = None,
) -> str:
    """Retrieve memories using parallel multi-store search. Queries all four
    stores simultaneously, fuses results, and ranks by recency-weighted
    relevance scoring. user_id is the slug (e.g. 'theo')."""
    stores: StoreManager = ctx.request_context.lifespan_context
    result = await read_pipeline(query, user_id, stores, limit=limit, category=category)
    return result.model_dump_json(indent=2)


@mcp.tool()
async def brain_export(
    user_id: str,
    ctx: Context,
) -> str:
    """Export all user data as portable JSON. Gathers from all four stores.
    Excludes coaching IP (prompt templates). BD-001: Everything about you
    is yours. How we help you is ours. user_id is the slug (e.g. 'theo')."""
    stores: StoreManager = ctx.request_context.lifespan_context
    result = await export_pipeline(user_id, stores)
    return result.model_dump_json(indent=2)


# ---------------------------------------------------------------------------
# Coaching helpers
# ---------------------------------------------------------------------------

def format_recall_for_prompt(recall_result) -> str:
    """Format brain_recall results into a text block for prompt injection.
    No label prefix — the template already provides the section header (I-8)."""
    if not recall_result.memories:
        return "No patterns available yet."
    lines = []
    for mem in recall_result.memories[:5]:
        lines.append(f"- {mem.content}")
    return "\n".join(lines)


async def _write_goal_cascade(slug, captured_data, stores, session_id):
    """Write coaching outputs to all 4 Brain Cloud stores (Turn 8)."""
    vision = captured_data.get("one_year_vision_refined", "")
    goal = captured_data.get("quarterly_goal_refined", "")
    traits = captured_data.get("identity_traits", [])
    releases = captured_data.get("release_items", [])
    action = captured_data.get("next_action_step", "")

    content = (
        f"Clarity Session completed. "
        f"One-year vision: {vision}. "
        f"Quarterly goal: {goal}. "
        f"Identity traits: {', '.join(traits) if traits else 'none identified'}. "
        f"Release patterns: {', '.join(releases) if releases else 'none identified'}. "
        f"Next action: {action}."
    )

    await write_pipeline(content, slug, stores, session_id=session_id)


# ---------------------------------------------------------------------------
# Coaching MCP Tools
# ---------------------------------------------------------------------------

@mcp.tool()
async def coaching_get_prompt(
    user_id: str,
    user_message: str,
    ctx: Context,
    session_id: str | None = None,
) -> str:
    """Get the next coaching instruction for a Clarity Session turn. Creates a
    new session if session_id is None. Detects signals in user_message, assembles
    the 4-layer prompt stack, and returns structured JSON with the system
    instruction. user_id is the slug (e.g. 'theo')."""
    stores: StoreManager = ctx.request_context.lifespan_context
    uuid = await stores.resolve_user_id(user_id)
    user_profile = await stores.supabase.get_user(uuid)

    # 1. Session creation or retrieval
    if session_id is None:
        session = await stores.supabase.create_coaching_session(uuid)
        session_id = session["id"]
    else:
        session = await stores.supabase.get_coaching_session(session_id)
        if not session:
            return json.dumps({
                "error": "Session not found",
                "session_id": session_id,
                "session_complete": False,
            }, indent=2)

    # 1b. Guard: if session is already completed, return error
    if session.get("status") == "completed":
        return json.dumps({
            "error": "Session already completed",
            "session_id": session_id,
            "session_complete": True,
        }, indent=2)

    # 2. Signal detection
    detector = SignalDetector()
    signals = detector.check(user_message)

    # 3. Get current turn spec
    registry = TurnRegistry()
    current_turn = session["current_turn"]
    if registry.is_complete(current_turn):
        return json.dumps({
            "error": "All turns completed",
            "session_id": session_id,
            "session_complete": True,
        }, indent=2)
    turn_spec = registry.get_turn(current_turn)

    # 4. Brain Cloud context (warm-start — turns 7+ or if data exists)
    brain_context = ""
    if current_turn >= 7:
        recall_result = await read_pipeline(
            "coaching patterns and challenges", user_id, stores, limit=5
        )
        brain_context = format_recall_for_prompt(recall_result)

    # 5. Write signals to signals_log if detected (I-7)
    if signals:
        # Re-fetch session to get latest signals_log (avoids lost updates)
        fresh = await stores.supabase.get_coaching_session(session_id)
        signals_log = (fresh.get("signals_log") if fresh else None) or []
        signals_log.append({
            "turn": current_turn,
            "signals": signals,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })
        await stores.supabase.update_coaching_session(
            session_id, {"signals_log": signals_log}
        )

    # 6. Assemble prompt (I-2: error handling)
    assembler = PromptAssembler(stores.supabase)
    try:
        instruction = await assembler.build(
            turn_spec=turn_spec,
            user_profile=user_profile,
            signals=signals,
            captured_data=session.get("captured_data") or {},
            conversation_history=session.get("conversation_history") or [],
            brain_cloud_context=brain_context,
        )
    except Exception as e:
        logger.error(f"Prompt assembly failed: {e}")
        return json.dumps({
            "error": "Coaching system temporarily unavailable",
            "session_id": session_id,
            "session_complete": False,
        }, indent=2)

    # 7. Return
    return json.dumps({
        "turn_number": turn_spec.turn_number,
        "turn_name": turn_spec.turn_name,
        "system_instruction": instruction,
        "data_to_capture": turn_spec.data_to_capture,
        "signals_detected": signals,
        "session_id": session_id,
        "session_complete": False,
    }, indent=2)


@mcp.tool()
async def coaching_store_turn(
    user_id: str,
    session_id: str,
    turn_number: int,
    captured_data: str,
    user_message: str,
    ai_response: str,
    ctx: Context,
) -> str:
    """Store captured data from a completed coaching turn and advance the session.
    Called by the AI after generating its response. captured_data is a JSON string
    of the fields extracted for this turn. user_id is the slug (e.g. 'theo')."""
    stores: StoreManager = ctx.request_context.lifespan_context
    uuid = await stores.resolve_user_id(user_id)

    session = await stores.supabase.get_coaching_session(session_id)
    if not session:
        return json.dumps({
            "error": "Session not found",
            "session_id": session_id,
            "stored": False,
        }, indent=2)

    # Guard: turn number must match session state (I-4)
    if turn_number != session.get("current_turn"):
        return json.dumps({
            "error": f"Turn mismatch: session at turn {session.get('current_turn')}, got {turn_number}",
            "stored": False,
        }, indent=2)

    # Parse captured_data with error handling (I-1)
    try:
        parsed_data = json.loads(captured_data) if isinstance(captured_data, str) else captured_data
    except json.JSONDecodeError as e:
        return json.dumps({
            "error": f"Invalid captured_data JSON: {e}",
            "stored": False,
        }, indent=2)

    # Validate captured_data keys against turn spec (R-4 — warning only)
    registry = TurnRegistry()
    expected_keys = set(registry.get_turn(turn_number).data_to_capture.keys())
    actual_keys = set(parsed_data.keys()) if parsed_data else set()
    missing_keys = expected_keys - actual_keys
    if missing_keys:
        logger.warning(f"Turn {turn_number}: missing expected fields: {missing_keys}")

    # 1. Merge captured_data into session
    existing_data = session.get("captured_data") or {}
    existing_data.update(parsed_data)

    # 2. Append to conversation_history (store actual user message for Turn 8 synthesis)
    history = session.get("conversation_history") or []
    history.append({"role": "user", "content": user_message, "turn": turn_number})
    history.append({"role": "assistant", "content": ai_response, "turn": turn_number})

    # 3. Advance turn
    next_turn = registry.get_next_turn(turn_number)
    is_complete = registry.is_complete(next_turn)

    # 4. Update session
    now_iso = datetime.now(timezone.utc).isoformat()
    update_data = {
        "captured_data": existing_data,
        "conversation_history": history,
        "current_turn": next_turn,
        "updated_at": now_iso,
    }

    if is_complete:
        update_data["status"] = "completed"
        update_data["completed_at"] = now_iso

    await stores.supabase.update_coaching_session(session_id, update_data)

    # 5. Turn 8: Write Goal Cascade to Brain Cloud
    if turn_number == 8:
        try:
            await _write_goal_cascade(user_id, existing_data, stores, session_id)
        except Exception as e:
            logger.error(f"Goal cascade write failed for session {session_id}: {e}")

    return json.dumps({
        "stored": True,
        "turn_advanced_to": next_turn,
        "session_complete": is_complete,
    }, indent=2)


@mcp.tool()
async def coaching_get_session_prompt(
    user_id: str,
    session_type: str,
    ctx: Context,
) -> str:
    """Get a coaching prompt for non-Clarity sessions (morning brief, weekly review,
    ongoing coaching). Returns assembled system instruction with user context
    and Brain Cloud history. user_id is the slug (e.g. 'theo')."""
    stores: StoreManager = ctx.request_context.lifespan_context
    uuid = await stores.resolve_user_id(user_id)
    user_profile = await stores.supabase.get_user(uuid)

    # Pull relevant Brain Cloud context
    recall_result = await read_pipeline(
        f"{session_type} coaching context", user_id, stores, limit=10
    )
    brain_context = format_recall_for_prompt(recall_result)

    # Assemble prompt
    assembler = PromptAssembler(stores.supabase)
    try:
        instruction = await assembler.build_session_prompt(
            session_type=session_type,
            user_profile=user_profile,
            brain_cloud_context=brain_context,
        )
    except Exception as e:
        logger.error(f"Session prompt assembly failed: {e}")
        return json.dumps({
            "error": "Coaching system temporarily unavailable",
            "session_type": session_type,
        }, indent=2)

    return json.dumps({
        "session_type": session_type,
        "system_instruction": instruction,
    }, indent=2)


def main():
    mcp.run(transport="stdio")


if __name__ == "__main__":
    main()
