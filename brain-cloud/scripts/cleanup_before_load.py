"""
W1-C Pre-Flight Check #6: Clean up test data before loading 193 hackathon records.

Run from brain-cloud/:
  uv run python scripts/cleanup_before_load.py          # DRY RUN (shows what will be deleted)
  uv run python scripts/cleanup_before_load.py --execute # LIVE RUN (deletes data)

Two phases:
  Phase 1 (MANDATORY): Delete W1-B test memories for Theo from all 4 stores.
      - Supabase: 2 memories (fabricated pipeline test artifacts)
      - Neo4j: Memory + entity nodes linked to Theo's UUID
      - Qdrant: 2 points for Theo
      - Mem0: memories for user 'theo'
      Preserves: Theo's :User row in Supabase and :User node in Neo4j.

  Phase 2 (RECOMMENDED): Delete ALL orphan test nodes in Neo4j.
      Three categories of orphans discovered during W1-B audit (2026-03-03):

      A. December 2025 test users — 3 sets of nodes with user_ids like
         'test_user_20251221_224911'. Each has a __User__ node, timestamp node,
         programming_language node, and framework nodes.

      B. Stale UUID orphans — Neo4j nodes whose user_id is a UUID that no longer
         exists in the Supabase users table. Created by test scripts that cleaned
         up Supabase but not Neo4j (smoke test user 1664112f-..., first Theo
         attempt 56c2df7e-...).

      None of these are Theo's data. But they clutter the graph
      (Beat 3 demo: "Here's What's Underneath" shows the knowledge graph).

Safety:
  - NEVER deletes the Theo :User profile (Supabase row or Neo4j node)
  - NEVER deletes from prompt_templates or clarity_sessions
  - Dry run is the default — you must explicitly opt in with --execute
  - Pre-cleanup and post-cleanup audits print exact counts
  - ABORTS if hackathon_import records are already loaded (prevents data loss)

When to run: AFTER W1-B is complete, BEFORE W1-C Step 11 (hackathon data loading).
When NOT to run: After hackathon records are loaded — this script deletes ALL Theo
    memories, not just test data. If 193 records are already loaded, do NOT run this.
"""

import asyncio
import logging
import sys

from brain_cloud.config import Settings
from brain_cloud.stores import StoreManager

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger("cleanup")


