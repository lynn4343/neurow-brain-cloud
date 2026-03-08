"""Test write pipeline — structured and natural language modes."""

import pytest

from brain_cloud.pipelines.write import write_pipeline, _resolve_date, _quality_gate
from brain_cloud.models import ParsedFact


@pytest.mark.asyncio
async def test_structured_write(test_stores, test_user_id):
    """Structured mode bypasses LLM extraction, maps fields directly."""
    result = await write_pipeline(
        content="Test structured write",
        user_id=test_user_id,
        stores=test_stores,
        structured={
            "content": "Test structured write",
            "category": "daily",
            "source": "data_import",
            "source_type": "lifelog",
            "original_ts": "2026-02-10T08:00:00Z",
            "importance": 0.5,
            "confidence": 0.7,
            "metadata": {"test": True},
        },
    )
    assert len(result.memory_ids) == 1
    assert all(s == "synced" for s in result.stores.values()), f"Sync failed: {result.stores}"


@pytest.mark.asyncio
async def test_natural_language_write(test_stores, test_user_id):
    """Natural language mode extracts facts via configured extraction model."""
    result = await write_pipeline(
        content="Test Runner decided to raise consulting rates to $2,800 for brand refresh projects.",
        user_id=test_user_id,
        stores=test_stores,
    )
    assert result.facts_extracted > 0, "No facts extracted"
    assert result.facts_stored > 0, "No facts stored"
    assert all(s == "synced" for s in result.stores.values()), f"Sync failed: {result.stores}"


# --- _resolve_date unit tests ---


def test_resolve_date_full_date():
    """Full YYYY-MM-DD date is preserved."""
    fallback = "2026-03-07T12:00:00+00:00"
    result = _resolve_date("2024-06-15", fallback)
    assert result.startswith("2024-06-15")
    assert result != fallback


def test_resolve_date_year_month():
    """Partial YYYY-MM date resolves to first of month."""
    fallback = "2026-03-07T12:00:00+00:00"
    result = _resolve_date("2024-06", fallback)
    assert result.startswith("2024-06-01")


def test_resolve_date_year_only():
    """Partial YYYY date resolves to Jan 1 of that year."""
    fallback = "2026-03-07T12:00:00+00:00"
    result = _resolve_date("2024", fallback)
    assert result.startswith("2024-01-01")


def test_resolve_date_none_returns_fallback():
    """None input returns fallback."""
    fallback = "2026-03-07T12:00:00+00:00"
    assert _resolve_date(None, fallback) == fallback


def test_resolve_date_unknown_returns_fallback():
    """'unknown' string returns fallback."""
    fallback = "2026-03-07T12:00:00+00:00"
    assert _resolve_date("unknown", fallback) == fallback


def test_resolve_date_empty_returns_fallback():
    """Empty string returns fallback."""
    fallback = "2026-03-07T12:00:00+00:00"
    assert _resolve_date("", fallback) == fallback


def test_resolve_date_garbage_returns_fallback():
    """Unparseable string returns fallback."""
    fallback = "2026-03-07T12:00:00+00:00"
    assert _resolve_date("not-a-date", fallback) == fallback


def test_resolve_date_with_whitespace():
    """Leading/trailing whitespace is stripped."""
    fallback = "2026-03-07T12:00:00+00:00"
    result = _resolve_date("  2024-06-15  ", fallback)
    assert result.startswith("2024-06-15")


@pytest.mark.asyncio
async def test_date_extraction_from_natural_language(test_stores, test_user_id):
    """Natural language with dates should preserve original_ts from content."""
    result = await write_pipeline(
        content="[2024-06-15] - Started charging $100/hour for brand identity projects",
        user_id=test_user_id,
        stores=test_stores,
    )
    assert result.facts_stored > 0, "No facts stored"
    # Verify via Supabase that original_ts is 2024, not 2026
    user_uuid = str(await test_stores.resolve_user_id(test_user_id))
    memories = await test_stores.supabase.get_all_memories(user_uuid)
    recent = [m for m in memories if "100" in m.get("content", "") or "brand" in m.get("content", "")]
    assert len(recent) > 0, "Fact not found in Supabase"
    for m in recent:
        assert m["original_ts"].startswith("2024"), f"Date not preserved: {m['original_ts']}"


