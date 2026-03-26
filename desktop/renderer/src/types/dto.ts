export type DocumentStatus = "imported" | "processing" | "indexed" | "failed";

export interface DocumentItem {
  id: string;
  filePath: string;
  name: string;
  extension: string;
  status: DocumentStatus;
  errorMessage: string | null;
  chunkCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
}

export interface Citation {
  id: string;
  documentId: string;
  documentName: string;
  chunkIndex: number;
  content: string;
  score: number;
}

export type HealthStatus = "checking" | "online" | "offline";

export interface HealthPayload {
  status: string;
  service: string;
  env: string;
  timestamp: string;
}

export interface ImportDocumentsPayload {
  filePaths: string[];
}

export interface ImportResultItem {
  documentId: string | null;
  filePath: string;
  fileName: string;
  status: DocumentStatus;
  errorMessage: string | null;
}

export interface ImportDocumentsResult {
  successCount: number;
  failedCount: number;
  results: ImportResultItem[];
}

export interface AskQuestionPayload {
  question: string;
  topK?: number;
  sessionId?: string;
}

export interface AskQuestionResult {
  answer: string;
  citations: Citation[];
  sessionId: string;
}

export interface ChatSessionSummary {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

export interface ChatSessionDetail extends ChatSessionSummary {
  messages: Message[];
}

export interface RuntimeSettings {
  apiBaseUrl: string;
  apiKey: string;
  modelName: string;
  embeddingModelName: string;
  llmProvider: string;
  embeddingProvider: string;
  topK: number;
  chunkSize: number;
  chunkOverlap: number;
  embeddingDimension: number;
}

export interface TestConnectionPayload {
  apiBaseUrl?: string;
  apiKey?: string;
  modelName?: string;
  embeddingModelName?: string;
  llmProvider?: string;
  embeddingProvider?: string;
}

export interface TestConnectionResult {
  success: boolean;
  message: string;
}

export interface FetchModelsPayload {
  apiBaseUrl?: string;
  apiKey?: string;
  llmProvider?: string;
}

export interface FetchModelsResult {
  models: string[];
}

export type AppLanguage = "zh-CN" | "en-US";

export type ThemeMode = "light" | "dark";

export type ProviderVendor = "mock" | "openai" | "doubao" | "deepseek" | "kimi";

export interface UpdateSettingsPayload {
  apiBaseUrl?: string;
  apiKey?: string;
  modelName?: string;
  embeddingModelName?: string;
  llmProvider?: string;
  embeddingProvider?: string;
  topK?: number;
  chunkSize?: number;
  chunkOverlap?: number;
  embeddingDimension?: number;
}
