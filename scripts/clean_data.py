#!/usr/bin/env python3
"""
Clean synthetic DTP data: deduplicate, fix quality issues, re-sequence IDs.
Must run AFTER shift_timestamps.py (requires .timestamps_shifted marker).

Usage: python3 scripts/clean_data.py
"""

import json
import sys
from collections import defaultdict
from datetime import datetime
from pathlib import Path

# Constants
DATA_DIR = Path(__file__).parent.parent / "data" / "Theo_Nakamura_P05"
SHIFTED_MARKER = DATA_DIR / ".timestamps_shifted"
CLEANED_MARKER = DATA_DIR / ".data_cleaned"

ID_PREFIXES = {
    "lifelog.jsonl": "ll",
    "conversations.jsonl": "c",
    "emails.jsonl": "e",
    "calendar.jsonl": "cal",
    "transactions.jsonl": "t",
    "social_posts.jsonl": "s",
    "files_index.jsonl": "f",
}

JSONL_FILES = list(ID_PREFIXES.keys())


# ---------------------------------------------------------------------------
# Helper functions
# ---------------------------------------------------------------------------

def extract_month(ts_str: str) -> str:
    """Extract YYYY-MM from ISO 8601 timestamp."""
    return ts_str[:7]


def spread_select(records: list, max_count: int) -> list:
    """Select records spread across timeline: earliest, midpoint(s), latest."""
    if len(records) <= max_count:
        return list(records)
    if max_count == 1:
        return [records[0]]
    if max_count == 2:
        return [records[0], records[-1]]
    if max_count == 3:
        mid = len(records) // 2
        return [records[0], records[mid], records[-1]]
    # For max_count > 3, evenly space
    indices = [int(i * (len(records) - 1) / (max_count - 1)) for i in range(max_count)]
    return [records[i] for i in indices]


def dedup_by_text(records: list, max_per_text: int) -> list:
    """Generic dedup: group by text, keep max_per_text spread across timeline."""
    groups = defaultdict(list)
    for r in records:
        groups[r["text"]].append(r)

    kept = []
    for text, group in groups.items():
        group.sort(key=lambda r: r["ts"])
        kept.extend(spread_select(group, max_per_text))
    return kept


def dedup_by_text_per_month(records: list) -> list:
    """Dedup: max 1 per unique text per calendar month."""
    seen = set()
    kept = []
    for r in sorted(records, key=lambda r: r["ts"]):
        key = (r["text"], extract_month(r["ts"]))
        if key not in seen:
            seen.add(key)
            kept.append(r)
    return kept


def resequence_ids(records: list, prefix: str) -> list:
    """Re-sequence IDs: prefix_0001, prefix_0002, ..."""
    for i, r in enumerate(records, 1):
        r["id"] = f"{prefix}_{i:04d}"
    return records


def clear_refs(records: list) -> int:
    """Clear all refs to empty arrays. Returns count of non-empty refs cleared."""
    cleared = 0
    for r in records:
        if r.get("refs"):
            cleared += 1
        r["refs"] = []
    return cleared


# ---------------------------------------------------------------------------
# Per-file cleaning functions
# ---------------------------------------------------------------------------

def clean_lifelog(records: list) -> tuple:
    """Dedup lifelog with type-aware rules.

    - milestone: keep 1 instance (earliest) per unique text
    - activity/reflection: keep max 3 (earliest + mid + latest)
    """
    groups = defaultdict(list)
    for r in records:
        groups[r["text"]].append(r)

    kept = []
    for text, group in groups.items():
        group.sort(key=lambda r: r["ts"])
        if group[0].get("type") == "milestone":
            kept.extend(spread_select(group, 1))
        else:
            kept.extend(spread_select(group, 3))

    unique_count = len(groups)
    return kept, unique_count


