import { useEffect, useMemo, useState } from "react";

import {
  askQuestion,
  createChatSession,
  deleteChatSession,
  deleteDocument,
  fetchModels,
  getChatSessionDetail,
  getChatSessions,
  getDocuments,
  getHealth,
  getSettings,
  importDocuments,
  reindexDocuments,
  testConnection,
  updateSettings
} from "./api/client";
import CitationPanel from "./components/CitationPanel";
import ChatPanel from "./components/ChatPanel";
import KnowledgePanel from "./components/KnowledgePanel";
import { detectProviderVendor, getCopy, providerConfigs } from "./i18n";
import DocumentsPage from "./pages/DocumentsPage";
import LoginPage from "./pages/LoginPage";
import SettingsPage from "./pages/SettingsPage";
import type {
  AppLanguage,
  ChatSessionSummary,
  Citation,
  DocumentItem,
  HealthStatus,
  Message,
  ProviderVendor,
  RuntimeSettings,
  ThemeMode
} from "./types/dto";
import "./styles/app.css";

const LANGUAGE_KEY = "pkb.language";
const THEME_KEY = "pkb.theme";
const AUTH_ACCOUNT_KEY = "pkb.auth.account";
const ACTIVE_SESSION_KEY = "pkb.activeSessionId";
const SELECTED_DOC_KEY = "pkb.selectedDocumentId";
const SESSION_CITATIONS_KEY = "pkb.sessionCitations";

interface ToolbarButtonProps {
  title: string;
  onClick: () => void;
  children: JSX.Element;
}

function ToolbarButton({ title, onClick, children }: ToolbarButtonProps): JSX.Element {
  return (
    <button className="icon-tool-btn" type="button" title={title} aria-label={title} onClick={onClick}>
      {children}
    </button>
  );
}

function RefreshIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M17.6 6.35A7.95 7.95 0 0 0 12 4a8 8 0 1 0 7.75 10h-2.1A6 6 0 1 1 12 6c1.48 0 2.83.54 3.88 1.43L13 10h7V3l-2.4 3.35Z" fill="currentColor" />
    </svg>
  );
}

function ThemeIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3.5a1 1 0 0 1 1 1v1.5a1 1 0 1 1-2 0V4.5a1 1 0 0 1 1-1Zm0 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm7.5-4.5a1 1 0 0 1 1 1 8.5 8.5 0 1 1-8.5-8.5 1 1 0 1 1 0 2A6.5 6.5 0 1 0 18.5 12a1 1 0 0 1 1-1Z" fill="currentColor" />
    </svg>
  );
}

function LanguageIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 5h7v2H8.72a14.2 14.2 0 0 1 2.16 3.4c.7-1.17 1.27-2.32 1.69-3.4h2.08a18.2 18.2 0 0 1-2.61 5.01c.66.86 1.45 1.68 2.36 2.45l-1.35 1.6a16.3 16.3 0 0 1-2.32-2.45 15.2 15.2 0 0 1-3.28 2.59L6.3 14.62a13 13 0 0 0 3.2-2.5A12.34 12.34 0 0 1 7.2 7H4V5Zm15.24 14-1.01-2.73h-4.46L12.76 19h-2.13l4.2-10.5h2.35L21.38 19h-2.14Zm-4.73-4.6h2.98L16 10.38 14.51 14.4Z" fill="currentColor" />
    </svg>
  );
}

function SettingsIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m19.14 12.94.04-.94-.04-.94 2.03-1.58a.6.6 0 0 0 .14-.78l-1.92-3.32a.61.61 0 0 0-.74-.26l-2.39.96a7.57 7.57 0 0 0-1.62-.94l-.36-2.54a.61.61 0 0 0-.6-.5h-3.84a.61.61 0 0 0-.6.5L9.88 5.1c-.57.22-1.11.53-1.62.94l-2.39-.96a.61.61 0 0 0-.74.26L3.21 8.66a.6.6 0 0 0 .14.78l2.03 1.58-.04.98.04.94-2.03 1.58a.6.6 0 0 0-.14.78l1.92 3.32c.15.26.46.37.74.26l2.39-.96c.5.4 1.05.72 1.62.94l.36 2.54c.05.29.3.5.6.5h3.84c.3 0 .55-.21.6-.5l.36-2.54c.57-.22 1.11-.53 1.62-.94l2.39.96c.28.11.59 0 .74-.26l1.92-3.32a.6.6 0 0 0-.14-.78l-2.03-1.58ZM12 15.5A3.5 3.5 0 1 1 12 8.5a3.5 3.5 0 0 1 0 7Z" fill="currentColor" />
    </svg>
  );
}

function createMessage(role: Message["role"], content: string): Message {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    role,
    content
  };
}

function readStoredLanguage(): AppLanguage {
  const value = window.localStorage.getItem(LANGUAGE_KEY);
  return value === "en-US" ? "en-US" : "zh-CN";
}

function readStoredTheme(): ThemeMode {
  const value = window.localStorage.getItem(THEME_KEY);
  return value === "dark" ? "dark" : "light";
}

function readStoredAuthAccount(): string | null {
  return window.localStorage.getItem(AUTH_ACCOUNT_KEY);
}

function readStoredActiveSessionId(): string | null {
  return window.localStorage.getItem(ACTIVE_SESSION_KEY);
}

function readStoredDocumentId(): string | null {
  return window.localStorage.getItem(SELECTED_DOC_KEY);
}

function readSessionCitations(): Record<string, Citation[]> {
  try {
    const raw = window.localStorage.getItem(SESSION_CITATIONS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, Citation[]>) : {};
  } catch {
    return {};
  }
}

function saveSessionCitations(sessionId: string, citations: Citation[]): void {
  const current = readSessionCitations();
  current[sessionId] = citations;
  window.localStorage.setItem(SESSION_CITATIONS_KEY, JSON.stringify(current));
}

function getSessionCitations(sessionId: string | null): Citation[] {
  if (!sessionId) {
    return [];
  }
  return readSessionCitations()[sessionId] ?? [];
}

