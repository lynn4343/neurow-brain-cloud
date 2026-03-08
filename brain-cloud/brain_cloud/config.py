from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(Path(__file__).resolve().parent.parent / ".env"),
        env_file_encoding="utf-8",
    )

    supabase_url: str
    supabase_key: str
    neo4j_uri: str
    neo4j_username: str = "neo4j"
    neo4j_password: str
    qdrant_url: str
    qdrant_api_key: str
    mem0_api_key: str
    openai_api_key: str
    anthropic_api_key: str = ""

    # Model configuration
    extraction_model: str = "gpt-5-mini"
    embedding_model: str = "text-embedding-3-small"
    embedding_dimensions: int = 1536

    # Mem0 user_id prefix (no prefix needed — slug isolation is sufficient)
    mem0_user_prefix: str = ""

    # Qdrant collection name
    qdrant_collection: str = "brain_cloud_prototype"
