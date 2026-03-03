import logging
from datetime import datetime, timezone

from pydantic import ValidationError

from brain_cloud.models import (
    ParsedFact,
    ParsedMemory,
    WriteResult,
)
from brain_cloud.stores import StoreManager
from brain_cloud.utils import openai_with_retry

logger = logging.getLogger(__name__)

EXTRACTION_PROMPT = """You are a memory extraction engine for a personal coaching system.
Extract structured information from the user's input. Respond in JSON.

RULES:
- Each fact must be atomic (one claim per fact)
- Each fact must be specific enough to be useful without surrounding context
- Classify confidence: explicit (stated directly), implied (strongly suggested), inferred (deduced from context)
- Classify category using ONLY these values: goal, health, career, pattern, belief, insight, behavior, session, calendar, financial, social, daily
- Identify ALL named entities (people, places, goals, projects, concepts, behaviors, beliefs, patterns)
- Identify relationships between entities as (subject, predicate, object) triples
- Predicates: RELATES_TO, BLOCKS, SUPPORTS, PRODUCED, TRACKS, DEMONSTRATES, PART_OF, ADDRESSES

EXAMPLE INPUT: "I pulled an all-nighter finishing a brand identity project I quoted too low. Delivered it. Client loved it. Charged $600. Should've been $2,200."

EXAMPLE OUTPUT:
{
  "facts": [
    {"text": "Completed a brand identity project by working through the night", "confidence": "explicit", "category": "behavior"},
    {"text": "Charged $600 for a brand identity project worth $2,200", "confidence": "explicit", "category": "career"},
    {"text": "Client was satisfied with brand identity deliverable", "confidence": "explicit", "category": "career"},
    {"text": "Tends to undercharge for design work", "confidence": "inferred", "category": "pattern"}
  ],
  "entities": [
    {"name": "brand identity project", "type": "project"},
    {"name": "undercharging pattern", "type": "pattern"}
  ],
  "relationships": [
    {"subject": "brand identity project", "predicate": "DEMONSTRATES", "object": "undercharging pattern"}
  ],
  "categories": ["career", "pattern", "behavior"],
  "sentiment": "mixed"
}"""

ALLOWED_CATEGORIES = {
    "goal", "health", "career", "pattern", "belief", "insight",
    "behavior", "session", "calendar", "financial", "social", "daily",
    "uncategorized",
}

CONFIDENCE_MAP = {
    "explicit": 0.9,
    "implied": 0.7,
    "inferred": 0.5,
}


async def _extract(content: str, stores: StoreManager) -> ParsedMemory:
    """Extract facts, entities, and relationships from natural language via GPT-4o-mini."""
    response = await openai_with_retry(
        lambda: stores.openai.chat.completions.create(
            model=stores.settings.extraction_model,
            messages=[
                {"role": "system", "content": EXTRACTION_PROMPT},
                {"role": "user", "content": content},
            ],
            response_format={"type": "json_object"},
        )
    )
    raw_json = response.choices[0].message.content
    try:
        return ParsedMemory.model_validate_json(raw_json)
    except ValidationError as e:
        logger.warning(f"Extraction validation failed: {e}. Retrying once.")
        retry_response = await openai_with_retry(
            lambda: stores.openai.chat.completions.create(
                model=stores.settings.extraction_model,
                messages=[
                    {"role": "system", "content": EXTRACTION_PROMPT},
                    {"role": "user", "content": content},
                    {"role": "assistant", "content": raw_json},
                    {"role": "user", "content": f"Your JSON was invalid: {e}. Fix it."},
                ],
                response_format={"type": "json_object"},
            )
        )
        try:
            return ParsedMemory.model_validate_json(
                retry_response.choices[0].message.content
            )
        except ValidationError:
            logger.error("Extraction failed twice. Storing as raw fact.")
            return ParsedMemory(
                facts=[
                    ParsedFact(
                        text=content,
                        confidence="explicit",
                        category="uncategorized",
                    )
                ],
                entities=[],
                relationships=[],
                categories=["uncategorized"],
            )


def _quality_gate(facts: list[ParsedFact]) -> list[ParsedFact]:
    """Tier 1 quality filter — lightweight, no LLM call."""
    passed = []
    rejected = 0
    for fact in facts:
        if not fact.text or not fact.text.strip():
            rejected += 1
            continue
        if len(fact.text) < 15:
            rejected += 1
            continue
        if not fact.category or fact.category not in ALLOWED_CATEGORIES:
            rejected += 1
            continue
        passed.append(fact)
    if rejected:
        logger.info(f"Quality gate: {rejected} facts rejected, {len(passed)} passed")
    return passed


