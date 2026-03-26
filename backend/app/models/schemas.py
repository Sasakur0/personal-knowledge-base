from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    """Standard response payload for backend health checks."""

    status: str
    service: str
    env: str
    timestamp: str


class DocumentImportRequest(BaseModel):
    """Input payload for importing local document file paths."""

    file_paths: list[str] = Field(default_factory=list, min_length=1)


class DocumentItemResponse(BaseModel):
    """Document metadata returned to the desktop renderer."""

    id: str
    file_path: str
    file_name: str
    file_ext: str
    status: str
    error_message: str | None = None
    chunk_count: int
    created_at: str
    updated_at: str


class DocumentListResponse(BaseModel):
    """Response wrapper for listing documents."""

    items: list[DocumentItemResponse]


class DocumentDeleteResponse(BaseModel):
    """Response returned after deleting a document."""

    status: str
    deleted_document_id: str
    message: str


class DocumentImportResult(BaseModel):
    """Per-file import execution status."""

    document_id: str | None = None
    file_path: str
    file_name: str
    status: str
    error_message: str | None = None


class DocumentImportResponse(BaseModel):
    """Aggregated import response with summary counters."""

    success_count: int
    failed_count: int
    results: list[DocumentImportResult]


class ReindexResponse(BaseModel):
    """Response payload for explicit FAISS index rebuild operations."""

    status: str
    indexed_chunk_count: int
    message: str


class CitationResponse(BaseModel):
    """Citation fragment returned for retrieval and chat answers."""

    chunk_id: str
    document_id: str
    document_name: str
    chunk_index: int
    content: str
    score: float


class RetrievalRequest(BaseModel):
    """Request payload for chunk retrieval."""

    query: str = Field(min_length=1)
    top_k: int | None = Field(default=None, ge=1, le=50)


class RetrievalResponse(BaseModel):
    """Retrieval response containing matched chunk citations."""

    query: str
    top_k: int
    citations: list[CitationResponse]


class ChatAskRequest(BaseModel):
    """Request payload for retrieval-augmented chat."""

    question: str = Field(min_length=1)
    top_k: int | None = Field(default=None, ge=1, le=50)
    session_id: str | None = None


class ChatAskResponse(BaseModel):
    """Chat response with generated answer and citations."""

    answer: str
    citations: list[CitationResponse]
    session_id: str


class ChatMessageResponse(BaseModel):
    """Persisted chat message returned to the desktop app."""

    id: str
    session_id: str
    role: str
    content: str
    created_at: str


class ChatSessionSummaryResponse(BaseModel):
    """Chat session metadata shown in the sidebar."""

    id: str
    title: str
    created_at: str
    updated_at: str
    message_count: int


class ChatSessionListResponse(BaseModel):
    """Response wrapper for chat session list."""

    items: list[ChatSessionSummaryResponse]


class ChatSessionDetailResponse(BaseModel):
    """Full chat session detail including messages."""

    id: str
    title: str
    created_at: str
    updated_at: str
    message_count: int
    messages: list[ChatMessageResponse]


class CreateChatSessionRequest(BaseModel):
    """Payload for creating a new chat session."""

    title: str | None = None


class AppSettingsResponse(BaseModel):
    """Runtime settings used by retrieval and model calls."""

    api_base_url: str
    api_key: str
    model_name: str
    embedding_model_name: str
    llm_provider: str
    embedding_provider: str
    top_k: int
    chunk_size: int
    chunk_overlap: int
    embedding_dimension: int


class UpdateAppSettingsRequest(BaseModel):
    """Patch payload for runtime settings updates."""

    api_base_url: str | None = None
    api_key: str | None = None
    model_name: str | None = None
    embedding_model_name: str | None = None
    llm_provider: str | None = None
    embedding_provider: str | None = None
    top_k: int | None = Field(default=None, ge=1, le=50)
    chunk_size: int | None = Field(default=None, ge=100, le=6000)
    chunk_overlap: int | None = Field(default=None, ge=0, le=2000)
    embedding_dimension: int | None = Field(default=None, ge=64, le=4096)


class TestConnectionRequest(BaseModel):
    """Payload for validating model provider connectivity."""

    api_base_url: str | None = None
    api_key: str | None = None
    model_name: str | None = None
    embedding_model_name: str | None = None
    llm_provider: str | None = None
    embedding_provider: str | None = None


class TestConnectionResponse(BaseModel):
    """Result of a model connectivity test."""

    success: bool
    message: str


class ModelListRequest(BaseModel):
    """Payload for fetching available model ids from a provider."""

    api_base_url: str | None = None
    api_key: str | None = None
    llm_provider: str | None = None


class ModelListResponse(BaseModel):
    """Available model ids returned by the provider."""

    models: list[str]
