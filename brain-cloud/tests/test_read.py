"""Test read pipeline — multi-store recall with fusion ranking."""

import pytest

from brain_cloud.pipelines.read import read_pipeline
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