def clean_emails(records: list) -> tuple:
    """Dedup emails (max 2 per text) + fix sent/inbox type."""
    type_fixes = 0
    for r in records:
        # Parse From address: "From: addr@domain | To: ..."
        from_part = r["text"].split("|")[0].strip()
        is_theo = "theo@theonakamura.com" in from_part
        correct_type = "sent" if is_theo else "inbox"
        if r["type"] != correct_type:
            r["type"] = correct_type
            type_fixes += 1

    kept = dedup_by_text(records, max_per_text=2)
    unique_count = len(set(r["text"] for r in records))
    return kept, unique_count, type_fixes


def clean_calendar(records: list) -> tuple:
    """Dedup calendar: max 1 per text per calendar month."""
    kept = dedup_by_text_per_month(records)
    unique_count = len(set(r["text"] for r in records))
    return kept, unique_count


def clean_transactions(records: list) -> tuple:
    """Dedup transactions: max 1 per text per calendar month."""
    kept = dedup_by_text_per_month(records)
    unique_count = len(set(r["text"] for r in records))
    return kept, unique_count


def clean_social_posts(records: list) -> tuple:
    """Dedup social posts: max 2 per text (earliest + latest)."""
    kept = dedup_by_text(records, max_per_text=2)
    unique_count = len(set(r["text"] for r in records))
    return kept, unique_count


def clean_files_index(records: list) -> tuple:
    """Dedup files index (max 2 per text) + fix portfolio year."""
    year_fixes = 0
    for r in records:
        if "portfolio_2024" in r["text"]:
            r["text"] = r["text"].replace("portfolio_2024", "portfolio_2025")
            year_fixes += 1

    kept = dedup_by_text(records, max_per_text=2)
    unique_count = len(set(r["text"] for r in records))
    return kept, unique_count, year_fixes


# ---------------------------------------------------------------------------
# File I/O
# ---------------------------------------------------------------------------

def read_jsonl(filepath: Path) -> list:
    """Read JSONL file into list of dicts."""
    records = []
    with open(filepath, "r") as f:
        for line in f:
            line = line.strip()
            if line:
                records.append(json.loads(line))
    return records


