"""Test export pipeline — portable JSON from all 4 stores."""

import pytest

from brain_cloud.pipelines.export import export_pipeline
from brain_cloud.pipelines.write import write_pipeline


@pytest.mark.asyncio
async def test_export(test_stores, test_user_id):
    """Seed a memory, then export all data for the test user."""
    # Seed: write a memory so there's something to export
    await write_pipeline(
        content="Test Runner completed a brand identity project for a new client.",
        user_id=test_user_id,
        stores=test_stores,
        structured={
            "content": "Test Runner completed a brand identity project for a new client.",
            "category": "career",
            "source": "data_import",
            "source_type": "lifelog",
            "original_ts": "2026-02-15T10:00:00Z",
            "importance": 0.5,
            "metadata": {"test": True},
        },
    )

    result = await export_pipeline(test_user_id, test_stores)

    assert result.version == "1.0"
    assert len(result.episodic) > 0, "No episodic data"
    assert "nodes" in result.graph, "Graph missing nodes key"
    assert len(result.associative) > 0, "No associative data"

    # BD-001: no prompt_templates in export
    export_fields = set(type(result).model_fields.keys())
    assert "prompt_templates" not in export_fields, "BD-001 VIOLATION"
