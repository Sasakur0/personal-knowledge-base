import uuid
from datetime import UTC, datetime
from sqlite3 import Row

from ..models.entities import AppSettingEntity, ChatMessageEntity, ChatSessionEntity, ChunkEntity, DocumentEntity, RetrievedChunkEntity
from .db import get_connection


def _now_iso() -> str:
    return datetime.now(UTC).isoformat()


def _row_to_document(row: Row) -> DocumentEntity:
    return DocumentEntity(
        id=row["id"],
        file_path=row["file_path"],
        file_name=row["file_name"],
        file_ext=row["file_ext"],
        status=row["status"],
        error_message=row["error_message"],
        chunk_count=row["chunk_count"],
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )


def _row_to_chunk(row: Row) -> ChunkEntity:
    return ChunkEntity(
        id=row["id"],
        document_id=row["document_id"],
        chunk_index=row["chunk_index"],
        content=row["content"],
        vector_id=row["vector_id"],
        created_at=row["created_at"],
    )


def _row_to_chat_session(row: Row) -> ChatSessionEntity:
    return ChatSessionEntity(
        id=row["id"],
        title=row["title"],
        created_at=row["created_at"],
        updated_at=row["updated_at"],
        message_count=row["message_count"],
    )


def _row_to_chat_message(row: Row) -> ChatMessageEntity:
    return ChatMessageEntity(
        id=row["id"],
        session_id=row["session_id"],
        role=row["role"],
        content=row["content"],
        created_at=row["created_at"],
    )


