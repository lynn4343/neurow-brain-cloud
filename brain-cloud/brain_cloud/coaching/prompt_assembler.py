"""Prompt assembler for coaching sessions.

Builds the complete system instruction by pulling a turn-specific template from
Supabase, injecting user context, temporal data, captured conversation data,
signal-specific handlers, and coaching style modifiers — then returns a single
assembled string that becomes the AI model's instructions.

Three-Seat Consciousness Architecture (CSA-011, 2026-03-04):
  Seat 1 (claude.ts): Identity, voice, modifiers, protocol — loaded once at session start
  Seat 2 (this assembler): Session context, temporal data, Brain Cloud context
  Seat 3 (turn templates): Per-turn instructions for Clarity Session

The assembler no longer includes Layer 1 (master system prompt). Identity, voice,
coaching style modifiers, and user type modifiers are in claude.ts (Seat 1).
This assembler provides session-specific structure and data only.
"""

import logging
import re

from brain_cloud.coaching.turn_registry import TurnSpec
from brain_cloud.stores.supabase import SupabaseStore
from brain_cloud.temporal import format_temporal_block, get_temporal_context

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Constants: Coaching style modifiers
# Synced with claude.ts Seat 1c (System_Prompts/Coaching_Style_Modifiers.md)
# These are still injected into the ongoing/default Supabase template as
# harmless reinforcement of Seat 1.
# ---------------------------------------------------------------------------

COACHING_STYLE_MODIFIERS: dict[str, str] = {
    "balanced": (
        "Coaching style: BALANCED. Equal parts warmth and directness. "
        "Validate AND challenge in the same breath. Neither soft nor sharp. Both."
    ),
    "gentle": (
        "Coaching style: GENTLE. Lead with warmth, safety, invitation. "
        "Challenges are offered, not pressed. Never push past resistance "
        "\u2014 note it and return when the moment is right."
    ),
    "direct": (
        "Coaching style: DIRECT. Lead with clarity and efficiency. "
        "Minimal preamble. Warmth is present through the precision of "
        "your attention, not softening language."
    ),
    "peak_performance": (
        "Coaching style: PEAK PERFORMANCE. This is accountability coaching "
        "\u2014 the user chose to be held to their own potential. Track their "
        "commitments and name gaps directly. Celebrate briefly, then raise "
        "the bar. Warmth shows as unshakeable belief in their capacity, not comfort."
    ),
}
COACHING_STYLE_MODIFIERS["peak"] = COACHING_STYLE_MODIFIERS["peak_performance"]
COACHING_STYLE_MODIFIERS["peak-performance"] = COACHING_STYLE_MODIFIERS["peak_performance"]

# Synced with claude.ts Seat 1d (System_Prompts/User_Type_Modifiers.md)
USER_TYPE_MODIFIERS: dict[str, str] = {
    "business_owner": (
        "Build the leader to build the company. Your job is founder development "
        "\u2014 the business grows when the founder grows.\n\n"
        "This user lives in the gap between vision and execution. They can see "
        "where they need to go. Coach the distance between seeing it and building "
        "it \u2014 that\u2019s your territory.\n\n"
        "You understand the weight: every hat, hard decisions made alone, the "
        "isolation that comes with the role. Name it when you see it. Don\u2019t "
        "dwell on it.\n\n"
        "Think strategically with them \u2014 second-order consequences, systems "
        "not willpower, what to stop doing as much as what to start. When "
        'operational gaps appear: \u201cWhat system would make this automatic?\u201d\n\n'
        "Their language: \u201cyour business,\u201d \u201cyour practice,\u201d "
        "\u201cyour clients.\u201d Personal growth and business growth are the "
        "same conversation \u2014 never separate them.\n\n"
        "Ask the question they\u2019re avoiding."
    ),
    "career_professional": (
        "This user is a career professional. Adapt language: \u201cyour career,\u201d "
        "not \u201cyour business.\u201d Frame through career context \u2014 advancement, "
        "visibility, managing up, strategic positioning. Ground examples in their "
        "work situation."
    ),
    "default": (
        "This user is focused on personal growth. Standard voice. Ground examples "
        "in their specific focus area \u2014 health, relationships, creativity, or "
        "whatever they\u2019re working on."
    ),
}

# ---------------------------------------------------------------------------
# Constants: Welcome message role-based lookups
# (from production opening_message_service.py)
# ---------------------------------------------------------------------------

# Check user_profiles.roles in this order. First match wins.
ROLE_PRIORITY = ["founder", "business_owner", "freelancer", "side-hustler", "side_hustler", "employed", "career_professional"]

