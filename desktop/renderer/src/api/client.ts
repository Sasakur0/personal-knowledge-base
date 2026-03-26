import type {
  AskQuestionPayload,
  AskQuestionResult,
  ChatSessionDetail,
  ChatSessionSummary,
  Citation,
  FetchModelsPayload,
  FetchModelsResult,
  DocumentItem,
  HealthPayload,
  ImportDocumentsPayload,
  ImportDocumentsResult,
  ImportResultItem,
  RuntimeSettings,
  TestConnectionPayload,
  TestConnectionResult,
  UpdateSettingsPayload
} from "../types/dto";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";
const REQUEST_TIMEOUT_MS = 15000;

interface ApiDocumentItem {
  id: string;
  file_path: string;
  file_name: string;
  file_ext: string;
  status: "imported" | "processing" | "indexed" | "failed";
  error_message: string | null;
  chunk_count: number;
  created_at: string;
  updated_at: string;
}

interface ApiDocumentListResponse {
  items: ApiDocumentItem[];
}

interface ApiImportResultItem {
  document_id: string | null;
  file_path: string;
  file_name: string;
  status: "imported" | "processing" | "indexed" | "failed";
  error_message: string | null;
}

interface ApiImportDocumentsResponse {
  success_count: number;
  failed_count: number;
  results: ApiImportResultItem[];
}

interface ApiCitation {
  chunk_id: string;
  document_id: string;
  document_name: string;
  chunk_index: number;
  content: string;
  score: number;
}

interface ApiChatResponse {
  answer: string;
  citations: ApiCitation[];
  session_id: string;
}

interface ApiSettingsResponse {
  api_base_url: string;
  api_key: string;
  model_name: string;
  embedding_model_name: string;
  llm_provider: string;
  embedding_provider: string;
  top_k: number;
  chunk_size: number;
  chunk_overlap: number;
  embedding_dimension: number;
}

interface ApiTestConnectionResponse {
  success: boolean;
  message: string;
}

interface ApiModelsResponse {
  models: string[];
}

interface ApiReindexResponse {
  status: string;
  indexed_chunk_count: number;
  message: string;
}

interface ApiChatSessionSummary {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

interface ApiChatSessionListResponse {
  items: ApiChatSessionSummary[];
}

interface ApiChatMessage {
  id: string;
  session_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

interface ApiChatSessionDetail {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  messages: ApiChatMessage[];
}

function mapCitation(item: ApiCitation): Citation {
  return {
    id: item.chunk_id,
    documentId: item.document_id,
    documentName: item.document_name,
    chunkIndex: item.chunk_index,
    content: item.content,
    score: item.score
  };
}

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      signal: controller.signal
    });

    if (!response.ok) {
      let message = `HTTP ${response.status}`;
      try {
        const errorPayload = (await response.json()) as { detail?: string };
        if (errorPayload.detail) {
          message = errorPayload.detail;
        }
      } catch {
        // ignore response parse errors
      }
      throw new Error(message);
    }

    return (await response.json()) as T;
  } finally {
    window.clearTimeout(timeout);
  }
}

export function getHealth(): Promise<HealthPayload> {
  return apiRequest<HealthPayload>("/api/health", { method: "GET" });
}

export async function getDocuments(): Promise<DocumentItem[]> {
  const payload = await apiRequest<ApiDocumentListResponse>("/api/documents", { method: "GET" });
  return payload.items.map((item) => ({
    id: item.id,
    filePath: item.file_path,
    name: item.file_name,
    extension: item.file_ext,
    status: item.status,
    errorMessage: item.error_message,
    chunkCount: item.chunk_count,
    createdAt: item.created_at,
    updatedAt: item.updated_at
  }));
}

export function deleteDocument(documentId: string): Promise<void> {
  return apiRequest<{ status: string }>(`/api/documents/${documentId}`, {
    method: "DELETE"
  }).then(() => undefined);
}

export async function importDocuments(payload: ImportDocumentsPayload): Promise<ImportDocumentsResult> {
  const result = await apiRequest<ApiImportDocumentsResponse>("/api/documents/import", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      file_paths: payload.filePaths
    })
  });

  const mappedResults: ImportResultItem[] = result.results.map((item) => ({
    documentId: item.document_id,
    filePath: item.file_path,
    fileName: item.file_name,
    status: item.status,
    errorMessage: item.error_message
  }));

  return {
    successCount: result.success_count,
    failedCount: result.failed_count,
    results: mappedResults
  };
}

