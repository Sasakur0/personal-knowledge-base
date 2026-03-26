from pathlib import Path

from ..models.entities import DocumentEntity
from ..models.schemas import (
    DocumentImportResponse,
    DocumentImportResult,
    DocumentItemResponse,
    DocumentListResponse,
)
from ..storage.repositories import ChunkRepository, DocumentRepository
from ..utils.config import get_settings, parse_supported_extensions
from .chunk_service import split_text_into_chunks
from .index_service import rebuild_faiss_index
from .parser_service import DocumentParseError, extract_text
from .settings_service import get_runtime_settings

document_repository = DocumentRepository()
chunk_repository = ChunkRepository()


def _normalize_file_path(raw_path: str) -> str:
    return str(Path(raw_path).expanduser().resolve(strict=False))


def _to_document_response(document: DocumentEntity) -> DocumentItemResponse:
    return DocumentItemResponse(
        id=document.id,
        file_path=document.file_path,
        file_name=document.file_name,
        file_ext=document.file_ext,
        status=document.status,
        error_message=document.error_message,
        chunk_count=document.chunk_count,
        created_at=document.created_at,
        updated_at=document.updated_at,
    )


def list_documents() -> DocumentListResponse:
    """Return all documents currently tracked in the metadata store."""
    return DocumentListResponse(items=[_to_document_response(item) for item in document_repository.list_documents()])


def _prepare_document_record(normalized_path: str, supported_extensions: set[str]) -> tuple[DocumentEntity, str | None]:
    path_obj = Path(normalized_path)
    file_name = path_obj.name
    file_ext = path_obj.suffix.lower()
    error_message: str | None = None
    status = "imported"

    if not path_obj.exists():
        status = "failed"
        error_message = "File does not exist."
    elif file_ext not in supported_extensions:
        status = "failed"
        supported = ", ".join(sorted(supported_extensions))
        error_message = f"Unsupported extension: {file_ext or '(none)'}; supported: {supported}."

    document = document_repository.upsert_document(
        file_path=normalized_path,
        file_name=file_name,
        file_ext=file_ext,
        status=status,
        error_message=error_message,
        chunk_count=0 if status != "indexed" else 0,
    )
    return document, error_message


def _process_document(document_id: str) -> tuple[str, str | None]:
    document = document_repository.get_by_id(document_id)
    if not document:
        return "failed", "Document record not found."

    document_repository.update_status(document_id, status="processing", error_message=None, chunk_count=0)

    runtime_settings = get_runtime_settings()
    try:
        content = extract_text(document.file_path)
        chunks = split_text_into_chunks(
            text=content,
            chunk_size=runtime_settings.chunk_size,
            chunk_overlap=runtime_settings.chunk_overlap,
        )
        if not chunks:
            raise DocumentParseError("Chunking produced no output.")

        chunk_repository.replace_chunks_for_document(document_id=document_id, chunks=chunks)
        document_repository.update_status(
            document_id,
            status="imported",
            error_message=None,
            chunk_count=len(chunks),
        )
        return "imported", None
    except Exception as error:  # pragma: no cover - filesystem and parser dependent
        message = str(error)
        document_repository.update_status(document_id, status="failed", error_message=message, chunk_count=0)
        chunk_repository.replace_chunks_for_document(document_id=document_id, chunks=[])
        return "failed", message


def import_documents(file_paths: list[str]) -> DocumentImportResponse:
    """
    Import files and run parse->chunk->index pipeline for valid inputs.

    Result status reflects final pipeline state (`indexed` or `failed`).
    """
    settings = get_settings()
    supported_extensions = parse_supported_extensions(settings.supported_file_extensions)

    seen: set[str] = set()
    normalized_paths: list[str] = []
    for path in file_paths:
        normalized = _normalize_file_path(path)
        if normalized not in seen:
            seen.add(normalized)
            normalized_paths.append(normalized)

    results: list[DocumentImportResult] = []
    candidates_for_processing: list[str] = []

    for normalized_path in normalized_paths:
        document, error_message = _prepare_document_record(normalized_path, supported_extensions)
        if document.status != "failed":
            candidates_for_processing.append(document.id)

        results.append(
            DocumentImportResult(
                document_id=document.id,
                file_path=document.file_path,
                file_name=document.file_name,
                status=document.status,
                error_message=error_message,
            )
        )

    processed_success_ids: list[str] = []
    for document_id in candidates_for_processing:
        status, error_message = _process_document(document_id)
        for item in results:
            if item.document_id == document_id:
                item.status = status
                item.error_message = error_message
                break
        if status == "imported":
            processed_success_ids.append(document_id)

    if processed_success_ids:
        try:
            rebuild_faiss_index()
            for document_id in processed_success_ids:
                document = document_repository.get_by_id(document_id)
                if document:
                    document_repository.update_status(
                        document_id,
                        status="indexed",
                        error_message=None,
                        chunk_count=document.chunk_count,
                    )
            for item in results:
                if item.document_id in processed_success_ids and item.status != "failed":
                    item.status = "indexed"
        except Exception as error:  # pragma: no cover - environment dependent on FAISS availability
            message = f"Index rebuild failed: {error}"
            for document_id in processed_success_ids:
                document_repository.update_status(document_id, status="failed", error_message=message, chunk_count=0)
            for item in results:
                if item.document_id in processed_success_ids:
                    item.status = "failed"
                    item.error_message = message

    success_count = sum(1 for item in results if item.status == "indexed")
    failed_count = len(results) - success_count

    return DocumentImportResponse(
        success_count=success_count,
        failed_count=failed_count,
        results=results,
    )


def delete_document(document_id: str) -> bool:
    """Delete a document and rebuild the FAISS index."""
    document = document_repository.get_by_id(document_id)
    if not document:
        return False

    document_repository.delete_document(document_id)
    rebuild_faiss_index()
    return True