# --- Category taxonomy tests (W5-3C: domain-aligned taxonomy) ---


def test_quality_gate_accepts_all_domain_categories():
    """Quality gate must accept all 9 personal + 3 professional domain categories."""
    domains = [
        "home", "finance", "health", "mindset", "family",
        "spirituality", "recreation", "community", "love",
        "career", "business", "education",
    ]
    facts = [
        ParsedFact(text=f"Test fact for {cat} domain", confidence="explicit", category=cat)
        for cat in domains
    ]
    passed = _quality_gate(facts)
    assert len(passed) == len(domains), f"Expected {len(domains)}, got {len(passed)}"


def test_quality_gate_accepts_cross_domain_types():
    """Quality gate must accept all 8 cross-domain type categories."""
    types = ["goal", "pattern", "insight", "belief", "behavior",
             "identity", "preference", "instruction"]
    facts = [
        ParsedFact(text=f"Test fact for {cat} type", confidence="explicit", category=cat)
        for cat in types
    ]
    passed = _quality_gate(facts)
    assert len(passed) == len(types), f"Expected {len(types)}, got {len(passed)}"


def test_quality_gate_accepts_infrastructure_categories():
    """Quality gate must accept infrastructure, backward-compat, and fallback categories."""
    infra = ["calendar", "daily", "session", "social", "financial", "uncategorized"]
    facts = [
        ParsedFact(text=f"Test fact for {cat} category", confidence="explicit", category=cat)
        for cat in infra
    ]
    passed = _quality_gate(facts)
    assert len(passed) == len(infra), f"Expected {len(infra)}, got {len(passed)}"


def test_quality_gate_rejects_unknown_category():
    """Quality gate still rejects categories not in ALLOWED_CATEGORIES."""
    facts = [
        ParsedFact(text="Fact with invalid category", confidence="explicit", category="nonexistent"),
    ]
    passed = _quality_gate(facts)
    assert len(passed) == 0, "Unknown category should be rejected"


def test_quality_gate_normalizes_category_case():
    """Quality gate should normalize case before checking ALLOWED_CATEGORIES."""
    facts = [
        ParsedFact(text="Test with title case category", confidence="explicit", category="Mindset"),
        ParsedFact(text="Test with upper case category", confidence="explicit", category="HEALTH"),
        ParsedFact(text="Test with mixed case category", confidence="explicit", category="Finance"),
    ]
    passed = _quality_gate(facts)
    assert len(passed) == 3, f"Expected 3 (case normalized), got {len(passed)}"


def test_quality_gate_rejects_malformed_variants():
    """Hyphenated/spaced variants of single-word categories should be rejected."""
    facts = [
        ParsedFact(text="Hyphenated variant should fail", confidence="explicit", category="mind-set"),
        ParsedFact(text="Spaced variant should fail", confidence="explicit", category="mind set"),
    ]
    passed = _quality_gate(facts)
    assert len(passed) == 0, f"Expected 0 (malformed categories rejected), got {len(passed)}"


def test_quality_gate_strips_user_prefix():
    """Strip 'User' / 'The user' prefix from extracted facts."""
    facts = [
        ParsedFact(text="User has a friend who is a neurosurgeon", confidence="explicit", category="community"),
        ParsedFact(text="The user prefers dark mode", confidence="explicit", category="preference"),
        ParsedFact(text="user likes coffee", confidence="explicit", category="preference"),
        ParsedFact(text="Uses Figma for design work", confidence="explicit", category="behavior"),
    ]
    result = _quality_gate(facts)
    assert result[0].text == "Has a friend who is a neurosurgeon"
    assert result[1].text == "Prefers dark mode"
    assert result[2].text == "Likes coffee"
    assert result[3].text == "Uses Figma for design work"


