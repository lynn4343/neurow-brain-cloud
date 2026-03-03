import json
import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from mcp.server.fastmcp import FastMCP, Context

from brain_cloud.config import Settings
from brain_cloud.stores import StoreManager
from brain_cloud.pipelines.write import write_pipeline
from brain_cloud.pipelines.read import read_pipeline
from brain_cloud.pipelines.export import export_pipeline

logging.basicConfig(level=logging.INFO, format="%(name)s %(levelname)s: %(message)s")
logger = logging.getLogger(__name__)


@asynccontextmanager
async def app_lifespan(server: FastMCP) -> AsyncIterator[StoreManager]:
    """Initialize all 4 store connections on startup, close on shutdown."""
    settings = Settings()
    store_manager = await StoreManager.create(settings)
    logger.info("Brain Cloud: all 4 stores connected")
    try:
        yield store_manager
    finally:
        await store_manager.close()
        logger.info("Brain Cloud: all stores closed")


mcp = FastMCP(
    "Brain Cloud",
    instructions="Four-store cognitive memory architecture for personal AI coaching",
    lifespan=app_lifespan,
)


@mcp.tool()
async def brain_create_profile(
    display_name: str,
    ctx: Context,
    first_name: str | None = None,
    coaching_style: str = "balanced",
) -> str:
    """Create a new user profile for Brain Cloud. Required before storing
    or recalling memories for a new user. Returns the user slug and UUID.
    Use the slug as user_id in other brain_* tools."""
    stores: StoreManager = ctx.request_context.lifespan_context
    # first_name defaults to first word of display_name
    fname = first_name or display_name.split()[0]
    user_data = {
        "display_name": display_name,
        "first_name": fname,
        "coaching_style": coaching_style,
        "is_demo_user": False,
        "onboarding_completed": False,
    }
    result = await stores.supabase.insert_user(user_data)
    user_uuid = result["user_id"]
    slug = fname.lower()
    # Handle slug collision — append number if slug already exists
    if slug in stores._slug_to_uuid:
        counter = 2
        while f"{slug}_{counter}" in stores._slug_to_uuid:
            counter += 1
        slug = f"{slug}_{counter}"
    # Cache the slug -> UUID mapping
    stores._slug_to_uuid[slug] = user_uuid
    # Create the :User node in Neo4j
    await stores.neo4j.create_user_node(user_uuid, display_name)
    return json.dumps({
        "slug": slug,
        "user_id": user_uuid,
        "display_name": display_name,
        "message": f"Profile created. Use user_id='{slug}' in other tools.",
    }, indent=2)


@mcp.tool()
async def brain_remember(
    content: str,
    user_id: str,
    ctx: Context,
    session_id: str | None = None,
) -> str:
    """Store a memory across all four cognitive stores (Supabase, Neo4j, Mem0,
    Qdrant). Extracts facts, entities, and relationships from natural language
    input. user_id is the slug (e.g. 'theo') — create a profile first with
    brain_create_profile if the user doesn't exist yet.
    Returns memory IDs and per-store sync status."""
    stores: StoreManager = ctx.request_context.lifespan_context
    result = await write_pipeline(content, user_id, stores, session_id=session_id)
    return result.model_dump_json(indent=2)


@mcp.tool()
async def brain_recall(
    query: str,
    user_id: str,
    ctx: Context,
    limit: int = 10,
    category: str | None = None,
) -> str:
    """Retrieve memories using parallel multi-store search. Queries all four
    stores simultaneously, fuses results, and ranks by recency-weighted
    relevance scoring. user_id is the slug (e.g. 'theo')."""
    stores: StoreManager = ctx.request_context.lifespan_context
    result = await read_pipeline(query, user_id, stores, limit=limit, category=category)
    return result.model_dump_json(indent=2)


@mcp.tool()
async def brain_export(
    user_id: str,
    ctx: Context,
) -> str:
    """Export all user data as portable JSON. Gathers from all four stores.
    Excludes coaching IP (prompt templates). BD-001: Everything about you
    is yours. How we help you is ours. user_id is the slug (e.g. 'theo')."""
    stores: StoreManager = ctx.request_context.lifespan_context
    result = await export_pipeline(user_id, stores)
    return result.model_dump_json(indent=2)


def main():
    mcp.run(transport="stdio")


if __name__ == "__main__":
    main()
