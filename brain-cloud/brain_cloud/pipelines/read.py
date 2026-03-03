import asyncio
import logging
from datetime import datetime, timezone
from math import exp

from brain_cloud.models import RecalledMemory, RecallResult
from brain_cloud.stores import StoreManager
from brain_cloud.utils import openai_with_retry

logger = logging.getLogger(__name__)

STOPWORDS = {
    "what", "do", "i", "know", "about", "the", "a", "an", "is",
    "are", "was", "were", "how", "why", "when", "where", "my",
    "his", "her", "their", "has", "have", "been", "does", "can",
    "tell", "me", "of", "in", "on", "to", "for", "and", "or",
    "with", "that", "this", "it", "all", "any", "some",
}


async def _rewrite_query(raw_query: str, stores: StoreManager) -> str:
    """Optimize the raw query for memory retrieval via GPT-4o-mini."""
    try:
        response = await openai_with_retry(
            lambda: stores.openai.chat.completions.create(
                model=stores.settings.extraction_model,
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "Given this conversation context, write the single most "
                            "effective search query to retrieve relevant memories from "
                            "a personal knowledge base. Output ONLY the query string."
                        ),
                    },
                    {"role": "user", "content": f"Query: {raw_query}"},
                ],
            )
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        logger.warning(f"Query rewrite failed, using raw query: {e}")
        return raw_query


def _extract_terms(query: str) -> list[str]:
    """Extract key terms from query for Neo4j graph traversal."""
    return [
        w for w in query.lower().split()
        if w not in STOPWORDS and len(w) > 2
    ][:5]


def _parse_ts(ts_str: str | None) -> datetime | None:
    """Parse an ISO timestamp string, returning None on failure."""
    if not ts_str:
        return None
    try:
        if ts_str.endswith("Z"):
            ts_str = ts_str[:-1] + "+00:00"
        return datetime.fromisoformat(ts_str)
    except (ValueError, TypeError):
        return None


def _compute_score(
    semantic_similarity: float,
    confidence: float,
    effective_ts: datetime | None,
    now: datetime,
) -> float:
    """Recency-weighted relevance scoring (Tier 1)."""
    if effective_ts:
        days_since = max((now - effective_ts).days, 0)
    else:
        days_since = 0
    recency_decay = exp(-0.01 * days_since)
    return semantic_similarity * confidence * recency_decay


