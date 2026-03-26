import type { AppLanguage, ProviderVendor } from "./types/dto";

export interface CopyBundle {
  appTitle: string;
  appSubtitle: string;
  backendOnline: string;
  backendOffline: string;
  backendChecking: string;
  retry: string;
  modelConfig: string;
  language: string;
  theme: string;
  knowledgeDocs: string;
  importFiles: string;
  importing: string;
  noDocuments: string;
  chunksLabel: string;
  imported: string;
  processing: string;
  indexed: string;
  failed: string;
  chatTitle: string;
  chatPlaceholder: string;
  chatEmpty: string;
  send: string;
  sending: string;
  you: string;
  assistant: string;
  citations: string;
  selectedDoc: string;
  noCitations: string;
  modelConfigTitle: string;
  close: string;
  provider: string;
  apiKey: string;
  save: string;
  saving: string;
  languageChinese: string;
  languageEnglish: string;
  lightMode: string;
  darkMode: string;
  importSummaryIndexed: string;
  importSummaryFailed: string;
  desktopPickerUnavailable: string;
  failedToLoadDocuments: string;
  failedToLoadSettings: string;
  importFailed: string;
  settingsSaved: string;
  failedToSaveSettings: string;
  chatFailed: string;
  waitingHealth: string;
  cannotConnectBackend: string;
  providerMock: string;
  providerOpenAI: string;
  providerDoubao: string;
  providerDeepSeek: string;
  providerKimi: string;
  toolbarRetry: string;
  toolbarTheme: string;
  toolbarLanguage: string;
  toolbarModelConfig: string;
  testConnection: string;
  testingConnection: string;
  connectionSuccess: string;
  connectionFailed: string;
  providerBaseUrl: string;
  providerModelName: string;
  serviceUrl: string;
  modelName: string;
  pullModels: string;
  pullingModels: string;
  noModelsAvailable: string;
  lastUpdated: string;
  citationChunk: string;
  citationScore: string;
  newChat: string;
  chatHistory: string;
  noChatSessions: string;
  searchDocs: string;
  delete: string;
  deleting: string;
  docDeleted: string;
  failedToDeleteDocument: string;
  deleteChat: string;
  failedToLoadSessions: string;
  failedToDeleteSession: string;
  openDocsLibrary: string;
  documentsPageTitle: string;
  documentsPageSubtitle: string;
  noSearchResults: string;
  matchedDocs: string;
  matchedSnippets: string;
  openCitationDetail: string;
  loginTitle: string;
  loginSubtitle: string;
  loginAccount: string;
  loginPassword: string;
  loginSubmit: string;
  loginHint: string;
  loginWelcome: string;
  loginFootnote: string;
}

