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
        result = await self.client.table("user_profiles").insert(data).execute()
        if not result.data:
            raise RuntimeError("insert_user returned no data")
        return result.data[0]

    async def insert_memory(self, data: dict) -> dict:
        result = await self.client.table("memories").insert(data).execute()
        if not result.data:
            raise RuntimeError("insert_memory returned no data")
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

    async def update_user(self, user_id: str, data: dict) -> dict:
        """Update user_profiles row. Pass only the fields to update."""
        result = await self.client.table("user_profiles").update(data).eq("id", user_id).execute()
        if not result.data:
            raise RuntimeError(f"update_user: no user found with id {user_id}")
        return result.data[0]

    async def get_user(self, user_id: str) -> dict:
        result = (
            await self.client.table("user_profiles")
            .select("*")
            .eq("id", user_id)
            .limit(1)
            .execute()
        )
        return result.data[0] if result.data else {}

    async def get_prompt_template(self, name: str) -> str:
        """Fetch active prompt template text by name."""
        result = (
            await self.client.table("prompt_templates")
            .select("content")
            .eq("name", name)
            .eq("is_active", True)
            .limit(1)
            .execute()
        )
        if not result.data:
            raise ValueError(f"Prompt template '{name}' not found")
        content = result.data[0].get("content")
        if not isinstance(content, dict) or "text" not in content:
            raise ValueError(f"Prompt template '{name}' has invalid content structure")
        return content["text"]

    async def create_coaching_session(
        self, user_id: str, session_type: str = "clarity_session"
    ) -> dict:
        """INSERT into coaching_sessions. Returns the new row."""
        result = await self.client.table("coaching_sessions").insert({
            "user_id": user_id,
            "session_type": session_type,
            "current_turn": 1,
            "status": "active",
        }).execute()
        if not result.data:
            raise RuntimeError("create_coaching_session returned no data")
        return result.data[0]

    async def get_coaching_session(self, session_id: str) -> dict:
        """SELECT from coaching_sessions by id."""
        result = await self.client.table("coaching_sessions") \
            .select("*").eq("id", session_id).limit(1).execute()
        return result.data[0] if result.data else {}

    async def update_coaching_session(self, session_id: str, data: dict) -> dict:
        """UPDATE coaching_sessions. Pass only the fields to update."""
        result = await self.client.table("coaching_sessions") \
            .update(data).eq("id", session_id).execute()
        return result.data[0] if result.data else {}

    async def get_coaching_sessions(self, user_id: str) -> list[dict]:
        """SELECT all coaching sessions for a user (export pipeline)."""
        result = await self.client.table("coaching_sessions") \
            .select("*").eq("user_id", user_id) \
            .order("started_at", desc=True).execute()
        return result.data

    async def get_most_recent_session(self, user_id: str) -> dict:
        """SELECT the most recently started coaching session for a user."""
        result = await self.client.table("coaching_sessions") \
            .select("*").eq("user_id", user_id) \
            .order("started_at", desc=True).limit(1).execute()
        return result.data[0] if result.data else {}

    _VALID_SYNC_STORES = {"neo4j", "qdrant", "mem0"}

    async def update_sync_status(self, memory_id: str, store: str, status: str):
        if store not in self._VALID_SYNC_STORES:
            raise ValueError(f"Invalid sync store: {store}")
        column = f"{store}_sync_status"
        await (
            self.client.table("memories")
            .update({column: status})
            .eq("memory_id", memory_id)
            .execute()
        )
