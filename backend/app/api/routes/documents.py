from fastapi import APIRouter, HTTPException

from ...models.schemas import (
    DocumentDeleteResponse,
    DocumentImportRequest,
    DocumentImportResponse,
    DocumentListResponse,
    ReindexResponse,
)
from ...services.document_service import delete_document, import_documents, list_documents
from ...services.index_service import rebuild_faiss_index

router = APIRouter(prefix="/documents")


@router.get("", response_model=DocumentListResponse)
def get_documents() -> DocumentListResponse:
    """List imported documents and their metadata statuses."""
    return list_documents()


@router.post("/import", response_model=DocumentImportResponse)
def import_document_paths(payload: DocumentImportRequest) -> DocumentImportResponse:
    """
    Import local files by path and run parse/chunk/index pipeline.

    Failed files still return readable failure reasons in per-file results.
    """
    return import_documents(payload.file_paths)


@router.post("/reindex", response_model=ReindexResponse)
def reindex_documents() -> ReindexResponse:
    """Rebuild FAISS index from stored chunks."""
    try:
        indexed_count = rebuild_faiss_index()
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Reindex failed: {error}") from error
    return ReindexResponse(
        status="ok",
        indexed_chunk_count=indexed_count,
        message="FAISS index rebuilt successfully.",
    )


@router.delete("/{document_id}", response_model=DocumentDeleteResponse)
def remove_document(document_id: str) -> DocumentDeleteResponse:
    """Delete a document and its chunks, then rebuild the FAISS index."""
    try:
        deleted = delete_document(document_id)
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Delete document failed: {error}") from error

    if not deleted:
        raise HTTPException(status_code=404, detail="Document not found.")

    return DocumentDeleteResponse(
        status="ok",
        deleted_document_id=document_id,
        message="Document deleted successfully.",
    )
