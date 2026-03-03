import logging

from supabase import acreate_client, AsyncClient

from brain_cloud.config import Settings

logger = logging.getLogger(__name__)


class SupabaseStore:
    def __init__(self, client: AsyncClient):
        self.client = client

    @classmethod
    async def create(cls, settings: Settings) -> "SupabaseStore":
        client = await acreate_client(settings.supabase_url, settings.supabase_key)
        return cls(client)

    async def insert_user(self, data: dict) -> dict:
        result = await self.client.table("users").insert(data).execute()
        return result.data[0]

    async def insert_memory(self, data: dict) -> dict:
        result = await self.client.table("memories").insert(data).execute()
        return result.data[0]

    async def bulk_insert_memories(self, records: list[dict]) -> list[dict]:
        result = await self.client.table("memories").insert(records).execute()
        return result.data

    async def query_memories(
        self, user_id: str, *, category: str | None = None, limit: int = 20
    ) -> list[dict]:
        query = self.client.table("memories").select("*").eq("user_id", user_id)
        if category:
            query = query.eq("category", category)
        query = query.order("created_at", desc=True).limit(limit)
        result = await query.execute()
        return result.data

    async def get_all_memories(self, user_id: str) -> list[dict]:
        result = (
            await self.client.table("memories")
            .select("*")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )
        return result.data

    async def get_user(self, user_id: str) -> dict:
        result = (
            await self.client.table("users")
            .select("*")
            .eq("user_id", user_id)
            .limit(1)
            .execute()
        )
        return result.data[0] if result.data else {}

    async def update_sync_status(self, memory_id: str, store: str, status: str):
        column = f"{store}_sync_status"
        await (
            self.client.table("memories")
            .update({column: status})
            .eq("memory_id", memory_id)
            .execute()
        )