def write_jsonl(filepath: Path, records: list) -> None:
    """Write list of dicts to JSONL file."""
    with open(filepath, "w") as f:
        for record in records:
            f.write(json.dumps(record) + "\n")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    # Precondition: timestamps must be shifted first
    if not SHIFTED_MARKER.exists():
        print("ERROR: Timestamps have not been shifted yet.")
        print("  Run shift_timestamps.py first.")
        sys.exit(1)

    # Idempotency guard
    if CLEANED_MARKER.exists():
        print("ERROR: Data has already been cleaned (marker file exists).")
        print(f"  Marker: {CLEANED_MARKER}")
        print("  To re-run, delete the marker file first.")
        sys.exit(1)

    print("DTP Data Cleaning — Dedup + Quality Fixes")
    print(f"Data directory: {DATA_DIR}")
    print("-" * 70)

    total_before = 0
    total_after = 0
    total_refs_cleared = 0
    results = []

    for filename in JSONL_FILES:
        filepath = DATA_DIR / filename
        if not filepath.exists():
            print(f"WARNING: {filename} not found, skipping")
            continue

        records = read_jsonl(filepath)
        original_count = len(records)
        total_before += original_count
        extra_info = ""

        # Apply per-file cleaning
        if filename == "lifelog.jsonl":
            cleaned, unique_count = clean_lifelog(records)
        elif filename == "conversations.jsonl":
            cleaned = list(records)  # No changes
            unique_count = len(set(r["text"] for r in records))
            extra_info = " (skipped — already clean)"
        elif filename == "emails.jsonl":
            cleaned, unique_count, type_fixes = clean_emails(records)
            extra_info = f" | {type_fixes} type fixes"
        elif filename == "calendar.jsonl":
            cleaned, unique_count = clean_calendar(records)
        elif filename == "transactions.jsonl":
            cleaned, unique_count = clean_transactions(records)
        elif filename == "social_posts.jsonl":
            cleaned, unique_count = clean_social_posts(records)
        elif filename == "files_index.jsonl":
            cleaned, unique_count, year_fixes = clean_files_index(records)
            extra_info = f" | {year_fixes} portfolio year fixes"
        else:
            cleaned = list(records)
            unique_count = len(set(r["text"] for r in records))

        # Cross-file operations: clear refs, sort, re-sequence
        refs_cleared = clear_refs(cleaned)
        total_refs_cleared += refs_cleared

        cleaned.sort(key=lambda r: r["ts"])

        prefix = ID_PREFIXES[filename]
        resequence_ids(cleaned, prefix)

        # Write back
        write_jsonl(filepath, cleaned)

        kept_count = len(cleaned)
        total_after += kept_count
        removed = original_count - kept_count

        # Date range
        if cleaned:
            first_date = min(r["ts"] for r in cleaned)[:10]
            last_date = max(r["ts"] for r in cleaned)[:10]
        else:
            first_date = last_date = "N/A"

        print(
            f"{filename:25s} | {original_count:3d} → {kept_count:3d} "
            f"(removed {removed:2d}) | {unique_count:2d} unique texts"
            f"{extra_info}"
        )

        results.append({
            "file": filename,
            "original": original_count,
            "kept": kept_count,
            "removed": removed,
            "unique": unique_count,
            "first_date": first_date,
            "last_date": last_date,
        })

    print("-" * 70)
    print(
        f"{'TOTAL':25s} | {total_before:3d} → {total_after:3d} "
        f"(removed {total_before - total_after:2d})"
    )
    print()

    # Quality fix summary
    print("QUALITY FIXES:")
    print(f"  Refs cleared: {total_refs_cleared} non-empty refs → []")
    print(f"  All files: sorted by timestamp, IDs re-sequenced")
    print()

    # Verification
    print("VERIFICATION:")
    all_pass = True

    # Check no duplicate texts exceed their caps
    for stat in results:
        filepath = DATA_DIR / stat["file"]
        records = read_jsonl(filepath)
        text_counts = defaultdict(int)
        for r in records:
            text_counts[r["text"]] += 1

        if stat["file"] == "lifelog.jsonl":
            for text, count in text_counts.items():
                # Find type of this text
                record_type = next(r["type"] for r in records if r["text"] == text)
                if record_type == "milestone" and count > 1:
                    print(f"  FAIL: {stat['file']} milestone appears {count}x: {text[:50]}...")
                    all_pass = False
                elif count > 3:
                    print(f"  FAIL: {stat['file']} text appears {count}x (max 3): {text[:50]}...")
                    all_pass = False
        elif stat["file"] in ("emails.jsonl", "social_posts.jsonl", "files_index.jsonl"):
            for text, count in text_counts.items():
                if count > 2:
                    print(f"  FAIL: {stat['file']} text appears {count}x (max 2): {text[:50]}...")
                    all_pass = False

        # Check IDs are sequential
        prefix = ID_PREFIXES[stat["file"]]
        expected_ids = [f"{prefix}_{i:04d}" for i in range(1, len(records) + 1)]
        actual_ids = [r["id"] for r in records]
        if actual_ids != expected_ids:
            print(f"  FAIL: {stat['file']} IDs not sequential")
            all_pass = False

        # Check sorted by timestamp
        timestamps = [r["ts"] for r in records]
        if timestamps != sorted(timestamps):
            print(f"  FAIL: {stat['file']} not sorted by timestamp")
            all_pass = False

        # Check refs all empty
        non_empty_refs = [r for r in records if r.get("refs")]
        if non_empty_refs:
            print(f"  FAIL: {stat['file']} has {len(non_empty_refs)} non-empty refs")
            all_pass = False

    if all_pass:
        print("  PASS: All dedup caps respected")
        print("  PASS: All IDs sequential")
        print("  PASS: All files sorted by timestamp")
        print("  PASS: All refs empty")

    # Write marker file
    CLEANED_MARKER.write_text(
        f"Cleaned on {datetime.now().isoformat()}\n"
        f"Records: {total_before} → {total_after} (removed {total_before - total_after})\n"
        f"Refs cleared: {total_refs_cleared}\n"
    )
    print(f"\nMarker written: {CLEANED_MARKER.name}")
    print("Done. Files modified in place. Git tracks original versions.")


if __name__ == "__main__":
    main()
