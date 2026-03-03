"""Prompt assembler for coaching sessions.

Builds the complete system instruction by pulling a turn-specific template from
Supabase, injecting user context, temporal data, captured conversation data,
signal-specific handlers, and coaching style modifiers — then returns a single
assembled string that becomes the AI model's instructions.

4-layer prompt stack:
  Layer 1: Master System Prompt (personality, voice, guardrails)
  Layer 2: Session Context (session type + turn number)
  Layer 3: Turn Instructions (from Supabase prompt_templates)
  Layer 4a: Signal Handlers (conditional — crisis/flooding/idk/disagreement)
  Layer 4b: Universal Guidance (always appended)
"""

import logging
import re
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from brain_cloud.coaching.turn_registry import TurnSpec
from brain_cloud.stores.supabase import SupabaseStore

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Constants: Coaching style modifiers (from Master_System_Prompt_Hackathon.md)
# ---------------------------------------------------------------------------

COACHING_STYLE_MODIFIERS: dict[str, str] = {
    "balanced": (
        'Coaching style: BALANCED. Equal parts warmth and directness. Validate AND '
        'challenge in the same breath. "That\'s a real win — and there\'s something '
        'worth looking at this week." Neither soft nor sharp. Both.'
    ),
    "gentle": (
        'Coaching style: GENTLE. Lead with warmth, safety, invitation. Challenges are '
        'offered, not pressed. "Whenever you\'re ready, there\'s something interesting '
        'in the data." Never push past resistance — note it and return later.'
    ),
    "direct": (
        'Coaching style: DIRECT. Lead with clarity and efficiency. Minimal preamble. '
        '"Admin didn\'t happen. Same issue as last week. Library block Wednesday?" '
        'Warmth is present through the precision of your attention.'
    ),
    "peak_performance": (
        'Coaching style: PEAK PERFORMANCE. High-performance coaching. "You held the '
        'rate 4 times. That\'s the baseline now, not the goal. What\'s the next '
        'level?" Challenge is primary. Celebrate briefly, then raise the bar.'
    ),
}
COACHING_STYLE_MODIFIERS["peak"] = COACHING_STYLE_MODIFIERS["peak_performance"]

USER_TYPE_MODIFIERS: dict[str, str] = {
    "business_owner": (
        "This user is a business owner. Layer these qualities onto your base voice:\n"
        '- Radical honesty delivered with care. "I\'m saying this because I believe in you."\n'
        '- Relentless execution focus. "Ideas are easy. What are you going to DO?"\n'
        '- No tolerance for excuses, with compassion. "That\'s a story. What\'s really going on?"\n'
        "- Operational excellence applied to ALL life areas, not just business.\n"
        "- Commitments treated as sacred. Follow-through is non-negotiable.\n"
        '- Language: "your business", "your practice", "your clients." If freelancer: '
        '"your freelance business." If side hustle: "your side hustle."'
    ),
    "career_professional": (
        "This user is a career professional. Adapt language:\n"
        '- NEVER say "your business" — always "your career."\n'
        "- Reference their career situation when providing examples.\n"
        "- Career-specific framing: advancement, visibility, managing up, strategic impact.\n"
        "- Do NOT use the high-directness business owner modifier. Standard warmth/directness blend."
    ),
    "default": (
        "This user is focused on a life area (health, relationships, personal growth, etc.). "
        "Standard voice. No business or career modifier. Ground examples in their specific focus area."
    ),
}

# ---------------------------------------------------------------------------
# Constants: Welcome message role-based lookups
# (from production opening_message_service.py)
# ---------------------------------------------------------------------------

# Check user_profiles.roles in this order. First match wins.
ROLE_PRIORITY = ["business_owner", "freelancer", "side_hustler", "career_professional"]

ROLE_DISPLAY_NAMES: dict[str, str] = {
    "business_owner": "Founder/Entrepreneur",
    "freelancer": "Freelancer",
    "side_hustler": "Side Hustler",
    "career_professional": "Career Professional",
}

ROLE_FALLBACK: dict[str, str] = {
    "business_owner": "Running a business is a wild ride — I get it.",
    "freelancer": "The freelance life has its own unique challenges — I see you.",
    "side_hustler": "Balancing a side hustle with everything else? That takes real commitment.",
    "career_professional": "Navigating your career path takes clarity — let's find it together.",
    "default": "Life is full of competing priorities — let's cut through the noise.",
}

LIMITING_BELIEFS: dict[str, str] = {
    "business_owner": "another productivity system",
    "freelancer": "to work harder or hustle more",
    "side_hustler": "more hours in the day",
    "career_professional": "a better resume or more connections",
    "default": "more willpower or motivation",
}