@pytest.mark.asyncio
async def test_import_content_domain_categories(test_stores, test_user_id):
    """Content spanning multiple life domains should all be stored (not rejected)."""
    result = await write_pipeline(
        content=(
            "[2024-06-15] - Name: Test User, lives in Austin TX. "
            "Running 3x/week. Freelance designer charging $100/hr. "
            "Prefers dark mode. Feeling more grounded this month."
        ),
        user_id=test_user_id,
        stores=test_stores,
        source="ai_import",
    )
    assert result.facts_stored >= 3, (
        f"Expected 3+ facts, got {result.facts_stored} — domain categories may be rejected"
    )


# --- Importance scoring tests (W5-5A: make the dead field live) ---


def test_quality_gate_clamps_importance_range():
    """Importance values outside 0-1 are clamped."""
    facts = [
        ParsedFact(text="High importance fact here", confidence="explicit",
                   category="identity", importance=1.5),
        ParsedFact(text="Negative importance fact here", confidence="explicit",
                   category="daily", importance=-0.3),
    ]
    passed = _quality_gate(facts)
    assert len(passed) == 2
    assert passed[0].importance == 1.0
    assert passed[1].importance == 0.0


def test_quality_gate_preserves_valid_importance():
    """Valid importance values pass through unchanged."""
    facts = [
        ParsedFact(text="Identity defining fact here", confidence="explicit",
                   category="identity", importance=0.9),
        ParsedFact(text="Trivial detail about a thing", confidence="explicit",
                   category="daily", importance=0.2),
    ]
    passed = _quality_gate(facts)
    assert passed[0].importance == 0.9
    assert passed[1].importance == 0.2


def test_quality_gate_defaults_missing_importance():
    """When extraction doesn't provide importance, default to 0.5."""
    facts = [
        ParsedFact(text="Fact without importance score", confidence="explicit",
                   category="career"),
    ]
    passed = _quality_gate(facts)
    assert passed[0].importance == 0.5


# --- Structured mode validation tests (W5-5A: close the bypass) ---


@pytest.mark.asyncio
async def test_structured_write_rejects_empty_content(test_stores, test_user_id):
    """Structured mode should reject empty content."""
    result = await write_pipeline(
        content="",
        user_id=test_user_id,
        stores=test_stores,
        structured={"content": "", "category": "daily"},
    )
    assert result.facts_stored == 0


@pytest.mark.asyncio
async def test_structured_write_rejects_short_content(test_stores, test_user_id):
    """Structured mode should reject content shorter than 10 chars."""
    result = await write_pipeline(
        content="Too short",
        user_id=test_user_id,
        stores=test_stores,
        structured={"content": "Too short", "category": "daily"},
    )
    assert result.facts_stored == 0


@pytest.mark.asyncio
async def test_structured_write_falls_back_unknown_category(test_stores, test_user_id):
    """Structured mode should fall back to 'uncategorized' for unknown categories."""
    result = await write_pipeline(
        content="Valid content with unknown category value",
        user_id=test_user_id,
        stores=test_stores,
        structured={"content": "Valid content with unknown category value", "category": "nonexistent"},
    )
    assert result.facts_stored == 1
    # Verify category was corrected in Supabase
    user_uuid = str(await test_stores.resolve_user_id(test_user_id))
    memories = await test_stores.supabase.get_all_memories(user_uuid)
    stored = [m for m in memories if "unknown category" in m.get("content", "")]
    assert len(stored) > 0, "Memory not found in Supabase"
    assert stored[0]["category"] == "uncategorized"


# --- Neo4j entity normalization tests (W5-5A: graph hygiene) ---


def test_normalize_entity_name_case():
    """Entity names should be title-cased consistently."""
    from brain_cloud.stores.neo4j import _normalize_entity_name
    assert _normalize_entity_name("neurow") == "Neurow"
    assert _normalize_entity_name("NEUROW") == "Neurow"
    assert _normalize_entity_name("school of motion") == "School of Motion"


def test_normalize_entity_name_strips_suffixes():
    """Corporate suffixes should be stripped."""
    from brain_cloud.stores.neo4j import _normalize_entity_name
    assert _normalize_entity_name("Neurow Inc") == "Neurow"
    assert _normalize_entity_name("Acme Corp.") == "Acme"
    assert _normalize_entity_name("  Neurow LLC  ") == "Neurow"
