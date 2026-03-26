from ..models.schemas import ChatAskResponse
from .chat_session_service import append_message, ensure_chat_session
from .llm_service import generate_answer
from .retrieval_service import search_citations
from .settings_service import get_runtime_settings


def ask_question(question: str, top_k: int | None = None, session_id: str | None = None) -> ChatAskResponse:
    """Execute retrieval-augmented QA and return answer with citations."""
    session = ensure_chat_session(session_id)
    append_message(session.id, "user", question)
    retrieval_result = search_citations(question, top_k=top_k)
    runtime_settings = get_runtime_settings()
    answer = generate_answer(question, retrieval_result.citations, runtime_settings)
    append_message(session.id, "assistant", answer)
    return ChatAskResponse(answer=answer, citations=retrieval_result.citations, session_id=session.id)
