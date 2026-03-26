from dataclasses import dataclass


@dataclass(slots=True)
class DocumentEntity:
    """Document metadata persisted in SQLite."""

    id: str
    file_path: str
    file_name: str
    file_ext: str
    status: str
    error_message: str | None
    chunk_count: int
    created_at: str
    updated_at: str


@dataclass(slots=True)
class ChunkEntity:
    """Text chunk metadata and vector mapping persisted in SQLite."""

    id: str
    document_id: str
    chunk_index: int
    content: str
    vector_id: int | None
    created_at: str


@dataclass(slots=True)
class RetrievedChunkEntity:
    """Joined retrieval record containing chunk and document metadata."""

    chunk_id: str
    document_id: str
    document_name: str
    chunk_index: int
    content: str
    vector_id: int


@dataclass(slots=True)
class AppSettingEntity:
    """Key-value setting record persisted in SQLite."""

    key: str
    value: str
    updated_at: str


@dataclass(slots=True)
class ChatSessionEntity:
    """Chat session metadata persisted in SQLite."""

    id: str
    title: str
    created_at: str
    updated_at: str
    message_count: int


@dataclass(slots=True)
class ChatMessageEntity:
    """Persisted chat message within a session."""

    id: str
    session_id: str
    role: str
    content: str
    created_at: str
