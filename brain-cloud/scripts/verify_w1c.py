"""
W1-C Step 12 — End-to-End Verification (all 5 tests).

Run from brain-cloud/:
  uv run python scripts/verify_w1c.py

Tests:
  12.1 brain_remember (natural language mode)
  12.2 brain_recall (pricing confidence)
  12.3 brain_export
  12.4 Structured mode verification (hackathon data spot-check)
  12.5 Cross-store consistency (5 random memory_ids)
"""

import asyncio
import json
import logging
import random

from qdrant_client.models import FieldCondition, Filter, MatchValue

from brain_cloud.config import Settings
from brain_cloud.pipelines.write import write_pipeline
from brain_cloud.pipelines.read import read_pipeline
from brain_cloud.pipelines.export import export_pipeline
from brain_cloud.stores import StoreManager

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger("verify_w1c")

RESULTS: dict[str, dict] = {}


def record(test_id: str, status: str, notes: str):
    RESULTS[test_id] = {"status": status, "notes": notes}
    marker = "PASS" if status == "PASS" else ("WARN" if status == "WARN" else "FAIL")
    logger.info(f"  [{marker}] {test_id}: {notes}")


async def test_12_1(stores: StoreManager):
    """12.1 brain_remember Test (Natural Language Mode)"""
    logger.info("\n=== 12.1 brain_remember (Natural Language Mode) ===")

    content = (
        "Theo raised his rates on two new clients this week without hesitation. "
        "He quoted $2,800 for a brand refresh — his highest ever."
    )

    result = await write_pipeline(content=content, user_id="theo", stores=stores)

    # Check WriteResult fields
    has_ids = len(result.memory_ids) > 0
    all_synced = all(v == "synced" for v in result.stores.values())
    facts_ok = result.facts_extracted >= 2

    logger.info(f"  memory_ids: {result.memory_ids}")
    logger.info(f"  stores: {result.stores}")
    logger.info(f"  facts_extracted: {result.facts_extracted}, facts_stored: {result.facts_stored}")

    if has_ids and all_synced and facts_ok:
        record("12.1", "PASS",
               f"{result.facts_extracted} facts extracted, {result.facts_stored} stored, "
               f"all 4 stores synced, {len(result.memory_ids)} memory_ids")
    else:
        issues = []
        if not has_ids:
            issues.append("no memory_ids")
        if not all_synced:
            failed = {k: v for k, v in result.stores.items() if v != "synced"}
            issues.append(f"store failures: {failed}")
        if not facts_ok:
            issues.append(f"only {result.facts_extracted} facts (need >=2)")
        record("12.1", "FAIL", "; ".join(issues))

    return result.memory_ids


async def test_12_2(stores: StoreManager):
    """12.2 brain_recall Test"""
    logger.info("\n=== 12.2 brain_recall (pricing confidence) ===")

    result = await read_pipeline(
        query="What do I know about Theo's pricing confidence?",
        user_id="theo",
        stores=stores,
    )

    n_memories = len(result.memories)
    top_score = result.memories[0].score if result.memories else 0.0
    stores_queried = result.retrieval_metadata.get("stores_queried", 0)

    logger.info(f"  {n_memories} memories returned, top_score={top_score:.4f}")
    logger.info(f"  stores_queried: {stores_queried}")
    logger.info(f"  query_rewritten: {result.retrieval_metadata.get('query_rewritten', 'N/A')}")

    # Show top 3 results
    for i, mem in enumerate(result.memories[:3]):
        logger.info(f"  #{i+1} [{mem.category}] score={mem.score:.4f}: {mem.content[:100]}...")

    # Check: multiple memories returned, top results relevant to pricing
    pricing_related = any(
        "pric" in m.content.lower() or "rate" in m.content.lower() or "$" in m.content
        for m in result.memories[:5]
    )

    if n_memories >= 2 and pricing_related:
        record("12.2", "PASS",
               f"{n_memories} memories, top_score={top_score:.4f}, pricing-relevant results found")
    elif n_memories >= 2:
        record("12.2", "WARN",
               f"{n_memories} memories but top results may not be pricing-specific")
    else:
        record("12.2", "FAIL", f"only {n_memories} memories returned (expected >=2)")


