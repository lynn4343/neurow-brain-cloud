import logging
from dataclasses import dataclass, field

from openai import AsyncOpenAI

from brain_cloud.config import Settings
from brain_cloud.stores.mem0 import Mem0Store
from brain_cloud.stores.neo4j import Neo4jStore
from brain_cloud.stores.qdrant import QdrantStore
from brain_cloud.stores.supabase import SupabaseStore

logger = logging.getLogger(__name__)


@dataclass
class StoreManager:
    supabase: SupabaseStore
    neo4j: Neo4jStore
    mem0: Mem0Store
    qdrant: QdrantStore
    openai: AsyncOpenAI  # Shared client for extraction + query rewrite
    settings: Settings
    _slug_to_uuid: dict[str, str] = field(default_factory=dict)

    @classmethod
    async def create(cls, settings: Settings) -> "StoreManager":
        supabase = await SupabaseStore.create(settings)
        neo4j_store = Neo4jStore(settings)
        mem0 = Mem0Store(settings)
        qdrant = QdrantStore(settings)
        openai_client = AsyncOpenAI(api_key=settings.openai_api_key)
        await neo4j_store.verify_connection()
        return cls(
            supabase=supabase,
            neo4j=neo4j_store,
            mem0=mem0,
            qdrant=qdrant,
            openai=openai_client,
            settings=settings,
        )

    async def resolve_user_id(self, slug: str) -> str:
        """Resolve a user slug (e.g. 'theo') to a Supabase UUID.

        The MCP tools accept short slugs. Supabase FK requires UUIDs.
        Queries the users table by first_name (case-insensitive) and caches.
        """
        if slug in self._slug_to_uuid:
            return self._slug_to_uuid[slug]
        result = (
            await self.supabase.client.table("user_profiles")
            .select("id")
            .ilike("first_name", slug)
            .limit(1)
            .execute()
        )
        if not result.data:
            raise ValueError(
                f"No user found with slug '{slug}'. "
                f"Create a profile first with brain_create_profile."
            )
        uuid = result.data[0]["id"]
        self._slug_to_uuid[slug] = uuid
        return uuid

    async def close(self):
        await self.neo4j.close()
        await self.qdrant.close()