ROLE_DISPLAY_NAMES: dict[str, str] = {
    "founder": "Founder/Entrepreneur",
    "business_owner": "Founder/Entrepreneur",  # Theo legacy
    "freelancer": "Freelancer",
    "side-hustler": "Side Hustler",
    "side_hustler": "Side Hustler",  # Theo legacy
    "employed": "Employed Professional",
    "career_professional": "Career Professional",  # Theo legacy
}

ROLE_FALLBACK: dict[str, str] = {
    "founder": "Running a business means holding a hundred things at once.",
    "business_owner": "Running a business means holding a hundred things at once.",
    "freelancer": "The freelance life means you're the business AND the talent.",
    "side-hustler": "Building something on the side of a full life — there's a lot to balance and prioritize.",
    "side_hustler": "Building something on the side of a full life — there's a lot to balance and prioritize.",
    "employed": "You know you're capable of more — and the path forward may not be obvious yet.",
    "career_professional": "You know you're capable of more — and the path forward may not be obvious yet.",
    "default": "There's a lot competing for your attention in life — and you're ready to get clear on what matters most.",
}

# Multi-role combo lines. Used when user selects 2+ roles and primary
# is NOT founder/business_owner. Key is frozenset of the two highest-
# priority non-founder roles. Falls back to generic if no match.
ROLE_COMBO_FALLBACK: dict[frozenset[str], str] = {
    frozenset({"career_professional", "side-hustler"}): "Growing a career while building something on the side — that means holding a hundred things at once.",
    frozenset({"career_professional", "side_hustler"}): "Growing a career while building something on the side — that means holding a hundred things at once.",
    frozenset({"employed", "side-hustler"}): "Growing a career while building something on the side — that means holding a hundred things at once.",
    frozenset({"employed", "side_hustler"}): "Growing a career while building something on the side — that means holding a hundred things at once.",
    frozenset({"career_professional", "freelancer"}): "Growing a career while running your own thing — that means holding a hundred things at once.",
    frozenset({"employed", "freelancer"}): "Growing a career while running your own thing — that means holding a hundred things at once.",
    frozenset({"freelancer", "side-hustler"}): "Freelancing while building something new on the side — that means holding a hundred things at once.",
    frozenset({"freelancer", "side_hustler"}): "Freelancing while building something new on the side — that means holding a hundred things at once.",
}
ROLE_COMBO_GENERIC = "Wearing that many hats means holding a hundred things at once."

# Legacy — no longer used in welcome message (Draft 3). Retained for test_onboarding_port.py.
LIMITING_BELIEFS: dict[str, str] = {
    "founder": "another productivity system",
    "business_owner": "another productivity system",  # Theo legacy
    "freelancer": "to work harder or hustle more",
    "side-hustler": "more hours in the day",
    "side_hustler": "more hours in the day",  # Theo legacy
    "employed": "a better resume or more connections",
    "career_professional": "a better resume or more connections",  # Theo legacy
    "default": "more willpower or motivation",
}

# Legacy — no longer used in welcome message (Draft 3). Retained for test_onboarding_port.py.
CLARITY_PROVIDES: dict[str, str] = {
    "founder": "a clear priority that moves the needle, and the confidence to say no to everything else",
    "business_owner": "a clear priority that moves the needle, and the confidence to say no to everything else",  # Theo legacy
    "freelancer": "focus on the work that matters most, and boundaries that protect your energy",
    "side-hustler": "one clear action that fits your real life, not someone else's playbook",
    "side_hustler": "one clear action that fits your real life, not someone else's playbook",  # Theo legacy
    "employed": "clarity on what you actually want, and a concrete step to get there",
    "career_professional": "clarity on what you actually want, and a concrete step to get there",  # Theo legacy
    "default": "one focused priority and the strategy to actually follow through",
}

# Keyed to focus_area. Normalizes the user's challenge as evidence of
# a positive quality, not a deficit. Designed to complete the sentence:
# "{challenge} comes with the territory — {challenge_reframe}."
CHALLENGE_REFRAME: dict[str, str] = {
    "career-business": "it means you have standards — and you're ready to channel them",
    "personal-growth": "it means you're paying attention to who you're becoming",
    "relationships": "it means the people in your life matter to you",
    "love": "it means the people in your life matter to you",
    "health": "it means you know what your body and mind need",
    "finance": "it means you're ready to face what most people avoid",
    "creativity": "it means you care about the quality of what you create",
    "education": "it means you're investing in where you're headed",
    "spirituality": "it means you're asking the questions that matter",
    "family": "it means the people in your life matter to you",
    "home": "it means you care about the space you're building your life in",
    "default": "it means you care about getting this right",
}

