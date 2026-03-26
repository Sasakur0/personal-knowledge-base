from fastapi import APIRouter, HTTPException

from ...models.schemas import RetrievalRequest, RetrievalResponse
from ...services.retrieval_service import search_citations

router = APIRouter(prefix="/retrieval")


@router.post("/search", response_model=RetrievalResponse)
def retrieve(payload: RetrievalRequest) -> RetrievalResponse:
    """Retrieve relevant chunks for a natural language query."""
    try:
        return search_citations(query=payload.query, top_k=payload.top_k)
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Retrieval failed: {error}") from error
