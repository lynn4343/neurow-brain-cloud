import asyncio
import logging
from datetime import datetime, timezone

from brain_cloud.models import BrainExport
from brain_cloud.stores import StoreManager

logger = logging.getLogger(__name__)


async def export_pipeline(user_id: str, stores: StoreManager) -> BrainExport:
    """Export all user data as portable JSON from all four stores.

    BD-001: "Everything about you is yours. How we help you is ours."
    Exports user memories (instance data), NEVER prompt_templates (schema/IP).
    """
    user_uuid = await stores.resolve_user_id(user_id)

    # Parallel gather from all stores (return_exceptions for graceful degradation)
    user_profile, memories, graph, mem0_data, qdrant_data, coaching_sessions = (
        await asyncio.gather(
            stores.supabase.get_user(str(user_uuid)),
            stores.supabase.get_all_memories(str(user_uuid)),
            stores.neo4j.get_user_graph(str(user_uuid)),
            stores.mem0.get_all_memories(user_id),  # slug — wrapper adds prefix
            stores.qdrant.get_all_points(str(user_uuid)),
            stores.supabase.get_coaching_sessions(str(user_uuid)),
            return_exceptions=True,
        )
    )

    # Handle any store that returned an exception — use empty fallback
    if isinstance(user_profile, Exception):
        logger.error(f"Supabase user fetch failed: {user_profile}")
        user_profile = {}
    if isinstance(memories, Exception):
        logger.error(f"Supabase memories fetch failed: {memories}")
        memories = []
    if isinstance(graph, Exception):
        logger.error(f"Neo4j graph fetch failed: {graph}")
        graph = {"nodes": [], "edges": []}
    if isinstance(mem0_data, Exception):
        logger.error(f"Mem0 fetch failed: {mem0_data}")
        mem0_data = []
    if isinstance(qdrant_data, Exception):
        logger.error(f"Qdrant fetch failed: {qdrant_data}")
        qdrant_data = []
    if isinstance(coaching_sessions, Exception):
        logger.error(f"Coaching sessions fetch failed: {coaching_sessions}")
        coaching_sessions = []

    # Filter: only memories with confidence >= 0.3
    memories = [m for m in memories if m.get("confidence", 0.7) >= 0.3]

    return BrainExport(
        version="1.0",
        exported_at=datetime.now(timezone.utc).isoformat(),
        user=user_profile,
        metadata={
            "total_memories": len(memories),
            "stores": 4,
            "categories": list(set(c for c in (m.get("category") for m in memories) if c)),
        },
        episodic=memories,
        graph=graph,
        semantic=mem0_data,
        associative=[{**p, "vector": None} for p in qdrant_data],  # Strip raw vectors
        coaching_sessions=coaching_sessions,
    )