def _fuse_results(
    mem0_results: list[dict],
    neo4j_results: list[dict],
    supabase_results: list[dict],
    qdrant_results: list[dict],
    limit: int,
) -> tuple[list[RecalledMemory], dict, dict]:
    """Merge, dedup, score, and rank results from all 4 stores."""
    now = datetime.now(timezone.utc)
    candidates: dict[str, dict] = {}  # memory_id -> merged data

    # --- Qdrant results (have similarity scores) ---
    for item in qdrant_results:
        mid = item.get("memory_id") or item.get("id", "")
        if not mid:
            continue
        candidates[mid] = {
            "memory_id": mid,
            "content": item.get("content", ""),
            "category": item.get("category", ""),
            "source": item.get("source", ""),
            "confidence": item.get("confidence", 0.7),
            "semantic_similarity": item.get("score", 0.5),
            "original_ts": item.get("original_ts"),
            "created_at": item.get("created_at"),
        }

    # --- Supabase results (structured data, no similarity score) ---
    for item in supabase_results:
        mid = item.get("memory_id", "")
        if not mid:
            continue
        if mid in candidates:
            # Enrich with Supabase fields if missing
            existing = candidates[mid]
            existing["confidence"] = item.get("confidence", existing["confidence"])
            existing["original_ts"] = item.get("original_ts") or existing.get("original_ts")
            existing["created_at"] = item.get("created_at") or existing.get("created_at")
        else:
            candidates[mid] = {
                "memory_id": mid,
                "content": item.get("content", ""),
                "category": item.get("category", ""),
                "source": item.get("source", ""),
                "confidence": item.get("confidence", 0.7),
                "semantic_similarity": 0.3,  # lower default for non-vector results
                "original_ts": item.get("original_ts"),
                "created_at": item.get("created_at"),
            }

    # --- Mem0 results (have their own score) ---
    for item in mem0_results:
        mid = item.get("metadata", {}).get("memory_id") if isinstance(item, dict) else None
        if not mid:
            # Mem0 may not have memory_id in metadata — skip dedup, add as candidate
            content = item.get("memory", "") if isinstance(item, dict) else str(item)
            fake_id = f"mem0_{id(item)}"
            candidates[fake_id] = {
                "memory_id": fake_id,
                "content": content,
                "category": item.get("metadata", {}).get("category", "") if isinstance(item, dict) else "",
                "source": "mem0",
                "confidence": 0.7,
                "semantic_similarity": item.get("score", 0.5) if isinstance(item, dict) else 0.5,
                "original_ts": item.get("metadata", {}).get("original_ts") if isinstance(item, dict) else None,
                "created_at": None,
            }
            continue
        if mid in candidates:
            # Boost score if found in multiple stores
            existing = candidates[mid]
            mem0_score = item.get("score", 0.5)
            existing["semantic_similarity"] = max(existing["semantic_similarity"], mem0_score)
        else:
            candidates[mid] = {
                "memory_id": mid,
                "content": item.get("memory", ""),
                "category": item.get("metadata", {}).get("category", ""),
                "source": item.get("metadata", {}).get("source", "mem0"),
                "confidence": 0.7,
                "semantic_similarity": item.get("score", 0.5),
                "original_ts": item.get("metadata", {}).get("original_ts"),
                "created_at": None,
            }

    # --- Extract graph context from Neo4j results ---
    graph_context = {"goals": [], "patterns": [], "insights": []}
    if isinstance(neo4j_results, list):
        for record in neo4j_results:
            if not isinstance(record, dict):
                continue
            # Handle fallback format (labels + props)
            if "labels" in record and "props" in record:
                labels = record["labels"]
                props = record["props"]
                if "Goal" in labels:
                    graph_context["goals"].append(props)
                elif "Pattern" in labels:
                    graph_context["patterns"].append(props)
                elif "Insight" in labels:
                    graph_context["insights"].append(props)
                continue
            # Handle full query format (memory + first_hop + second_hop)
            for hop_key in ("first_hop", "second_hop"):
                hops = record.get(hop_key, [])
                if not isinstance(hops, list):
                    continue
                for hop in hops:
                    node = hop.get("node")
                    if not node or not isinstance(node, dict):
                        continue
                    node_labels = node.get("labels", [])
                    if not node_labels:
                        # Try to infer from properties
                        if node.get("timeframe"):
                            graph_context["goals"].append(node)
                        elif node.get("type") in ("behavioral", "cognitive", "emotional"):
                            graph_context["patterns"].append(node)
                    else:
                        if "Goal" in node_labels:
                            graph_context["goals"].append(node)
                        elif "Pattern" in node_labels:
                            graph_context["patterns"].append(node)
                        elif "Insight" in node_labels:
                            graph_context["insights"].append(node)

    # --- Score and rank ---
    scored = []
    for mid, data in candidates.items():
        effective_ts = _parse_ts(data.get("original_ts")) or _parse_ts(data.get("created_at"))
        score = _compute_score(
            data["semantic_similarity"],
            data["confidence"],
            effective_ts,
            now,
        )
        age_days = (now - effective_ts).days if effective_ts else 0
        scored.append(
            RecalledMemory(
                memory_id=data["memory_id"],
                content=data["content"],
                category=data["category"],
                source=data["source"],
                confidence=data["confidence"],
                score=round(score, 4),
                age_days=age_days,
            )
        )

    scored.sort(key=lambda m: m.score, reverse=True)
    top = scored[:limit]

    stores_queried = sum(1 for r in [mem0_results, neo4j_results, supabase_results, qdrant_results]
                         if r and not isinstance(r, Exception))
    retrieval_metadata = {
        "stores_queried": stores_queried,
        "total_candidates": len(candidates),
        "top_score": top[0].score if top else 0.0,
    }

    return top, graph_context, retrieval_metadata


async def read_pipeline(
    query: str,
    user_id: str,
    stores: StoreManager,
    *,
    limit: int = 10,
    category: str | None = None,
) -> RecallResult:
    """Retrieve memories using parallel multi-store search with fusion ranking."""
    user_uuid = await stores.resolve_user_id(user_id)

    # Query rewriting
    optimized_query = await _rewrite_query(query, stores)

    # Embed query for vector search
    embedded_query = await stores.qdrant.embed(optimized_query)

    # Extract key terms for Neo4j
    terms = _extract_terms(optimized_query)

    # Parallel fan-out to all 4 stores
    results = await asyncio.gather(
        stores.mem0.search_memories(optimized_query, user_id, limit=20),
        stores.neo4j.query_related(terms, str(user_uuid)),
        stores.supabase.query_memories(str(user_uuid), category=category, limit=20),
        stores.qdrant.search(embedded_query, str(user_uuid), limit=20),
        return_exceptions=True,
    )

    mem0_results, neo4j_results, supabase_results, qdrant_results = results

    # Log any store failures but continue
    for name, result in [
        ("mem0", mem0_results),
        ("neo4j", neo4j_results),
        ("supabase", supabase_results),
        ("qdrant", qdrant_results),
    ]:
        if isinstance(result, Exception):
            logger.error(f"{name} query failed: {result}")

    # Replace exceptions with empty results
    mem0_results = mem0_results if not isinstance(mem0_results, Exception) else []
    neo4j_results = neo4j_results if not isinstance(neo4j_results, Exception) else []
    supabase_results = supabase_results if not isinstance(supabase_results, Exception) else []
    qdrant_results = qdrant_results if not isinstance(qdrant_results, Exception) else []

    # Fuse and rank
    memories, graph_context, retrieval_metadata = _fuse_results(
        mem0_results, neo4j_results, supabase_results, qdrant_results, limit
    )
    retrieval_metadata["query_rewritten"] = optimized_query

    return RecallResult(
        memories=memories,
        graph_context=graph_context,
        retrieval_metadata=retrieval_metadata,
    )
