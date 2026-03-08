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
- Classify category using ONLY these values:

Life domains (personal): home, finance, health, mindset, family, spirituality, recreation, community, love
Life domains (professional): career, business, education
Cross-domain types: goal, pattern, insight, belief, behavior, identity, preference, instruction
Infrastructure: calendar, daily, session, social

Category definitions:
- home: living situation, housing, home environment
- finance: personal money — income, budgeting, personal debt, savings, investments, rent, spending
- health: fitness, nutrition, sleep, medical, physical wellbeing
- mindset: stress, self-talk, therapy, emotional patterns, personal growth, inner world
- family: parents, siblings, children, parenting, family dynamics
- spirituality: meditation, meaning, faith, journaling, philosophical reflection
- recreation: hobbies, leisure, travel, play, creative pursuits outside work
- community: friendships, social groups, networking, local community
- love: romantic relationships, dating, partnership dynamics
- career: employment, roles, advancement, workplace dynamics (employees)
- business: business operations AND business finances — clients, revenue, expenses, invoicing, pricing, pipeline, cash flow, strategy (founders, freelancers, entrepreneurs, side hustles)
- education: courses, degrees, certifications, structured learning, skill development
- goal: goals, milestones, aspirations in any domain
- pattern: behavioral patterns, recurring themes
- insight: realizations, learnings, aha moments
- belief: core beliefs, values, identity statements
- behavior: specific actions, habits, activities
- identity: personal facts (name, age, location, demographics)
- preference: opinions, tastes, working-style preferences, tool choices
- instruction: rules the user has set for AI behavior (tone, format, "always/never" rules)
- calendar: calendar events, scheduling, appointments
- daily: routine items, daily activities, low-importance items
- session: coaching session metadata
- social: social media posts, public sharing

- Assign an importance score (0.0 to 1.0) to each fact based on how central it is to understanding this person:
  - 0.8-1.0: Identity-defining (name, location, relationships, life roles, core identity)
  - 0.7-0.9: Goals, values, deeply held beliefs, life vision
  - 0.5-0.7: Behavioral patterns, recurring habits, skills, expertise areas
  - 0.3-0.5: Specific project details, one-time events, tool preferences
  - 0.1-0.3: Trivial details, formatting preferences, transient observations
- NEVER start a fact with "User", "The user", or "the user". Write facts as standalone statements about the person. Example: "Has a friend who is a neurosurgeon" NOT "User has a friend who is a neurosurgeon".
- When processing imported data from another AI (structured with headers like "Instructions", "Identity", "Career", "Projects", "Preferences"), map: Instructions → instruction, Identity → identity, Career → career or business (employment → career, freelance/founder → business), Projects → career/business/education or goal, Preferences → preference
- If the input contains dates (e.g. [2024-06-15], "June 2024", "last March"), extract them into a "date" field per fact in ISO 8601 format (YYYY-MM-DD). Use partial dates if only month/year is known (YYYY-MM or YYYY). If no date is associated with a fact, omit the "date" field.
- Identify ALL named entities (people, places, goals, projects, concepts, behaviors, beliefs, patterns)
- Identify relationships between entities as (subject, predicate, object) triples
- Predicates: RELATES_TO, BLOCKS, SUPPORTS, PRODUCED, TRACKS, DEMONSTRATES, PART_OF, ADDRESSES

EXAMPLE INPUT: "[2024-06-15] I pulled an all-nighter finishing a brand identity project I quoted too low. Delivered it. Client loved it. Charged $600. Should've been $2,200."

