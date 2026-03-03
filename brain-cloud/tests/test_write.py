"""Test write pipeline — structured and natural language modes."""

import pytest

from brain_cloud.pipelines.write import write_pipeline


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
    """Natural language mode extracts facts via GPT-4o-mini."""
    result = await write_pipeline(
        content="Test Runner decided to raise consulting rates to $2,800 for brand refresh projects.",
        user_id=test_user_id,
        stores=test_stores,
    )
    assert result.facts_extracted > 0, "No facts extracted"
    assert result.facts_stored > 0, "No facts stored"
    assert all(s == "synced" for s in result.stores.values()), f"Sync failed: {result.stores}"