# Display-formatted focus area labels for the welcome message.
# Replaces raw .replace("_", " ").replace("-", " ") formatting.
FOCUS_AREA_DISPLAY_NAMES: dict[str, str] = {
    "career-business": "career and business",
    "personal-growth": "personal growth",
    "health": "health and wellness",
    "finance": "personal finance",
    "family": "family",
    "love": "love and relationships",
    "home": "home and living space",
    "education": "education",
    "spirituality": "spirituality",
    "creativity": "creativity",
}

# Short display-friendly form of challenge IDs for the welcome message.
# Must work in: "{challenge} comes with the territory — {reframe}."
# Rule: noun-form phrases only. No sentences, no verbs as openers.
CHALLENGE_DISPLAY: dict[str, str] = {
    # Business challenges
    "procrastination": "procrastination",
    "difficulty-focusing": "difficulty focusing",
    "starting-not-finishing": "starting strong and not finishing",
    "overwhelm": "overwhelm",
    "perfectionism": "perfectionism",
    "self-doubt": "self-doubt",
    "imposter-syndrome": "imposter syndrome",
    "dont-know-next": "not knowing the next move",
    "questioning-goal": "questioning the goal",
    "too-many-opportunities": "too many opportunities pulling at you",
    "time-scarcity": "time scarcity",
    "money-scarcity": "money scarcity",
    "energy-burnout": "burnout",
    "lack-of-support": "lack of support",
    # Career challenges
    "dont-know-what-want": "not knowing what you want next",
    "dont-know-how-progress": "not knowing how to progress",
    "questioning-right-path": "questioning the path",
    "avoiding-conversations": "avoiding hard conversations",
    "difficulty-advocating": "difficulty advocating for yourself",
    "fear-rejection": "fear of rejection",
    "feeling-stuck": "feeling stuck",
    "isolated-lacking-support": "feeling isolated",
    "job-draining-energy": "a job that drains your energy",
    # Health challenges
    "motivated-no-direction": "motivation without direction",
    "unsure-what-works": "not knowing what routine is right",
    "overwhelmed-options": "overwhelm from too many options",
    "too-busy-tired": "never having enough energy",
    "starting-falling-off": "starting strong then falling off",
    "prioritizing-others": "putting everyone else first",
    "self-doubt-change": "self-doubt about change",
    "losing-motivation": "losing motivation",
    "past-attempts-hard": "past setbacks making it harder",
    # Finance challenges
    "dont-know-where-money-goes": "not knowing where the money goes",
    "unclear-priorities": "unclear financial priorities",
    "no-clear-picture": "no clear financial picture",
    "spending-impulsively": "impulsive spending",
    "avoiding-finances": "avoiding your finances",
    "avoiding-actions": "avoiding the hard money moves",
    "money-anxiety": "money anxiety",
    "never-enough": "the 'never enough' feeling",
    "money-relationship-tension": "money tension in relationships",
    # Family challenges
    "unclear-needs": "unclear needs in family",
    "dont-know-how-improve": "not knowing how to improve the dynamic",
    "confusion-role": "confusion about your role",
    "not-enough-quality-time": "not enough quality time",
    "struggling-boundaries": "struggling with boundaries",
    "guilt-not-present": "guilt about not being present",
    "resentment-tension": "unresolved tension",
    "carrying-more-share": "carrying more than your share",
    # Home challenges
    "unclear-what-want": "not knowing what you want your home to feel like",
    "not-sure-improvements": "not sure what improvements matter",
    "weighing-move": "weighing a big change",
    "procrastinating-tasks": "procrastinating on home projects",
    "clutter-building": "letting clutter build up",
    "overwhelmed-attention": "overwhelm from everything that needs attention",
    "guilt-shame-state": "guilt about the state of things",
    "stress-money-resources": "stress about resources",
    # Education challenges
    "unsure-credential": "not knowing the right path",
    "deciding-how-deep": "deciding how deep to go",
    "connect-to-goals": "connecting learning to real goals",
    "procrastinating-coursework": "procrastinating on coursework",
    "balance-priorities": "balancing education with everything else",
    "burnout-motivation": "burnout",
    "imposter-behind": "imposter syndrome",
    "stress-time-cost": "stress about the tradeoffs",
    # Spirituality challenges
    "deepen-practice": "wanting to go deeper",
    "searching-meaning": "searching for meaning",
    "beliefs-not-fitting": "beliefs not fitting like they used to",
    "maintaining-practice": "maintaining a consistent practice",
    "not-making-time": "not making time for stillness",
    "knowing-not-doing": "knowing what feeds you but not doing it",
    "feeling-disconnected": "feeling disconnected",
    "doubt-guilt": "doubt or guilt",
    "spiritual-dryness": "spiritual dryness",
    # Mental/Emotional (Personal Growth) challenges
    "not-sure-where-start": "not knowing where to start",
    "not-sure-whats-bothering": "not knowing what's really bothering you",
    "struggling-understand-patterns": "struggling to understand your patterns",
    "avoiding-what-helps": "avoiding what would actually help",
    "not-prioritizing-health": "not prioritizing your mental health",
    "difficulty-asking-help": "difficulty asking for help",
    "negative-self-talk": "negative self-talk",
    "anxiety-low-mood": "carrying anxiety or stress",
    "emotionally-drained": "emotional burnout",
    # Love - Strengthening
    "uncertain-direction": "uncertainty about where things are going",
    "dont-know-needs": "not knowing what you need from your partner",
    "not-enough-time": "not making enough time for the relationship",
    "holding-back": "holding back what you really feel",
    "resentment-past-hurts": "unresolved past hurts",
    "fear-vulnerable": "fear of being vulnerable",
    "carrying-more-load": "carrying more of the load",
    # Love - Finding
    "dont-know-looking-for": "not knowing what you're looking for",
    "unclear-ready": "not being sure you're ready",
    "not-sure-where-meet": "not knowing where to meet the right people",
    "not-putting-out-there": "not putting yourself out there",
    "struggling-pacing": "struggling with pacing",
    "difficulty-expressing": "difficulty expressing what you want",
    "negative-beliefs-dating": "negative beliefs about dating",
    "past-relationships-affecting": "past relationships affecting how you show up",
    # Love - Complicated
    "not-sure-what-want": "not being sure what you want",
    "confused-where-stand": "confusion about where things stand",
    "dont-know-stay-go": "not knowing if you should stay or go",
    "avoiding-decision": "avoiding a real decision",
    "not-communicating-needs": "not communicating what you need",
    "staying-patterns": "staying in patterns that aren't working",
    "fear-wrong-choice": "fear of making the wrong choice",
    "guilt-obligation": "guilt or obligation",
    "drained-uncertainty": "being drained by uncertainty",
}

