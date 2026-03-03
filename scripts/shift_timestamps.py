#!/usr/bin/env python3
"""
Shift DTP synthetic persona timestamps forward for demo alignment.
Truncates records that fall after the import date cutoff.

Usage: python3 scripts/shift_timestamps.py
"""

import json
import sys
from datetime import datetime, timedelta
from pathlib import Path

# Constants
SHIFT_DAYS = 365
IMPORT_DATE = datetime(2026, 2, 5, 0, 0, 0)  # Hard cutoff — no records on/after this date
DATA_DIR = Path(__file__).parent.parent / "data" / "Theo_Nakamura_P05"
SHIFTED_MARKER = DATA_DIR / ".timestamps_shifted"

JSONL_FILES = [
    "lifelog.jsonl",
    "conversations.jsonl",
    "emails.jsonl",
    "calendar.jsonl",
    "transactions.jsonl",
    "social_posts.jsonl",
    "files_index.jsonl",
]


def shift_timestamp(ts_str: str) -> str:
    """Shift ISO 8601 timestamp forward by SHIFT_DAYS.

    Uses string manipulation for the timezone suffix to avoid
    Python version issues (fromisoformat timezone support varies).
    All timestamps in this dataset use -05:00 format consistently.
    """
    # Split datetime from timezone offset (e.g., "2024-04-03T16:20:00" + "-05:00")
    # The offset is always the last 6 characters: ±HH:MM
    dt_str = ts_str[:-6]
    tz_suffix = ts_str[-6:]

    dt = datetime.fromisoformat(dt_str)
    shifted = dt + timedelta(days=SHIFT_DAYS)

    return shifted.isoformat() + tz_suffix


def is_before_import(ts_str: str) -> bool:
    """Check if timestamp is before the import date cutoff."""
    # Parse just the datetime portion (ignore timezone for comparison)
    dt_str = ts_str[:-6]
    dt = datetime.fromisoformat(dt_str)
    return dt < IMPORT_DATE


def process_jsonl(filepath: Path) -> dict:
    """Process a single JSONL file. Returns stats."""
    records = []
    original_count = 0
    dropped_count = 0

    with open(filepath, "r") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            original_count += 1
            record = json.loads(line)

            # Shift the timestamp
            record["ts"] = shift_timestamp(record["ts"])

            # Keep only records before import date
            if is_before_import(record["ts"]):
                records.append(record)
            else:
                dropped_count += 1

    # Write back in place
    with open(filepath, "w") as f:
        for record in records:
            f.write(json.dumps(record) + "\n")

    # Date range of surviving records
    if records:
        dates = [r["ts"] for r in records]
        first = min(dates)[:10]
        last = max(dates)[:10]
    else:
        first = last = "N/A"

    return {
        "file": filepath.name,
        "original": original_count,
        "kept": len(records),
        "dropped": dropped_count,
        "first_date": first,
        "last_date": last,
    }


def main():
    # Idempotency guard — don't shift already-shifted data
    if SHIFTED_MARKER.exists():
        print("ERROR: Timestamps have already been shifted (marker file exists).")
        print(f"  Marker: {SHIFTED_MARKER}")
        print("  To re-run, delete the marker file first. But note: running twice")
        print("  on already-shifted data will produce incorrect results.")
        sys.exit(1)

    print(f"DTP Timestamp Shift — +{SHIFT_DAYS} days")
    print(f"Import date cutoff: {IMPORT_DATE.isoformat()}")
    print(f"Data directory: {DATA_DIR}")
    print("-" * 70)

    total_original = 0
    total_kept = 0
    total_dropped = 0
    results = []

    for filename in JSONL_FILES:
        filepath = DATA_DIR / filename
        if not filepath.exists():
            print(f"WARNING: {filename} not found, skipping")
            continue

        stats = process_jsonl(filepath)
        results.append(stats)
        total_original += stats["original"]
        total_kept += stats["kept"]
        total_dropped += stats["dropped"]

        print(
            f"{stats['file']:25s} | {stats['original']:3d} → {stats['kept']:3d} "
            f"(dropped {stats['dropped']:2d}) | {stats['first_date']} to {stats['last_date']}"
        )

    print("-" * 70)
    print(f"{'TOTAL':25s} | {total_original:3d} → {total_kept:3d} (dropped {total_dropped:2d})")
    print()

    # Verification
    print("VERIFICATION:")
    all_pass = True
    for stats in results:
        if stats["last_date"] != "N/A" and stats["last_date"] >= "2026-02-05":
            print(f"  FAIL: {stats['file']} has records on/after import date ({stats['last_date']})")
            all_pass = False
    if all_pass:
        print("  PASS: All records are before import date (2026-02-05)")

    # Write marker file
    SHIFTED_MARKER.write_text(
        f"Shifted +{SHIFT_DAYS} days on {datetime.now().isoformat()}\n"
        f"Import cutoff: {IMPORT_DATE.isoformat()}\n"
        f"Records: {total_original} → {total_kept} (dropped {total_dropped})\n"
    )
    print(f"\nMarker written: {SHIFTED_MARKER.name}")
    print("Done. Files modified in place. Git tracks original versions.")


if __name__ == "__main__":
    main()
