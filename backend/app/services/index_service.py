from ..storage.faiss_store import build_index, delete_index_file, normalize_vectors, save_index
from ..storage.repositories import ChunkRepository
from .embedding_service import generate_embeddings
from .settings_service import get_runtime_settings

chunk_repository = ChunkRepository()


def rebuild_faiss_index() -> int:
    """
    Rebuild FAISS index from all chunks in SQLite.

    Returns the number of indexed chunks.
    """
    chunks = chunk_repository.list_all_chunks()
    if not chunks:
        chunk_repository.clear_vector_ids()
        delete_index_file()
        return 0

    settings = get_runtime_settings()
    embeddings = generate_embeddings([chunk.content for chunk in chunks], settings)
    normalized_embeddings = normalize_vectors(embeddings)
    index = build_index(normalized_embeddings)
    save_index(index)

    chunk_repository.clear_vector_ids()
    chunk_repository.update_vector_ids([(chunk.id, vector_id) for vector_id, chunk in enumerate(chunks)])
    return len(chunks)
