from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parents[2]


class AppSettings(BaseSettings):
    """Environment-level settings loaded from backend .env."""

    app_env: str = "development"
    host: str = "127.0.0.1"
    port: int = 8000
    cors_origins: str = "http://127.0.0.1:5173,http://localhost:5173"

    sqlite_path: str = "data/sqlite/pkb.db"
    faiss_dir: str = "data/faiss"
    faiss_index_filename: str = "knowledge.index"

    supported_file_extensions: str = ".pdf,.txt,.md,.markdown,.docx"

    default_api_base_url: str = ""
    default_api_key: str = ""
    default_model_name: str = "gpt-4o-mini"
    default_embedding_model_name: str = "text-embedding-3-small"
    default_llm_provider: str = "mock"
    default_embedding_provider: str = "mock"
    default_top_k: int = 5
    default_chunk_size: int = 600
    default_chunk_overlap: int = 100
    default_embedding_dimension: int = 384

    model_config = SettingsConfigDict(
        env_file=BACKEND_DIR / ".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


@lru_cache(maxsize=1)
def get_settings() -> AppSettings:
    """Return a cached environment settings instance."""
    return AppSettings()


def parse_csv_values(raw_values: str) -> list[str]:
    """Parse comma-separated values and strip surrounding whitespace."""
    return [item.strip() for item in raw_values.split(",") if item.strip()]


def parse_cors_origins(raw_origins: str) -> list[str]:
    """Parse comma-separated CORS origins from environment settings."""
    return parse_csv_values(raw_origins)


def parse_supported_extensions(raw_extensions: str) -> set[str]:
    """Parse and normalize supported file extensions from settings."""
    return {item.lower() for item in parse_csv_values(raw_extensions)}


def resolve_backend_path(raw_path: str) -> Path:
    """Resolve relative backend paths against backend root directory."""
    candidate = Path(raw_path).expanduser()
    if candidate.is_absolute():
        return candidate
    return (BACKEND_DIR / candidate).resolve(strict=False)
