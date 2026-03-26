from ..models.entities import ChatMessageEntity, ChatSessionEntity
from ..models.schemas import (
    ChatMessageResponse,
    ChatSessionDetailResponse,
    ChatSessionListResponse,
    ChatSessionSummaryResponse,
)
from ..storage.repositories import ChatSessionRepository

session_repository = ChatSessionRepository()
DEFAULT_SESSION_TITLE = "新对话"


def _to_message_response(message: ChatMessageEntity) -> ChatMessageResponse:
    return ChatMessageResponse(
        id=message.id,
        session_id=message.session_id,
        role=message.role,
        content=message.content,
        created_at=message.created_at,
    )


def _to_session_summary(session: ChatSessionEntity) -> ChatSessionSummaryResponse:
    return ChatSessionSummaryResponse(
        id=session.id,
        title=session.title,
        created_at=session.created_at,
        updated_at=session.updated_at,
        message_count=session.message_count,
    )


def list_chat_sessions() -> ChatSessionListResponse:
    return ChatSessionListResponse(items=[_to_session_summary(item) for item in session_repository.list_sessions()])


def create_chat_session(title: str | None = None) -> ChatSessionDetailResponse:
    session = session_repository.create_session(title=title or DEFAULT_SESSION_TITLE)
    return ChatSessionDetailResponse(
        id=session.id,
        title=session.title,
        created_at=session.created_at,
        updated_at=session.updated_at,
        message_count=session.message_count,
        messages=[],
    )


def get_chat_session_detail(session_id: str) -> ChatSessionDetailResponse | None:
    session = session_repository.get_session(session_id)
    if not session:
        return None
    messages = session_repository.list_messages(session_id)
    return ChatSessionDetailResponse(
        id=session.id,
        title=session.title,
        created_at=session.created_at,
        updated_at=session.updated_at,
        message_count=session.message_count,
        messages=[_to_message_response(item) for item in messages],
    )


def delete_chat_session(session_id: str) -> bool:
    session = session_repository.get_session(session_id)
    if not session:
        return False
    session_repository.delete_session(session_id)
    return True


def ensure_chat_session(session_id: str | None) -> ChatSessionEntity:
    if session_id:
        existing = session_repository.get_session(session_id)
        if existing:
            return existing
    return session_repository.create_session(DEFAULT_SESSION_TITLE)


def append_message(session_id: str, role: str, content: str) -> None:
    session_repository.append_message(session_id, role, content)
    session = session_repository.get_session(session_id)
    if session and session.title == DEFAULT_SESSION_TITLE and role == "user":
        normalized = " ".join(content.strip().split())
        if normalized:
            session_repository.rename_session(session_id, normalized[:32])
