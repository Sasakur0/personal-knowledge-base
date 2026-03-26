from pathlib import Path

import numpy as np

from ..utils.config import get_settings, resolve_backend_path

try:
    import faiss  # type: ignore
except Exception:  # pragma: no cover - environment dependent
    faiss = None


def _require_faiss() -> None:
    if faiss is None:
        raise RuntimeError(
            "FAISS is not available. Install a compatible faiss-cpu package for this Python/Windows version."
        )


def get_index_path() -> Path:
    """Return the FAISS index file path, ensuring its directory exists."""
    settings = get_settings()
    faiss_dir = resolve_backend_path(settings.faiss_dir)
    faiss_dir.mkdir(parents=True, exist_ok=True)
    return (faiss_dir / settings.faiss_index_filename).resolve(strict=False)


def delete_index_file() -> None:
    """Delete persisted FAISS index if it exists."""
    index_path = get_index_path()
    if index_path.exists():
        index_path.unlink()


def normalize_vectors(vectors: np.ndarray) -> np.ndarray:
    """Normalize vectors in-place for cosine-similarity search with Inner Product."""
    _require_faiss()
    normalized = vectors.astype(np.float32, copy=True)
    faiss.normalize_L2(normalized)
    return normalized


def build_index(vectors: np.ndarray) -> "faiss.IndexFlatIP":
    """Build a FAISS Inner Product index from normalized vectors."""
    _require_faiss()
    if vectors.ndim != 2:
        raise ValueError("Vectors must be a 2D matrix.")
    dimension = vectors.shape[1]
    index = faiss.IndexFlatIP(dimension)
    index.add(vectors)
    return index


def save_index(index: "faiss.IndexFlatIP") -> None:
    """Persist FAISS index to disk."""
    _require_faiss()
    faiss.write_index(index, str(get_index_path()))


def load_index() -> "faiss.IndexFlatIP | None":
    """Load FAISS index from disk, or return None if absent."""
    _require_faiss()
    index_path = get_index_path()
    if not index_path.exists():
        return None
    return faiss.read_index(str(index_path))
