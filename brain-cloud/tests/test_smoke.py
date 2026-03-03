"""End-to-end smoke test — write → read → export round-trip."""

import pytest

from brain_cloud.pipelines.write import write_pipeline
from brain_cloud.pipelines.read import read_pipeline
from brain_cloud.pipelines.export import export_pipeline


@pytest.mark.asyncio
async def test_full_round_trip(test_stores, test_user_id):
    """Write a memory, recall it, export it — full pipeline exercise."""
    # 1. Write (natural language mode — tests LLM extraction)
    write_result = await write_pipeline(
        content="I raised my consulting rate to $200/hr last week. First time breaking the $150 ceiling.",
        user_id=test_user_id,
        stores=test_stores,
    )
    assert write_result.facts_extracted > 0, "Extraction failed"
    assert all(s == "synced" for s in write_result.stores.values()), f"Write failed: {write_result.stores}"

    # 2. Read it back
    read_result = await read_pipeline("consulting rate", test_user_id, test_stores)
    assert len(read_result.memories) > 0, "Recall returned nothing"
    assert read_result.memories[0].score > 0, "No scoring"

    # 3. Export
    export_result = await export_pipeline(test_user_id, test_stores)
    assert len(export_result.episodic) > 0, "Export empty"
