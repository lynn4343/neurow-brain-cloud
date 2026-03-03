from pydantic import BaseModel
from typing import Literal


# --- Write Pipeline Models ---

class ParsedFact(BaseModel):
    text: str
    confidence: Literal["explicit", "implied", "inferred"]
    category: str


class ParsedEntity(BaseModel):
    name: str
    type: Literal["person", "goal", "project", "place", "concept",
                   "behavior", "belief", "pattern"]


class ParsedRelationship(BaseModel):
    subject: str
    predicate: str
    object: str


class ParsedMemory(BaseModel):
    facts: list[ParsedFact]
    entities: list[ParsedEntity]
    relationships: list[ParsedRelationship]
    categories: list[str]
    sentiment: Literal["positive", "negative", "neutral", "mixed"] | None = None


class WriteResult(BaseModel):
    memory_ids: list[str]
    stores: dict[str, str]  # store_name → "synced" | "failed" | "partial"
    facts_extracted: int
    facts_stored: int


# --- Read Pipeline Models ---

class RecalledMemory(BaseModel):
    memory_id: str
    content: str
    category: str
    source: str
    confidence: float
    score: float
    age_days: int


class RecallResult(BaseModel):
    memories: list[RecalledMemory]
    graph_context: dict
    retrieval_metadata: dict


# --- Export Model ---

class BrainExport(BaseModel):
    version: str = "1.0"
    exported_at: str
    user: dict
    metadata: dict
    episodic: list[dict]       # Supabase memories
    graph: dict                # Neo4j nodes + edges
    semantic: list[dict]       # Mem0 memories
    associative: list[dict]    # Qdrant points (without raw vectors)
    coaching_sessions: list[dict] = []  # Clarity Session data (goals, captured_data)