CLARITY_PROVIDES: dict[str, str] = {
    "business_owner": "a clear priority that moves the needle, and the confidence to say no to everything else",
    "freelancer": "focus on the work that matters most, and boundaries that protect your energy",
    "side_hustler": "one clear action that fits your real life, not someone else's playbook",
    "career_professional": "clarity on what you actually want, and a concrete step to get there",
    "default": "one focused priority and the strategy to actually follow through",
}

# ---------------------------------------------------------------------------
# Constants: Display names and defaults
# ---------------------------------------------------------------------------

# Display names for captured_data keys — prevents internal naming from leaking.
DISPLAY_NAMES: dict[str, str] = {
    "one_year_vision_raw": "One-Year Vision (your words)",
    "one_year_vision_refined": "One-Year Vision (refined)",
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
    "quarterly_goal_raw": "",
    "quarterly_goal_refined": "",
    "goal_why": "",
    "halfway_milestone": "",
    "next_action_step": "",
    "identity_traits": [],
    "release_items": [],
}

# Regex for cleaning unreplaced template placeholders.
# Matches {snake_case_names} and {dotted.names} but NOT JSON-like braces.
_PLACEHOLDER_RE = re.compile(r"\{[a-z][a-z0-9_.]*\}")


# ---------------------------------------------------------------------------
# Formatting helpers
# ---------------------------------------------------------------------------

def get_temporal_context(timezone: str = "America/Chicago") -> dict[str, str]:
    """Resolve all temporal information server-side. Models never calculate dates."""
    try:
        tz = ZoneInfo(timezone)
    except Exception:
        logger.warning(f"Invalid timezone '{timezone}', falling back to America/Chicago")
        tz = ZoneInfo("America/Chicago")
    now = datetime.now(tz)
    one_year = now + timedelta(days=365)
    return {
        "current_date": now.strftime("%A, %B %d, %Y"),
        "current_time": now.strftime("%I:%M %p %Z"),
        "day_of_week": now.strftime("%A"),
        "current_date_plus_one_year": one_year.strftime("%B %d, %Y"),
    }


def format_temporal_context(temporal: dict[str, str]) -> str:
    """Format the temporal dict into a human-readable string for Layer 1 injection."""
    return f"Today is {temporal['current_date']}. Current time: {temporal['current_time']}."


def format_captured_data(captured_data: dict) -> str:
    """Format captured_data dict as readable context for prompt injection."""
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


def format_declared_challenges(challenges: list | None) -> str:
    """Format declared_challenges list as readable text."""
    if not challenges:
        return "No challenges declared during onboarding."
    return "Declared challenges: " + ", ".join(
        c.replace("_", " ") for c in challenges
    )