# ---------------------------------------------------------------------------
# Constants: Display names and defaults
# ---------------------------------------------------------------------------

# Display names for captured_data keys — prevents internal naming from leaking.
DISPLAY_NAMES: dict[str, str] = {
    "one_year_vision_raw": "One-Year Vision (your words)",
    "one_year_vision_refined": "One-Year Vision (refined)",
    "domain_vision_raw": "Domain Vision (your words)",
    "quarterly_goal_raw": "Quarterly Goal (your words)",
    "quarterly_goal_refined": "Quarterly Goal (refined)",
    "goal_why": "Why This Goal Matters",
    "halfway_milestone": "Halfway Milestone",
    "next_action_step": "Next Action Step",
    "identity_traits": "Identity Traits",
    "release_items": "Release Patterns",
}

# Default values for all captured_data fields — prevents unreplaced placeholders.
CAPTURED_DATA_DEFAULTS: dict[str, object] = {
    "one_year_vision_raw": "",
    "one_year_vision_refined": "",
    "domain_vision_raw": "",
    "quarterly_goal_raw": "",
    "quarterly_goal_refined": "",
    "goal_why": "",
    "halfway_milestone": "",
    "next_action_step": "",
    "identity_traits": [],
    "release_items": [],
}

# Arc labels for Clarity Session preamble — maps turn position (0-indexed) to display label.
ARC_LABELS: list[str] = [
    "Vision", "Focus", "Goal", "Why", "Milestone", "Action", "Identity", "Release", "Close",
]

# Regex for cleaning unreplaced template placeholders.
# Matches {snake_case_names}, {dotted.names}, and {UPPER_CASE} but NOT JSON-like braces.
_PLACEHOLDER_RE = re.compile(r"\{[a-zA-Z][a-zA-Z0-9_.]*\}")


# ---------------------------------------------------------------------------
# Formatting helpers
# ---------------------------------------------------------------------------


def format_captured_data(captured_data: dict) -> str:
    """Format captured_data dict as readable context for prompt injection.

    NOTE: After v2 preamble introduction (W4-1.1), this function is no longer
    called by Clarity Session assembly (replaced by format_captured_data_for_preamble).
    Kept intentionally for non-Clarity session contexts and debugging.
    """
    if not captured_data:
        return "No prior data captured yet."
    lines: list[str] = []
    for key, value in captured_data.items():
        label = DISPLAY_NAMES.get(key, key.replace("_", " ").title())
        if isinstance(value, list):
            if value:
                lines.append(f"- {label}: {', '.join(str(v) for v in value)}")
            # Skip empty lists — no value to show
        elif value:  # Skip empty strings
            lines.append(f"- {label}: {value}")
    return "\n".join(lines) if lines else "No prior data captured yet."


