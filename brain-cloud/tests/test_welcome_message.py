"""Welcome Message tests — Draft 3 build spec verification.

Tests the build_welcome_message() function in prompt_assembler.py.
Covers: role fallback, multi-role combos, challenge reframe, challenge display,
focus area display, formatting (Oxford comma), structure, and integration.

Uses test_stores + test_user_id fixtures from conftest.py. Never touches Theo.
"""

import json

import pytest

from brain_cloud.coaching import PromptAssembler


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def _update_profile_and_build(stores, test_user_id, profile_data: dict) -> str:
    """Update test user profile, build welcome message, return text."""
    uuid = await stores.resolve_user_id(test_user_id)
    await stores.supabase.update_user(uuid, profile_data)
    user_profile = await stores.supabase.get_user(uuid)

    # Clear template cache so Supabase template is always fresh
    PromptAssembler._template_cache.clear()

    assembler = PromptAssembler(stores.supabase)
    return await assembler.build_welcome_message(user_profile)


# ===================================================================
# Role Fallback
# ===================================================================

@pytest.mark.asyncio
async def test_founder_role_fallback(test_stores, test_user_id):
    """Founder gets 'holding a hundred things at once' line."""
    msg = await _update_profile_and_build(test_stores, test_user_id, {
        "roles": ["founder"],
        "focus_area": "career-business",
        "declared_challenges": ["overwhelm"],
    })
    assert "holding a hundred things at once" in msg


@pytest.mark.asyncio
async def test_freelancer_role_fallback(test_stores, test_user_id):
    """Freelancer gets 'the business AND the talent' line."""
    msg = await _update_profile_and_build(test_stores, test_user_id, {
        "roles": ["freelancer"],
        "focus_area": "career-business",
        "declared_challenges": ["overwhelm"],
    })
    assert "the business AND the talent" in msg


@pytest.mark.asyncio
async def test_career_professional_role_fallback(test_stores, test_user_id):
    """Career professional gets 'capable of more' line with 'yet'."""
    msg = await _update_profile_and_build(test_stores, test_user_id, {
        "roles": ["career_professional"],
        "focus_area": "career-business",
        "declared_challenges": ["feeling-stuck"],
    })
    assert "capable of more" in msg
    assert "yet" in msg


@pytest.mark.asyncio
async def test_default_role_fallback(test_stores, test_user_id):
    """No roles → default line."""
    msg = await _update_profile_and_build(test_stores, test_user_id, {
        "roles": [],
        "focus_area": "personal-growth",
        "declared_challenges": ["procrastination"],
    })
    assert "competing for your attention" in msg


# ===================================================================
# Multi-Role
# ===================================================================

@pytest.mark.asyncio
async def test_multi_role_combo_career_side_hustler(test_stores, test_user_id):
    """Career professional + side-hustler → combo line with 'holding a hundred things'."""
    msg = await _update_profile_and_build(test_stores, test_user_id, {
        "roles": ["career_professional", "side-hustler"],
        "focus_area": "career-business",
        "declared_challenges": ["overwhelm"],
    })
    assert "Growing a career while building something on the side" in msg
    assert "holding a hundred things at once" in msg


@pytest.mark.asyncio
async def test_multi_role_founder_wins(test_stores, test_user_id):
    """Founder + freelancer → founder line wins (priority)."""
    msg = await _update_profile_and_build(test_stores, test_user_id, {
        "roles": ["founder", "freelancer"],
        "focus_area": "career-business",
        "declared_challenges": ["overwhelm"],
    })
    assert "Running a business means holding a hundred things at once" in msg


@pytest.mark.asyncio
async def test_multi_role_unknown_combo_generic(test_stores, test_user_id):
    """Two roles with no specific combo → generic 'wearing that many hats' line."""
    # employed + career_professional is NOT in ROLE_COMBO_FALLBACK → generic
    msg = await _update_profile_and_build(test_stores, test_user_id, {
        "roles": ["employed", "career_professional"],
        "focus_area": "career-business",
        "declared_challenges": ["overwhelm"],
    })
    assert "Wearing that many hats" in msg


# ===================================================================
# Challenge Reframe
# ===================================================================

@pytest.mark.asyncio
async def test_challenge_reframe_career_business(test_stores, test_user_id):
    """focus_area='career-business' → 'you have standards' reframe."""
    msg = await _update_profile_and_build(test_stores, test_user_id, {
        "roles": ["founder"],
        "focus_area": "career-business",
        "declared_challenges": ["perfectionism"],
    })
    assert "you have standards" in msg


@pytest.mark.asyncio
async def test_challenge_reframe_health(test_stores, test_user_id):
    """focus_area='health' → 'you know what your body and mind need' reframe."""
    msg = await _update_profile_and_build(test_stores, test_user_id, {
        "roles": ["freelancer"],
        "focus_area": "health",
        "declared_challenges": ["losing-motivation"],
    })
    assert "you know what your body and mind need" in msg


@pytest.mark.asyncio
async def test_challenge_reframe_default(test_stores, test_user_id):
    """Unknown focus_area → default reframe."""
    msg = await _update_profile_and_build(test_stores, test_user_id, {
        "roles": ["founder"],
        "focus_area": "unknown-area",
        "declared_challenges": ["overwhelm"],
    })
    assert "you care about getting this right" in msg


# ===================================================================
# Challenge Display
# ===================================================================

@pytest.mark.asyncio
async def test_challenge_display_clean_id(test_stores, test_user_id):
    """'perfectionism' displays as 'perfectionism'."""
    msg = await _update_profile_and_build(test_stores, test_user_id, {
        "roles": ["founder"],
        "focus_area": "career-business",
        "declared_challenges": ["perfectionism"],
    })
    assert "perfectionism comes with the territory" in msg


