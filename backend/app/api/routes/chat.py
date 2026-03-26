from fastapi import APIRouter, HTTPException

from ...models.schemas import ChatAskRequest, ChatAskResponse
from ...services.qa_service import ask_question

router = APIRouter(prefix="/chat")


@router.post("/ask", response_model=ChatAskResponse)
def ask(payload: ChatAskRequest) -> ChatAskResponse:
    """Answer user question using retrieval-augmented generation."""
    try:
        return ask_question(question=payload.question, top_k=payload.top_k, session_id=payload.session_id)
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Chat request failed: {error}") from error
