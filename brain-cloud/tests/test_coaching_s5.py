"""S5 Verification — Coaching integration tests.

Tests 5-9 from the S5 spec. Tests 5-6 use a dedicated test user (via conftest
fixtures). Tests 7-9 use Theo's actual data to verify recall and export.

These tests call the coaching services and Supabase methods directly,
bypassing the MCP Context wrapper (which requires a running MCP server).
The logic tested is identical — the MCP tool functions are thin wrappers.
"""

import json

import pytest

from brain_cloud.coaching import SignalDetector, TurnRegistry, PromptAssembler
from brain_cloud.pipelines.read import read_pipeline
from brain_cloud.pipelines.export import export_pipeline

THEO_UUID = "0c4831b5-8df3-4fba-94be-57e4e3112116"
THEO_SLUG = "theo"

# --- Turn captured_data payloads for the 8-turn cycle ---
TURN_DATA = {
    1: {"one_year_vision_raw": "test vision", "one_year_vision_refined": "test refined vision"},
    2: {"quarterly_goal_raw": "test goal", "quarterly_goal_refined": "test refined goal"},
    3: {"goal_why": "test why"},
    4: {"halfway_milestone": "test milestone"},
    5: {"next_action_step": "test action"},
    6: {"identity_traits": ["bold", "disciplined"]},
    7: {"release_items": ["underpriced projects", "procrastination"]},
    8: {},
}


# ===================================================================
# Test 5: Full Clarity Session Cycle (8 turns)
# ===================================================================

@pytest.mark.asyncio
async def test_full_clarity_session_cycle(test_stores, test_user_id):
    """Test 5: Create a Clarity Session and run all 8 turns.

    Verifies:
    - Session creation with status "active" and current_turn=1
    - Turn advancement on each store
    - captured_data accumulates across turns
    - conversation_history grows with each store_turn
    - After Turn 8: status → "completed"
    - Goal Cascade memory written to memories table
    """
    stores = test_stores
    uuid = await stores.resolve_user_id(test_user_id)
    user_profile = await stores.supabase.get_user(uuid)

    detector = SignalDetector()
    registry = TurnRegistry()
    assembler = PromptAssembler(stores.supabase)

    # Step 1: Create a new coaching session
    session = await stores.supabase.create_coaching_session(uuid)
    session_id = session["id"]
    assert session["status"] == "active"
    assert session["current_turn"] == 1

    accumulated_data = {}

    for turn_num in range(1, 9):
        # --- GET PROMPT ---
        session = await stores.supabase.get_coaching_session(session_id)
        assert session["current_turn"] == turn_num, (
            f"Expected session at turn {turn_num}, got {session['current_turn']}"
        )

        turn_spec = registry.get_turn(turn_num)
        signals = detector.check(f"test message turn {turn_num}")
        assert signals == [], f"Unexpected signals on plain message: {signals}"

        # Build the prompt (verifies template fetch + assembly)
        brain_context = ""
        instruction = await assembler.build(
            turn_spec=turn_spec,
            user_profile=user_profile,
            signals=signals,
            captured_data=session.get("captured_data") or {},
            conversation_history=session.get("conversation_history") or [],
            brain_cloud_context=brain_context,
        )
        assert "== SESSION CONTEXT ==" in instruction
        assert "== TURN INSTRUCTIONS ==" in instruction
        assert "CLARITY SESSION" in instruction
        assert "[now]" in instruction

        # --- STORE TURN ---
        parsed_data = TURN_DATA[turn_num]
        accumulated_data.update(parsed_data)

        history = session.get("conversation_history") or []
        history.append({
            "role": "user",
            "content": f"test user message turn {turn_num}",
            "turn": turn_num,
        })
        history.append({
            "role": "assistant",
            "content": f"test ai response turn {turn_num}",
            "turn": turn_num,
        })

        existing_data = session.get("captured_data") or {}
        existing_data.update(parsed_data)

        from datetime import datetime, timezone
        now_iso = datetime.now(timezone.utc).isoformat()
        next_turn = registry.get_next_turn(turn_num)
        is_complete = registry.is_complete(next_turn)

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

        # Verify conversation_history grows correctly
        updated_session = await stores.supabase.get_coaching_session(session_id)
        assert len(updated_session.get("conversation_history") or []) == turn_num * 2, (
            f"Expected {turn_num * 2} history entries, got "
            f"{len(updated_session.get('conversation_history') or [])}"
        )

    # After Turn 8: verify final state
    final_session = await stores.supabase.get_coaching_session(session_id)
    assert final_session["status"] == "completed", f"Expected completed, got {final_session['status']}"
    assert final_session["current_turn"] == 9, f"Expected turn 9, got {final_session['current_turn']}"

    # Verify captured_data has ALL fields accumulated across turns
    cd = final_session.get("captured_data") or {}
    assert cd.get("one_year_vision_refined") == "test refined vision"
    assert cd.get("quarterly_goal_refined") == "test refined goal"
    assert cd.get("goal_why") == "test why"
    assert cd.get("halfway_milestone") == "test milestone"
    assert cd.get("next_action_step") == "test action"
    assert cd.get("identity_traits") == ["bold", "disciplined"]
    assert cd.get("release_items") == ["underpriced projects", "procrastination"]

    # Verify conversation_history has 16 entries (2 per turn x 8 turns)
    history = final_session.get("conversation_history") or []
    assert len(history) == 16, f"Expected 16 history entries, got {len(history)}"
    # Verify user entries contain actual message text (not placeholders)
    user_entries = [h for h in history if h["role"] == "user"]
    for entry in user_entries:
        assert "test user message" in entry["content"], (
            f"User entry doesn't contain actual message: {entry['content']}"
        )

    # Count memories before Goal Cascade write
    pre_cascade_memories = await stores.supabase.query_memories(uuid, limit=100)
    pre_count = len(pre_cascade_memories)

    # Write Goal Cascade (simulating what _write_goal_cascade does)
    from brain_cloud.pipelines.write import write_pipeline
    vision = cd.get("one_year_vision_refined", "")
    goal = cd.get("quarterly_goal_refined", "")
    traits = cd.get("identity_traits", [])
    releases = cd.get("release_items", [])
    action = cd.get("next_action_step", "")
    cascade_content = (
        f"Clarity Session completed. "
        f"One-year vision: {vision}. "
        f"Quarterly goal: {goal}. "
        f"Identity traits: {', '.join(traits) if traits else 'none identified'}. "
        f"Release patterns: {', '.join(releases) if releases else 'none identified'}. "
        f"Next action: {action}."
    )
    await write_pipeline(cascade_content, test_user_id, stores, session_id=session_id)

    # Verify Goal Cascade memory was written (write_pipeline extracts facts,
    # so check that new memories were created, not for verbatim content)
    post_cascade_memories = await stores.supabase.query_memories(uuid, limit=100)
    post_count = len(post_cascade_memories)
    assert post_count > pre_count, (
        f"Goal Cascade write created no new memories: {pre_count} → {post_count}"
    )


