from dataclasses import dataclass

import httpx

from ..models.schemas import (
    AppSettingsResponse,
    ModelListRequest,
    ModelListResponse,
    TestConnectionRequest,
    TestConnectionResponse,
    UpdateAppSettingsRequest,
)
from ..storage.repositories import SettingsRepository
from ..utils.config import get_settings as get_env_settings

settings_repository = SettingsRepository()


@dataclass(slots=True)
class RuntimeSettings:
    api_base_url: str
    api_key: str
    model_name: str
    embedding_model_name: str
    llm_provider: str
    embedding_provider: str
    top_k: int
    chunk_size: int
    chunk_overlap: int
    embedding_dimension: int


def _default_settings() -> RuntimeSettings:
    env = get_env_settings()
    return RuntimeSettings(
        api_base_url=env.default_api_base_url,
        api_key=env.default_api_key,
        model_name=env.default_model_name,
        embedding_model_name=env.default_embedding_model_name,
        llm_provider=env.default_llm_provider,
        embedding_provider=env.default_embedding_provider,
        top_k=env.default_top_k,
        chunk_size=env.default_chunk_size,
        chunk_overlap=env.default_chunk_overlap,
        embedding_dimension=env.default_embedding_dimension,
    )


def get_runtime_settings() -> RuntimeSettings:
    """Resolve runtime settings from DB overrides merged on top of defaults."""
    defaults = _default_settings()
    overrides = settings_repository.get_all()

    return RuntimeSettings(
        api_base_url=overrides.get("api_base_url", defaults.api_base_url),
        api_key=overrides.get("api_key", defaults.api_key),
        model_name=overrides.get("model_name", defaults.model_name),
        embedding_model_name=overrides.get("embedding_model_name", defaults.embedding_model_name),
        llm_provider=overrides.get("llm_provider", defaults.llm_provider),
        embedding_provider=overrides.get("embedding_provider", defaults.embedding_provider),
        top_k=int(overrides.get("top_k", defaults.top_k)),
        chunk_size=int(overrides.get("chunk_size", defaults.chunk_size)),
        chunk_overlap=int(overrides.get("chunk_overlap", defaults.chunk_overlap)),
        embedding_dimension=int(overrides.get("embedding_dimension", defaults.embedding_dimension)),
    )


def to_settings_response(settings: RuntimeSettings) -> AppSettingsResponse:
    """Convert runtime settings to API response DTO."""
    return AppSettingsResponse(
        api_base_url=settings.api_base_url,
        api_key=settings.api_key,
        model_name=settings.model_name,
        embedding_model_name=settings.embedding_model_name,
        llm_provider=settings.llm_provider,
        embedding_provider=settings.embedding_provider,
        top_k=settings.top_k,
        chunk_size=settings.chunk_size,
        chunk_overlap=settings.chunk_overlap,
        embedding_dimension=settings.embedding_dimension,
    )


def get_app_settings() -> AppSettingsResponse:
    """Return current runtime settings."""
    return to_settings_response(get_runtime_settings())


def _merge_test_payload(payload: TestConnectionRequest) -> RuntimeSettings:
    current = get_runtime_settings()
    return RuntimeSettings(
        api_base_url=(payload.api_base_url or current.api_base_url).strip(),
        api_key=(payload.api_key or current.api_key).strip(),
        model_name=(payload.model_name or current.model_name).strip(),
        embedding_model_name=(payload.embedding_model_name or current.embedding_model_name).strip(),
        llm_provider=(payload.llm_provider or current.llm_provider).strip().lower(),
        embedding_provider=(payload.embedding_provider or current.embedding_provider).strip().lower(),
        top_k=current.top_k,
        chunk_size=current.chunk_size,
        chunk_overlap=current.chunk_overlap,
        embedding_dimension=current.embedding_dimension,
    )