export const copyMap: Record<AppLanguage, CopyBundle> = {
  "zh-CN": {
    appTitle: "个人知识库问答助手",
    appSubtitle: "本地检索、引用回溯与模型问答",
    backendOnline: "后端已连接",
    backendOffline: "后端不可用",
    backendChecking: "正在检查后端",
    retry: "重试",
    modelConfig: "模型配置",
    language: "语言",
    theme: "主题",
    knowledgeDocs: "知识库文档",
    importFiles: "导入文档",
    importing: "导入中...",
    noDocuments: "还没有导入文档。",
    chunksLabel: "分片数",
    imported: "已导入",
    processing: "处理中",
    indexed: "已索引",
    failed: "失败",
    chatTitle: "对话问答",
    chatPlaceholder: "输入问题，系统会基于知识库检索后回答",
    chatEmpty: "新建聊天后开始提问。",
    send: "发送",
    sending: "发送中...",
    you: "我",
    assistant: "助手",
    citations: "引用片段",
    selectedDoc: "当前文档",
    noCitations: "提问后会在这里显示命中的片段和来源。",
    modelConfigTitle: "模型配置",
    close: "关闭",
    provider: "模型厂商",
    apiKey: "API Key",
    save: "保存",
    saving: "保存中...",
    languageChinese: "中文",
    languageEnglish: "English",
    lightMode: "浅色",
    darkMode: "深色",
    importSummaryIndexed: "成功索引",
    importSummaryFailed: "失败",
    desktopPickerUnavailable: "桌面文件选择器不可用。",
    failedToLoadDocuments: "加载文档失败",
    failedToLoadSettings: "加载配置失败",
    importFailed: "导入失败",
    settingsSaved: "配置已保存。",
    failedToSaveSettings: "保存配置失败",
    chatFailed: "问答失败",
    waitingHealth: "等待首次健康检查...",
    cannotConnectBackend: "无法连接后端",
    providerMock: "本地演示",
    providerOpenAI: "OpenAI",
    providerDoubao: "豆包",
    providerDeepSeek: "DeepSeek",
    providerKimi: "Kimi",
    toolbarRetry: "重新检测服务",
    toolbarTheme: "切换主题",
    toolbarLanguage: "切换语言",
    toolbarModelConfig: "打开模型配置",
    testConnection: "测试连接",
    testingConnection: "测试中...",
    connectionSuccess: "连接成功",
    connectionFailed: "连接失败",
    providerBaseUrl: "服务地址",
    providerModelName: "默认模型",
    serviceUrl: "模型服务地址",
    modelName: "问答模型",
    pullModels: "拉取模型",
    pullingModels: "拉取中...",
    noModelsAvailable: "暂无可用模型，请先填写地址和 API Key 后拉取。",
    lastUpdated: "最近更新",
    citationChunk: "分片",
    citationScore: "相关度",
    newChat: "新建聊天",
    chatHistory: "聊天记录",
    noChatSessions: "还没有聊天记录。",
    searchDocs: "搜索文档",
    delete: "删除",
    deleting: "删除中...",
    docDeleted: "文档已删除。",
    failedToDeleteDocument: "删除文档失败",
    deleteChat: "删除聊天",
    failedToLoadSessions: "加载聊天记录失败",
    failedToDeleteSession: "删除聊天失败",
    openDocsLibrary: "打开文档库",
    documentsPageTitle: "文档库管理",
    documentsPageSubtitle: "搜索、查看和删除已导入文档",
    noSearchResults: "没有匹配到文档。",
    matchedDocs: "命中文档",
    matchedSnippets: "引用片段",
    openCitationDetail: "查看引用",
    loginTitle: "登录工作台",
    loginSubtitle: "进入你的本地知识助手桌面空间",
    loginAccount: "账号",
    loginPassword: "密码",
    loginSubmit: "进入系统",
    loginHint: "当前为本地登录界面，不接真实账号服务。",
    loginWelcome: "让文档、对话和引用回到同一个桌面工作流里。",
    loginFootnote: "登录后会恢复这台设备上次离开时的界面状态和聊天记录。"
  },
  "en-US": {
    appTitle: "Personal Knowledge Base Assistant",
    appSubtitle: "Local retrieval, source tracing, and model-assisted answers",
    backendOnline: "Backend Online",
    backendOffline: "Backend Offline",
    backendChecking: "Checking Backend",
    retry: "Retry",
    modelConfig: "Model Config",
    language: "Language",
    theme: "Theme",
    knowledgeDocs: "Knowledge Docs",
    importFiles: "Import Docs",
    importing: "Importing...",
    noDocuments: "No documents imported yet.",
    chunksLabel: "Chunks",
    imported: "Imported",
    processing: "Processing",
    indexed: "Indexed",
    failed: "Failed",
    chatTitle: "Chat",
    chatPlaceholder: "Ask a question based on the indexed knowledge base",
    chatEmpty: "Create a chat and start asking.",
    send: "Send",
    sending: "Sending...",
    you: "You",
    assistant: "Assistant",
    citations: "Citations",
    selectedDoc: "Selected document",
    noCitations: "Matched snippets and sources will appear here after a question.",
    modelConfigTitle: "Model Config",
    close: "Close",
    provider: "Provider",
    apiKey: "API Key",
    save: "Save",
    saving: "Saving...",
    languageChinese: "Chinese",
    languageEnglish: "English",
    lightMode: "Light",
    darkMode: "Dark",
    importSummaryIndexed: "Indexed",
    importSummaryFailed: "Failed",
    desktopPickerUnavailable: "Desktop file picker is unavailable.",
    failedToLoadDocuments: "Failed to load documents",
    failedToLoadSettings: "Failed to load config",
    importFailed: "Import failed",
    settingsSaved: "Config saved.",
    failedToSaveSettings: "Failed to save config",
    chatFailed: "Chat failed",
    waitingHealth: "Waiting for first health check...",
    cannotConnectBackend: "Cannot connect to backend",
    providerMock: "Mock",
    providerOpenAI: "OpenAI",
    providerDoubao: "Doubao",
    providerDeepSeek: "DeepSeek",
    providerKimi: "Kimi",
    toolbarRetry: "Recheck service",
    toolbarTheme: "Toggle theme",
    toolbarLanguage: "Switch language",
    toolbarModelConfig: "Open model config",
    testConnection: "Test Connection",
    testingConnection: "Testing...",
    connectionSuccess: "Connection succeeded",
    connectionFailed: "Connection failed",
    providerBaseUrl: "Base URL",
    providerModelName: "Default model",
    serviceUrl: "Service URL",
    modelName: "Chat Model",
    pullModels: "Pull Models",
    pullingModels: "Pulling...",
    noModelsAvailable: "No models available yet. Fill in the URL and API key, then pull models.",
    lastUpdated: "Updated",
    citationChunk: "Chunk",
    citationScore: "Score",
    newChat: "New Chat",
    chatHistory: "Chat History",
    noChatSessions: "No chat sessions yet.",
    searchDocs: "Search docs",
    delete: "Delete",
    deleting: "Deleting...",
    docDeleted: "Document deleted.",
    failedToDeleteDocument: "Failed to delete document",
    deleteChat: "Delete chat",
    failedToLoadSessions: "Failed to load chat history",
    failedToDeleteSession: "Failed to delete chat",
    openDocsLibrary: "Open Library",
    documentsPageTitle: "Document Library",
    documentsPageSubtitle: "Search, inspect, and remove imported documents",
    noSearchResults: "No matching documents.",
    matchedDocs: "Matched Docs",
    matchedSnippets: "Snippets",
    openCitationDetail: "View citations",
    loginTitle: "Sign In",
    loginSubtitle: "Enter your local knowledge assistant workspace",
    loginAccount: "Account",
    loginPassword: "Password",
    loginSubmit: "Enter Workspace",
    loginHint: "This is a local sign-in screen only. No real account service is connected.",
    loginWelcome: "Keep documents, chat, and citations inside one desktop workflow.",
    loginFootnote: "After sign-in, the app restores your local state and chat history."
  }
};