async def write_pipeline(
    content: str,
    user_id: str,
    stores: StoreManager,
    *,
    structured: dict | None = None,
    session_id: str | None = None,
) -> WriteResult:
    """Write a memory across all four cognitive stores.

    Mode 1 (structured): Bypass LLM extraction, map fields directly.
    Mode 2 (natural language): Extract via GPT-4o-mini, then write.
    """
    user_uuid = await stores.resolve_user_id(user_id)
    now_iso = datetime.now(timezone.utc).isoformat()

    store_status = {
        "supabase": "pending",
        "neo4j": "pending",
        "mem0": "pending",
        "qdrant": "pending",
    }
    memory_ids: list[str] = []

    if structured:
        # Mode 1: Structured bypass — single record, no extraction
        facts = [
            ParsedFact(
                text=structured.get("content", content),
                confidence="explicit",
                category=structured.get("category", "uncategorized"),
            )
        ]
        entities = []
        relationships = []
        sentiment = None
    else:
        # Mode 2: LLM extraction
        parsed = await _extract(content, stores)
        facts = _quality_gate(parsed.facts)
        entities = parsed.entities
        relationships = parsed.relationships
        sentiment = parsed.sentiment

    facts_extracted = len(facts)
    facts_stored = 0

    for fact in facts:
        # --- 1. Supabase INSERT ---
        memory_data = {
            "user_id": str(user_uuid),
            "content": fact.text,
            "category": fact.category,
            "subcategory": None,
            "source": structured.get("source", "coaching_session") if structured else "coaching_session",
            "source_type": structured.get("source_type", "natural_language") if structured else "natural_language",
            "importance": structured.get("importance", 0.5) if structured else 0.5,
            "confidence": CONFIDENCE_MAP.get(fact.confidence, 0.7),
            "strength": 1.0,
            "sentiment": sentiment if not structured else structured.get("sentiment"),
            "original_ts": structured.get("original_ts") if structured else now_iso,
            "session_id": session_id,
            "metadata": structured.get("metadata", {}) if structured else {},
            "neo4j_sync_status": "pending",
            "qdrant_sync_status": "pending",
            "mem0_sync_status": "pending",
        }

        try:
            row = await stores.supabase.insert_memory(memory_data)
            memory_id = row["memory_id"]
            memory_ids.append(memory_id)
            store_status["supabase"] = "synced"
        except Exception as e:
            logger.error(f"Supabase insert failed: {e}")
            store_status["supabase"] = "failed"
            continue  # Can't proceed without memory_id

        # --- 2. Neo4j: Memory node + entities + relationships ---
        try:
            await stores.neo4j.create_memory_node({
                "memory_id": memory_id,
                "user_id": str(user_uuid),
                "content": fact.text,
                "category": fact.category,
                "source": memory_data["source"],
                "original_ts": memory_data["original_ts"],
            })
            if entities or relationships:
                await stores.neo4j.create_entity_and_relationships(
                    [e.model_dump() for e in entities],
                    [r.model_dump() for r in relationships],
                    memory_id,
                    str(user_uuid),
                )
            await stores.supabase.update_sync_status(memory_id, "neo4j", "synced")
            store_status["neo4j"] = "synced"
        except Exception as e:
            logger.error(f"Neo4j write failed: {e}")
            store_status["neo4j"] = "failed"
            try:
                await stores.supabase.update_sync_status(memory_id, "neo4j", "failed")
            except Exception:
                pass

        # --- 3. Mem0: Add memory with metadata ---
        try:
            await stores.mem0.add_memory(
                content=fact.text,
                user_id=user_id,  # slug — wrapper adds prefix
                metadata={
                    "memory_id": memory_id,
                    "category": fact.category,
                    "source": memory_data["source"],
                    "importance": memory_data["importance"],
                    "original_ts": memory_data["original_ts"],
                },
            )
            await stores.supabase.update_sync_status(memory_id, "mem0", "synced")
            store_status["mem0"] = "synced"
        except Exception as e:
            logger.error(f"Mem0 write failed: {e}")
            store_status["mem0"] = "failed"
            try:
                await stores.supabase.update_sync_status(memory_id, "mem0", "failed")
            except Exception:
                pass

        # --- 4. Qdrant: Embed and upsert ---
        try:
            vector = await stores.qdrant.embed(fact.text)
            await stores.qdrant.upsert_point(
                memory_id=memory_id,
                vector=vector,
                payload={
                    "user_id": str(user_uuid),
                    "memory_id": memory_id,
                    "content": fact.text,
                    "category": fact.category,
                    "source": memory_data["source"],
                    "source_type": memory_data["source_type"],
                    "importance": memory_data["importance"],
                    "confidence": memory_data["confidence"],
                    "original_ts": memory_data["original_ts"],
                    "created_at": now_iso,
                },
            )
            await stores.supabase.update_sync_status(memory_id, "qdrant", "synced")
            store_status["qdrant"] = "synced"
        except Exception as e:
            logger.error(f"Qdrant write failed: {e}")
            store_status["qdrant"] = "failed"
            try:
                await stores.supabase.update_sync_status(memory_id, "qdrant", "failed")
            except Exception:
                pass

        facts_stored += 1

    return WriteResult(
        memory_ids=memory_ids,
        stores=store_status,
        facts_extracted=facts_extracted,
        facts_stored=facts_stored,
    )
