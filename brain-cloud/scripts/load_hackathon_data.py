"""
Load 193 hackathon JSONL records into Brain Cloud (all 4 stores).

Bypasses write_pipeline for efficiency — direct batch operations.
Idempotent: safe to re-run (skips records by original_id).

Run from brain-cloud/:
  uv run python scripts/load_hackathon_data.py

Source spec: Wave_1_Implementation_Plan.md §11
Mapping spec: Hackathon_JSONL_Mapping_Spec.md
"""

import asyncio
import json
import logging
from datetime import datetime, timezone
from pathlib import Path

from brain_cloud.config import Settings
from brain_cloud.hackathon_mapper import map_hackathon_record
from brain_cloud.stores import StoreManager

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger("load_hackathon_data")

# Paths
MONOREPO_ROOT = Path(__file__).resolve().parent.parent.parent
DATA_DIR = MONOREPO_ROOT / "data" / "Theo_Nakamura_P05"
PERSONA_PROFILE = DATA_DIR / "persona_profile.json"

JSONL_FILES = [
    "lifelog.jsonl",
    "calendar.jsonl",
    "transactions.jsonl",
    "files_index.jsonl",
    "emails.jsonl",
    "social_posts.jsonl",
    "conversations.jsonl",
]

# Theo's enriched profile (from persona_profile.json + 04_COACHING_PROFILE.md)
THEO_PROFILE = {
    "display_name": "Theo Nakamura",
    "first_name": "Theo",
    "declared_roles": ["Founder", "Freelancer"],
    "is_business_owner": True,
    "focus_area": "business",
    "business_description": "Freelance graphic designer transitioning to brand identity studio owner",
    "business_stage": "growing",
    "current_business_focus": "Premium pricing, client acquisition",
    "business_challenges": ["pricing", "time management", "client boundaries"],
    "declared_challenges": ["procrastination", "undercharging", "work-life balance"],
    "coaching_style": "direct",
    "is_imported": True,
    "imported_at": "2026-02-05T00:00:00Z",
    "is_demo_user": True,
    "onboarding_completed": True,
}


def read_all_jsonl() -> list[dict]:
    """Read all 7 JSONL files into a unified list."""
    all_records = []
    for filename in JSONL_FILES:
        filepath = DATA_DIR / filename
        if not filepath.exists():
            logger.error(f"Missing file: {filepath}")
            continue
        count = 0
        with open(filepath) as f:
            for line in f:
                line = line.strip()
                if line:
                    all_records.append(json.loads(line))
                    count += 1
        logger.info(f"  {filename}: {count} records")
    return all_records


async def ensure_theo_user(stores: StoreManager) -> str:
    """Create or update Theo's user profile. Returns UUID."""
    # Check if Theo exists
    result = (
        await stores.supabase.client.table("users")
        .select("user_id")
        .ilike("first_name", "theo")
        .limit(1)
        .execute()
    )

    if result.data:
        theo_uuid = result.data[0]["user_id"]
        logger.info(f"Theo exists: {theo_uuid}")
        # Update profile with enriched fields
        await (
            stores.supabase.client.table("users")
            .update(THEO_PROFILE)
            .eq("user_id", theo_uuid)
            .execute()
        )
        logger.info("Updated Theo's profile with enriched data")
    else:
        # Create Theo
        new_user = await stores.supabase.insert_user(THEO_PROFILE)
        theo_uuid = new_user["user_id"]
        logger.info(f"Created Theo: {theo_uuid}")

    # Cache slug → UUID
    stores._slug_to_uuid["theo"] = theo_uuid

    # Ensure :User node in Neo4j (MERGE = idempotent)
    await stores.neo4j.create_user_node(theo_uuid, "Theo Nakamura")
    logger.info("Neo4j :User node ensured")

    return theo_uuid


