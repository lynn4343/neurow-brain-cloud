"""
One-time cleanup: remove test profile data from Neo4j and Qdrant.

Supabase and Mem0 already cleaned. This handles the remaining two stores.

PROTECTED (do NOT touch):
  - Theo Nakamura: 0c4831b5-8df3-4fba-94be-57e4e3112116
  - Lynn Hayden:   ddecea03-9c40-43c2-baa2-7470e7d579fa
  - Jordan Lee:    ff0f6540-9d9d-4ae3-8a57-40e3e778d120

Run from brain-cloud/:
  uv run python scripts/cleanup_test_profiles.py
"""

import asyncio
import logging

from qdrant_client.models import FieldCondition, Filter, MatchValue

from brain_cloud.config import Settings
from brain_cloud.stores import StoreManager

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger("cleanup_test_profiles")

# UUIDs of the 12 test profiles to delete
DELETE_UUIDS = [
    "6afa0062-93f6-427e-bad3-b0542d6692a5",  # Avery Alfonso
    "c9ba3efd-bef1-46d8-af4c-0ddad70cdd39",  # Janey Doey
    "4f714704-55d4-498a-a04f-bfdc45766fdd",  # Sasha Masha
    "e108aa4d-2814-4653-9bab-cc6f56a56d3e",  # Georgie Porgie
    "ce204722-3e50-4a4d-b6b3-f3993f4404b4",  # Jordy Lee
    "5f9ec0ac-11d6-407e-8d50-784373627832",  # Arlo Neufeld
    "34025197-50a5-4fc5-94a1-f66d27f5867b",  # Zodi Neufeld
    "bbdb9ec3-bac3-4060-8288-6b3543865fe6",  # Peter Piper
    "02afb77b-7c23-4a10-a493-a85532fb1c12",  # Sally Seashells
    "110e25ad-71f7-496c-847a-93b9db3c1388",  # Roger That
    "f2192718-4905-4918-ba78-5d37f0e69a79",  # Sarah Cupcakes
    "5328e0ce-7772-48be-a3aa-4fb19cae571f",  # Freeda Wheeler
]

# Protected UUIDs — safety check
PROTECTED_UUIDS = {
    "0c4831b5-8df3-4fba-94be-57e4e3112116",  # Theo Nakamura
    "ddecea03-9c40-43c2-baa2-7470e7d579fa",  # Lynn Hayden
    "ff0f6540-9d9d-4ae3-8a57-40e3e778d120",  # Jordan Lee
}


async def main():
    # Safety check: no overlap
    overlap = set(DELETE_UUIDS) & PROTECTED_UUIDS
    if overlap:
        logger.error(f"ABORT: Protected UUIDs in delete list: {overlap}")
        return

    settings = Settings()
    stores = await StoreManager.create(settings)

    # --- Neo4j: delete all nodes for each test UUID ---
    neo4j_total = 0
    async with stores.neo4j.driver.session(database="neo4j") as session:
        for uuid in DELETE_UUIDS:
            # Safety: verify not protected
            if uuid in PROTECTED_UUIDS:
                logger.error(f"SKIP protected UUID: {uuid}")
                continue

            result = await session.run(
                """
                MATCH (n {user_id: $uid})
                DETACH DELETE n
                RETURN count(n) AS deleted
                """,
                uid=uuid,
            )
            rec = await result.single()
            count = rec["deleted"]
            if count > 0:
                logger.info(f"  Neo4j: deleted {count} nodes for {uuid}")
            neo4j_total += count

    logger.info(f"Neo4j total: {neo4j_total} nodes deleted across 12 test profiles")

    # --- Qdrant: delete all points for each test UUID ---
    qdrant_total = 0
    for uuid in DELETE_UUIDS:
        if uuid in PROTECTED_UUIDS:
            logger.error(f"SKIP protected UUID: {uuid}")
            continue

        # Count before delete
        points = await stores.qdrant.client.count(
            collection_name=settings.qdrant_collection,
            count_filter=Filter(
                must=[FieldCondition(key="user_id", match=MatchValue(value=uuid))]
            ),
            exact=True,
        )
        if points.count > 0:
            await stores.qdrant.client.delete(
                collection_name=settings.qdrant_collection,
                points_selector=Filter(
                    must=[FieldCondition(key="user_id", match=MatchValue(value=uuid))]
                ),
            )
            logger.info(f"  Qdrant: deleted {points.count} points for {uuid}")
            qdrant_total += points.count

    logger.info(f"Qdrant total: {qdrant_total} points deleted across 12 test profiles")

    # --- Verify protected profiles are untouched ---
    logger.info("\n--- Verification: Protected profiles ---")

    for name, uuid in [
        ("Theo Nakamura", "0c4831b5-8df3-4fba-94be-57e4e3112116"),
        ("Lynn Hayden", "ddecea03-9c40-43c2-baa2-7470e7d579fa"),
        ("Jordan Lee", "ff0f6540-9d9d-4ae3-8a57-40e3e778d120"),
    ]:
        async with stores.neo4j.driver.session(database="neo4j") as session:
            result = await session.run(
                "MATCH (n {user_id: $uid}) RETURN count(n) AS c",
                uid=uuid,
            )
            rec = await result.single()
            neo4j_count = rec["c"]

        qdrant_count = await stores.qdrant.client.count(
            collection_name=settings.qdrant_collection,
            count_filter=Filter(
                must=[FieldCondition(key="user_id", match=MatchValue(value=uuid))]
            ),
            exact=True,
        )

        logger.info(f"  {name}: Neo4j={neo4j_count} nodes, Qdrant={qdrant_count.count} points")

    await stores.close()
    logger.info("\nDone.")


if __name__ == "__main__":
    asyncio.run(main())