async def audit_stores(stores: StoreManager, theo_uuid: str, label: str):
    """Print exact state of all 4 stores. Used before and after cleanup."""
    print(f"\n{'='*60}")
    print(f"  AUDIT: {label}")
    print(f"{'='*60}")

    # Supabase
    users = await stores.supabase.client.table("users").select(
        "user_id, first_name, display_name"
    ).execute()
    mems = await stores.supabase.client.table("memories").select(
        "memory_id, content, category, source"
    ).eq("user_id", theo_uuid).execute()
    print(f"\nSupabase:")
    print(f"  Users: {len(users.data)}")
    for u in users.data:
        print(f"    {u['first_name']} ({u['user_id'][:8]}...)")
    print(f"  Theo memories: {len(mems.data)}")
    for m in mems.data:
        print(f"    [{m['source']}:{m['category']}] {m['content'][:60]}")
    supabase_user_ids = {u["user_id"] for u in users.data}

    # Neo4j — all nodes grouped by ownership
    async with stores.neo4j.driver.session(database="neo4j") as session:
        # Theo's nodes
        r = await session.run(
            "MATCH (n {user_id: $uid}) RETURN labels(n) AS labels, "
            "coalesce(n.content, n.name, n.display_name, '') AS preview",
            uid=theo_uuid,
        )
        theo_nodes = [rec.data() async for rec in r]

        # December 2025 test user nodes (user_id starts with 'test_user_')
        r2 = await session.run(
            "MATCH (n) WHERE n.user_id STARTS WITH 'test_user_' "
            "RETURN labels(n) AS labels, n.user_id AS uid"
        )
        dec_orphans = [rec.data() async for rec in r2]

        # Timestamp nodes (user_id matches YYYYMMDD_HHMMSS pattern)
        r3 = await session.run(
            "MATCH (n) WHERE n.user_id =~ '\\\\d{8}_\\\\d{6}' "
            "RETURN labels(n) AS labels, n.user_id AS uid"
        )
        ts_orphans = [rec.data() async for rec in r3]

        # UUID-based nodes whose user_id is NOT in Supabase users table
        # (stale orphans from smoke tests / failed runs)
        r4 = await session.run(
            "MATCH (n) WHERE n.user_id IS NOT NULL "
            "AND n.user_id <> $uid "
            "AND NOT n.user_id STARTS WITH 'test_user_' "
            "AND n.user_id =~ '[0-9a-f]{8}-[0-9a-f]{4}-.*' "
            "RETURN DISTINCT n.user_id AS uid, labels(n) AS labels, "
            "count(*) AS cnt",
            uid=theo_uuid,
        )
        uuid_orphan_records = [rec.data() async for rec in r4]
        # Filter to only those UUIDs NOT in Supabase
        uuid_orphans = [
            r for r in uuid_orphan_records
            if r["uid"] not in supabase_user_ids
        ]

        # Disconnected framework/language nodes (no user_id, no relationships)
        r5 = await session.run(
            "MATCH (n) WHERE (n:programming_language OR n:framework) "
            "AND NOT (n)--() "
            "RETURN labels(n) AS labels, coalesce(n.name, '') AS name"
        )
        disconnected = [rec.data() async for rec in r5]

    total_orphans = len(dec_orphans) + len(ts_orphans) + sum(r["cnt"] for r in uuid_orphans) + len(disconnected)

    print(f"\nNeo4j:")
    print(f"  Theo's nodes: {len(theo_nodes)}")
    for n in theo_nodes:
        print(f"    {n['labels']} | {n['preview'][:50]}")
    print(f"  Orphan nodes (total): {total_orphans}")
    if dec_orphans:
        print(f"    Dec 2025 test users: {len(dec_orphans)}")
    if ts_orphans:
        print(f"    Timestamp nodes: {len(ts_orphans)}")
    if uuid_orphans:
        print(f"    Stale UUID orphans:")
        for r in uuid_orphans:
            print(f"      {r['uid'][:12]}... ({r['labels']}) x{r['cnt']}")
    if disconnected:
        print(f"    Disconnected framework/language: {len(disconnected)}")

    # Qdrant
    from qdrant_client.models import Filter, FieldCondition, MatchValue
    points, _ = await stores.qdrant.client.scroll(
        collection_name=stores.qdrant.collection,
        scroll_filter=Filter(must=[
            FieldCondition(key="user_id", match=MatchValue(value=theo_uuid))
        ]),
        limit=500,
        with_payload=True,
        with_vectors=False,
    )
    print(f"\nQdrant:")
    print(f"  Theo's points: {len(points)}")
    for p in points:
        print(f"    {p.id} | [{p.payload.get('category','')}] "
              f"{str(p.payload.get('content',''))[:50]}")

    # Mem0
    mem0_data = await stores.mem0.get_all_memories("theo")
    print(f"\nMem0:")
    print(f"  Theo's memories: {len(mem0_data)}")
    for m in mem0_data:
        if isinstance(m, dict):
            print(f"    {m.get('id','?')[:12]}... | "
                  f"{str(m.get('memory',''))[:60]}")

    print(f"\n{'='*60}\n")

    return {
        "supabase_memories": len(mems.data),
        "neo4j_theo_nodes": len(theo_nodes),
        "neo4j_orphans": total_orphans,
        "qdrant_points": len(points),
        "mem0_memories": len(mem0_data),
    }


async def phase_1_theo_test_data(
    stores: StoreManager, theo_uuid: str, execute: bool
):
    """Delete W1-B test memories for Theo from all 4 stores."""
    print("\n--- PHASE 1: W1-B Test Data Cleanup (Theo) ---")

    if not execute:
        print("  [DRY RUN] Would delete:")
        print(f"    Supabase: ALL memories for user_id={theo_uuid}")
        print(f"    Neo4j: All non-:User nodes for user_id={theo_uuid}")
        print(f"    Qdrant: All points for user_id={theo_uuid}")
        print(f"    Mem0: All memories for user 'theo'")
        print("  [DRY RUN] Would PRESERVE:")
        print(f"    Supabase: users row for Theo")
        print(f"    Neo4j: :User node for Theo")
        return

    # 1. Supabase: delete ALL memories for Theo
    result = await stores.supabase.client.table("memories").delete().eq(
        "user_id", theo_uuid
    ).execute()
    logger.info(f"Supabase: deleted {len(result.data)} memories")

    # 2. Neo4j: delete all non-:User nodes for Theo (Memory, entity, etc.)
    async with stores.neo4j.driver.session(database="neo4j") as session:
        r = await session.run(
            "MATCH (n {user_id: $uid}) WHERE NOT n:User "
            "DETACH DELETE n RETURN count(n) AS deleted",
            uid=theo_uuid,
        )
        record = await r.single()
        logger.info(f"Neo4j: deleted {record['deleted']} Theo nodes (kept :User)")

    # 3. Qdrant: delete all points for Theo
    from qdrant_client.models import Filter, FieldCondition, MatchValue
    await stores.qdrant.client.delete(
        collection_name=stores.qdrant.collection,
        points_selector=Filter(must=[
            FieldCondition(key="user_id", match=MatchValue(value=theo_uuid))
        ]),
    )
    logger.info("Qdrant: deleted all points for Theo")

    # 4. Mem0: delete all memories for Theo
    await stores.mem0.delete_all("theo")
    logger.info("Mem0: deleted all memories for Theo")