EXAMPLE OUTPUT:
{
  "facts": [
    {"text": "Completed a brand identity project by working through the night", "confidence": "explicit", "category": "behavior", "date": "2024-06-15", "importance": 0.4},
    {"text": "Charged $600 for a brand identity project worth $2,200", "confidence": "explicit", "category": "business", "date": "2024-06-15", "importance": 0.5},
    {"text": "Client was satisfied with brand identity deliverable", "confidence": "explicit", "category": "business", "date": "2024-06-15", "importance": 0.3},
    {"text": "Tends to undercharge for design work", "confidence": "inferred", "category": "pattern", "importance": 0.8}
  ],
  "entities": [
    {"name": "brand identity project", "type": "project"},
    {"name": "undercharging pattern", "type": "pattern"}
  ],
  "relationships": [
    {"subject": "brand identity project", "predicate": "DEMONSTRATES", "object": "undercharging pattern"}
  ],
  "categories": ["business", "pattern", "behavior"],
  "sentiment": "mixed"
}"""

ALLOWED_CATEGORIES = {
    # Life domains — Personal (9)
    "home", "finance", "health", "mindset",
    "family", "spirituality", "recreation", "community", "love",
    # Life domains — Professional (3)
    "career", "business", "education",
    # Cross-domain types (8)
    "goal", "pattern", "insight", "belief", "behavior",
    "identity", "preference", "instruction",
    # Infrastructure (4)
    "calendar", "daily", "session", "social",
    # Backward compat (1) — Theo's 53 bank records use this; new data uses "finance"
    "financial",
    # Fallback (1) — not listed in extraction prompt
    "uncategorized",
}

CONFIDENCE_MAP = {
    "explicit": 0.9,
    "implied": 0.7,
    "inferred": 0.5,
}


async def _extract(content: str, stores: StoreManager) -> ParsedMemory:
    """Extract facts, entities, and relationships via configured extraction model."""
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
    if not raw_json:
        logger.warning("Empty response from extraction model, using raw fallback.")
        return ParsedMemory(
            facts=[ParsedFact(text=content, confidence="explicit", category="uncategorized")],
            entities=[],
            relationships=[],
            categories=["uncategorized"],
        )
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


def _resolve_date(date_str: str | None, fallback: str) -> str:
    """Parse an extracted date string into ISO 8601 timestamp.
    Returns fallback (now) if date_str is None, empty, or unparseable."""
    if not date_str or date_str.strip().lower() in ("unknown", "none", ""):
        return fallback

    cleaned = date_str.strip()

    # Try full date: YYYY-MM-DD
    try:
        dt = datetime.strptime(cleaned[:10], "%Y-%m-%d")
        return dt.replace(tzinfo=timezone.utc).isoformat()
    except ValueError:
        pass

    # Try year-month: YYYY-MM
    try:
        dt = datetime.strptime(cleaned[:7], "%Y-%m")
        return dt.replace(tzinfo=timezone.utc).isoformat()
    except ValueError:
        pass

    # Try year only: YYYY
    try:
        dt = datetime.strptime(cleaned[:4], "%Y")
        return dt.replace(tzinfo=timezone.utc).isoformat()
    except ValueError:
        pass

    return fallback


def _quality_gate(facts: list[ParsedFact]) -> list[ParsedFact]:
    """Tier 1 quality filter — lightweight, no LLM call."""
    passed = []
    rejected = 0
    for fact in facts:
        if not fact.text or not fact.text.strip():
            rejected += 1
            continue
        if len(fact.text) < 10:
            rejected += 1
            continue
        # Strip impersonal "User" prefix from extracted facts
        for prefix in ("The user ", "the user ", "User ", "user "):
            if fact.text.startswith(prefix):
                fact.text = fact.text[len(prefix):]
                if fact.text:
                    fact.text = fact.text[0].upper() + fact.text[1:]
                break
        # Validate and normalize importance
        if fact.importance is not None:
            fact.importance = max(0.0, min(1.0, fact.importance))
        else:
            fact.importance = 0.5
        # Normalize case — catches LLM variants like "Mindset", "HEALTH"
        if fact.category:
            fact.category = fact.category.strip().lower()
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
    source: str = "coaching_session",
) -> WriteResult:
    """Write a memory across all four cognitive stores.

    Mode 1 (structured): Bypass LLM extraction, map fields directly.
    Mode 2 (natural language): Extract via configured extraction model, then write.
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
        # Lightweight validation (no LLM, no full quality gate)
        content_text = structured.get("content", content)
        if not content_text or not content_text.strip():
            logger.warning("Structured write rejected: empty content")
            return WriteResult(memory_ids=[], stores=store_status,
                               facts_extracted=0, facts_stored=0)
        if len(content_text.strip()) < 10:
            logger.warning(f"Structured write rejected: content too short ({len(content_text.strip())} chars)")
            return WriteResult(memory_ids=[], stores=store_status,
                               facts_extracted=0, facts_stored=0)
        category = structured.get("category", "uncategorized")
        if category:
            category = category.strip().lower()
        if not category or category not in ALLOWED_CATEGORIES:
            logger.warning(f"Structured write: unknown category '{category}', falling back to 'uncategorized'")
            category = "uncategorized"

        facts = [
            ParsedFact(
                text=content_text,
                confidence="explicit",
                category=category,
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
    entities_written = False

    for fact in facts:
        # --- 1. Supabase INSERT ---
        memory_data = {
            "user_id": str(user_uuid),
            "content": fact.text,
            "category": fact.category,
            "subcategory": None,
            "source": structured.get("source", source) if structured else source,
            "source_type": structured.get("source_type", "natural_language") if structured else "natural_language",
            "importance": structured.get("importance", 0.5) if structured else (fact.importance if fact.importance is not None else 0.5),
            "confidence": CONFIDENCE_MAP.get(fact.confidence, 0.7),
            "strength": 1.0,
            "sentiment": sentiment if not structured else structured.get("sentiment"),
            "original_ts": _resolve_date(structured.get("original_ts"), now_iso) if structured else _resolve_date(fact.date, now_iso),
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
            if (entities or relationships) and not entities_written:
                await stores.neo4j.create_entity_and_relationships(
                    [e.model_dump() for e in entities],
                    [r.model_dump() for r in relationships],
                    memory_id,
                    str(user_uuid),
                )
                entities_written = True
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
