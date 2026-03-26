from pathlib import Path

from docx import Document as DocxDocument
from pypdf import PdfReader


class DocumentParseError(RuntimeError):
    """Raised when a local document cannot be parsed into plain text."""


def _read_text_with_fallback(path: Path) -> str:
    encodings = ("utf-8", "utf-8-sig", "gb18030", "gbk", "latin-1")
    for encoding in encodings:
        try:
            return path.read_text(encoding=encoding)
        except UnicodeDecodeError:
            continue
    raise DocumentParseError(f"Failed to decode text file: {path.name}")


def _extract_pdf_text(path: Path) -> str:
    with path.open("rb") as file_stream:
        reader = PdfReader(file_stream)
        page_texts = [(page.extract_text() or "").strip() for page in reader.pages]
    return "\n\n".join(part for part in page_texts if part)


def _extract_docx_text(path: Path) -> str:
    document = DocxDocument(path)
    return "\n".join(paragraph.text.strip() for paragraph in document.paragraphs if paragraph.text.strip())


def extract_text(file_path: str) -> str:
    """Extract plain text from supported local file types."""
    path = Path(file_path)
    extension = path.suffix.lower()

    if extension in {".txt", ".md", ".markdown"}:
        content = _read_text_with_fallback(path)
    elif extension == ".pdf":
        content = _extract_pdf_text(path)
    elif extension == ".docx":
        content = _extract_docx_text(path)
    else:
        raise DocumentParseError(f"Unsupported extension for parser: {extension or '(none)'}")

    normalized = content.replace("\x00", "").strip()
    if not normalized:
        raise DocumentParseError(f"Extracted text is empty for file: {path.name}")
    return normalized
