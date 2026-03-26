from collections.abc import Iterable

from ..models.entities import RetrievedChunkEntity
from ..models.schemas import CitationResponse, RetrievalResponse
from ..storage.faiss_store import load_index, normalize_vectors
from ..storage.repositories import ChunkRepository
from .embedding_service import generate_embeddings
from .settings_service import get_runtime_settings

chunk_repository = ChunkRepository()


def _sort_by_requested_order(
    requested_vector_ids: Iterable[int], retrieved_items: list[RetrievedChunkEntity]
) -> list[RetrievedChunkEntity]:
    mapping = {item.vector_id: item for item in retrieved_items}
    ordered: list[RetrievedChunkEntity] = []
    for vector_id in requested_vector_ids:
        item = mapping.get(vector_id)
        if item:
            ordered.append(item)
    return ordered


def search_citations(query: str, top_k: int | None = None) -> RetrievalResponse:
    """Search relevant chunks from FAISS and return citation payloads."""
    settings = get_runtime_settings()
    effective_top_k = top_k or settings.top_k

    index = load_index()
    if index is None:
        return RetrievalResponse(query=query, top_k=effective_top_k, citations=[])

    query_vector = generate_embeddings([query], settings)
    normalized_query = normalize_vectors(query_vector)
    scores, ids = index.search(normalized_query, effective_top_k)

    vector_ids = [int(item) for item in ids[0].tolist() if int(item) >= 0]
    score_map = {int(vector_id): float(scores[0][idx]) for idx, vector_id in enumerate(ids[0].tolist()) if int(vector_id) >= 0}
    retrieved = chunk_repository.list_by_vector_ids(vector_ids)
    ordered_items = _sort_by_requested_order(vector_ids, retrieved)

    citations = [
        CitationResponse(
            chunk_id=item.chunk_id,
            document_id=item.document_id,
            document_name=item.document_name,
            chunk_index=item.chunk_index,
            content=item.content,
            score=score_map.get(item.vector_id, 0.0),
        )
        for item in ordered_items
    ]
    return RetrievalResponse(query=query, top_k=effective_top_k, citations=citations)