async def main():
    logger.info("=== Hackathon Data Loading ===")
    logger.info(f"Data directory: {DATA_DIR}")

    settings = Settings()
    stores = await StoreManager.create(settings)

    # 1. Ensure Theo's user profile
    logger.info("\n--- Step 1: User Profile ---")
    theo_uuid = await ensure_theo_user(stores)

    # 2. Read all JSONL files
    logger.info("\n--- Step 2: Reading JSONL Files ---")
    raw_records = read_all_jsonl()
    logger.info(f"Total raw records: {len(raw_records)}")

    # 3. Map each record
    logger.info("\n--- Step 3: Mapping Records ---")
    mapped_records = []
    for record in raw_records:
        entity = map_hackathon_record(record)
        mapped_records.append(entity)

    # Count by category
    cat_counts: dict[str, int] = {}
    for m in mapped_records:
        cat_counts[m["category"]] = cat_counts.get(m["category"], 0) + 1
    logger.info(f"Mapped {len(mapped_records)} records. Categories: {cat_counts}")

    # 3b. Idempotency check
    logger.info("\n--- Step 3b: Idempotency Check ---")
    existing = (
        await stores.supabase.client.table("memories")
        .select("metadata")
        .eq("user_id", theo_uuid)
        .eq("source", "data_import")
        .execute()
    )
    existing_ids: set[str] = set()
    for row in existing.data:
        meta = row.get("metadata")
        if isinstance(meta, dict):
            oid = meta.get("original_id")
            if oid:
                existing_ids.add(oid)

    records_to_insert = [
        r for r in mapped_records
        if r["metadata"]["original_id"] not in existing_ids
    ]

    if not records_to_insert:
        logger.info("All records already loaded. Skipping to verification.")
    else:
        if existing_ids:
            logger.info(
                f"Found {len(existing_ids)} existing records. "
                f"Loading {len(records_to_insert)} new records."
            )
        else:
            logger.info(f"Clean state. Loading all {len(records_to_insert)} records.")

        # 4. Supabase bulk INSERT in batches of 50
        logger.info("\n--- Step 4: Supabase Bulk Insert ---")
        supabase_rows: list[dict] = []
        for entity in records_to_insert:
            supabase_rows.append({
                "user_id": theo_uuid,
                "content": entity["content"],
                "category": entity["category"],
                "source": entity["source"],
                "source_type": entity["source_type"],
                "original_ts": entity["original_ts"],
                "importance": entity["importance"],
                "confidence": 0.7,
                "metadata": entity["metadata"],
                "neo4j_sync_status": "pending",
                "qdrant_sync_status": "pending",
                "mem0_sync_status": "pending",
            })

        inserted_rows: list[dict] = []
        batch_size = 50
        for i in range(0, len(supabase_rows), batch_size):
            batch = supabase_rows[i : i + batch_size]
            result = await stores.supabase.bulk_insert_memories(batch)
            inserted_rows.extend(result)
            logger.info(
                f"  Supabase batch {i // batch_size + 1}: "
                f"inserted {len(result)} rows "
                f"({len(inserted_rows)}/{len(supabase_rows)} total)"
            )

        # Capture memory_ids — cross-store join key
        memory_ids = [row["memory_id"] for row in inserted_rows]
        logger.info(f"Supabase complete: {len(inserted_rows)} rows, {len(memory_ids)} memory_ids captured")

        # Build content list aligned with memory_ids for embedding
        contents = [row["content"] for row in inserted_rows]

        # 5. Batch embed via OpenAI
        logger.info("\n--- Step 5: Batch Embedding ---")
        vectors = await stores.qdrant.embed_batch(contents)
        logger.info(f"Embedded {len(vectors)} texts ({len(vectors[0])} dims)")

        # 6. Qdrant batch upsert in chunks of 100
        logger.info("\n--- Step 6: Qdrant Batch Upsert ---")
        from qdrant_client.models import PointStruct

        qdrant_chunk_size = 100
        qdrant_upserted = 0
        for i in range(0, len(memory_ids), qdrant_chunk_size):
            chunk_ids = memory_ids[i : i + qdrant_chunk_size]
            chunk_vectors = vectors[i : i + qdrant_chunk_size]
            chunk_rows = inserted_rows[i : i + qdrant_chunk_size]

            points = []
            for mid, vec, row in zip(chunk_ids, chunk_vectors, chunk_rows):
                points.append(PointStruct(
                    id=mid,
                    vector=vec,
                    payload={
                        "user_id": theo_uuid,
                        "memory_id": mid,
                        "content": row["content"],
                        "category": row["category"],
                        "source": row["source"],
                        "source_type": row["source_type"],
                        "importance": row["importance"],
                        "confidence": row.get("confidence", 0.7),
                        "original_ts": row["original_ts"],
                        "created_at": row.get("created_at", datetime.now(timezone.utc).isoformat()),
                    },
                ))

            await stores.qdrant.client.upsert(
                collection_name=settings.qdrant_collection,
                points=points,
            )
            qdrant_upserted += len(points)
            logger.info(
                f"  Qdrant batch {i // qdrant_chunk_size + 1}: "
                f"upserted {len(points)} points ({qdrant_upserted}/{len(memory_ids)} total)"
            )

        logger.info(f"Qdrant complete: {qdrant_upserted} points")

        # 7. Mem0 sequential add with 150ms delay
        logger.info("\n--- Step 7: Mem0 Sequential Add ---")
        mem0_success = 0
        mem0_fail = 0
        for idx, (mid, row) in enumerate(zip(memory_ids, inserted_rows)):
            try:
                await stores.mem0.add_memory(
                    content=row["content"],
                    user_id="theo",
                    metadata={
                        "memory_id": mid,
                        "category": row["category"],
                        "source": row["source"],
                        "importance": row["importance"],
                        "original_ts": row["original_ts"],
                    },
                )
                mem0_success += 1
            except Exception as e:
                mem0_fail += 1
                logger.warning(f"  Mem0 failed for {mid}: {e}")

            if (idx + 1) % 25 == 0:
                logger.info(f"  Mem0 progress: {idx + 1}/{len(memory_ids)} ({mem0_success} ok, {mem0_fail} fail)")

            await asyncio.sleep(0.15)

        logger.info(f"Mem0 complete: {mem0_success} added, {mem0_fail} failed")

        # 8. Neo4j batch UNWIND for Memory nodes
        logger.info("\n--- Step 8: Neo4j Batch Memory Nodes ---")
        neo4j_batch = []
        for mid, row in zip(memory_ids, inserted_rows):
            neo4j_batch.append({
                "memory_id": mid,
                "user_id": theo_uuid,
                "content": row["content"][:500],  # truncate for graph
                "category": row["category"],
                "source": row["source"],
                "original_ts": row["original_ts"],
            })

        async with stores.neo4j.driver.session(database="neo4j") as session:
            result = await session.run(
                """
                UNWIND $batch AS item
                MERGE (m:Memory {memory_id: item.memory_id})
                SET m.user_id = item.user_id,
                    m.content = item.content,
                    m.category = item.category,
                    m.source = item.source,
                    m.original_ts = item.original_ts
                RETURN count(m) AS created
                """,
                batch=neo4j_batch,
            )
            record = await result.single()
            logger.info(f"Neo4j complete: {record['created']} Memory nodes")

        # 9. Update Supabase sync statuses
        logger.info("\n--- Step 9: Updating Sync Statuses ---")
        # Batch update all at once for each store
        for store_name in ["neo4j", "qdrant", "mem0"]:
            col = f"{store_name}_sync_status"
            await (
                stores.supabase.client.table("memories")
                .update({col: "synced"})
                .eq("user_id", theo_uuid)
                .eq("source", "data_import")
                .eq(col, "pending")
                .execute()
            )
        logger.info("Sync statuses updated to 'synced' for all stores")

    # 10. Verification
    logger.info("\n--- Step 10: Verification ---")
    all_pass = True

    # Supabase count
    sb_count = (
        await stores.supabase.client.table("memories")
        .select("*", count="exact")
        .eq("user_id", theo_uuid)
        .execute()
    )
    sb_n = sb_count.count
    logger.info(f"Supabase memories: {sb_n}")
    if sb_n != 193:
        logger.error(f"  FAIL: expected 193, got {sb_n}")
        all_pass = False
    else:
        logger.info("  PASS")

    # Neo4j Memory node count
    async with stores.neo4j.driver.session(database="neo4j") as session:
        result = await session.run(
            "MATCH (m:Memory {user_id: $uid}) RETURN count(m) AS c",
            uid=theo_uuid,
        )
        record = await result.single()
        neo4j_n = record["c"]
    logger.info(f"Neo4j Memory nodes: {neo4j_n}")
    if neo4j_n != 193:
        logger.error(f"  FAIL: expected 193, got {neo4j_n}")
        all_pass = False
    else:
        logger.info("  PASS")

    # Qdrant point count
    qdrant_count = await stores.qdrant.client.count(
        collection_name=settings.qdrant_collection, exact=True
    )
    qdrant_n = qdrant_count.count
    logger.info(f"Qdrant points: {qdrant_n}")
    if qdrant_n != 193:
        logger.error(f"  FAIL: expected 193, got {qdrant_n}")
        all_pass = False
    else:
        logger.info("  PASS")

    # Mem0 count (consolidation expected — check >= 100)
    mem0_data = await stores.mem0.get_all_memories("theo")
    mem0_n = len(mem0_data)
    logger.info(f"Mem0 memories: {mem0_n}")
    if mem0_n < 100:
        logger.warning(f"  WARN: expected >= 100 (consolidation normal), got {mem0_n}")
        logger.warning("  Mem0 processes async — count may increase over next 60s")
    else:
        logger.info("  PASS")

    # Category distribution spot check
    cat_result = (
        await stores.supabase.client.table("memories")
        .select("category")
        .eq("user_id", theo_uuid)
        .execute()
    )
    cat_dist: dict[str, int] = {}
    for row in cat_result.data:
        cat_dist[row["category"]] = cat_dist.get(row["category"], 0) + 1
    logger.info(f"Category distribution: {cat_dist}")

    # Cross-store consistency spot check (first 5 memory_ids)
    logger.info("\n--- Cross-Store Consistency Check ---")
    sample = (
        await stores.supabase.client.table("memories")
        .select("memory_id, neo4j_sync_status, qdrant_sync_status, mem0_sync_status")
        .eq("user_id", theo_uuid)
        .limit(5)
        .execute()
    )
    for row in sample.data:
        mid = row["memory_id"]
        statuses = f"neo4j={row['neo4j_sync_status']}, qdrant={row['qdrant_sync_status']}, mem0={row['mem0_sync_status']}"
        logger.info(f"  {mid[:12]}... {statuses}")

    if all_pass:
        logger.info("\n=== DATA LOADING COMPLETE — ALL CHECKS PASSED ===")
    else:
        logger.error("\n=== DATA LOADING COMPLETE — SOME CHECKS FAILED (see above) ===")

    await stores.close()


if __name__ == "__main__":
    asyncio.run(main())