def test_model_connection(payload: TestConnectionRequest) -> TestConnectionResponse:
    """Validate whether current provider credentials can reach the model service."""
    settings = _merge_test_payload(payload)

    if settings.llm_provider == "mock":
        return TestConnectionResponse(success=True, message="Mock provider is available locally.")

    if settings.llm_provider != "openai_compatible":
        return TestConnectionResponse(success=False, message=f"Unsupported llm provider: {settings.llm_provider}")

    if not settings.api_base_url:
        return TestConnectionResponse(success=False, message="api_base_url is required.")
    headers = {"Content-Type": "application/json"}
    if settings.api_key:
        headers["Authorization"] = f"Bearer {settings.api_key}"

    url = f"{settings.api_base_url.rstrip('/')}/models"

    try:
        with httpx.Client(timeout=15.0) as client:
            response = client.get(url, headers=headers)
    except httpx.HTTPError as error:
        return TestConnectionResponse(success=False, message=f"Connection failed: {error}")

    if response.status_code >= 400:
        detail = response.text.strip() or f"HTTP {response.status_code}"
        return TestConnectionResponse(success=False, message=f"Connection failed: {detail}")

    return TestConnectionResponse(success=True, message="Connection succeeded.")


def get_available_models(payload: ModelListRequest) -> ModelListResponse:
    """Fetch available model ids from the configured provider."""
    current = get_runtime_settings()
    llm_provider = (payload.llm_provider or current.llm_provider).strip().lower()
    api_base_url = (payload.api_base_url or current.api_base_url).strip()
    api_key = (payload.api_key or current.api_key).strip()

    if llm_provider == "mock":
        return ModelListResponse(models=["mock-chat", "mock-chat-pro"])

    if llm_provider != "openai_compatible":
        raise ValueError(f"Unsupported llm provider: {llm_provider}")

    if not api_base_url:
        raise ValueError("api_base_url is required.")

    headers = {"Content-Type": "application/json"}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"

    url = f"{api_base_url.rstrip('/')}/models"

    try:
        with httpx.Client(timeout=20.0) as client:
            response = client.get(url, headers=headers)
    except httpx.HTTPError as error:
        raise ValueError(f"Failed to fetch models: {error}") from error

    if response.status_code >= 400:
        detail = response.text.strip() or f"HTTP {response.status_code}"
        raise ValueError(f"Failed to fetch models: {detail}")

    payload_json = response.json()
    items = payload_json.get("data", [])
    model_ids = []
    for item in items:
        model_id = item.get("id")
        if isinstance(model_id, str) and model_id.strip():
            model_ids.append(model_id.strip())

    if not model_ids:
        raise ValueError("No models were returned by the provider.")

    return ModelListResponse(models=sorted(set(model_ids)))


def update_app_settings(payload: UpdateAppSettingsRequest) -> AppSettingsResponse:
    """Persist setting updates and return merged result."""
    updates: dict[str, str] = {}

    if payload.api_base_url is not None:
        updates["api_base_url"] = payload.api_base_url.strip()
    if payload.api_key is not None:
        updates["api_key"] = payload.api_key.strip()
    if payload.model_name is not None:
        updates["model_name"] = payload.model_name.strip()
    if payload.embedding_model_name is not None:
        updates["embedding_model_name"] = payload.embedding_model_name.strip()
    if payload.llm_provider is not None:
        provider = payload.llm_provider.strip().lower()
        if provider not in {"mock", "openai_compatible"}:
            raise ValueError("llm_provider must be one of: mock, openai_compatible.")
        updates["llm_provider"] = provider
    if payload.embedding_provider is not None:
        provider = payload.embedding_provider.strip().lower()
        if provider not in {"mock", "openai_compatible"}:
            raise ValueError("embedding_provider must be one of: mock, openai_compatible.")
        updates["embedding_provider"] = provider
    if payload.top_k is not None:
        updates["top_k"] = str(payload.top_k)
    if payload.chunk_size is not None:
        updates["chunk_size"] = str(payload.chunk_size)
    if payload.chunk_overlap is not None:
        updates["chunk_overlap"] = str(payload.chunk_overlap)
    if payload.embedding_dimension is not None:
        updates["embedding_dimension"] = str(payload.embedding_dimension)

    candidate = get_runtime_settings()
    effective_chunk_size = int(updates.get("chunk_size", candidate.chunk_size))
    effective_chunk_overlap = int(updates.get("chunk_overlap", candidate.chunk_overlap))
    if effective_chunk_overlap >= effective_chunk_size:
        raise ValueError("chunk_overlap must be smaller than chunk_size.")

    if updates:
        settings_repository.upsert_many(updates)

    return get_app_settings()