async def phase_2_neo4j_orphans(
    stores: StoreManager, theo_uuid: str, supabase_user_ids: set[str],
    execute: bool,
):
    """Delete ALL orphan test nodes in Neo4j."""
    print("\n--- PHASE 2: Neo4j Orphan Cleanup ---")

    async with stores.neo4j.driver.session(database="neo4j") as session:

        # --- 2A: December 2025 test users ---
        r = await session.run(
            "MATCH (n) WHERE n.user_id STARTS WITH 'test_user_' "
            "RETURN count(n) AS count"
        )
        dec_count = (await r.single())["count"]

        # --- 2B: Timestamp nodes (YYYYMMDD_HHMMSS) ---
        r2 = await session.run(
            "MATCH (n) WHERE n.user_id =~ '\\\\d{8}_\\\\d{6}' "
            "RETURN count(n) AS count"
        )
        ts_count = (await r2.single())["count"]

        # --- 2C: Stale UUID orphans (UUID not in Supabase) ---
        r3 = await session.run(
            "MATCH (n) WHERE n.user_id IS NOT NULL "
            "AND n.user_id <> $uid "
            "AND NOT n.user_id STARTS WITH 'test_user_' "
            "AND n.user_id =~ '[0-9a-f]{8}-[0-9a-f]{4}-.*' "
            "RETURN DISTINCT n.user_id AS uid",
            uid=theo_uuid,
        )
        stale_uuids = [
            rec["uid"] async for rec in r3
            if rec["uid"] not in supabase_user_ids
        ]

        stale_uuid_node_count = 0
        if stale_uuids:
            r4 = await session.run(
                "MATCH (n) WHERE n.user_id IN $uids "
                "RETURN count(n) AS count",
                uids=stale_uuids,
            )
            stale_uuid_node_count = (await r4.single())["count"]

        # --- 2D: Disconnected framework/language nodes ---
        r5 = await session.run(
            "MATCH (n) WHERE (n:programming_language OR n:framework) "
            "AND NOT (n)--() RETURN count(n) AS count"
        )
        disconnected_count = (await r5.single())["count"]

        total = dec_count + ts_count + stale_uuid_node_count + disconnected_count

        if not execute:
            print(f"  [DRY RUN] Would delete {total} orphan nodes:")
            print(f"    A. Dec 2025 test users (user_id STARTS WITH 'test_user_'): "
                  f"{dec_count}")
            print(f"    B. Timestamp nodes (YYYYMMDD_HHMMSS): {ts_count}")
            print(f"    C. Stale UUID nodes (UUID not in Supabase users): "
                  f"{stale_uuid_node_count} across {len(stale_uuids)} UUIDs")
            if stale_uuids:
                for uid in stale_uuids:
                    print(f"       - {uid}")
            print(f"    D. Disconnected framework/language nodes: "
                  f"{disconnected_count}")
            print(f"  [DRY RUN] These are NOT Theo's data.")
            return

        deleted_total = 0

        # 2A: Delete Dec 2025 test users
        if dec_count > 0:
            r = await session.run(
                "MATCH (n) WHERE n.user_id STARTS WITH 'test_user_' "
                "DETACH DELETE n RETURN count(n) AS deleted"
            )
            d = (await r.single())["deleted"]
            deleted_total += d
            logger.info(f"Neo4j Phase 2A: deleted {d} Dec 2025 test nodes")

        # 2B: Delete timestamp nodes
        if ts_count > 0:
            r = await session.run(
                "MATCH (n) WHERE n.user_id =~ '\\\\d{8}_\\\\d{6}' "
                "DETACH DELETE n RETURN count(n) AS deleted"
            )
            d = (await r.single())["deleted"]
            deleted_total += d
            logger.info(f"Neo4j Phase 2B: deleted {d} timestamp nodes")

        # 2C: Delete stale UUID orphans
        if stale_uuids:
            r = await session.run(
                "MATCH (n) WHERE n.user_id IN $uids "
                "DETACH DELETE n RETURN count(n) AS deleted",
                uids=stale_uuids,
            )
            d = (await r.single())["deleted"]
            deleted_total += d
            logger.info(f"Neo4j Phase 2C: deleted {d} stale UUID nodes "
                        f"({len(stale_uuids)} UUIDs)")

        # 2D: Delete disconnected framework/language nodes
        if disconnected_count > 0:
            r = await session.run(
                "MATCH (n) WHERE (n:programming_language OR n:framework) "
                "AND NOT (n)--() DELETE n RETURN count(n) AS deleted"
            )
            d = (await r.single())["deleted"]
            deleted_total += d
            logger.info(f"Neo4j Phase 2D: deleted {d} disconnected "
                        f"framework/language nodes")

        logger.info(f"Neo4j Phase 2 total: deleted {deleted_total} orphan nodes")