def format_captured_data_for_preamble(captured_data: dict, first_name: str) -> str:
    """Format captured data with raw/refined separation for the session preamble.

    Raw fields (_raw suffix) are quoted — they're the user's exact words.
    Refined fields (_refined suffix) are unquoted — they're the confirmed versions.
    Other fields (goal_why, halfway_milestone, etc.) appear in the 'shared' section.

    Returns empty string if no captured data — caller omits the data section entirely.
    """
    if not captured_data:
        return ""

    raw_lines: list[str] = []
    refined_lines: list[str] = []
    other_lines: list[str] = []

    for key, value in captured_data.items():
        if not value:
            continue
        label = DISPLAY_NAMES.get(key, key.replace("_", " ").title())

        if key.endswith("_raw"):
            short_label = label.replace(" (your words)", "").replace(" (raw)", "")
            raw_lines.append(f'- {short_label}: "{value}"')
        elif key.endswith("_refined"):
            short_label = label.replace(" (refined)", "")
            refined_lines.append(f"- {short_label}: {value}")
        elif isinstance(value, list) and value:
            other_lines.append(f"- {label}: {', '.join(str(v) for v in value)}")
        else:
            other_lines.append(f"- {label}: {value}")

    sections: list[str] = []
    if raw_lines or other_lines:
        header = f"WHAT {first_name.upper()} HAS SHARED (in their words):"
        sections.append(header + "\n" + "\n".join(raw_lines + other_lines))
    if refined_lines:
        header = "CONFIRMED (refined together):"
        sections.append(header + "\n" + "\n".join(refined_lines))

    return "\n\n".join(sections)


def format_declared_challenges(challenges: list | None) -> str:
    """Format declared_challenges list as readable text."""
    if not challenges:
        return "No challenges declared during onboarding."
    return "Declared challenges: " + ", ".join(
        c.replace("_", " ").replace("-", " ") for c in challenges
    )


def format_conversation_history(history: list[dict] | None) -> str:
    """Format conversation_history for Turn 9 injection.

    Preserves the user's actual words — the Milton model narrative
    needs their exact language from all prior turns.
    """
    if not history:
        return "No conversation history."
    lines: list[str] = []
    for entry in history:
        role = entry.get("role", "unknown").upper()
        turn = entry.get("turn", "?")
        content = entry.get("content", "")
        lines.append(f"[Turn {turn} - {role}]: {content}")
    return "\n".join(lines)


def inject_variables(template: str, variables: dict) -> str:
    """Replace {variable_name} placeholders in template text.

    After all known variables are injected, any remaining unreplaced
    placeholders (e.g., {one_year_vision_refined} before Turn 1 completes)
    are stripped to prevent raw placeholders from leaking into model output.

    NOTE: {user.first_name} is a flat dict key, not attribute access.
    The dot is part of the key string for readability in templates.
    """
    result = template
    for key, value in variables.items():
        if isinstance(value, list):
            # Format lists as comma-separated strings, not Python repr
            formatted = ", ".join(str(v) for v in value) if value else ""
        else:
            formatted = str(value) if value is not None else ""
        result = result.replace(f"{{{key}}}", formatted)
    # Strip any remaining unreplaced {placeholder} patterns.
    # This prevents the model from seeing raw template variables.
    result = _PLACEHOLDER_RE.sub("", result)
    return result


# ---------------------------------------------------------------------------
# Prompt Assembler
# ---------------------------------------------------------------------------

