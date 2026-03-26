from fastapi import APIRouter, HTTPException

from ...models.schemas import CreateChatSessionRequest, ChatSessionDetailResponse, ChatSessionListResponse
from ...services.chat_session_service import (
    create_chat_session,
    delete_chat_session,
    get_chat_session_detail,
    list_chat_sessions,
)

router = APIRouter(prefix="/conversations")


@router.get("", response_model=ChatSessionListResponse)
def get_conversations() -> ChatSessionListResponse:
    """List all chat sessions ordered by most recently updated."""
    return list_chat_sessions()


@router.post("", response_model=ChatSessionDetailResponse)
def create_conversation(payload: CreateChatSessionRequest) -> ChatSessionDetailResponse:
    """Create a new chat session."""
    return create_chat_session(payload.title)


@router.get("/{session_id}", response_model=ChatSessionDetailResponse)
def get_conversation(session_id: str) -> ChatSessionDetailResponse:
    """Fetch a chat session and all persisted messages."""
    detail = get_chat_session_detail(session_id)
    if not detail:
        raise HTTPException(status_code=404, detail="Chat session not found.")
    return detail


@router.delete("/{session_id}")
def remove_conversation(session_id: str) -> dict[str, str]:
    """Delete a chat session and its messages."""
    deleted = delete_chat_session(session_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Chat session not found.")
    return {"status": "ok", "deleted_session_id": session_id}
