import logging

from openai import AsyncOpenAI
from qdrant_client import AsyncQdrantClient
from qdrant_client.models import (
    Distance,
    FieldCondition,
    Filter,
    MatchValue,
    PayloadSchemaType,
    PointStruct,
    VectorParams,
)

from brain_cloud.config import Settings

logger = logging.getLogger(__name__)


class QdrantStore:
    def __init__(self, settings: Settings):
        self.client = AsyncQdrantClient(
            url=settings.qdrant_url,
            api_key=settings.qdrant_api_key,
        )
        self.openai_client = AsyncOpenAI(api_key=settings.openai_api_key)
        self.collection = settings.qdrant_collection
        self.model = settings.embedding_model
        self.dimensions = settings.embedding_dimensions

    async def create_collection(self):
        collections = await self.client.get_collections()
        existing = [c.name for c in collections.collections]
        if self.collection in existing:
            logger.info(f"Collection '{self.collection}' already exists, skipping creation")
            return

        await self.client.create_collection(
            collection_name=self.collection,
            vectors_config=VectorParams(size=self.dimensions, distance=Distance.COSINE),
        )
        # Payload indexes for filtered search
        await self.client.create_payload_index(
            self.collection, "user_id", PayloadSchemaType.KEYWORD
        )
        await self.client.create_payload_index(
            self.collection, "category", PayloadSchemaType.KEYWORD
        )
        await self.client.create_payload_index(
            self.collection, "source", PayloadSchemaType.KEYWORD
        )
        logger.info(f"Created Qdrant collection '{self.collection}' with payload indexes")

    async def embed(self, text: str) -> list[float]:
        response = await self.openai_client.embeddings.create(
            model=self.model,
            input=text,
        )
        return response.data[0].embedding

    async def embed_batch(self, texts: list[str]) -> list[list[float]]:
        all_vectors = []
        chunk_size = 50
        for i in range(0, len(texts), chunk_size):
            chunk = texts[i : i + chunk_size]
            try:
                response = await self.openai_client.embeddings.create(
                    model=self.model,
                    input=chunk,
                )
                all_vectors.extend([item.embedding for item in response.data])
            except Exception as e:
                if "token" in str(e).lower():
                    # Retry with smaller chunks
                    for text in chunk:
                        vec = await self.embed(text)
                        all_vectors.append(vec)
                else:
                    raise
        return all_vectors

    async def upsert_point(self, memory_id: str, vector: list[float], payload: dict):
        await self.client.upsert(
            collection_name=self.collection,
            points=[PointStruct(id=memory_id, vector=vector, payload=payload)],
        )

    async def search(
        self, query_vector: list[float], user_id: str, limit: int = 20
    ) -> list[dict]:
        results = await self.client.query_points(
            collection_name=self.collection,
            query=query_vector,
            query_filter=Filter(
                must=[FieldCondition(key="user_id", match=MatchValue(value=user_id))]
            ),
            limit=limit,
        )
        return [
            {**point.payload, "score": point.score, "id": str(point.id)}
            for point in results.points
        ]

    async def get_all_points(self, user_id: str) -> list[dict]:
        """Retrieve all points for a user via paginated scroll."""
        all_points = []
        scroll_filter = Filter(
            must=[FieldCondition(key="user_id", match=MatchValue(value=user_id))]
        )
        offset = None
        page_size = 100

        while True:
            results, next_offset = await self.client.scroll(
                collection_name=self.collection,
                scroll_filter=scroll_filter,
                limit=page_size,
                offset=offset,
            )
            all_points.extend(
                {**point.payload, "id": str(point.id)}
                for point in results
            )
            if next_offset is None or len(results) < page_size:
                break
            offset = next_offset

        return all_points

    async def close(self):
        await self.client.close()
        await self.openai_client.close()
