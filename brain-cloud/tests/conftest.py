"""
Shared pytest fixtures for Brain Cloud tests.

Provides an isolated test user ("test_runner") with automatic cleanup
across all 4 stores. Theo's 193 hackathon records are never touched.
"""

import logging

import pytest_asyncio
from qdrant_client.models import FieldCondition, Filter, MatchValue

from brain_cloud.config import Settings
from brain_cloud.stores import StoreManager

logger = logging.getLogger(__name__)

TEST_USER_SLUG = "test_runner"
TEST_USER_PROFILE = {
    "display_name": "Test Runner",
    "first_name": "test_runner",
    "is_demo_user": False,
    "onboarding_completed": False,
}


@pytest_asyncio.fixture
async def test_stores():
    """Per-test StoreManager — fresh connections, clean shutdown."""
    settings = Settings()
    stores = await StoreManager.create(settings)
    yield stores
    await stores.close()


@pytest_asyncio.fixture
async def test_user_id(test_stores):
    """Create a dedicated test user, yield the slug, then clean up ALL data across 4 stores."""
    stores = test_stores

    # --- Setup: create test user ---
    test_user = await stores.supabase.insert_user(TEST_USER_PROFILE)
    test_uuid = test_user["user_id"]
    stores._slug_to_uuid[TEST_USER_SLUG] = test_uuid

    # Ensure :User node in Neo4j
    await stores.neo4j.create_user_node(test_uuid, "Test Runner")

    yield TEST_USER_SLUG

    # --- Teardown: clean up ALL test data across 4 stores ---
    logger.info(f"Cleaning up test user {test_uuid} across all stores...")

    # 1. Supabase: delete memories, then user
    await (
        stores.supabase.client.table("memories")
        .delete()
        .eq("user_id", test_uuid)
        .execute()
    )
    await (
        stores.supabase.client.table("users")
        .delete()
        .eq("user_id", test_uuid)
        .execute()
    )

    # 2. Neo4j: DETACH DELETE all nodes for this user (including :User)
    async with stores.neo4j.driver.session(database="neo4j") as session:
        await session.run(
            "MATCH (n {user_id: $uid}) DETACH DELETE n",
            uid=test_uuid,
        )

    # 3. Qdrant: delete all points for this user
    await stores.qdrant.client.delete(
        collection_name=stores.qdrant.collection,
        points_selector=Filter(
            must=[FieldCondition(key="user_id", match=MatchValue(value=test_uuid))]
        ),
    )

    # 4. Mem0: delete all memories for this user
    try:
        await stores.mem0.delete_all(TEST_USER_SLUG)
    except Exception as e:
        logger.warning(f"Mem0 cleanup warning (non-fatal): {e}")

    # Clear slug cache
    stores._slug_to_uuid.pop(TEST_USER_SLUG, None)

    logger.info("Test user cleanup complete")
