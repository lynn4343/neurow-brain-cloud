"""Temporal awareness for Brain Cloud.

Resolves all temporal context server-side so the coaching AI never
calculates dates, classifies time-of-day, or reasons about temporal
patterns. Returns structured data that any part of Brain Cloud can use.

Design principle: the AI receives pre-formatted temporal context as data,
not as a computation task.
"""

import logging
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

logger = logging.getLogger(__name__)

# Default timezone for the hackathon demo (Theo Nakamura, Austin TX).
# Production: pulled from user profile.
_DEFAULT_TZ = "America/Chicago"

# --- Time-of-day classification ---
# Each tuple: (start_hour, end_hour_exclusive, classification)
# Ordered so the first match wins. Night spans midnight (21-5),
# so it's checked via the fallback.
_TIME_OF_DAY_RANGES: list[tuple[int, int, str]] = [
    (5, 9, "early_morning"),
    (9, 12, "morning"),
    (12, 14, "midday"),
    (14, 17, "afternoon"),
    (17, 21, "evening"),
    # 21-4 handled by fallback → "night"
]

# --- Week position classification ---
# Monday=0 in Python's weekday()
_WEEK_POSITION: dict[int, str] = {
    0: "start",    # Monday
    1: "mid",      # Tuesday
    2: "mid",      # Wednesday
    3: "mid",      # Thursday
    4: "end",      # Friday
    5: "weekend",  # Saturday
    6: "weekend",  # Sunday
}

# --- format_temporal_block() helpers ---
_WEEK_POSITION_PHRASES: dict[str, str] = {
    "start": "start of the work week",
    "mid": "middle of the work week",
    "end": "end of the work week",
}


def compute_action_due_date(completed_at: datetime, tz: str = _DEFAULT_TZ) -> str:
    """Compute the due date for a Clarity Session next action step.

    The user always gets a full working week:
      Mon-Wed completion → due this Sunday (4-6 days)
      Thu-Sun completion → due next Sunday (7-10 days)

    Args:
        completed_at: Session completion timestamp (timezone-aware UTC).
        tz: User's IANA timezone. Defaults to America/Chicago.

    Returns:
        ISO date string (YYYY-MM-DD), always a Sunday.
    """
    if completed_at.tzinfo is None:
        raise ValueError("completed_at must be timezone-aware (got naive datetime)")

    try:
        local_tz = ZoneInfo(tz)
    except Exception:
        logger.warning("Invalid timezone '%s', falling back to %s", tz, _DEFAULT_TZ)
        local_tz = ZoneInfo(_DEFAULT_TZ)

    local_dt = completed_at.astimezone(local_tz)
    weekday = local_dt.weekday()  # 0=Mon, 6=Sun

    if weekday <= 2:  # Mon, Tue, Wed → this Sunday
        days_until_sunday = 6 - weekday
    else:  # Thu, Fri, Sat, Sun → next Sunday
        days_until_sunday = 6 - weekday + 7

    due = local_dt.date() + timedelta(days=days_until_sunday)
    return due.isoformat()


def _classify_time_of_day(hour: int) -> str:
    """Map hour (0-23) to a time-of-day classification."""
    for start, end, classification in _TIME_OF_DAY_RANGES:
        if start <= hour < end:
            return classification
    return "night"


def get_temporal_context(timezone: str = _DEFAULT_TZ) -> dict:
    """Resolve all temporal information server-side.

    Returns a dict with 8 keys covering human-readable dates/times,
    time-of-day classification, weekend detection, week position,
    and a machine-readable ISO timestamp.

    Args:
        timezone: IANA timezone string. Defaults to America/Chicago.
                  Invalid values fall back to America/Chicago with a warning.
    """
    try:
        tz = ZoneInfo(timezone)
    except Exception:
        logger.warning("Invalid timezone '%s', falling back to %s", timezone, _DEFAULT_TZ)
        tz = ZoneInfo(_DEFAULT_TZ)

    now = datetime.now(tz)
    one_year = now + timedelta(days=365)

    return {
        # Existing fields (migrated from prompt_assembler.py)
        "current_date": now.strftime("%A, %B %d, %Y"),
        "current_time": now.strftime("%I:%M %p %Z"),
        "day_of_week": now.strftime("%A"),
        "current_date_plus_one_year": one_year.strftime("%B %d, %Y"),
        # New fields
        "time_of_day": _classify_time_of_day(now.hour),
        "is_weekend": now.weekday() >= 5,
        "week_position": _WEEK_POSITION[now.weekday()],
        "iso_timestamp": now.isoformat(),
    }


def format_temporal_block(ctx: dict) -> str:
    """Format temporal context as a human-readable text block for prompt injection.

    Produces natural English with conditional sentence structures for
    early_morning and night values. All time_of_day values are
    display-converted (underscore → space) before interpolation.
    """
    line1 = f"Today is {ctx['current_date']}. Current time: {ctx['current_time']}."

    time_display = ctx["time_of_day"].replace("_", " ")
    is_weekend = ctx["is_weekend"]

    if is_weekend:
        if ctx["time_of_day"] == "early_morning":
            line2 = "It's early morning on the weekend."
        elif ctx["time_of_day"] == "night":
            line2 = "It's late on a weekend night."
        else:
            line2 = f"It's {time_display} on the weekend."
    else:
        pos_phrase = _WEEK_POSITION_PHRASES.get(ctx["week_position"], "")
        if ctx["time_of_day"] == "early_morning":
            line2 = f"It's early morning on a weekday, {pos_phrase}."
        elif ctx["time_of_day"] == "night":
            line2 = f"It's late on a weekday night, {pos_phrase}."
        else:
            line2 = f"It's a weekday {time_display}, {pos_phrase}."

    return f"{line1}\n{line2}"
