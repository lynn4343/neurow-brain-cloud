"""Test read pipeline — multi-store recall with fusion ranking."""

import pytest
from datetime import datetime, timezone

from brain_cloud.pipelines.read import read_pipeline, _compute_score
from brain_cloud.pipelines.write import write_pipeline


@pytest.mark.asyncio
async def test_recall(test_stores, test_user_id):
    """Seed a memory, then recall it via the read pipeline."""
    # Seed: write a memory so there's something to recall
    await write_pipeline(
        content="Test Runner raised consulting rate to $200/hr, breaking through the $150 ceiling.",
        user_id=test_user_id,
        stores=test_stores,
    )

    # Recall
    result = await read_pipeline("consulting rate", test_user_id, test_stores)

    assert len(result.memories) > 0, "No memories recalled"
    assert result.memories[0].score > 0, "Scores not computed"
    assert result.retrieval_metadata["stores_queried"] >= 2, "Too few stores responded"


# --- Scoring formula tests (W5-5A: importance in scoring) ---


def test_compute_score_importance_differentiates():
    """High importance memories should score higher than low importance."""
    now = datetime.now(timezone.utc)
    high = _compute_score(0.8, 0.7, 0.9, now, now)   # importance=0.9
    low = _compute_score(0.8, 0.7, 0.2, now, now)     # importance=0.2
    assert high > low
    assert high / low == pytest.approx(0.9 / 0.2, rel=0.01)


def test_compute_score_default_importance():
    """Default importance (0.5) gives middle-ground score."""
    now = datetime.now(timezone.utc)
    default = _compute_score(0.8, 0.7, 0.5, now, now)
    high = _compute_score(0.8, 0.7, 0.9, now, now)
    low = _compute_score(0.8, 0.7, 0.2, now, now)
    assert low < default < high


@pytest.mark.asyncio
async def test_recall_exposes_importance_and_similarity(test_stores, test_user_id):
    """RecalledMemory should expose importance and semantic_similarity fields."""
    await write_pipeline(
        content="Test Runner lives in Austin, Texas — this is an identity fact.",
        user_id=test_user_id,
        stores=test_stores,
    )

    result = await read_pipeline("where does Test Runner live", test_user_id, test_stores)

    assert len(result.memories) > 0, "No memories recalled"
    mem = result.memories[0]
    assert hasattr(mem, "importance"), "RecalledMemory missing importance field"
    assert hasattr(mem, "semantic_similarity"), "RecalledMemory missing semantic_similarity field"
    assert 0.0 <= mem.importance <= 1.0, f"importance out of range: {mem.importance}"
    assert 0.0 <= mem.semantic_similarity <= 1.0, f"semantic_similarity out of range: {mem.semantic_similarity}"
