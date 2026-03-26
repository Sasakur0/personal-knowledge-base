import hashlib

import httpx
import numpy as np

from .settings_service import RuntimeSettings


def _hash_to_unit_vector(text: str, dimension: int) -> np.ndarray:
    """Generate deterministic mock embedding for local/offline MVP mode."""
    vector = np.zeros(dimension, dtype=np.float32)
    tokens = [token for token in text.lower().split() if token]
    if not tokens:
        tokens = ["<empty>"]

    for token in tokens:
        digest = hashlib.sha256(token.encode("utf-8")).digest()
        for index in range(0, len(digest), 4):
            value = int.from_bytes(digest[index : index + 4], byteorder="little", signed=False)
            slot = value % dimension
            vector[slot] += 1.0

    norm = np.linalg.norm(vector)
    if norm == 0:
        return vector
    return vector / norm


def _mock_embeddings(texts: list[str], dimension: int) -> np.ndarray:
    vectors = [_hash_to_unit_vector(text, dimension) for text in texts]
    return np.vstack(vectors).astype(np.float32)


def _openai_compatible_embeddings(texts: list[str], settings: RuntimeSettings) -> np.ndarray:
    if not settings.api_base_url:
        raise RuntimeError("api_base_url is required for openai-compatible embedding provider.")
    if not settings.embedding_model_name:
        raise RuntimeError("embedding_model_name is required for openai-compatible provider.")

    base_url = settings.api_base_url.rstrip("/")
    url = f"{base_url}/embeddings"
    headers = {"Content-Type": "application/json"}
    if settings.api_key:
        headers["Authorization"] = f"Bearer {settings.api_key}"

    with httpx.Client(timeout=60.0) as client:
        response = client.post(
            url,
            json={"model": settings.embedding_model_name, "input": texts},
            headers=headers,
        )
    if response.status_code >= 400:
        raise RuntimeError(f"Embedding request failed: HTTP {response.status_code} {response.text}")

    payload = response.json()
    vectors = [item["embedding"] for item in payload.get("data", [])]
    if len(vectors) != len(texts):
        raise RuntimeError("Embedding provider returned mismatched vector count.")
    return np.array(vectors, dtype=np.float32)


def generate_embeddings(texts: list[str], settings: RuntimeSettings) -> np.ndarray:
    """Generate embeddings from configured provider."""
    if not texts:
        raise ValueError("texts cannot be empty when generating embeddings.")

    provider = settings.embedding_provider.strip().lower()
    if provider == "mock":
        return _mock_embeddings(texts, settings.embedding_dimension)
    if provider == "openai_compatible":
        try:
            return _openai_compatible_embeddings(texts, settings)
        except RuntimeError as error:
            message = str(error).lower()
            fallback_markers = (
                "http 401",
                "http 403",
                "http 404",
                "invalidendpointormodel.notfound",
                "does not exist",
                "do not have access",
            )
            if any(marker in message for marker in fallback_markers):
                return _mock_embeddings(texts, settings.embedding_dimension)
            raise

    raise RuntimeError(f"Unsupported embedding provider: {settings.embedding_provider}")
