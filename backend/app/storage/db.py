import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Iterator

from ..utils.config import get_settings, resolve_backend_path


def get_sqlite_path() -> Path:
    """Resolve and ensure the SQLite database directory exists."""
    settings = get_settings()
    sqlite_path = resolve_backend_path(settings.sqlite_path)
    sqlite_path.parent.mkdir(parents=True, exist_ok=True)
    return sqlite_path


def _ensure_document_columns(connection: sqlite3.Connection) -> None:
    """Add missing columns for forward-compatible schema upgrades."""
    cursor = connection.execute("PRAGMA table_info(documents)")
    existing_columns = {row[1] for row in cursor.fetchall()}

    if "chunk_count" not in existing_columns:
        connection.execute("ALTER TABLE documents ADD COLUMN chunk_count INTEGER NOT NULL DEFAULT 0")
    if "error_message" not in existing_columns:
        connection.execute("ALTER TABLE documents ADD COLUMN error_message TEXT")


def _ensure_chat_session_columns(connection: sqlite3.Connection) -> None:
    """Add missing columns for chat_sessions schema upgrades."""
    cursor = connection.execute("PRAGMA table_info(chat_sessions)")
    existing_columns = {row[1] for row in cursor.fetchall()}

    if "title" not in existing_columns:
        connection.execute("ALTER TABLE chat_sessions ADD COLUMN title TEXT NOT NULL DEFAULT '新对话'")


def init_database() -> None:
    """Initialize SQLite schema required by metadata, chunks, and settings APIs."""
    connection = sqlite3.connect(get_sqlite_path())

    try:
        connection.execute("PRAGMA foreign_keys = ON")
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS documents (
                id TEXT PRIMARY KEY,
                file_path TEXT NOT NULL UNIQUE,
                file_name TEXT NOT NULL,
                file_ext TEXT NOT NULL,
                status TEXT NOT NULL,
                error_message TEXT,
                chunk_count INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """
        )
        _ensure_document_columns(connection)
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS chunks (
                id TEXT PRIMARY KEY,
                document_id TEXT NOT NULL,
                chunk_index INTEGER NOT NULL,
                content TEXT NOT NULL,
                vector_id INTEGER,
                created_at TEXT NOT NULL,
                UNIQUE(document_id, chunk_index),
                FOREIGN KEY(document_id) REFERENCES documents(id) ON DELETE CASCADE
            )
            """
        )
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS app_settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """
        )
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS chat_sessions (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """
        )
        _ensure_chat_session_columns(connection)
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS chat_messages (
                id TEXT PRIMARY KEY,
                session_id TEXT NOT NULL,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY(session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
            )
            """
        )
        connection.commit()
    finally:
        connection.close()


@contextmanager
def get_connection() -> Iterator[sqlite3.Connection]:
    """Yield a SQLite connection configured with dictionary-like rows."""
    connection = sqlite3.connect(get_sqlite_path())
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")

    try:
        yield connection
    finally:
        connection.close()