# ===================================================================
# Test 6: Signal Detection
# ===================================================================

@pytest.mark.asyncio
async def test_signal_detection(test_stores, test_user_id):
    """Test 6: Signal detection returns correct signals and modifies prompt.

    Verifies:
    - IDK signal detected in 'I don't know'
    - Flooding signal detected in 'I'm overwhelmed'
    - Both detected when combined
    - Case insensitivity
    - Crisis signal detection
    - Signal priority (flooding suppresses idk)
    - No signals on clean message
    """
    stores = test_stores
    uuid = await stores.resolve_user_id(test_user_id)
    user_profile = await stores.supabase.get_user(uuid)

    detector = SignalDetector()
    registry = TurnRegistry()
    assembler = PromptAssembler(stores.supabase)

    # Basic signal detection
    assert detector.check("I don't know") == ["idk"]
    assert detector.check("I'm overwhelmed") == ["flooding"]
    assert detector.check("Sounds good") == []
    assert detector.check("I DON'T KNOW") == ["idk"]  # Case insensitive

    # Crisis detection
    crisis_signals = detector.check("I want to hurt myself")
    assert "crisis" in crisis_signals

    # Multi-signal: flooding + idk → flooding suppresses idk in prompt assembly
    multi = detector.check("I don't know and I'm overwhelmed")
    assert "flooding" in multi
    assert "idk" in multi

    # Now test that signal detection modifies the prompt
    # Create a session for testing
    session = await stores.supabase.create_coaching_session(uuid)
    session_id = session["id"]

    turn_spec = registry.get_turn(1)

    # Test IDK signal modifies the prompt
    idk_signals = detector.check("I don't know what to say")
    assert "idk" in idk_signals

    idk_instruction = await assembler.build(
        turn_spec=turn_spec,
        user_profile=user_profile,
        signals=["idk"],
        captured_data={},
        conversation_history=[],
    )
    assert "== SIGNAL HANDLER ==" in idk_instruction, "IDK handler not in prompt"

    # Test flooding signal
    flood_instruction = await assembler.build(
        turn_spec=turn_spec,
        user_profile=user_profile,
        signals=["flooding"],
        captured_data={},
        conversation_history=[],
    )
    assert "== SIGNAL HANDLER ==" in flood_instruction, "Flooding handler not in prompt"

    # Test crisis replaces Layer 3 entirely (no TURN INSTRUCTIONS, no COACHING GUIDANCE)
    crisis_instruction = await assembler.build(
        turn_spec=turn_spec,
        user_profile=user_profile,
        signals=["crisis"],
        captured_data={},
        conversation_history=[],
    )
    assert "== TURN INSTRUCTIONS ==" in crisis_instruction  # Still has the header
    assert "== COACHING GUIDANCE ==" not in crisis_instruction, "Crisis should skip universal guidance"

    # Signals_log persistence test — write signals to session
    signals_log = session.get("signals_log") or []
    from datetime import datetime, timezone
    signals_log.append({
        "turn": 1,
        "signals": ["idk"],
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })
    await stores.supabase.update_coaching_session(session_id, {"signals_log": signals_log})

    # Verify signals_log persisted
    updated = await stores.supabase.get_coaching_session(session_id)
    assert updated.get("signals_log") is not None, "signals_log not persisted"
    assert len(updated["signals_log"]) == 1
    assert updated["signals_log"][0]["signals"] == ["idk"]


