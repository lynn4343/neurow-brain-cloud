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
from brain_cloud.temporal import compute_action_due_date

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
    parts = display_name.split()
    if not parts:
        return json.dumps({"error": "display_name cannot be empty"}, indent=2)
    fname = first_name or parts[0]
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
async def brain_update_profile(
    user_id: str,
    profile_data: str,
    ctx: Context,
) -> str:
    """Update a user's profile with onboarding data. profile_data is a JSON
    string of fields to update (roles, focus_area, coaching_style, etc.).
    user_id is the slug (e.g. 'theo')."""
    stores: StoreManager = ctx.request_context.lifespan_context
    uuid = await stores.resolve_user_id(user_id)
    try:
        parsed = json.loads(profile_data)
    except json.JSONDecodeError as e:
        return json.dumps({"error": f"Invalid profile_data JSON: {e}", "updated": False}, indent=2)
    if not isinstance(parsed, dict):
        return json.dumps({"error": "profile_data must be a JSON object", "updated": False}, indent=2)
    # Whitelist allowed fields to prevent injection
    ALLOWED_FIELDS = {
        "roles", "focus_area", "coaching_style", "declared_challenges",
        "is_business_owner", "side_hustle_goal",
        "business_description", "business_stage",
        "current_business_focus", "business_challenges",
        "career_situation", "career_stage",
        "career_focus", "career_challenges",
        "love_partner_situation", "onboarding_completed",
    }
    safe_data = {k: v for k, v in parsed.items() if k in ALLOWED_FIELDS}
    await stores.supabase.update_user(uuid, safe_data)
    return json.dumps({"updated": True, "fields": list(safe_data.keys())})


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
    """Write coaching outputs to all 4 Brain Cloud stores (Turn 9)."""
    vision = captured_data.get("one_year_vision_refined", "")
    goal = captured_data.get("quarterly_goal_refined", "")
    traits = captured_data.get("identity_traits", [])
    releases = captured_data.get("release_items", [])
    action = captured_data.get("next_action_step", "")
    due_date = compute_action_due_date(datetime.now(timezone.utc))

    content = (
        f"Clarity Session completed. "
        f"One-year vision: {vision}. "
        f"Quarterly goal: {goal}. "
        f"Identity traits: {', '.join(traits) if traits else 'none identified'}. "
        f"Release patterns: {', '.join(releases) if releases else 'none identified'}. "
        f"Next action: {action}. "
        f"Action due: {due_date}."
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
    # Optional: store previous turn in the same call (eliminates second MCP round trip)
    previous_turn_number: int | None = None,
    captured_data: str | None = None,
    ai_response: str | None = None,
) -> str:
    """Get the next coaching instruction for a Clarity Session turn. Creates a
    new session if session_id is None. Detects signals in user_message, assembles
    the 4-layer prompt stack, and returns structured JSON with the system
    instruction. user_id is the slug (e.g. 'theo').

    Optional: pass previous_turn_number, captured_data, and ai_response to store
    the previous turn's data in the same call. This combines coaching_store_turn +
    coaching_get_prompt into one round trip, saving ~2-3 seconds per turn."""
    stores: StoreManager = ctx.request_context.lifespan_context
    uuid = await stores.resolve_user_id(user_id)
    user_profile = await stores.supabase.get_user(uuid)
    if not user_profile:
        return json.dumps({"error": "User not found", "user_id": user_id}, indent=2)

    # 0. Ensure Neo4j user node exists (lazy creation for direct-API-created profiles).
    # create_user_node is MERGE-based — idempotent, safe on every call.
    try:
        await stores.neo4j.create_user_node(str(uuid), user_profile.get("display_name", ""))
    except Exception as e:
        logger.warning(f"Neo4j user node ensure failed (non-blocking): {e}")

    # 1. Session creation or retrieval
    is_new_session = session_id is None
    if is_new_session:
        # Guard: prevent orphaned sessions from post-completion AI tool calls.
        # If the AI calls coaching_get_prompt without a session_id right after
        # coaching_store_turn completed the session, block session creation.
        recent = await stores.supabase.get_most_recent_session(str(uuid))
        if recent and recent.get("status") == "completed":
            completed_at = recent.get("completed_at")
            if completed_at:
                try:
                    completed_dt = datetime.fromisoformat(completed_at)
                    elapsed = (datetime.now(timezone.utc) - completed_dt).total_seconds()
                    if elapsed < 60:
                        return json.dumps({
                            "turn_number": -1,
                            "turn_name": "session_just_completed",
                            "system_instruction": "The user's coaching session was just completed. Do not start a new session.",
                            "session_id": recent["id"],
                            "session_complete": True,
                        }, indent=2)
                except (ValueError, TypeError):
                    pass  # Malformed timestamp — proceed normally

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

    # 1c. Welcome message for new sessions (before Turn 1)
    if is_new_session:
        assembler = PromptAssembler(stores.supabase)
        try:
            welcome_text = await assembler.build_welcome_message(user_profile)
        except Exception as e:
            logger.warning(f"Welcome message failed, proceeding to Turn 1: {e}")
            welcome_text = None

        if welcome_text:
            welcome_instruction = (
                "== WELCOME MESSAGE ==\n\n"
                "Deliver the following welcome message to the user. "
                "This is your opening — the user's first impression of Neurow as a coach. "
                "Deliver it warmly and naturally as your own voice. Do not add to it or "
                "paraphrase it — send it as your complete response.\n\n"
                "After the user responds, call coaching_get_prompt again with their "
                "response to begin Turn 1. This is a welcome-only turn — do NOT call "
                "coaching_store_turn.\n\n"
                "---\n\n"
                f"{welcome_text}"
            )
            return json.dumps({
                "turn_number": 0,
                "turn_name": "welcome",
                "system_instruction": welcome_instruction,
                "data_to_capture": {},
                "signals_detected": [],
                "session_id": session_id,
                "session_complete": False,
            }, indent=2)

    # 1d. Optional: store previous turn data (combined call optimization).
    # When the AI passes previous turn data, we store it here instead of
    # requiring a separate coaching_store_turn call. Saves one MCP round trip.
    if previous_turn_number is not None and captured_data is not None:
        if previous_turn_number != session.get("current_turn"):
            return json.dumps({
                "error": f"Turn mismatch: session at turn {session.get('current_turn')}, got {previous_turn_number}",
                "stored": False,
            }, indent=2)

        try:
            parsed_data = json.loads(captured_data) if isinstance(captured_data, str) else captured_data
        except json.JSONDecodeError as e:
            return json.dumps({"error": f"Invalid captured_data JSON: {e}", "stored": False}, indent=2)

        # Validate captured_data keys (warning only)
        registry_check = TurnRegistry()
        try:
            turn_spec_check = registry_check.get_turn(previous_turn_number)
        except (KeyError, IndexError, ValueError) as e:
            return json.dumps({"error": f"Invalid previous_turn_number: {previous_turn_number}", "stored": False}, indent=2)
        expected_keys = set(turn_spec_check.data_to_capture.keys())
        actual_keys = set(parsed_data.keys()) if parsed_data else set()
        missing_keys = expected_keys - actual_keys
        if missing_keys:
            logger.warning(f"Turn {previous_turn_number}: missing expected fields: {missing_keys}")

        # Merge captured_data + conversation_history + advance turn
        existing_data = session.get("captured_data") or {}
        existing_data.update(parsed_data)

        history = session.get("conversation_history") or []
        # user_message is the user's response to the previous turn's AI output —
        # it's the input that triggered this combined call, closing out the previous turn.
        history.append({"role": "user", "content": user_message, "turn": previous_turn_number})
        history.append({"role": "assistant", "content": ai_response or "", "turn": previous_turn_number})

        next_turn = registry_check.get_next_turn(previous_turn_number)
        now_iso = datetime.now(timezone.utc).isoformat()

        await stores.supabase.update_coaching_session(session_id, {
            "captured_data": existing_data,
            "conversation_history": history,
            "current_turn": next_turn,
            "updated_at": now_iso,
        })

        # Re-fetch session so the rest of the function reads the updated state
        session = await stores.supabase.get_coaching_session(session_id)

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

    # 4. Brain Cloud context (warm-start — turns 8+ or if data exists)
    brain_context = ""
    if current_turn >= 8:
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

    # 5. Turn 9: Write Goal Cascade to Brain Cloud
    if turn_number == 9:
        try:
            await _write_goal_cascade(user_id, existing_data, stores, session_id)
        except Exception as e:
            logger.error(f"Goal cascade write failed for session {session_id}: {e}")

    response = {
        "stored": True,
        "turn_advanced_to": next_turn,
        "session_complete": is_complete,
    }

    if turn_number == 9 and is_complete:
        due_date = compute_action_due_date(datetime.now(timezone.utc))
        goal_cascade_data = {
            "vision": existing_data.get("one_year_vision_refined", ""),
            "quarterly_goal": existing_data.get("quarterly_goal_refined", ""),
            "goal_why": existing_data.get("goal_why", ""),
            "identity_traits": existing_data.get("identity_traits", []),
            "release_items": existing_data.get("release_items", []),
            "next_action_step": existing_data.get("next_action_step", ""),
            "next_action_due": due_date,
        }
        response["goal_cascade"] = goal_cascade_data

        # Server-authoritative: persist goal cascade to user profile
        session_user_id = str(session.get("user_id"))
        try:
            await stores.supabase.update_user(session_user_id, {
                "goal_cascade": goal_cascade_data,
                "clarity_session_completed": True,
            })
        except Exception as e:
            logger.error(f"Goal cascade profile write failed: {e}")

    return json.dumps(response, indent=2)


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
    if not user_profile:
        return json.dumps({"error": "User not found", "user_id": user_id}, indent=2)

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
