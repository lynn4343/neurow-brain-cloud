"""
Hackathon JSONL → Brain Cloud mapping functions.

7 vertical-specific mappers dispatched by map_hackathon_record().
Deterministic transforms only — no LLM calls.

Source spec: Hackathon_JSONL_Mapping_Spec.md §7
Decisions: HJ-D-001 (category routing), HJ-D-002 (conversation=1 memory),
           HJ-D-003 (file metadata as memory), HJ-D-004 (tags as metadata)
"""

import re
from typing import Any, TypedDict


class BrainCloudEntity(TypedDict):
    content: str
    category: str
    source: str
    source_type: str
    original_ts: str
    importance: float
    metadata: dict[str, Any]


# Source field value → Brain Cloud source_type
HACKATHON_SOURCE_TO_VERTICAL: dict[str, str] = {
    "lifelog": "lifelog",
    "calendar": "calendar",
    "bank": "transaction",
    "social": "social_post",
    "email": "email",
    "files": "file_index",
    "ai_chat": "conversation",
}

# (source, type) → Brain Cloud category
HACKATHON_CATEGORY_ROUTING: dict[tuple[str, str], str] = {
    ("lifelog", "activity"): "daily",
    ("lifelog", "reflection"): "insight",
    ("lifelog", "milestone"): "goal",
    ("calendar", "event"): "calendar",
    ("bank", "transaction"): "financial",
    ("social", "post"): "social",
    ("email", "inbox"): "daily",
    ("email", "sent"): "daily",
    ("files", "doc"): "daily",
    ("files", "photo"): "daily",
    ("ai_chat", "chat_turn"): "insight",
}

# Default importance by source vertical
HACKATHON_IMPORTANCE: dict[str, float] = {
    "lifelog": 0.5,
    "calendar": 0.4,
    "bank": 0.3,
    "social": 0.4,
    "email": 0.3,
    "files": 0.2,
    "ai_chat": 0.7,
}

# Importance overrides by (source, type)
HACKATHON_IMPORTANCE_OVERRIDES: dict[tuple[str, str], float] = {
    ("lifelog", "reflection"): 0.6,
    ("lifelog", "milestone"): 0.7,
}


# --- Vertical Mappers ---


def map_hackathon_lifelog(record: dict) -> BrainCloudEntity:
    source = record["source"]
    rec_type = record["type"]
    category = HACKATHON_CATEGORY_ROUTING.get((source, rec_type), "daily")
    importance = HACKATHON_IMPORTANCE_OVERRIDES.get(
        (source, rec_type),
        HACKATHON_IMPORTANCE[source],
    )

    return {
        "content": record["text"],
        "category": category,
        "source": "data_import",
        "source_type": "lifelog",
        "original_ts": record["ts"],
        "importance": importance,
        "metadata": {
            "original_id": record["id"],
            "import_source": "hackathon_import",
            "vertical": "lifelog",
            "record_type": rec_type,
            "tags": record["tags"],
            "refs": record["refs"],
            "pii_level": record["pii_level"],
        },
    }


def _parse_calendar_text(text: str) -> dict:
    result = {"title": text, "duration": None, "location": None}

    # Extract duration in parentheses: (2h), (45m), (1.5h)
    duration_match = re.search(r"\((\d+\.?\d*[hm])\)", text)
    if duration_match:
        result["duration"] = duration_match.group(1)

    # Extract location after " - " (last segment)
    parts = text.split(" - ")
    if len(parts) >= 2:
        location = parts[-1].strip()
        if not re.match(r"^\(\d", location):
            result["location"] = location

    # Title: strip duration parenthetical and location suffix
    title = re.sub(r"\s*\([\d.]+[hm]\)\s*", " ", text)
    title = title.split(" - ")[0].strip()
    title = title.rstrip(" \u2014").strip()
    result["title"] = title

    return result


def map_hackathon_calendar(record: dict) -> BrainCloudEntity:
    parsed = _parse_calendar_text(record["text"])

    return {
        "content": record["text"],
        "category": "calendar",
        "source": "data_import",
        "source_type": "calendar",
        "original_ts": record["ts"],
        "importance": HACKATHON_IMPORTANCE["calendar"],
        "metadata": {
            "original_id": record["id"],
            "import_source": "hackathon_import",
            "vertical": "calendar",
            "record_type": "event",
            "title": parsed["title"],
            "duration": parsed["duration"],
            "location": parsed["location"],
            "tags": record["tags"],
            "refs": record["refs"],
            "pii_level": record["pii_level"],
        },
    }


def _parse_transaction_text(text: str) -> dict:
    result = {"amount": None, "vendor": None, "tx_category": None, "direction": "expense"}

    amount_match = re.match(r"\$([0-9,]+\.?\d*)", text)
    if amount_match:
        result["amount"] = float(amount_match.group(1).replace(",", ""))

    parts = [p.strip() for p in text.split(" - ")]
    if len(parts) >= 2:
        result["vendor"] = parts[1]
    if len(parts) >= 3:
        result["tx_category"] = parts[2]

    if "revenue" in text.lower() or "payment received" in text.lower():
        result["direction"] = "income"

    return result


def map_hackathon_transaction(record: dict) -> BrainCloudEntity:
    parsed = _parse_transaction_text(record["text"])

    return {
        "content": record["text"],
        "category": "financial",
        "source": "data_import",
        "source_type": "transaction",
        "original_ts": record["ts"],
        "importance": HACKATHON_IMPORTANCE["bank"],
        "metadata": {
            "original_id": record["id"],
            "import_source": "hackathon_import",
            "vertical": "transaction",
            "record_type": "transaction",
            "amount": parsed["amount"],
            "vendor": parsed["vendor"],
            "tx_category": parsed["tx_category"],
            "direction": parsed["direction"],
            "tags": record["tags"],
            "refs": record["refs"],
            "pii_level": record["pii_level"],
        },
    }