class DocumentRepository:
    """Repository for reading and mutating document metadata records."""

    def list_documents(self) -> list[DocumentEntity]:
        with get_connection() as connection:
            cursor = connection.execute(
                """
                SELECT id, file_path, file_name, file_ext, status, error_message, chunk_count, created_at, updated_at
                FROM documents
                ORDER BY updated_at DESC
                """
            )
            return [_row_to_document(row) for row in cursor.fetchall()]

    def get_by_id(self, document_id: str) -> DocumentEntity | None:
        with get_connection() as connection:
            row = connection.execute(
                """
                SELECT id, file_path, file_name, file_ext, status, error_message, chunk_count, created_at, updated_at
                FROM documents
                WHERE id = ?
                """,
                (document_id,),
            ).fetchone()
            return _row_to_document(row) if row else None

    def get_by_file_path(self, file_path: str) -> DocumentEntity | None:
        with get_connection() as connection:
            row = connection.execute(
                """
                SELECT id, file_path, file_name, file_ext, status, error_message, chunk_count, created_at, updated_at
                FROM documents
                WHERE file_path = ?
                """,
                (file_path,),
            ).fetchone()
            return _row_to_document(row) if row else None

    def upsert_document(
        self,
        *,
        file_path: str,
        file_name: str,
        file_ext: str,
        status: str,
        error_message: str | None,
        chunk_count: int,
    ) -> DocumentEntity:
        existing = self.get_by_file_path(file_path)
        timestamp = _now_iso()

        if existing:
            with get_connection() as connection:
                connection.execute(
                    """
                    UPDATE documents
                    SET file_name = ?, file_ext = ?, status = ?, error_message = ?, chunk_count = ?, updated_at = ?
                    WHERE id = ?
                    """,
                    (file_name, file_ext, status, error_message, chunk_count, timestamp, existing.id),
                )
                connection.commit()
            return DocumentEntity(
                id=existing.id,
                file_path=file_path,
                file_name=file_name,
                file_ext=file_ext,
                status=status,
                error_message=error_message,
                chunk_count=chunk_count,
                created_at=existing.created_at,
                updated_at=timestamp,
            )

        new_entity = DocumentEntity(
            id=str(uuid.uuid4()),
            file_path=file_path,
            file_name=file_name,
            file_ext=file_ext,
            status=status,
            error_message=error_message,
            chunk_count=chunk_count,
            created_at=timestamp,
            updated_at=timestamp,
        )
        with get_connection() as connection:
            connection.execute(
                """
                INSERT INTO documents (
                    id, file_path, file_name, file_ext, status, error_message, chunk_count, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    new_entity.id,
                    new_entity.file_path,
                    new_entity.file_name,
                    new_entity.file_ext,
                    new_entity.status,
                    new_entity.error_message,
                    new_entity.chunk_count,
                    new_entity.created_at,
                    new_entity.updated_at,
                ),
            )
            connection.commit()
        return new_entity

    def update_status(
        self,
        document_id: str,
        *,
        status: str,
        error_message: str | None,
        chunk_count: int | None = None,
    ) -> None:
        with get_connection() as connection:
            if chunk_count is None:
                connection.execute(
                    """
                    UPDATE documents
                    SET status = ?, error_message = ?, updated_at = ?
                    WHERE id = ?
                    """,
                    (status, error_message, _now_iso(), document_id),
                )
            else:
                connection.execute(
                    """
                    UPDATE documents
                    SET status = ?, error_message = ?, chunk_count = ?, updated_at = ?
                    WHERE id = ?
                    """,
                    (status, error_message, chunk_count, _now_iso(), document_id),
                )
            connection.commit()

    def delete_document(self, document_id: str) -> None:
        with get_connection() as connection:
            connection.execute("DELETE FROM documents WHERE id = ?", (document_id,))
            connection.commit()


class ChunkRepository:
    """Repository for document chunks and vector mapping metadata."""

    def replace_chunks_for_document(self, document_id: str, chunks: list[str]) -> list[ChunkEntity]:
        created_at = _now_iso()
        with get_connection() as connection:
            connection.execute("DELETE FROM chunks WHERE document_id = ?", (document_id,))
            records: list[ChunkEntity] = []
            for index, content in enumerate(chunks):
                chunk_entity = ChunkEntity(
                    id=str(uuid.uuid4()),
                    document_id=document_id,
                    chunk_index=index,
                    content=content,
                    vector_id=None,
                    created_at=created_at,
                )
                connection.execute(
                    """
                    INSERT INTO chunks (id, document_id, chunk_index, content, vector_id, created_at)
                    VALUES (?, ?, ?, ?, ?, ?)
                    """,
                    (
                        chunk_entity.id,
                        chunk_entity.document_id,
                        chunk_entity.chunk_index,
                        chunk_entity.content,
                        chunk_entity.vector_id,
                        chunk_entity.created_at,
                    ),
                )
                records.append(chunk_entity)
            connection.commit()
            return records

    def list_all_chunks(self) -> list[ChunkEntity]:
        with get_connection() as connection:
            cursor = connection.execute(
                """
                SELECT id, document_id, chunk_index, content, vector_id, created_at
                FROM chunks
                ORDER BY created_at ASC, chunk_index ASC
                """
            )
            return [_row_to_chunk(row) for row in cursor.fetchall()]

    def clear_vector_ids(self) -> None:
        with get_connection() as connection:
            connection.execute("UPDATE chunks SET vector_id = NULL")
            connection.commit()

    def update_vector_ids(self, chunk_vector_pairs: list[tuple[str, int]]) -> None:
        with get_connection() as connection:
            connection.executemany(
                "UPDATE chunks SET vector_id = ? WHERE id = ?",
                [(vector_id, chunk_id) for chunk_id, vector_id in chunk_vector_pairs],
            )
            connection.commit()

    def list_by_vector_ids(self, vector_ids: list[int]) -> list[RetrievedChunkEntity]:
        if not vector_ids:
            return []

        placeholders = ",".join("?" for _ in vector_ids)
        with get_connection() as connection:
            cursor = connection.execute(
                f"""
                SELECT
                    c.id AS chunk_id,
                    c.document_id AS document_id,
                    d.file_name AS document_name,
                    c.chunk_index AS chunk_index,
                    c.content AS content,
                    c.vector_id AS vector_id
                FROM chunks c
                JOIN documents d ON d.id = c.document_id
                WHERE c.vector_id IN ({placeholders})
                """,
                tuple(vector_ids),
            )
            rows = cursor.fetchall()
            return [
                RetrievedChunkEntity(
                    chunk_id=row["chunk_id"],
                    document_id=row["document_id"],
                    document_name=row["document_name"],
                    chunk_index=row["chunk_index"],
                    content=row["content"],
                    vector_id=row["vector_id"],
                )
                for row in rows
            ]


class SettingsRepository:
    """Repository for persisted runtime settings."""

    def get_all(self) -> dict[str, str]:
        with get_connection() as connection:
            cursor = connection.execute("SELECT key, value FROM app_settings")
            return {row["key"]: row["value"] for row in cursor.fetchall()}

    def upsert_many(self, updates: dict[str, str]) -> None:
        timestamp = _now_iso()
        rows = [(key, value, timestamp) for key, value in updates.items()]
        with get_connection() as connection:
            connection.executemany(
                """
                INSERT INTO app_settings (key, value, updated_at)
                VALUES (?, ?, ?)
                ON CONFLICT(key) DO UPDATE SET
                    value = excluded.value,
                    updated_at = excluded.updated_at
                """,
                rows,
            )
            connection.commit()

    def list_entities(self) -> list[AppSettingEntity]:
        with get_connection() as connection:
            cursor = connection.execute("SELECT key, value, updated_at FROM app_settings ORDER BY key ASC")
            return [
                AppSettingEntity(
                    key=row["key"],
                    value=row["value"],
                    updated_at=row["updated_at"],
                )
                for row in cursor.fetchall()
            ]


class ChatSessionRepository:
    """Repository for persisted chat sessions and messages."""

    def list_sessions(self) -> list[ChatSessionEntity]:
        with get_connection() as connection:
            cursor = connection.execute(
                """
                SELECT
                    s.id,
                    s.title,
                    s.created_at,
                    s.updated_at,
                    COUNT(m.id) AS message_count
                FROM chat_sessions s
                LEFT JOIN chat_messages m ON m.session_id = s.id
                GROUP BY s.id, s.title, s.created_at, s.updated_at
                ORDER BY s.updated_at DESC, s.created_at DESC
                """
            )
            return [_row_to_chat_session(row) for row in cursor.fetchall()]

    def get_session(self, session_id: str) -> ChatSessionEntity | None:
        with get_connection() as connection:
            row = connection.execute(
                """
                SELECT
                    s.id,
                    s.title,
                    s.created_at,
                    s.updated_at,
                    COUNT(m.id) AS message_count
                FROM chat_sessions s
                LEFT JOIN chat_messages m ON m.session_id = s.id
                WHERE s.id = ?
                GROUP BY s.id, s.title, s.created_at, s.updated_at
                """,
                (session_id,),
            ).fetchone()
            return _row_to_chat_session(row) if row else None

    def create_session(self, title: str) -> ChatSessionEntity:
        session_id = str(uuid.uuid4())
        timestamp = _now_iso()
        with get_connection() as connection:
            connection.execute(
                """
                INSERT INTO chat_sessions (id, title, created_at, updated_at)
                VALUES (?, ?, ?, ?)
                """,
                (session_id, title, timestamp, timestamp),
            )
            connection.commit()
        return ChatSessionEntity(
            id=session_id,
            title=title,
            created_at=timestamp,
            updated_at=timestamp,
            message_count=0,
        )

    def delete_session(self, session_id: str) -> None:
        with get_connection() as connection:
            connection.execute("DELETE FROM chat_sessions WHERE id = ?", (session_id,))
            connection.commit()

    def list_messages(self, session_id: str) -> list[ChatMessageEntity]:
        with get_connection() as connection:
            cursor = connection.execute(
                """
                SELECT id, session_id, role, content, created_at
                FROM chat_messages
                WHERE session_id = ?
                ORDER BY created_at ASC
                """,
                (session_id,),
            )
            return [_row_to_chat_message(row) for row in cursor.fetchall()]

    def append_message(self, session_id: str, role: str, content: str) -> ChatMessageEntity:
        message_id = str(uuid.uuid4())
        timestamp = _now_iso()
        with get_connection() as connection:
            connection.execute(
                """
                INSERT INTO chat_messages (id, session_id, role, content, created_at)
                VALUES (?, ?, ?, ?, ?)
                """,
                (message_id, session_id, role, content, timestamp),
            )
            connection.execute(
                "UPDATE chat_sessions SET updated_at = ? WHERE id = ?",
                (timestamp, session_id),
            )
            connection.commit()
        return ChatMessageEntity(
            id=message_id,
            session_id=session_id,
            role=role,
            content=content,
            created_at=timestamp,
        )

    def rename_session(self, session_id: str, title: str) -> None:
        with get_connection() as connection:
            connection.execute(
                "UPDATE chat_sessions SET title = ?, updated_at = ? WHERE id = ?",
                (title, _now_iso(), session_id),
            )
            connection.commit()