def format_conversation_history(history: list[dict] | None) -> str:
    """Format conversation_history for Turn 8 injection.

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
        """Map user_profiles.roles to the appropriate user type modifier."""
        roles = user_profile.get("roles") or []
        if isinstance(roles, str):
            roles = [roles]
        if "business_owner" in roles or "freelancer" in roles:
            return USER_TYPE_MODIFIERS["business_owner"]
        if "career_professional" in roles:
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
        if display:
            return display.split()[0]
        return "there"

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
            # Temporal context (individual fields for Layer 3)
            "current_date": temporal["current_date"],
            "current_time": temporal["current_time"],
            "day_of_week": temporal["day_of_week"],
            "current_date_plus_one_year": temporal["current_date_plus_one_year"],
            # Formatted context blocks
            "captured_data_summary": format_captured_data(captured_data),
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
        """Build the complete system instruction for a Clarity Session turn.

        Returns the fully assembled multi-layer prompt string.
        """
        temporal = get_temporal_context()

        # --- Layer 1: Master System Prompt ---
        master = await self._get_template("master/system_prompt")
        layer1_vars = {
            "COACHING_STYLE_MODIFIER": self._resolve_coaching_style(user_profile),
            "USER_TYPE_MODIFIER": self._resolve_user_type(user_profile),
            "TEMPORAL_CONTEXT": format_temporal_context(temporal),
        }
        layer1 = inject_variables(master, layer1_vars)

        # --- Layer 2: Session Context ---
        layer2 = f"This is a Clarity Session. Turn {turn_spec.turn_number} of 8."

        # --- Layer 3: Turn Instructions ---
        # Build the complete variable dict for injection.
        variables = self._build_turn_variables(
            user_profile, captured_data, conversation_history,
            brain_cloud_context, temporal,
        )

        if "crisis" in signals:
            # CRITICAL: Crisis replaces Layer 3 entirely.
            # The model must exit coaching flow, not try to continue.
            layer3 = await self._get_template("signals/crisis_handler")
            layer3 = inject_variables(layer3, variables)
            signal_blocks: list[str] = []
        else:
            turn_template = await self._get_template(turn_spec.template_name)
            layer3 = inject_variables(turn_template, variables)
            signal_blocks = await self._get_signal_blocks(signals)

        # --- Assemble all layers ---
        parts = [layer1]
        parts.append(f"\n\n== SESSION CONTEXT ==\n\n{layer2}")
        parts.append(f"\n\n== TURN INSTRUCTIONS ==\n\n{layer3}")
        for block in signal_blocks:
            parts.append(f"\n\n== SIGNAL HANDLER ==\n\n{block}")

        # --- Layer 4b: Universal Guidance (skip during crisis) ---
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
        """Build a non-turn-based session prompt (morning brief, weekly, ongoing, etc.).

        Same Layer 1 as Clarity Session, but Layer 2 is the session-specific
        prompt, and there are no turns or signal handlers.

        The ongoing/default template includes its own modifier/temporal placeholders
        (redundant with Layer 1 but reinforcing). All variables are injected into
        both layers to ensure no raw placeholders leak.
        """
        temporal = get_temporal_context()
        coaching_style = self._resolve_coaching_style(user_profile)
        user_type = self._resolve_user_type(user_profile)
        temporal_str = format_temporal_context(temporal)

        # --- Layer 1: Master System Prompt ---
        master = await self._get_template("master/system_prompt")
        layer1_vars = {
            "COACHING_STYLE_MODIFIER": coaching_style,
            "USER_TYPE_MODIFIER": user_type,
            "TEMPORAL_CONTEXT": temporal_str,
        }
        layer1 = inject_variables(master, layer1_vars)

        # --- Layer 2: Session Prompt ---
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
            "brain_cloud_context": brain_cloud_context or "No coaching history available yet.",
            # Uppercase Layer-1-style variables (ongoing template uses these)
            "COACHING_STYLE_MODIFIER": coaching_style,
            "USER_TYPE_MODIFIER": user_type,
            "TEMPORAL_CONTEXT": temporal_str,
        }
        layer2 = inject_variables(session_prompt, session_vars)

        return f"{layer1}\n\n== SESSION INSTRUCTIONS ==\n\n{layer2}"

    async def build_welcome_message(self, user_profile: dict) -> str:
        """Build personalized welcome message for pre-Clarity-Session state.

        Returns the assistant's first message text (not a system instruction).
        This bridges static onboarding → Clarity Session. Adapted from
        production opening_message_service.py.
        """
        template = await self._get_template("clarity_session/welcome")
        primary_role = self._resolve_primary_role(user_profile)

        # Role-based text resolution
        role_fallback = ROLE_FALLBACK.get(primary_role, ROLE_FALLBACK["default"])
        limiting_belief = LIMITING_BELIEFS.get(primary_role, LIMITING_BELIEFS["default"])
        clarity_provides = CLARITY_PROVIDES.get(primary_role, CLARITY_PROVIDES["default"])

        # Format roles_text — display-formatted, joined with " and "
        roles = user_profile.get("roles") or []
        if isinstance(roles, str):
            roles = [roles]
        if roles:
            roles_text = " and ".join(
                ROLE_DISPLAY_NAMES.get(r, r.replace("_", " ").title())
                for r in roles
            )
        else:
            roles_text = "person building a better life"

        # Format focus_area — display-formatted
        focus_area = user_profile.get("focus_area") or "what matters most"
        focus_area = focus_area.replace("_", " ")

        # Challenge — first declared challenge, or fallback
        challenges = user_profile.get("declared_challenges") or []
        if isinstance(challenges, str):
            challenges = [challenges]
        if challenges:
            challenge = challenges[0].replace("_", " ")
        else:
            challenge = "staying focused on what matters"

        variables = {
            "user.first_name": self._resolve_first_name(user_profile),
            "role_fallback": role_fallback,
            "roles_text": roles_text,
            "focus_area": focus_area,
            "challenge": challenge,
            "limiting_belief": limiting_belief,
            "clarity_provides": clarity_provides,
        }

        message = inject_variables(template, variables)

        # Length guard: if > 1,000 chars, use compact fallback
        if len(message) > 1000:
            first_name = self._resolve_first_name(user_profile)
            message = (
                f"Hey {first_name}\n\n"
                f"You don't need {limiting_belief}.\n\n"
                f"You need {clarity_provides}.\n\n"
                f"**That's what we're building together.**\n\n"
                f"By the end of this session, you'll know exactly what to focus on "
                f"— and how to actually make it happen.\n\n"
                f"Sound good?"
            )

        return message
