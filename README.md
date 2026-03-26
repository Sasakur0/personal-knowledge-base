# Personal Knowledge Base Assistant

[中文说明](./README.zh-CN.md)

Local-first desktop knowledge base QA app for Windows.

## Tech Stack
- Desktop shell: Electron
- Frontend: React + TypeScript
- Backend: Python + FastAPI
- Metadata store: SQLite
- Vector search: FAISS
- Parsers: PDF / TXT / MD / DOCX
- Model gateway: OpenAI-compatible API (supports OpenAI / Doubao / DeepSeek / Kimi by `api_base_url`)

## MVP Scope (Implemented)
- 3-column desktop layout:
  - Left: document list/import status
  - Center: chat QA
  - Right: retrieved citations
- Document import pipeline:
  - select local files in Electron
  - validate + parse + chunk + embedding + FAISS indexing
  - metadata/chunks/settings persisted in SQLite
- Retrieval QA:
  - retrieve top_k chunks
  - assemble context
  - generate answer (default mock provider, optional openai-compatible provider)
  - return answer + citations
- Settings:
  - API Base URL
  - API Key
  - model name
  - top_k
  - chunk size / overlap
  - provider mode (`mock` / `openai_compatible`)

## Directory Overview
```text
desktop/
  electron/
  renderer/
backend/
  app/
    api/
    services/
    models/
    storage/
    utils/
scripts/
```

## Windows Local Development
1. Create and use project virtual environment:
```powershell
cd D:\Person\personal-knowledge-base
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
```

2. Prepare env files:
```powershell
Copy-Item backend\.env.example backend\.env
Copy-Item desktop\.env.example desktop\.env
```

3. Install desktop dependencies:
```powershell
cd desktop
npm install
```

4. Start backend:
```powershell
cd D:\Person\personal-knowledge-base
.\.venv\Scripts\python.exe -m uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```

5. Start desktop app:
```powershell
cd D:\Person\personal-knowledge-base\desktop
npm run dev
```

By default Electron auto-starts backend from `.venv`. If you want to run backend manually, set:
```powershell
$env:PKB_BACKEND_AUTOSTART="0"
```

## API Endpoints
- `GET /api/health`
- `GET /api/documents`
- `POST /api/documents/import`
- `POST /api/documents/reindex`
- `POST /api/retrieval/search`
- `POST /api/chat/ask`
- `GET /api/settings`
- `PUT /api/settings`
