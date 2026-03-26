import { useState } from "react";

import type { CopyBundle } from "../i18n";
import type { ChatSessionSummary, DocumentItem } from "../types/dto";

interface KnowledgePanelProps {
  sessions: ChatSessionSummary[];
  activeSessionId: string | null;
  onCreateSession: () => Promise<void>;
  onSelectSession: (id: string) => Promise<void>;
  onDeleteSession: (id: string) => Promise<void>;
  documents: DocumentItem[];
  onOpenDocuments: () => void;
  importing: boolean;
  importSummary: string | null;
  copy: CopyBundle;
}

export default function KnowledgePanel(props: KnowledgePanelProps): JSX.Element {
  const {
    sessions,
    activeSessionId,
    onCreateSession,
    onSelectSession,
    onDeleteSession,
    documents,
    onOpenDocuments,
    importing,
    importSummary,
    copy
  } = props;

  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);

  const handleDeleteSession = async (id: string): Promise<void> => {
    setDeletingSessionId(id);
    try {
      await onDeleteSession(id);
    } finally {
      setDeletingSessionId(null);
    }
  };

  return (
    <aside className="panel panel-left knowledge-layout">
      <div className="sidebar-scroll">
        <section className="sidebar-section">
          <div className="sidebar-section-head">
            <h2>{copy.chatHistory}</h2>
            <button className="primary-btn compact-btn" type="button" onClick={() => void onCreateSession()}>
              {copy.newChat}
            </button>
          </div>
          <div className="session-list">
            {sessions.length === 0 ? (
              <div className="doc-empty">{copy.noChatSessions}</div>
            ) : (
              sessions.map((session) => (
                <div key={session.id} className={`session-card ${session.id === activeSessionId ? "active" : ""}`}>
                  <button className="session-main" type="button" onClick={() => void onSelectSession(session.id)}>
                    <span className="session-title">{session.title}</span>
                    <span className="session-meta">{new Date(session.updatedAt).toLocaleString()}</span>
                  </button>
                  <button
                    className="icon-inline-btn"
                    type="button"
                    title={copy.deleteChat}
                    aria-label={copy.deleteChat}
                    onClick={() => void handleDeleteSession(session.id)}
                    disabled={deletingSessionId === session.id}
                  >
                    {deletingSessionId === session.id ? "..." : "×"}
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="sidebar-section docs-entry-section">
          <div className="sidebar-section-head">
            <h2>{copy.knowledgeDocs}</h2>
            <button className="ghost-btn compact-btn" type="button" onClick={onOpenDocuments}>
              {copy.openDocsLibrary}
            </button>
          </div>
          <div className="docs-entry-card">
            <span className="docs-entry-count">{documents.length}</span>
            <span className="docs-entry-label">{copy.knowledgeDocs}</span>
            <span className="docs-entry-subtitle">{importing ? copy.importing : copy.documentsPageSubtitle}</span>
          </div>
          {importSummary ? <p className="panel-note inline-note">{importSummary}</p> : null}
        </section>
      </div>
    </aside>
  );
}