class PromptAssembler:
    """Builds complete system instructions for coaching turns.

    Templates are fetched from Supabase and cached for the server lifetime.
    Templates only change on deployment, never during a coaching session.
    """

    # Class-level cache — shared across all instances, persists for server lifetime.
    _template_cache: dict[str, str] = {}

    def __init__(self, supabase: SupabaseStore):
        self.supabase = supabase

    async def _get_template(self, name: str) -> str:
        """Fetch a template from Supabase, caching on first access."""
        if name not in PromptAssembler._template_cache:
            PromptAssembler._template_cache[name] = (
                await self.supabase.get_prompt_template(name)
            )
        return PromptAssembler._template_cache[name]

    @staticmethod
    def _resolve_coaching_style(user_profile: dict) -> str:
        """Map user_profiles.coaching_style to the modifier text block."""
        style = (user_profile.get("coaching_style") or "balanced").lower()
        return COACHING_STYLE_MODIFIERS.get(style, COACHING_STYLE_MODIFIERS["balanced"])

    @staticmethod
    def _resolve_user_type(user_profile: dict) -> str:
        """Map user_profiles.roles to the appropriate user type modifier.

        Accepts production IDs (founder, employed, side-hustler) AND
        Theo legacy IDs (business_owner, career_professional, side_hustler).
        """
        roles = user_profile.get("roles") or []
        if isinstance(roles, str):
            roles = [roles]
        # Business owner: production + legacy
        biz_roles = {"founder", "freelancer", "side-hustler", "business_owner", "side_hustler"}
        if biz_roles.intersection(roles):
            return USER_TYPE_MODIFIERS["business_owner"]
        # Career professional: production + legacy
        career_roles = {"employed", "career_professional"}
        if career_roles.intersection(roles):
            return USER_TYPE_MODIFIERS["career_professional"]
        return USER_TYPE_MODIFIERS["default"]

    @staticmethod
    def _resolve_primary_role(user_profile: dict) -> str:
        """Resolve the user's primary role using priority order.

        Used by welcome message for role-specific messaging.
        Different from _resolve_user_type which maps to coaching modifiers
        (where freelancer → business_owner modifier).
        """
        roles = user_profile.get("roles") or []
        if isinstance(roles, str):
            roles = [roles]
        for role in ROLE_PRIORITY:
            if role in roles:
                return role
        return "default"

    @staticmethod
    def _resolve_first_name(user_profile: dict) -> str:
        """Extract first_name with fallback chain. Never returns None or 'None'."""
        name = user_profile.get("first_name")
        if name:
            return name
        display = user_profile.get("display_name") or ""
        parts = display.split()
        if parts:
            return parts[0]
        return "there"

    def _build_session_preamble(
        self,
        turn_number: int,
        user_profile: dict,
        captured_data: dict,
    ) -> str:
        """Generate the rich session preamble for Clarity Session turns.

        Replaces the thin "Turn N of 9" context line (W4-1.1). Includes:
        - Goal Cascade definition and stakes
        - Arc tracking line (completed \u2713, current [now], future Title Case)
        - Prior data with raw/refined separation (omitted on Turn 1)
        - User-question handling note
        """
        first_name = self._resolve_first_name(user_profile)

        # --- Arc line ---
        arc_parts: list[str] = []
        for i, label in enumerate(ARC_LABELS):
            turn_idx = i + 1  # ARC_LABELS is 0-indexed, turns are 1-indexed
            if turn_idx < turn_number:
                arc_parts.append(f"{label} \u2713")
            elif turn_idx == turn_number:
                arc_parts.append(f"{label.upper()} [now]")
            else:
                arc_parts.append(label)
        arc_line = " | ".join(arc_parts)

        # --- Data section (empty on Turn 1) ---
        data_section = format_captured_data_for_preamble(captured_data, first_name)

        # --- Assemble preamble ---
        lines: list[str] = [
            f"CLARITY SESSION \u2014 You are building {first_name}'s Goal Cascade.",
            "",
            "The Goal Cascade is the foundation for all future coaching \u2014 every morning brief,",
            "weekly session, and coaching conversation will reference what's built here. By the end,",
            f"{first_name} should feel clear, aligned, and grounded: a vision, a goal, an identity",
            "shift, and a concrete next step.",
            "",
            f"Arc: {arc_line}",
        ]

        if data_section:
            lines.append("")
            lines.append("---")
            lines.append("")
            lines.append(data_section)

        lines.append("")
        lines.append("---")
        lines.append("")
        lines.append(
            "Reference their prior answers naturally \u2014 they should never have to repeat themselves."
        )
        lines.append(
            "If they ask a question or want to revisit a prior answer, engage naturally, then return"
        )
        lines.append("to this turn's objective.")

        return "\n".join(lines)

    def _build_turn_variables(
        self,
        user_profile: dict,
        captured_data: dict,
        conversation_history: list[dict],
        brain_cloud_context: str,
        temporal: dict[str, str],
    ) -> dict[str, object]:
        """Build the complete variable dict for template injection.

        Includes defaults for all known captured_data fields so that
        no placeholder is ever left unreplaced.
        """
        # Start with captured_data defaults, then overlay actual values.
        all_captured = dict(CAPTURED_DATA_DEFAULTS)
        all_captured.update(captured_data)

        variables: dict[str, object] = {
            # User context
            "user.first_name": self._resolve_first_name(user_profile),
            "focus_area": FOCUS_AREA_DISPLAY_NAMES.get(
                user_profile.get("focus_area", ""),
                (user_profile.get("focus_area") or "what matters most").replace("_", " ").replace("-", " "),
            ),
            # Temporal context (individual fields for Layer 3)
            "current_date": temporal["current_date"],
            "current_time": temporal["current_time"],
            "day_of_week": temporal["day_of_week"],
            "current_date_plus_one_year": temporal["current_date_plus_one_year"],
            "time_of_day": temporal["time_of_day"].replace("_", " "),
            "is_weekend": "weekend" if temporal["is_weekend"] else "weekday",
            "week_position": temporal["week_position"],
            # Formatted context blocks
            # captured_data_summary removed — now in session preamble
            # (format_captured_data_for_preamble). Individual fields still injected below.
            "declared_challenges": format_declared_challenges(
                user_profile.get("declared_challenges")
            ),
            "brain_cloud_context": brain_cloud_context or "No patterns available yet.",
            "conversation_history": format_conversation_history(conversation_history),
        }

        # Add every captured_data field as an individual injectable variable.
        # This allows turn-specific framing (e.g., Turn 2 references {one_year_vision_refined}).
        for key, value in all_captured.items():
            variables[key] = value

        return variables

    async def _get_signal_blocks(self, signals: list[str]) -> list[str]:
        """Fetch signal handler templates with priority enforcement.

        Priority rules:
          - crisis → overrides everything (handled in build(), replaces Layer 3)
          - flooding → suppresses idk and disagreement handlers
          - idk + disagreement → both can coexist
        """
        if "flooding" in signals:
            # Flooding takes priority: suppress idk and disagreement
            active_signals = [s for s in signals if s == "flooding"]
        else:
            active_signals = signals

        blocks: list[str] = []
        for signal in active_signals:
            template_name = f"signals/{signal}_handler"
            try:
                block = await self._get_template(template_name)
                blocks.append(block)
            except ValueError:
                logger.warning(f"Signal handler template not found: {template_name}")
        return blocks

    async def build(
        self,
        turn_spec: TurnSpec,
        user_profile: dict,
        signals: list[str],
        captured_data: dict,
        conversation_history: list[dict],
        brain_cloud_context: str = "",
    ) -> str:
        """Build the system instruction for a Clarity Session turn.

        Identity, voice, modifiers are in claude.ts (Seat 1). This assembler
        provides session context, turn instructions, and signal handlers only.
        """
        temporal = get_temporal_context()

        # Session context — rich v2 preamble with arc tracking and prior data
        session_context = self._build_session_preamble(
            turn_spec.turn_number, user_profile, captured_data,
        )

        # Turn instructions — with full variable injection
        variables = self._build_turn_variables(
            user_profile, captured_data, conversation_history,
            brain_cloud_context, temporal,
        )

        if "crisis" in signals:
            # CRITICAL: Crisis replaces turn instructions entirely.
            # The model must exit coaching flow, not try to continue.
            turn_instructions = await self._get_template("signals/crisis_handler")
            turn_instructions = inject_variables(turn_instructions, variables)
            signal_blocks: list[str] = []
        else:
            turn_template = await self._get_template(turn_spec.template_name)
            turn_instructions = inject_variables(turn_template, variables)
            signal_blocks = await self._get_signal_blocks(signals)

        # Assemble — no Layer 1 (identity/voice/modifiers are in Seat 1)
        parts = [f"== SESSION CONTEXT ==\n\n{session_context}"]
        parts.append(f"\n\n== TURN INSTRUCTIONS ==\n\n{turn_instructions}")
        for block in signal_blocks:
            parts.append(f"\n\n== SIGNAL HANDLER ==\n\n{block}")

        # Universal guidance (skip during crisis)
        if "crisis" not in signals:
            guidance = await self._get_template("signals/prompt_level_guidance")
            parts.append(f"\n\n== COACHING GUIDANCE ==\n\n{guidance}")

        return "".join(parts)

    # Template name mapping for session types where the Supabase template name
    # doesn't follow the default {type}/session convention.
    _SESSION_TEMPLATE_MAP: dict[str, str] = {
        "ongoing": "ongoing/default",
    }

    async def build_session_prompt(
        self,
        session_type: str,
        user_profile: dict,
        brain_cloud_context: str = "",
    ) -> str:
        """Build a non-turn-based session prompt (morning brief, weekly, ongoing).

        Identity, voice, and modifiers are in claude.ts (Seat 1). This returns
        the session-specific coaching instructions with temporal context and
        Brain Cloud data injected.

        The ongoing/default template still has {COACHING_STYLE_MODIFIER} and
        {USER_TYPE_MODIFIER} placeholders — these are injected here as harmless
        reinforcement of Seat 1.
        """
        temporal = get_temporal_context()
        coaching_style = self._resolve_coaching_style(user_profile)
        user_type = self._resolve_user_type(user_profile)
        temporal_block = format_temporal_block(temporal)

        # Session prompt with full variable injection
        template_name = self._SESSION_TEMPLATE_MAP.get(
            session_type, f"{session_type}/session"
        )
        session_prompt = await self._get_template(template_name)

        # Comprehensive variables dict — covers both standard session templates
        # (morning brief: lowercase vars only) and self-contained templates
        # (ongoing: has uppercase modifier placeholders too).
        session_vars: dict[str, object] = {
            # Standard session variables (lowercase — morning brief, weekly)
            "user.first_name": self._resolve_first_name(user_profile),
            "current_date": temporal["current_date"],
            "current_time": temporal["current_time"],
            "day_of_week": temporal["day_of_week"],
            "time_of_day": temporal["time_of_day"].replace("_", " "),
            "is_weekend": "weekend" if temporal["is_weekend"] else "weekday",
            "week_position": temporal["week_position"],
            "brain_cloud_context": brain_cloud_context or "No coaching history available yet.",
            # Uppercase modifier variables (ongoing template uses these —
            # harmless reinforcement of Seat 1)
            "COACHING_STYLE_MODIFIER": coaching_style,
            "USER_TYPE_MODIFIER": user_type,
            "TEMPORAL_CONTEXT": temporal_block,
        }

        return inject_variables(session_prompt, session_vars)

    async def build_welcome_message(self, user_profile: dict) -> str:
        """Build personalized welcome message for pre-Clarity-Session state.

        Returns the assistant's first message text (not a system instruction).
        This bridges static onboarding → Clarity Session. Adapted from
        production opening_message_service.py.
        """
        template = await self._get_template("clarity_session/welcome")
        primary_role = self._resolve_primary_role(user_profile)

        # Parse roles ONCE — reused by role_fallback and roles_text
        roles = user_profile.get("roles") or []
        if isinstance(roles, str):
            roles = [roles]

        # --- Multi-role combo check (Section 3a) ---
        is_founder = primary_role in ("founder", "business_owner")
        has_multiple_roles = len(roles) >= 2

        if has_multiple_roles and not is_founder:
            role_set = frozenset(roles)
            combo_line = None
            for combo_key, combo_text in ROLE_COMBO_FALLBACK.items():
                if combo_key.issubset(role_set):
                    combo_line = combo_text
                    break
            role_fallback = combo_line or ROLE_COMBO_GENERIC
        else:
            role_fallback = ROLE_FALLBACK.get(primary_role, ROLE_FALLBACK["default"])

        # --- Challenge reframe — keyed to focus_area (Section 3b) ---
        focus_area_raw = user_profile.get("focus_area") or ""
        challenge_reframe = CHALLENGE_REFRAME.get(focus_area_raw, CHALLENGE_REFRAME["default"])

        # --- Focus area display name (Section 3c) ---
        focus_area = FOCUS_AREA_DISPLAY_NAMES.get(
            focus_area_raw,
            focus_area_raw.replace("_", " ").replace("-", " ") if focus_area_raw else "what matters most",
        )

        # --- Challenge display (Section 3d) ---
        challenges = user_profile.get("declared_challenges") or []
        if isinstance(challenges, str):
            challenges = [challenges]
        if challenges:
            raw_challenge = challenges[0]
            challenge = CHALLENGE_DISPLAY.get(
                raw_challenge,
                raw_challenge.replace("_", " ").replace("-", " "),
            )
        else:
            challenge = "knowing where to focus"

        # --- Roles text — Oxford comma for 3+ (Section 3e) ---
        if roles:
            display_roles = [
                ROLE_DISPLAY_NAMES.get(r, r.replace("_", " ").replace("-", " ").title())
                for r in roles
            ]
            if len(display_roles) == 1:
                roles_text = display_roles[0]
            elif len(display_roles) == 2:
                roles_text = f"{display_roles[0]} and {display_roles[1]}"
            else:
                roles_text = ", ".join(display_roles[:-1]) + f", and {display_roles[-1]}"
        else:
            roles_text = "person building a better life"

        # --- Variable injection (Section 3f) ---
        variables = {
            "user.first_name": self._resolve_first_name(user_profile),
            "role_fallback": role_fallback,
            "roles_text": roles_text,
            "focus_area": focus_area,
            "challenge": challenge,
            "challenge_reframe": challenge_reframe,
        }

        message = inject_variables(template, variables)

        # --- Length guard (Section 3g) ---
        if len(message) > 1000:
            first_name = self._resolve_first_name(user_profile)
            message = (
                f"Hey {first_name}\n\n"
                f"{role_fallback}\n\n"
                f"Your vision. One real goal. Your very next step. "
                f"Everything we do together after this starts with what you share now.\n\n"
                f"Sound good?"
            )

        return message