@pytest.mark.asyncio
async def test_challenge_display_problematic_id(test_stores, test_user_id):
    """'motivated-no-direction' displays as 'motivation without direction', not 'motivated no direction'."""
    msg = await _update_profile_and_build(test_stores, test_user_id, {
        "roles": ["freelancer"],
        "focus_area": "health",
        "declared_challenges": ["motivated-no-direction"],
    })
    assert "motivation without direction" in msg
    assert "motivated no direction" not in msg


@pytest.mark.asyncio
async def test_challenge_display_empty(test_stores, test_user_id):
    """No declared_challenges → 'knowing where to focus' fallback."""
    msg = await _update_profile_and_build(test_stores, test_user_id, {
        "roles": ["founder"],
        "focus_area": "career-business",
        "declared_challenges": [],
    })
    assert "knowing where to focus" in msg


# ===================================================================
# Focus Area Display
# ===================================================================

@pytest.mark.asyncio
async def test_focus_area_display_career_business(test_stores, test_user_id):
    """'career-business' displays as 'career and business', not 'career business'."""
    msg = await _update_profile_and_build(test_stores, test_user_id, {
        "roles": ["founder"],
        "focus_area": "career-business",
        "declared_challenges": ["overwhelm"],
    })
    assert "career and business" in msg
    assert "career business" not in msg.replace("career and business", "")


# ===================================================================
# Formatting
# ===================================================================

@pytest.mark.asyncio
async def test_roles_text_oxford_comma(test_stores, test_user_id):
    """3 roles → 'Role A, Role B, and Role C' (Oxford comma)."""
    msg = await _update_profile_and_build(test_stores, test_user_id, {
        "roles": ["founder", "freelancer", "side-hustler"],
        "focus_area": "career-business",
        "declared_challenges": ["overwhelm"],
    })
    assert "Founder/Entrepreneur, Freelancer, and Side Hustler" in msg


@pytest.mark.asyncio
async def test_roles_text_two_roles(test_stores, test_user_id):
    """2 roles → 'Role A and Role B' (no comma)."""
    msg = await _update_profile_and_build(test_stores, test_user_id, {
        "roles": ["founder", "freelancer"],
        "focus_area": "career-business",
        "declared_challenges": ["overwhelm"],
    })
    assert "Founder/Entrepreneur and Freelancer" in msg


# ===================================================================
# Structure
# ===================================================================

@pytest.mark.asyncio
async def test_welcome_contains_sound_good(test_stores, test_user_id):
    """Welcome message ends with 'Sound good?'"""
    msg = await _update_profile_and_build(test_stores, test_user_id, {
        "roles": ["founder"],
        "focus_area": "career-business",
        "declared_challenges": ["overwhelm"],
    })
    assert msg.strip().endswith("Sound good?")


@pytest.mark.asyncio
async def test_welcome_no_methodology_exposure(test_stores, test_user_id):
    """Welcome message does NOT contain: NLP, Goal Cascade, behavioral delta, identity shift."""
    msg = await _update_profile_and_build(test_stores, test_user_id, {
        "roles": ["founder"],
        "focus_area": "career-business",
        "declared_challenges": ["overwhelm"],
    })
    for term in ["NLP", "Goal Cascade", "behavioral delta", "identity shift"]:
        assert term not in msg, f"Methodology leak: '{term}' found in welcome message"


@pytest.mark.asyncio
async def test_welcome_no_negative_presuppositions(test_stores, test_user_id):
    """Welcome message does NOT contain: 'getting in the way', 'holding you back', 'struggle', 'fix'."""
    msg = await _update_profile_and_build(test_stores, test_user_id, {
        "roles": ["founder"],
        "focus_area": "career-business",
        "declared_challenges": ["overwhelm"],
    })
    for phrase in ["getting in the way", "holding you back", "struggle", "fix"]:
        assert phrase not in msg.lower(), f"Negative presupposition: '{phrase}' found in welcome message"


# ===================================================================
# Integration
# ===================================================================

@pytest.mark.asyncio
async def test_welcome_in_coaching_get_prompt(test_stores, test_user_id):
    """New session (no session_id) returns turn_number=0 with welcome text.

    Simulates the coaching_get_prompt flow: create session, build welcome,
    verify JSON structure — same logic as server.py lines 235-265.
    """
    stores = test_stores
    uuid = await stores.resolve_user_id(test_user_id)

    # Set up profile with roles/focus/challenge
    await stores.supabase.update_user(uuid, {
        "roles": ["founder"],
        "focus_area": "career-business",
        "declared_challenges": ["perfectionism"],
        "first_name": "Test",
    })
    user_profile = await stores.supabase.get_user(uuid)

    # Create a new session (simulates is_new_session = True)
    session = await stores.supabase.create_coaching_session(uuid)
    session_id = session["id"]

    # Build welcome message
    PromptAssembler._template_cache.clear()
    assembler = PromptAssembler(stores.supabase)
    welcome_text = await assembler.build_welcome_message(user_profile)

    assert welcome_text is not None
    assert len(welcome_text) > 0

    # Build the JSON response structure (mirrors server.py)
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
    result = {
        "turn_number": 0,
        "turn_name": "welcome",
        "system_instruction": welcome_instruction,
        "data_to_capture": {},
        "signals_detected": [],
        "session_id": session_id,
        "session_complete": False,
    }

    # Verify structure
    assert result["turn_number"] == 0
    assert result["turn_name"] == "welcome"
    assert "Sound good?" in result["system_instruction"]
    assert "Hey Test" in result["system_instruction"]
    assert result["session_complete"] is False

    # Verify JSON serializable
    json_str = json.dumps(result, indent=2)
    assert len(json_str) > 100
