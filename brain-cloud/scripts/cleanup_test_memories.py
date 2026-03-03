"""
One-time cleanup: remove verification test memories from Theo.

The 12.1 verification test (run twice) created 6 extra memories
with source="coaching_session". Theo's 193 hackathon records all
have source="data_import". This script deletes the extras.

Run from brain-cloud/:
  uv run python scripts/cleanup_test_memories.py
"""

import asyncio
import logging

from qdrant_client.models import FieldCondition, Filter, MatchValue

from brain_cloud.config import Settings
from brain_cloud.stores import StoreManager

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger("cleanup_test_memories")


async def main():
    settings = Settings()
    stores = await StoreManager.create(settings)

    theo_uuid = await stores.resolve_user_id("theo")
    logger.info(f"Theo UUID: {theo_uuid}")

    # Find non-hackathon memories (source != "data_import")
    result = (
        await stores.supabase.client.table("memories")
        .select("memory_id, content, source, source_type, created_at")
        .eq("user_id", str(theo_uuid))
        .neq("source", "data_import")
        .execute()
    )

    if not result.data:
        logger.info("No test memories found. Theo is clean.")
        await stores.close()
        return

    logger.info(f"Found {len(result.data)} non-hackathon memories to remove:")
    memory_ids = []
    for row in result.data:
        mid = row["memory_id"]
        memory_ids.append(mid)
        logger.info(f"  {mid[:12]}... source={row['source']} | {row['content'][:80]}...")

    # 1. Supabase: delete
    for mid in memory_ids:
        await (
            stores.supabase.client.table("memories")
            .delete()
            .eq("memory_id", mid)
            .execute()
        )
    logger.info(f"Supabase: deleted {len(memory_ids)} rows")

    # 2. Neo4j: delete Memory nodes + orphaned entity nodes
    async with stores.neo4j.driver.session(database="neo4j") as session:
        for mid in memory_ids:
            await session.run(
                "MATCH (m:Memory {memory_id: $mid}) DETACH DELETE m",
                mid=mid,
            )
        # Clean up orphaned entity nodes (no remaining Memory connections)
        result = await session.run(
            """
            MATCH (n)
            WHERE n.user_id = $uid
              AND NOT n:User
              AND NOT n:Memory
              AND NOT EXISTS { MATCH (n)--(:Memory) }
            DETACH DELETE n
            RETURN count(n) AS deleted
            """,
            uid=str(theo_uuid),
        )
        rec = await result.single()
        logger.info(f"Neo4j: deleted {len(memory_ids)} Memory nodes + {rec['deleted']} orphaned entities")

    # 3. Qdrant: delete points by ID
    await stores.qdrant.client.delete(
        collection_name=settings.qdrant_collection,
        points_selector=memory_ids,
    )
    logger.info(f"Qdrant: deleted {len(memory_ids)} points")

    # 4. Mem0: skip (no targeted delete, and Mem0 consolidates)
    logger.info("Mem0: skipped (no targeted delete; consolidation handles it)")

    # Verify final counts
    sb_count = (
        await stores.supabase.client.table("memories")
        .select("*", count="exact")
        .eq("user_id", str(theo_uuid))
        .execute()
    )
    logger.info(f"\nFinal Supabase count: {sb_count.count}")

    qdrant_count = await stores.qdrant.client.count(
        collection_name=settings.qdrant_collection, exact=True
    )
    logger.info(f"Final Qdrant count: {qdrant_count.count}")

    async with stores.neo4j.driver.session(database="neo4j") as session:
        result = await session.run(
            "MATCH (m:Memory {user_id: $uid}) RETURN count(m) AS c",
            uid=str(theo_uuid),
        )
        rec = await result.single()
        logger.info(f"Final Neo4j Memory count: {rec['c']}")

    await stores.close()


if __name__ == "__main__":
    asyncio.run(main())
