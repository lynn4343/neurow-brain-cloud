"""Tests for brain_cloud.temporal — temporal awareness module."""

import re
from datetime import datetime
from unittest.mock import patch
from zoneinfo import ZoneInfo

from brain_cloud.temporal import format_temporal_block, get_temporal_context

TZ = ZoneInfo("America/Chicago")


def _mock_now(year=2026, month=3, day=4, hour=9, minute=15):
    """Create a timezone-aware datetime for mocking."""
    return datetime(year, month, day, hour, minute, tzinfo=TZ)


# ---------------------------------------------------------------------------
# get_temporal_context() tests
# ---------------------------------------------------------------------------


def test_returns_all_expected_keys():
    """Context dict contains all 8 keys."""
    ctx = get_temporal_context()
    expected_keys = {
        "current_date", "current_time", "day_of_week",
        "current_date_plus_one_year", "time_of_day", "is_weekend",
        "week_position", "iso_timestamp",
    }
    assert set(ctx.keys()) == expected_keys


@patch("brain_cloud.temporal.datetime")
def test_time_of_day_classification(mock_dt):
    """Each hour range maps to correct classification."""
    cases = [
        (3, "night"),
        (5, "early_morning"),
        (8, "early_morning"),
        (9, "morning"),
        (11, "morning"),
        (12, "midday"),
        (13, "midday"),
        (14, "afternoon"),
        (16, "afternoon"),
        (17, "evening"),
        (20, "evening"),
        (21, "night"),
        (23, "night"),
    ]
    for hour, expected in cases:
        mock_dt.now.return_value = _mock_now(hour=hour)
        mock_dt.side_effect = lambda *a, **kw: datetime(*a, **kw)
        ctx = get_temporal_context()
        assert ctx["time_of_day"] == expected, f"hour={hour}: expected {expected}, got {ctx['time_of_day']}"


@patch("brain_cloud.temporal.datetime")
def test_week_position_classification(mock_dt):
    """Monday=start, Tue-Thu=mid, Fri=end, Sat-Sun=weekend."""
    # 2026-03-02 is Monday, 2026-03-08 is Sunday
    cases = [
        (2, "start"),   # Monday
        (3, "mid"),     # Tuesday
        (4, "mid"),     # Wednesday
        (5, "mid"),     # Thursday
        (6, "end"),     # Friday
        (7, "weekend"), # Saturday
        (8, "weekend"), # Sunday
    ]
    for day, expected in cases:
        mock_dt.now.return_value = _mock_now(day=day)
        mock_dt.side_effect = lambda *a, **kw: datetime(*a, **kw)
        ctx = get_temporal_context()
        assert ctx["week_position"] == expected, f"day={day}: expected {expected}, got {ctx['week_position']}"


@patch("brain_cloud.temporal.datetime")
def test_weekend_detection(mock_dt):
    """is_weekend is True for Saturday and Sunday only."""
    for day in range(2, 9):  # Mon=2 through Sun=8 (March 2026)
        mock_dt.now.return_value = _mock_now(day=day)
        mock_dt.side_effect = lambda *a, **kw: datetime(*a, **kw)
        ctx = get_temporal_context()
        expected = day >= 7  # Saturday=7, Sunday=8
        assert ctx["is_weekend"] == expected, f"day={day}: expected is_weekend={expected}"


def test_invalid_timezone_fallback():
    """Invalid timezone string falls back to America/Chicago with no exception."""
    ctx = get_temporal_context(timezone="Invalid/Timezone")
    assert "current_date" in ctx
    assert len(ctx) == 8


def test_iso_timestamp_format():
    """iso_timestamp is a valid ISO 8601 string with timezone offset."""
    ctx = get_temporal_context()
    ts = ctx["iso_timestamp"]
    # Regex: date T time (optional microseconds) timezone offset
    pattern = r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?[+-]\d{2}:\d{2}"
    assert re.fullmatch(pattern, ts), f"iso_timestamp doesn't match ISO 8601: {ts}"


# ---------------------------------------------------------------------------
# format_temporal_block() tests
# ---------------------------------------------------------------------------


@patch("brain_cloud.temporal.datetime")
def test_format_standard_weekday_output(mock_dt):
    """Standard time_of_day values produce 'It's a weekday {time}, {position}.'"""
    # Wednesday 2pm = afternoon, mid week
    mock_dt.now.return_value = _mock_now(day=4, hour=14)  # Wed March 4
    mock_dt.side_effect = lambda *a, **kw: datetime(*a, **kw)
    ctx = get_temporal_context()
    block = format_temporal_block(ctx)
    assert "It's a weekday afternoon, middle of the work week." in block


@patch("brain_cloud.temporal.datetime")
def test_format_early_morning_weekday_output(mock_dt):
    """early_morning uses flipped sentence structure."""
    # Monday 6am = early_morning, start
    mock_dt.now.return_value = _mock_now(day=2, hour=6)  # Mon March 2
    mock_dt.side_effect = lambda *a, **kw: datetime(*a, **kw)
    ctx = get_temporal_context()
    block = format_temporal_block(ctx)
    assert "It's early morning on a weekday, start of the work week." in block


@patch("brain_cloud.temporal.datetime")
def test_format_night_weekday_output(mock_dt):
    """night uses 'late' qualifier."""
    # Wednesday 11pm = night, mid
    mock_dt.now.return_value = _mock_now(day=4, hour=23)  # Wed March 4
    mock_dt.side_effect = lambda *a, **kw: datetime(*a, **kw)
    ctx = get_temporal_context()
    block = format_temporal_block(ctx)
    assert "It's late on a weekday night, middle of the work week." in block


@patch("brain_cloud.temporal.datetime")
def test_format_standard_weekend_output(mock_dt):
    """Standard time_of_day on weekend produces 'It's {time} on the weekend.'"""
    # Saturday 10am = morning, weekend
    mock_dt.now.return_value = _mock_now(day=7, hour=10)  # Sat March 7
    mock_dt.side_effect = lambda *a, **kw: datetime(*a, **kw)
    ctx = get_temporal_context()
    block = format_temporal_block(ctx)
    assert "It's morning on the weekend." in block


@patch("brain_cloud.temporal.datetime")
def test_format_early_morning_weekend_output(mock_dt):
    """early_morning on weekend uses flipped structure."""
    # Sunday 6am = early_morning, weekend
    mock_dt.now.return_value = _mock_now(day=8, hour=6)  # Sun March 8
    mock_dt.side_effect = lambda *a, **kw: datetime(*a, **kw)
    ctx = get_temporal_context()
    block = format_temporal_block(ctx)
    assert "It's early morning on the weekend." in block


@patch("brain_cloud.temporal.datetime")
def test_format_night_weekend_output(mock_dt):
    """night on weekend uses 'late' qualifier."""
    # Saturday 11pm = night, weekend
    mock_dt.now.return_value = _mock_now(day=7, hour=23)  # Sat March 7
    mock_dt.side_effect = lambda *a, **kw: datetime(*a, **kw)
    ctx = get_temporal_context()
    block = format_temporal_block(ctx)
    assert "It's late on a weekend night." in block


@patch("brain_cloud.temporal.datetime")
def test_format_includes_date_and_time(mock_dt):
    """First line always contains the current_date and current_time."""
    mock_dt.now.return_value = _mock_now(day=4, hour=9, minute=15)
    mock_dt.side_effect = lambda *a, **kw: datetime(*a, **kw)
    ctx = get_temporal_context()
    block = format_temporal_block(ctx)
    first_line = block.split("\n")[0]
    assert ctx["current_date"] in first_line
    assert ctx["current_time"] in first_line
