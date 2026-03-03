import logging

from mem0 import AsyncMemoryClient

from brain_cloud.config import Settings

logger = logging.getLogger(__name__)


class Mem0Store:
    def __init__(self, settings: Settings):
        self.client = AsyncMemoryClient(api_key=settings.mem0_api_key)
        self.prefix = settings.mem0_user_prefix

    def _uid(self, user_id: str) -> str:
        if not user_id:
            raise ValueError("user_id must not be empty for Mem0 operations")
        return f"{self.prefix}{user_id}"

    async def add_memory(self, content: str, user_id: str, metadata: dict):
        await self.client.add(
            [{"role": "user", "content": content}],
            user_id=self._uid(user_id),
            metadata=metadata,
        )

    async def search_memories(self, query: str, user_id: str, limit: int = 20) -> list[dict]:
        # Mem0 v2 API requires user_id inside filters, not at top level.
        # The SDK's search() puts user_id at the top level which causes 400.
        # Call the API directly with correct format.
        uid = self._uid(user_id)
        response = await self.client.async_client.post(
            "/v2/memories/search/",
            json={
                "query": query,
                "filters": {"user_id": uid},
                "limit": limit,
            },
        )
        response.raise_for_status()
        result = response.json()
        if isinstance(result, list):
            return result
        return result.get("results", [])

    async def get_all_memories(self, user_id: str) -> list[dict]:
        # Mem0 v2 API requires user_id inside filters.
        # SDK's get_all() puts it at top level causing 400.
        uid = self._uid(user_id)
        response = await self.client.async_client.get(
            "/v1/memories/",
            params={"user_id": uid},
        )
        response.raise_for_status()
        result = response.json()
        if isinstance(result, list):
            return result
        return result.get("results", result.get("memories", []))

    async def delete_all(self, user_id: str):
        await self.client.delete_all(user_id=self._uid(user_id))