export async function askQuestion(payload: AskQuestionPayload): Promise<AskQuestionResult> {
  const response = await apiRequest<ApiChatResponse>("/api/chat/ask", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      question: payload.question,
      top_k: payload.topK,
      session_id: payload.sessionId
    })
  });
  return {
    answer: response.answer,
    citations: response.citations.map(mapCitation),
    sessionId: response.session_id
  };
}

function mapSettingsResponse(payload: ApiSettingsResponse): RuntimeSettings {
  return {
    apiBaseUrl: payload.api_base_url,
    apiKey: payload.api_key,
    modelName: payload.model_name,
    embeddingModelName: payload.embedding_model_name,
    llmProvider: payload.llm_provider,
    embeddingProvider: payload.embedding_provider,
    topK: payload.top_k,
    chunkSize: payload.chunk_size,
    chunkOverlap: payload.chunk_overlap,
    embeddingDimension: payload.embedding_dimension
  };
}

export async function getSettings(): Promise<RuntimeSettings> {
  const payload = await apiRequest<ApiSettingsResponse>("/api/settings", { method: "GET" });
  return mapSettingsResponse(payload);
}

export async function updateSettings(payload: UpdateSettingsPayload): Promise<RuntimeSettings> {
  const response = await apiRequest<ApiSettingsResponse>("/api/settings", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      api_base_url: payload.apiBaseUrl,
      api_key: payload.apiKey,
      model_name: payload.modelName,
      embedding_model_name: payload.embeddingModelName,
      llm_provider: payload.llmProvider,
      embedding_provider: payload.embeddingProvider,
      top_k: payload.topK,
      chunk_size: payload.chunkSize,
      chunk_overlap: payload.chunkOverlap,
      embedding_dimension: payload.embeddingDimension
    })
  });
  return mapSettingsResponse(response);
}

export function testConnection(payload: TestConnectionPayload): Promise<TestConnectionResult> {
  return apiRequest<ApiTestConnectionResponse>("/api/settings/test-connection", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      api_base_url: payload.apiBaseUrl,
      api_key: payload.apiKey,
      model_name: payload.modelName,
      embedding_model_name: payload.embeddingModelName,
      llm_provider: payload.llmProvider,
      embedding_provider: payload.embeddingProvider
    })
  });
}

export function fetchModels(payload: FetchModelsPayload): Promise<FetchModelsResult> {
  return apiRequest<ApiModelsResponse>("/api/settings/models", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      api_base_url: payload.apiBaseUrl,
      api_key: payload.apiKey,
      llm_provider: payload.llmProvider
    })
  });
}

export function reindexDocuments(): Promise<void> {
  return apiRequest<ApiReindexResponse>("/api/documents/reindex", {
    method: "POST"
  }).then(() => undefined);
}

function mapChatSessionSummary(payload: ApiChatSessionSummary): ChatSessionSummary {
  return {
    id: payload.id,
    title: payload.title,
    createdAt: payload.created_at,
    updatedAt: payload.updated_at,
    messageCount: payload.message_count
  };
}

export async function getChatSessions(): Promise<ChatSessionSummary[]> {
  const payload = await apiRequest<ApiChatSessionListResponse>("/api/conversations", { method: "GET" });
  return payload.items.map(mapChatSessionSummary);
}

export async function createChatSession(title?: string): Promise<ChatSessionDetail> {
  const payload = await apiRequest<ApiChatSessionDetail>("/api/conversations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ title })
  });
  return {
    ...mapChatSessionSummary(payload),
    messages: payload.messages.map((item) => ({
      id: item.id,
      role: item.role,
      content: item.content,
      createdAt: item.created_at
    }))
  };
}

export async function getChatSessionDetail(sessionId: string): Promise<ChatSessionDetail> {
  const payload = await apiRequest<ApiChatSessionDetail>(`/api/conversations/${sessionId}`, { method: "GET" });
  return {
    ...mapChatSessionSummary(payload),
    messages: payload.messages.map((item) => ({
      id: item.id,
      role: item.role,
      content: item.content,
      createdAt: item.created_at
    }))
  };
}

export function deleteChatSession(sessionId: string): Promise<void> {
  return apiRequest<{ status: string }>(`/api/conversations/${sessionId}`, {
    method: "DELETE"
  }).then(() => undefined);
}
