import httpx

from ..models.schemas import CitationResponse
from .settings_service import RuntimeSettings


def _build_context_prompt(question: str, citations: list[CitationResponse]) -> str:
    if not citations:
        return f"Question:\n{question}\n\nNo context was retrieved."

    lines = [f"Question:\n{question}\n", "Context snippets:"]
    for index, citation in enumerate(citations, start=1):
        lines.append(
            f"[{index}] {citation.document_name}#{citation.chunk_index} (score={citation.score:.4f})\n{citation.content}"
        )
    return "\n\n".join(lines)


def _mock_answer(question: str, citations: list[CitationResponse]) -> str:
    if not citations:
        return (
            "I could not find relevant chunks in the local knowledge base. "
            "Please import and index documents, or ask a more specific question."
        )

    top = citations[0]
    return (
        "Based on the indexed documents, the most relevant evidence is from "
        f"{top.document_name} chunk #{top.chunk_index}. "
        f"Summary: {top.content[:280]}"
    )


def _openai_compatible_answer(
    question: str,
    citations: list[CitationResponse],
    settings: RuntimeSettings,
) -> str:
    if not settings.api_base_url:
        raise RuntimeError("api_base_url is required for openai-compatible llm provider.")
    if not settings.model_name:
        raise RuntimeError("model_name is required for openai-compatible llm provider.")

    base_url = settings.api_base_url.rstrip("/")
    url = f"{base_url}/chat/completions"
    headers = {"Content-Type": "application/json"}
    if settings.api_key:
        headers["Authorization"] = f"Bearer {settings.api_key}"

    prompt = _build_context_prompt(question, citations)
    payload = {
        "model": settings.model_name,
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are a retrieval-augmented assistant. "
                    "Answer strictly using provided context and cite uncertainty when needed."
                ),
            },
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.2,
    }

    with httpx.Client(timeout=90.0) as client:
        response = client.post(url, headers=headers, json=payload)

    if response.status_code >= 400:
        raise RuntimeError(f"LLM request failed: HTTP {response.status_code} {response.text}")

    data = response.json()
    choices = data.get("choices", [])
    if not choices:
        raise RuntimeError("LLM response missing choices.")
    content = choices[0].get("message", {}).get("content", "")
    if not content:
        raise RuntimeError("LLM response content is empty.")
    return str(content).strip()


def generate_answer(question: str, citations: list[CitationResponse], settings: RuntimeSettings) -> str:
    """Generate final answer from configured LLM provider."""
    provider = settings.llm_provider.strip().lower()
    if provider == "mock":
        return _mock_answer(question, citations)
    if provider == "openai_compatible":
        return _openai_compatible_answer(question, citations, settings)
    raise RuntimeError(f"Unsupported llm provider: {settings.llm_provider}")