async def main():
    execute = "--execute" in sys.argv

    if not execute:
        print("=" * 60)
        print("  DRY RUN — no data will be deleted.")
        print("  Add --execute to actually delete data.")
        print("=" * 60)
    else:
        print("=" * 60)
        print("  LIVE RUN — data WILL be deleted.")
        print("=" * 60)

    settings = Settings()
    stores = await StoreManager.create(settings)

    # Resolve Theo
    try:
        theo_uuid = await stores.resolve_user_id("theo")
    except ValueError:
        print("Theo not found in Supabase. Nothing to clean up.")
        await stores.close()
        return

    theo_uuid_str = str(theo_uuid)
    print(f"Theo UUID: {theo_uuid_str}")

    # Get all valid Supabase user IDs (for orphan detection)
    all_users = await stores.supabase.client.table("users").select(
        "user_id"
    ).execute()
    supabase_user_ids = {u["user_id"] for u in all_users.data}

    # --- PRE-CLEANUP AUDIT ---
    pre = await audit_stores(stores, theo_uuid_str, "PRE-CLEANUP STATE")

    # Safety check: if hackathon data is already loaded, ABORT
    imported = await stores.supabase.client.table("memories").select(
        "*", count="exact"
    ).eq("user_id", theo_uuid_str).eq(
        "source", "hackathon_import"
    ).execute()
    if imported.count and imported.count > 0:
        print(f"\nABORT: Found {imported.count} hackathon_import records "
              f"already loaded.")
        print("This script is designed to run BEFORE hackathon data loading.")
        print("Running it now would delete real data. Exiting.")
        await stores.close()
        sys.exit(1)

    # --- PHASE 1: Theo test data ---
    await phase_1_theo_test_data(stores, theo_uuid_str, execute)

    # --- PHASE 2: Neo4j orphans ---
    await phase_2_neo4j_orphans(
        stores, theo_uuid_str, supabase_user_ids, execute
    )

    if execute:
        # --- POST-CLEANUP AUDIT ---
        post = await audit_stores(stores, theo_uuid_str, "POST-CLEANUP STATE")

        # --- VERIFICATION ---
        print("--- VERIFICATION ---")
        checks_passed = True

        # 1. Supabase memories = 0
        if post["supabase_memories"] != 0:
            print(f"  FAIL: Supabase still has "
                  f"{post['supabase_memories']} memories")
            checks_passed = False
        else:
            print("  PASS: Supabase memories = 0")

        # 2. Theo :User node preserved (exactly 1 node for Theo in Neo4j)
        if post["neo4j_theo_nodes"] != 1:
            print(f"  WARN: Expected 1 Neo4j :User node for Theo, "
                  f"found {post['neo4j_theo_nodes']}")
        else:
            print("  PASS: Neo4j :User node preserved (1 node)")

        # 3. Neo4j orphans = 0
        if post["neo4j_orphans"] != 0:
            print(f"  FAIL: Neo4j still has {post['neo4j_orphans']} "
                  f"orphan nodes")
            checks_passed = False
        else:
            print("  PASS: Neo4j orphan nodes = 0")

        # 4. Qdrant points = 0
        if post["qdrant_points"] != 0:
            print(f"  FAIL: Qdrant still has {post['qdrant_points']} points")
            checks_passed = False
        else:
            print("  PASS: Qdrant points = 0")

        # 5. Mem0 (async — may lag)
        if post["mem0_memories"] != 0:
            print(f"  WARN: Mem0 still shows {post['mem0_memories']} "
                  f"memories (may be async — check again in 30s)")
        else:
            print("  PASS: Mem0 memories = 0")

        # 6. Theo user row preserved in Supabase
        user_check = await stores.supabase.client.table("users").select(
            "user_id"
        ).eq("user_id", theo_uuid_str).execute()
        if not user_check.data:
            print("  FAIL: Theo user row DELETED from Supabase — "
                  "this should not happen!")
            checks_passed = False
        else:
            print("  PASS: Theo user row preserved in Supabase")

        if checks_passed:
            print("\nCLEANUP COMPLETE — all checks passed.")
            print("Theo exists as an empty profile, ready for "
                  "193 hackathon records.")
        else:
            print("\nCLEANUP INCOMPLETE — see failures above. "
                  "Do NOT proceed to Step 11.")
    else:
        print("\n[DRY RUN] No data was modified. "
              "Run with --execute to apply changes.")

    await stores.close()


asyncio.run(main())