def map_hackathon_social(record: dict) -> BrainCloudEntity:
    hashtags = re.findall(r"#(\w+)", record["text"])

    return {
        "content": record["text"],
        "category": "social",
        "source": "data_import",
        "source_type": "social_post",
        "original_ts": record["ts"],
        "importance": HACKATHON_IMPORTANCE["social"],
        "metadata": {
            "original_id": record["id"],
            "import_source": "hackathon_import",
            "vertical": "social_post",
            "record_type": "post",
            "hashtags": hashtags if hashtags else None,
            "tags": record["tags"],
            "refs": record["refs"],
            "pii_level": record["pii_level"],
        },
    }


def _parse_email_text(text: str) -> dict:
    result = {"from_addr": None, "to_addr": None, "subject": None, "body_summary": None}

    parts = [p.strip() for p in text.split(" | ")]
    for part in parts:
        if part.startswith("From:"):
            result["from_addr"] = part[len("From:"):].strip()
        elif part.startswith("To:"):
            result["to_addr"] = part[len("To:"):].strip()
        elif part.startswith("Subject:"):
            result["subject"] = part[len("Subject:"):].strip()
        elif part.startswith("Body summary:"):
            result["body_summary"] = part[len("Body summary:"):].strip()

    return result


def map_hackathon_email(record: dict) -> BrainCloudEntity:
    parsed = _parse_email_text(record["text"])
    direction = record["type"]  # "inbox" or "sent"

    content = f"Email ({direction}): {parsed['subject'] or 'No subject'}"
    if parsed["body_summary"]:
        content += f" — {parsed['body_summary']}"

    return {
        "content": content,
        "category": "daily",
        "source": "data_import",
        "source_type": "email",
        "original_ts": record["ts"],
        "importance": HACKATHON_IMPORTANCE["email"],
        "metadata": {
            "original_id": record["id"],
            "import_source": "hackathon_import",
            "vertical": "email",
            "record_type": direction,
            "from_addr": parsed["from_addr"],
            "to_addr": parsed["to_addr"],
            "subject": parsed["subject"],
            "body_summary": parsed["body_summary"],
            "direction": direction,
            "tags": record["tags"],
            "refs": record["refs"],
            "pii_level": record["pii_level"],
        },
    }


def _parse_file_text(text: str) -> dict:
    result = {"filename": None, "file_ext": None, "description": None}

    parts = text.split(" \u2014 ", 1)
    if len(parts) == 2:
        result["filename"] = parts[0].strip()
        result["description"] = parts[1].strip()
        ext_match = re.search(r"\.(\w+)$", result["filename"])
        if ext_match:
            result["file_ext"] = ext_match.group(1).lower()
    else:
        result["description"] = text

    return result


def map_hackathon_files(record: dict) -> BrainCloudEntity:
    parsed = _parse_file_text(record["text"])

    content = f"File: {parsed['filename'] or 'unknown'}"
    if parsed["description"]:
        content += f" \u2014 {parsed['description']}"

    return {
        "content": content,
        "category": "daily",
        "source": "data_import",
        "source_type": "file_index",
        "original_ts": record["ts"],
        "importance": HACKATHON_IMPORTANCE["files"],
        "metadata": {
            "original_id": record["id"],
            "import_source": "hackathon_import",
            "vertical": "file_index",
            "record_type": record["type"],
            "filename": parsed["filename"],
            "file_ext": parsed["file_ext"],
            "description": parsed["description"],
            "tags": record["tags"],
            "refs": record["refs"],
            "pii_level": record["pii_level"],
        },
    }


def _parse_conversation_text(text: str) -> dict:
    result = {"user_message": None, "assistant_message": None}

    parts = text.split("ASSISTANT:", 1)
    if len(parts) == 2:
        user_part = parts[0].strip()
        result["assistant_message"] = parts[1].strip()
        if user_part.startswith("USER:"):
            result["user_message"] = user_part[len("USER:"):].strip()
        else:
            result["user_message"] = user_part
    else:
        result["user_message"] = text

    return result


def map_hackathon_conversation(record: dict) -> BrainCloudEntity:
    parsed = _parse_conversation_text(record["text"])

    return {
        "content": record["text"],
        "category": "insight",
        "source": "data_import",
        "source_type": "conversation",
        "original_ts": record["ts"],
        "importance": HACKATHON_IMPORTANCE["ai_chat"],
        "metadata": {
            "original_id": record["id"],
            "import_source": "hackathon_import",
            "vertical": "conversation",
            "record_type": "chat_turn",
            "user_message": parsed["user_message"],
            "assistant_message": parsed["assistant_message"],
            "prior_ai_source": "unknown",
            "tags": record["tags"],
            "refs": record["refs"],
            "pii_level": record["pii_level"],
        },
    }


# --- Dispatcher ---

HACKATHON_VERTICAL_MAPPERS: dict[str, callable] = {
    "lifelog": map_hackathon_lifelog,
    "calendar": map_hackathon_calendar,
    "bank": map_hackathon_transaction,
    "social": map_hackathon_social,
    "email": map_hackathon_email,
    "files": map_hackathon_files,
    "ai_chat": map_hackathon_conversation,
}


def map_hackathon_record(record: dict) -> BrainCloudEntity:
    """Route a hackathon JSONL record to the appropriate vertical mapper."""
    source = record["source"]
    mapper = HACKATHON_VERTICAL_MAPPERS.get(source)
    if mapper is None:
        raise ValueError(f"Unknown hackathon JSONL source: {source!r}")
    return mapper(record)