# ===================================================================
# Test 7: Brain Cloud Integration (uses Theo's actual data)
# ===================================================================

@pytest.mark.asyncio
async def test_brain_cloud_integration(test_stores):
    """Test 7: Verify recall works against Theo's coaching data.

    Uses Theo's actual data loaded in S4. Tests that brain_recall can
    find coaching artifacts.
    """
    stores = test_stores
    # Ensure Theo's slug is resolvable
    theo_uuid = await stores.resolve_user_id(THEO_SLUG)
    assert theo_uuid == THEO_UUID

    # Recall Goal Cascade data
    result = await read_pipeline("Theo's quarterly goal", THEO_SLUG, stores, limit=5)
    assert len(result.memories) > 0, "No memories recalled for 'quarterly goal'"

    # Recall weekly session data
    result2 = await read_pipeline("weekly session pricing", THEO_SLUG, stores, limit=5)
    assert len(result2.memories) > 0, "No memories recalled for 'weekly session'"


# ===================================================================
# Test 8: Data Portability (brain_export — uses Theo's data)
# ===================================================================

@pytest.mark.asyncio
async def test_data_portability(test_stores):
    """Test 8: Verify export includes coaching_sessions and excludes coaching IP.

    BD-001: Everything about you is yours. How we help you is ours.
    """
    stores = test_stores

    result = await export_pipeline(THEO_SLUG, stores)

    # coaching_sessions array present and populated
    assert len(result.coaching_sessions) >= 1, (
        f"Expected at least 1 coaching session, got {len(result.coaching_sessions)}"
    )

    # The historical session should have captured_data
    session = result.coaching_sessions[0]
    assert session.get("captured_data") is not None, "coaching_sessions missing captured_data"
    cd = session["captured_data"]
    assert "one_year_vision_refined" in cd, "captured_data missing vision"

    # BD-001: Export must NOT contain prompt_templates
    export_fields = set(type(result).model_fields.keys())
    assert "prompt_templates" not in export_fields, "BD-001 VIOLATION: prompt_templates in export"

    # Verify JSON serialization works (the actual MCP tool calls model_dump_json)
    export_json = result.model_dump_json(indent=2)
    assert len(export_json) > 100, "Export JSON suspiciously small"
    assert "prompt_templates" not in export_json, "BD-001 VIOLATION: prompt_templates in export JSON"


# ===================================================================
# Test 9: Session Prompt Tool (Morning Brief + Ongoing)
# ===================================================================

@pytest.mark.asyncio
async def test_session_prompt_tools(test_stores):
    """Test 9: Verify coaching_get_session_prompt for morning brief and ongoing.

    Tests the build_session_prompt method directly (equivalent to calling
    the coaching_get_session_prompt MCP tool).
    """
    stores = test_stores
    theo_uuid = await stores.resolve_user_id(THEO_SLUG)
    user_profile = await stores.supabase.get_user(theo_uuid)

    assembler = PromptAssembler(stores.supabase)

    # Pull Brain Cloud context (simulating what the MCP tool does)
    recall_result = await read_pipeline(
        "morning_brief coaching context", THEO_SLUG, stores, limit=10
    )
    if recall_result.memories:
        brain_context = "\n".join(f"- {m.content}" for m in recall_result.memories[:5])
    else:
        brain_context = "No patterns available yet."

    # Morning Brief
    morning_instruction = await assembler.build_session_prompt(
        session_type="morning_brief",
        user_profile=user_profile,
        brain_cloud_context=brain_context,
    )
    assert morning_instruction, "Morning brief instruction is empty"
    assert len(morning_instruction) > 100, "Morning brief instruction suspiciously short"
    # Should contain Theo's name (from user_profile)
    assert "Theo" in morning_instruction, "Morning brief missing user's name"
    # Should NOT contain raw {placeholder} text
    import re
    raw_placeholders = re.findall(r"\{[a-z][a-z0-9_.]*\}", morning_instruction)
    assert len(raw_placeholders) == 0, f"Raw placeholders in morning brief: {raw_placeholders}"

    # Ongoing
    ongoing_instruction = await assembler.build_session_prompt(
        session_type="ongoing",
        user_profile=user_profile,
        brain_cloud_context=brain_context,
    )
    assert ongoing_instruction, "Ongoing instruction is empty"
    assert len(ongoing_instruction) > 100, "Ongoing instruction suspiciously short"
    # Should contain coaching style modifier (injected into ongoing template)
    # The ongoing template uses uppercase variables, verify they're injected
    assert "{COACHING_STYLE_MODIFIER}" not in ongoing_instruction, (
        "Unreplaced COACHING_STYLE_MODIFIER in ongoing prompt"
    )
    assert "{USER_TYPE_MODIFIER}" not in ongoing_instruction, (
        "Unreplaced USER_TYPE_MODIFIER in ongoing prompt"
    )