async def test_12_3(stores: StoreManager):
    """12.3 brain_export Test"""
    logger.info("\n=== 12.3 brain_export ===")

    result = await export_pipeline(user_id="theo", stores=stores)

    # Check all 4 sections exist
    has_episodic = isinstance(result.episodic, list) and len(result.episodic) > 0
    has_graph = isinstance(result.graph, dict) and "nodes" in result.graph
    has_semantic = isinstance(result.semantic, list)
    has_associative = isinstance(result.associative, list)

    episodic_count = len(result.episodic)
    graph_nodes = len(result.graph.get("nodes", []))
    semantic_count = len(result.semantic)
    associative_count = len(result.associative)

    logger.info(f"  episodic: {episodic_count}")
    logger.info(f"  graph.nodes: {graph_nodes}")
    logger.info(f"  semantic: {semantic_count}")
    logger.info(f"  associative: {associative_count}")

    # BD-001 check: no prompt_templates
    export_fields = set(result.model_fields.keys())
    bd001_clean = "prompt_templates" not in export_fields
    logger.info(f"  BD-001 (no prompt_templates): {'CLEAN' if bd001_clean else 'VIOLATION'}")

    # Verify memory_ids are valid UUID strings (spot check first 5)
    uuid_ok = True
    for mem in result.episodic[:5]:
        mid = mem.get("memory_id", "")
        if not mid or len(mid) < 32:
            uuid_ok = False
            break
    logger.info(f"  UUID format check: {'OK' if uuid_ok else 'FAIL'}")

    # Expect >= 193 episodic (hackathon + test from 12.1)
    if episodic_count >= 193 and has_graph and bd001_clean and uuid_ok:
        record("12.3", "PASS",
               f"episodic={episodic_count}, graph_nodes={graph_nodes}, "
               f"semantic={semantic_count}, associative={associative_count}, BD-001 clean")
    else:
        issues = []
        if episodic_count < 193:
            issues.append(f"episodic={episodic_count} (expected >=193)")
        if not has_graph:
            issues.append("graph missing")
        if not bd001_clean:
            issues.append("BD-001 violation")
        if not uuid_ok:
            issues.append("invalid UUIDs")
        record("12.3", "FAIL", "; ".join(issues))


async def test_12_4(stores: StoreManager):
    """12.4 Structured Mode Verification — spot-check hackathon conversation record"""
    logger.info("\n=== 12.4 Structured Mode Verification ===")

    result = (
        await stores.supabase.client.table("memories")
        .select("*")
        .eq("source", "data_import")
        .eq("source_type", "conversation")
        .limit(1)
        .execute()
    )

    if not result.data:
        record("12.4", "FAIL", "no conversation records found")
        return

    rec = result.data[0]
    logger.info(f"  memory_id: {rec['memory_id']}")
    logger.info(f"  source: {rec['source']}")
    logger.info(f"  source_type: {rec['source_type']}")
    logger.info(f"  category: {rec['category']}")
    logger.info(f"  confidence: {rec['confidence']}")
    logger.info(f"  content: {rec['content'][:100]}...")

    meta = rec.get("metadata", {})
    logger.info(f"  metadata.original_id: {meta.get('original_id', 'MISSING')}")
    logger.info(f"  metadata.tags: {meta.get('tags', 'MISSING')}")

    checks = {
        "source == data_import": rec["source"] == "data_import",
        "source_type == conversation": rec["source_type"] == "conversation",
        "category == insight": rec["category"] == "insight",
        "confidence == 0.7": rec["confidence"] == 0.7,
        "tags in metadata": "tags" in meta,
        "original_id starts with c_": str(meta.get("original_id", "")).startswith("c_"),
    }

    for check_name, passed in checks.items():
        logger.info(f"  {check_name}: {'OK' if passed else 'FAIL'}")

    all_pass = all(checks.values())
    if all_pass:
        record("12.4", "PASS", "all 6 spot-check assertions passed")
    else:
        failed = [k for k, v in checks.items() if not v]
        record("12.4", "FAIL", f"failed: {', '.join(failed)}")