export default function App(): JSX.Element {
  const [language, setLanguage] = useState<AppLanguage>(() => readStoredLanguage());
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => readStoredTheme());
  const [authAccount, setAuthAccount] = useState<string | null>(() => readStoredAuthAccount());
  const copy = getCopy(language);

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(() => readStoredDocumentId());
  const [importing, setImporting] = useState<boolean>(false);
  const [importSummary, setImportSummary] = useState<string | null>(null);

  const [healthStatus, setHealthStatus] = useState<HealthStatus>("checking");

  const [sessions, setSessions] = useState<ChatSessionSummary[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(() => readStoredActiveSessionId());
  const [messages, setMessages] = useState<Message[]>([]);
  const [citations, setCitations] = useState<Citation[]>([]);
  const [chatInput, setChatInput] = useState<string>("");
  const [chatSending, setChatSending] = useState<boolean>(false);

  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [documentsPageOpen, setDocumentsPageOpen] = useState<boolean>(false);
  const [settingsLoading, setSettingsLoading] = useState<boolean>(false);
  const [runtimeSettings, setRuntimeSettings] = useState<RuntimeSettings | null>(null);

  const providerVendor = useMemo<ProviderVendor>(() => {
    if (!runtimeSettings) {
      return "mock";
    }
    return detectProviderVendor(runtimeSettings.apiBaseUrl, runtimeSettings.llmProvider);
  }, [runtimeSettings]);

  const selectedDocument = useMemo(() => {
    if (!selectedDocumentId) {
      return null;
    }
    return documents.find((item) => item.id === selectedDocumentId) ?? null;
  }, [documents, selectedDocumentId]);

  useEffect(() => {
    document.documentElement.dataset.theme = themeMode;
    window.localStorage.setItem(THEME_KEY, themeMode);
  }, [themeMode]);

  useEffect(() => {
    window.localStorage.setItem(LANGUAGE_KEY, language);
  }, [language]);

  useEffect(() => {
    if (authAccount) {
      window.localStorage.setItem(AUTH_ACCOUNT_KEY, authAccount);
    }
  }, [authAccount]);

  useEffect(() => {
    if (activeSessionId) {
      window.localStorage.setItem(ACTIVE_SESSION_KEY, activeSessionId);
    }
  }, [activeSessionId]);

  useEffect(() => {
    if (selectedDocumentId) {
      window.localStorage.setItem(SELECTED_DOC_KEY, selectedDocumentId);
    }
  }, [selectedDocumentId]);

  const healthStatusLabel = (status: HealthStatus): string => {
    switch (status) {
      case "online":
        return copy.backendOnline;
      case "offline":
        return copy.backendOffline;
      default:
        return copy.backendChecking;
    }
  };

  const refreshHealth = async (): Promise<void> => {
    setHealthStatus("checking");
    try {
      const payload = await getHealth();
      setHealthStatus(payload.status === "ok" ? "online" : "offline");
    } catch {
      setHealthStatus("offline");
    }
  };

  const refreshDocuments = async (): Promise<void> => {
    try {
      const items = await getDocuments();
      setDocuments(items);

      if (items.length === 0) {
        setSelectedDocumentId(null);
      } else if (!selectedDocumentId || !items.some((item) => item.id === selectedDocumentId)) {
        setSelectedDocumentId(items[0].id);
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unknown error";
      setImportSummary(`${copy.failedToLoadDocuments}: ${reason}`);
    }
  };

  const refreshSettings = async (): Promise<void> => {
    try {
      const settings = await getSettings();
      setRuntimeSettings(settings);
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unknown error";
      setImportSummary(`${copy.failedToLoadSettings}: ${reason}`);
    }
  };

  const loadSessionDetail = async (sessionId: string): Promise<void> => {
    const detail = await getChatSessionDetail(sessionId);
    setActiveSessionId(detail.id);
    setMessages(detail.messages);
    setCitations(getSessionCitations(detail.id));
  };

  const refreshSessions = async (preferredSessionId?: string | null): Promise<void> => {
    try {
      const items = await getChatSessions();
      setSessions(items);

      if (items.length === 0) {
        const created = await createChatSession();
        setSessions([{ id: created.id, title: created.title, createdAt: created.createdAt, updatedAt: created.updatedAt, messageCount: created.messageCount }]);
        setActiveSessionId(created.id);
        setMessages(created.messages);
        setCitations(getSessionCitations(created.id));
        return;
      }

      const targetSessionId =
        preferredSessionId && items.some((item) => item.id === preferredSessionId)
          ? preferredSessionId
          : activeSessionId && items.some((item) => item.id === activeSessionId)
            ? activeSessionId
            : items[0].id;

      await loadSessionDetail(targetSessionId);
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unknown error";
      setImportSummary(`${copy.failedToLoadSessions}: ${reason}`);
    }
  };

  const handleImport = async (): Promise<void> => {
    if (!window.desktopAPI?.selectFiles) {
      setImportSummary(copy.desktopPickerUnavailable);
      return;
    }

    const filePaths = await window.desktopAPI.selectFiles();
    if (filePaths.length === 0) {
      return;
    }

    setImporting(true);
    setImportSummary(null);

    try {
      const result = await importDocuments({ filePaths });
      const failureMessages = result.results
        .filter((item) => item.status === "failed")
        .slice(0, 2)
        .map((item) => `${item.fileName}: ${item.errorMessage ?? "Unknown error"}`);
      const failureHint = failureMessages.length > 0 ? ` | ${failureMessages.join(" ; ")}` : "";

      setImportSummary(`${copy.importSummaryIndexed}: ${result.successCount} | ${copy.importSummaryFailed}: ${result.failedCount}${failureHint}`);
      await refreshDocuments();
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unknown error";
      setImportSummary(`${copy.importFailed}: ${reason}`);
    } finally {
      setImporting(false);
    }
  };

  const handleDeleteDocument = async (documentId: string): Promise<void> => {
    try {
      await deleteDocument(documentId);
      setImportSummary(copy.docDeleted);
      await refreshDocuments();
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unknown error";
      setImportSummary(`${copy.failedToDeleteDocument}: ${reason}`);
    }
  };

  const handleCreateSession = async (): Promise<void> => {
    try {
      const created = await createChatSession();
      await refreshSessions(created.id);
      setChatInput("");
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unknown error";
      setImportSummary(`${copy.failedToLoadSessions}: ${reason}`);
    }
  };

  const handleDeleteSession = async (sessionId: string): Promise<void> => {
    try {
      await deleteChatSession(sessionId);
      const citationsMap = readSessionCitations();
      delete citationsMap[sessionId];
      window.localStorage.setItem(SESSION_CITATIONS_KEY, JSON.stringify(citationsMap));
      const remaining = sessions.filter((item) => item.id !== sessionId);
      if (remaining.length === 0) {
        const created = await createChatSession();
        await refreshSessions(created.id);
      } else {
        await refreshSessions(activeSessionId === sessionId ? remaining[0].id : activeSessionId);
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unknown error";
      setImportSummary(`${copy.failedToDeleteSession}: ${reason}`);
    }
  };

  const handleSendQuestion = async (): Promise<void> => {
    const question = chatInput.trim();
    if (!question) {
      return;
    }

    setMessages((current) => [...current, createMessage("user", question)]);
    setChatInput("");
    setChatSending(true);

    try {
      const result = await askQuestion({ question, topK: runtimeSettings?.topK, sessionId: activeSessionId ?? undefined });
      saveSessionCitations(result.sessionId, result.citations);
      await refreshSessions(result.sessionId);
      setCitations(result.citations);
      if (result.citations.length > 0) {
        setSelectedDocumentId(result.citations[0].documentId);
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unknown error";
      setMessages((current) => [...current, createMessage("assistant", `${copy.chatFailed}: ${reason}`)]);
    } finally {
      setChatSending(false);
    }
  };

  const handleSaveSettings = async (
    vendor: ProviderVendor,
    apiKey: string,
    apiBaseUrl: string,
    modelName: string
  ): Promise<void> => {
    const config = providerConfigs[vendor];
    setSettingsLoading(true);
    try {
      const saved = await updateSettings({
        apiBaseUrl,
        apiKey,
        modelName,
        embeddingModelName: config.embeddingModelName,
        llmProvider: config.llmProvider,
        embeddingProvider: config.embeddingProvider
      });
      await reindexDocuments();
      await refreshDocuments();
      setRuntimeSettings(saved);
      setSettingsOpen(false);
      setImportSummary(copy.settingsSaved);
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unknown error";
      setImportSummary(`${copy.failedToSaveSettings}: ${reason}`);
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleTestConnection = async (
    vendor: ProviderVendor,
    apiKey: string,
    apiBaseUrl: string
  ): Promise<{ success: boolean; message: string }> => {
    const config = providerConfigs[vendor];
    const result = await testConnection({
      apiBaseUrl,
      apiKey,
      modelName: config.modelName,
      embeddingModelName: config.embeddingModelName,
      llmProvider: config.llmProvider,
      embeddingProvider: config.embeddingProvider
    });

    return {
      success: result.success,
      message: result.success ? `${copy.connectionSuccess}: ${result.message}` : `${copy.connectionFailed}: ${result.message}`
    };
  };

  const handleFetchModels = async (vendor: ProviderVendor, apiKey: string, apiBaseUrl: string): Promise<string[]> => {
    const config = providerConfigs[vendor];
    const result = await fetchModels({
      apiBaseUrl,
      apiKey,
      llmProvider: config.llmProvider
    });
    return result.models;
  };

  useEffect(() => {
    if (!authAccount) {
      return;
    }
    void refreshHealth();
    void refreshDocuments();
    void refreshSettings();
    void refreshSessions(readStoredActiveSessionId());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authAccount]);

  if (!authAccount) {
    return (
      <LoginPage
        copy={copy}
        language={language}
        themeMode={themeMode}
        onToggleLanguage={() => setLanguage(language === "zh-CN" ? "en-US" : "zh-CN")}
        onToggleTheme={() => setThemeMode(themeMode === "light" ? "dark" : "light")}
        onLogin={(account) => setAuthAccount(account)}
      />
    );
  }

  return (
    <main className="layout-root app-android-shell">
      <header className="topbar topbar-android">
        <div className="topbar-title-group">
          <span className="topbar-eyebrow">PKB Assistant</span>
          <h1>{copy.appTitle}</h1>
          <span className="topbar-subtitle">{copy.appSubtitle}</span>
        </div>
        <div className="health-box">
          <span className={`health-tag ${healthStatus}`}>{healthStatusLabel(healthStatus)}</span>
          <div className="toolbar-strip" role="toolbar" aria-label="App toolbar">
            <ToolbarButton title={copy.toolbarRetry} onClick={() => void refreshHealth()}>
              <RefreshIcon />
            </ToolbarButton>
            <ToolbarButton
              title={`${copy.toolbarTheme}: ${themeMode === "light" ? copy.darkMode : copy.lightMode}`}
              onClick={() => setThemeMode(themeMode === "light" ? "dark" : "light")}
            >
              <ThemeIcon />
            </ToolbarButton>
            <ToolbarButton
              title={`${copy.toolbarLanguage}: ${language === "zh-CN" ? copy.languageEnglish : copy.languageChinese}`}
              onClick={() => setLanguage(language === "zh-CN" ? "en-US" : "zh-CN")}
            >
              <LanguageIcon />
            </ToolbarButton>
            <ToolbarButton title={copy.toolbarModelConfig} onClick={() => setSettingsOpen(true)}>
              <SettingsIcon />
            </ToolbarButton>
          </div>
        </div>
      </header>
      <section className="workspace workspace-android">
        <KnowledgePanel
          sessions={sessions}
          activeSessionId={activeSessionId}
          onCreateSession={handleCreateSession}
          onSelectSession={loadSessionDetail}
          onDeleteSession={handleDeleteSession}
          documents={documents}
          onOpenDocuments={() => setDocumentsPageOpen(true)}
          importing={importing}
          importSummary={importSummary}
          copy={copy}
        />
        <ChatPanel
          messages={messages}
          inputValue={chatInput}
          onInputChange={setChatInput}
          onSend={handleSendQuestion}
          sending={chatSending}
          copy={copy}
        />
        <CitationPanel citations={citations} selectedDocument={selectedDocument?.name ?? "-"} copy={copy} />
      </section>
      <SettingsPage
        open={settingsOpen}
        loading={settingsLoading}
        settings={runtimeSettings}
        onClose={() => setSettingsOpen(false)}
        onSave={handleSaveSettings}
        onTestConnection={handleTestConnection}
        onFetchModels={handleFetchModels}
        copy={copy}
        providerVendor={providerVendor}
      />
      <DocumentsPage
        open={documentsPageOpen}
        documents={documents}
        selectedId={selectedDocumentId}
        importing={importing}
        onClose={() => setDocumentsPageOpen(false)}
        onImport={handleImport}
        onSelect={setSelectedDocumentId}
        onDeleteDocument={handleDeleteDocument}
        copy={copy}
      />
    </main>
  );
}