export function getCopy(language: AppLanguage): CopyBundle {
  return copyMap[language];
}

export interface ProviderConfig {
  vendor: ProviderVendor;
  apiBaseUrl: string;
  modelName: string;
  embeddingModelName: string;
  llmProvider: "mock" | "openai_compatible";
  embeddingProvider: "mock" | "openai_compatible";
}

export const providerConfigs: Record<ProviderVendor, ProviderConfig> = {
  mock: {
    vendor: "mock",
    apiBaseUrl: "",
    modelName: "mock-chat",
    embeddingModelName: "mock-embedding",
    llmProvider: "mock",
    embeddingProvider: "mock"
  },
  openai: {
    vendor: "openai",
    apiBaseUrl: "https://api.openai.com/v1",
    modelName: "gpt-4o-mini",
    embeddingModelName: "mock-embedding",
    llmProvider: "openai_compatible",
    embeddingProvider: "mock"
  },
  doubao: {
    vendor: "doubao",
    apiBaseUrl: "https://ark.cn-beijing.volces.com/api/v3",
    modelName: "doubao-1-5-lite-32k-250115",
    embeddingModelName: "mock-embedding",
    llmProvider: "openai_compatible",
    embeddingProvider: "mock"
  },
  deepseek: {
    vendor: "deepseek",
    apiBaseUrl: "https://api.deepseek.com/v1",
    modelName: "deepseek-chat",
    embeddingModelName: "mock-embedding",
    llmProvider: "openai_compatible",
    embeddingProvider: "mock"
  },
  kimi: {
    vendor: "kimi",
    apiBaseUrl: "https://api.moonshot.cn/v1",
    modelName: "moonshot-v1-8k",
    embeddingModelName: "mock-embedding",
    llmProvider: "openai_compatible",
    embeddingProvider: "mock"
  }
};

export function detectProviderVendor(apiBaseUrl: string, llmProvider: string): ProviderVendor {
  if (llmProvider === "mock") {
    return "mock";
  }
  const normalized = apiBaseUrl.toLowerCase();
  if (normalized.includes("openai.com")) {
    return "openai";
  }
  if (normalized.includes("volces.com") || normalized.includes("ark.cn-beijing")) {
    return "doubao";
  }
  if (normalized.includes("deepseek.com")) {
    return "deepseek";
  }
  if (normalized.includes("moonshot.cn")) {
    return "kimi";
  }
  return "openai";
}