async def test_12_5(stores: StoreManager, settings: Settings):
    """12.5 Cross-Store Consistency — 5 random memory_ids"""
    logger.info("\n=== 12.5 Cross-Store Consistency ===")

    # Get 5 random memory_ids from Supabase
    all_mems = (
        await stores.supabase.client.table("memories")
        .select("memory_id, neo4j_sync_status, qdrant_sync_status, mem0_sync_status")
        .eq("source", "data_import")
        .execute()
    )

    sample = random.sample(all_mems.data, min(5, len(all_mems.data)))
    verified = 0

    for row in sample:
        mid = row["memory_id"]
        logger.info(f"\n  Checking {mid[:12]}...")

        # Supabase sync statuses
        sb_ok = (
            row["neo4j_sync_status"] == "synced"
            and row["qdrant_sync_status"] == "synced"
            and row["mem0_sync_status"] == "synced"
        )
        logger.info(f"    Supabase sync: neo4j={row['neo4j_sync_status']}, "
                     f"qdrant={row['qdrant_sync_status']}, mem0={row['mem0_sync_status']}")

        # Neo4j: check Memory node exists
        neo4j_found = False
        async with stores.neo4j.driver.session(database="neo4j") as session:
            result = await session.run(
                "MATCH (m:Memory {memory_id: $mid}) RETURN m.memory_id AS mid",
                mid=mid,
            )
            rec = await result.single()
            neo4j_found = rec is not None
        logger.info(f"    Neo4j Memory node: {'FOUND' if neo4j_found else 'MISSING'}")

        # Qdrant: check point exists
        qdrant_found = False
        try:
            points = await stores.qdrant.client.retrieve(
                collection_name=settings.qdrant_collection,
                ids=[mid],
            )
            qdrant_found = len(points) > 0
        except Exception as e:
            logger.warning(f"    Qdrant retrieve error: {e}")
        logger.info(f"    Qdrant point: {'FOUND' if qdrant_found else 'MISSING'}")

        if sb_ok and neo4j_found and qdrant_found:
            verified += 1
            logger.info(f"    VERIFIED")
        else:
            issues = []
            if not sb_ok:
                issues.append("sync status not all synced")
            if not neo4j_found:
                issues.append("missing in Neo4j")
            if not qdrant_found:
                issues.append("missing in Qdrant")
            logger.info(f"    ISSUES: {', '.join(issues)}")

    if verified == len(sample):
        record("12.5", "PASS", f"{verified}/{len(sample)} random memory_ids verified across all stores")
    else:
        record("12.5", "FAIL", f"only {verified}/{len(sample)} verified")


async def main():
    logger.info("=" * 60)
    logger.info("W1-C STEP 12 — END-TO-END VERIFICATION")
    logger.info("=" * 60)

    settings = Settings()
    stores = await StoreManager.create(settings)

    # Run all 5 tests sequentially (12.1 must run before 12.2)
    test_memory_ids = await test_12_1(stores)
    await test_12_2(stores)
    await test_12_3(stores)
    await test_12_4(stores)
    await test_12_5(stores, settings)

    # Summary
    logger.info("\n" + "=" * 60)
    logger.info("VERIFICATION SUMMARY")
    logger.info("=" * 60)

    all_pass = True
    for test_id, result in RESULTS.items():
        status = result["status"]
        notes = result["notes"]
        logger.info(f"  {test_id}: [{status}] {notes}")
        if status == "FAIL":
            all_pass = False

    if all_pass:
        logger.info("\n=== ALL VERIFICATION TESTS PASSED ===")
    else:
        failed = [k for k, v in RESULTS.items() if v["status"] == "FAIL"]
        logger.info(f"\n=== SOME TESTS FAILED: {', '.join(failed)} ===")

    # Cleanup: remove 12.1 test memories to keep Theo's data at exactly 193
    if test_memory_ids:
        logger.info(f"\n--- Cleanup: Removing {len(test_memory_ids)} test memories ---")
        theo_uuid = await stores.resolve_user_id("theo")

        # Supabase: delete test memories by memory_id
        for mid in test_memory_ids:
            await (
                stores.supabase.client.table("memories")
                .delete()
                .eq("memory_id", mid)
                .execute()
            )

        # Neo4j: delete Memory nodes + any entity/relationship nodes created by write pipeline
        async with stores.neo4j.driver.session(database="neo4j") as session:
            for mid in test_memory_ids:
                await session.run(
                    "MATCH (m:Memory {memory_id: $mid}) DETACH DELETE m",
                    mid=mid,
                )
            # Also clean up any entity nodes created by the NL extraction
            # (they link to the test memories via relationships)
            await session.run(
                """
                MATCH (n)
                WHERE n.user_id = $uid
                  AND NOT n:User
                  AND NOT n:Memory
                  AND NOT EXISTS { MATCH (n)--(:Memory) }
                DETACH DELETE n
                """,
                uid=str(theo_uuid),
            )

        # Qdrant: delete points by ID
        await stores.qdrant.client.delete(
            collection_name=settings.qdrant_collection,
            points_selector=test_memory_ids,
        )

        # Mem0: no targeted delete available — Mem0 consolidates anyway
        # Skipping to avoid deleting all of Theo's Mem0 data

        logger.info(f"Cleaned up {len(test_memory_ids)} test memories from Supabase, Neo4j, Qdrant")

    await stores.close()


if __name__ == "__main__":
    asyncio.run(main())
