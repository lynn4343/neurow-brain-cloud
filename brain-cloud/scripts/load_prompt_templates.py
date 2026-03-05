"""
Load 17 prompt templates into Supabase prompt_templates table.

Reads coaching scripts from BUILD_SPECS, extracts content between markers,
and upserts into prompt_templates. Idempotent: safe to re-run.

Run from brain-cloud/:
  uv run python scripts/load_prompt_templates.py

Source: Wave 3 S1 spec
"""

import asyncio
import logging
import re
from pathlib import Path

from supabase import acreate_client

from brain_cloud.config import Settings

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger("load_prompt_templates")

# Source directory for coaching scripts
SCRIPTS_DIR = Path.home() / (
    "LIFE_OS/_0_Neurow_Org/Engineering/Mission_Control/Active_Projects/"
    "Hackathon_Sprint/BUILD_SPECS/Coaching_Design/Coaching_Scripts"
)


def extract_between_markers(text: str, begin_marker: str, end_marker: str) -> str:
    """Extract content between two marker lines (exclusive of markers)."""
    lines = text.split("\n")
    start_idx = None
    end_idx = None
    for i, line in enumerate(lines):
        if begin_marker in line and start_idx is None:
            start_idx = i + 1
        elif end_marker in line and start_idx is not None:
            end_idx = i
            break
    if start_idx is None or end_idx is None:
        raise ValueError(f"Markers not found: '{begin_marker}' / '{end_marker}'")
    content = "\n".join(lines[start_idx:end_idx]).strip()
    return content


def extract_turn_templates(text: str) -> dict[str, str]:
    """Extract all turn/signal templates from the turn templates file."""
    templates = {}
    pattern = re.compile(r"### BEGIN TURN (.+)")
    lines = text.split("\n")
    i = 0
    while i < len(lines):
        match = pattern.match(lines[i])
        if match:
            name = match.group(1).strip()
            start = i + 1
            # Find END TURN
            end = None
            for j in range(start, len(lines)):
                if "### END TURN" in lines[j]:
                    end = j
                    break
            if end is None:
                raise ValueError(f"No END TURN found for '{name}'")
            content = "\n".join(lines[start:end]).strip()
            templates[name] = content
            i = end + 1
        else:
            i += 1
    return templates


async def main():
    settings = Settings()
    client = await acreate_client(settings.supabase_url, settings.supabase_key)

    templates_to_load: list[dict] = []

    # --- 4 Runtime Prompts ---
    # (master/system_prompt REMOVED — CSA-011, 2026-03-04)
    # Identity, voice, modifiers moved to claude.ts Seat 1.
    # The Supabase row can remain dormant. Source archived at
    # Design_Reference/Master_System_Prompt_Hackathon_ARCHIVED.md

    # 1. Morning Brief
    text = (SCRIPTS_DIR / "Morning_Brief_Hackathon.md").read_text()
    content = extract_between_markers(text, "### BEGIN PROMPT", "### END PROMPT")
    templates_to_load.append({
        "name": "morning_brief/session",
        "version": 1,
        "content": {"text": content},
        "category": "system",
        "tags": ["daily", "morning", "brief", "coaching", "ongoing"],
        "is_active": True,
        "release_label": "hackathon",
    })

    # 3. Weekly Session
    text = (SCRIPTS_DIR / "Weekly_Session_Hackathon.md").read_text()
    content = extract_between_markers(text, "### BEGIN PROMPT", "### END PROMPT")
    # C-3 fix: normalize uppercase {BRAIN_CLOUD_CONTEXT} to lowercase
    content = content.replace("{BRAIN_CLOUD_CONTEXT}", "{brain_cloud_context}")
    templates_to_load.append({
        "name": "weekly_session/session",
        "version": 1,
        "content": {"text": content},
        "category": "system",
        "tags": ["weekly", "session", "coaching", "ongoing", "planning"],
        "is_active": True,
        "release_label": "hackathon",
    })

    # 4. Clarity Session Welcome
    text = (SCRIPTS_DIR / "Clarity_Session_Welcome_Hackathon.md").read_text()
    content = extract_between_markers(text, "### BEGIN WELCOME", "### END WELCOME")
    templates_to_load.append({
        "name": "clarity_session/welcome",
        "version": 1,
        "content": {"text": content},
        "category": "clarity_session",
        "tags": ["clarity_session", "welcome", "onboarding", "transition"],
        "is_active": True,
        "release_label": "hackathon",
    })

    # 5. Ongoing Coaching
    text = (SCRIPTS_DIR / "Ongoing_Coaching_Hackathon.md").read_text()
    content = extract_between_markers(text, "### BEGIN PROMPT", "### END PROMPT")
    templates_to_load.append({
        "name": "ongoing/default",
        "version": 1,
        "content": {"text": content},
        "category": "system",
        "tags": ["ongoing", "coaching", "default", "tier2"],
        "is_active": True,
        "release_label": "hackathon",
    })

    # --- 8 Turn Templates + 5 Signal Handlers ---

    text = (SCRIPTS_DIR / "Clarity_Session_Turn_Templates_v2.md").read_text()
    all_turns = extract_turn_templates(text)

    # Turn templates
    for turn_num in range(1, 9):
        key = f"clarity_session/turn_{turn_num}"
        if key not in all_turns:
            raise ValueError(f"Turn template '{key}' not found in source file")
        templates_to_load.append({
            "name": key,
            "version": 1,
            "content": {"text": all_turns[key]},
            "category": "clarity_session",
            "tags": ["clarity_session", "turn"],
            "is_active": True,
            "release_label": "hackathon",
        })

    # Signal handlers
    signal_names = [
        "signals/idk_handler",
        "signals/flooding_handler",
        "signals/crisis_handler",
        "signals/disagreement_handler",
        "signals/prompt_level_guidance",
    ]
    for name in signal_names:
        if name not in all_turns:
            raise ValueError(f"Signal template '{name}' not found in source file")
        templates_to_load.append({
            "name": name,
            "version": 1,
            "content": {"text": all_turns[name]},
            "category": "signal",
            "tags": ["signal", "handler"],
            "is_active": True,
            "release_label": "hackathon",
        })

    # --- Upsert all templates ---

    logger.info(f"Loading {len(templates_to_load)} templates...")

    for tmpl in templates_to_load:
        result = await (
            client.table("prompt_templates")
            .upsert(tmpl, on_conflict="name,version")
            .execute()
        )
        if not result.data:
            logger.warning(f"  {tmpl['name']:40s} — upsert returned no data, possible issue")
            continue
        chars = len(tmpl["content"]["text"])
        logger.info(f"  {tmpl['name']:40s} ({chars:,} chars) — OK")

    logger.info(f"Done. {len(templates_to_load)} templates loaded.")


if __name__ == "__main__":
    asyncio.run(main())
