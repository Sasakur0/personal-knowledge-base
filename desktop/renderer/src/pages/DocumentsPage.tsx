import { useMemo, useState } from "react";

import type { CopyBundle } from "../i18n";
import type { DocumentItem, DocumentStatus } from "../types/dto";

interface DocumentsPageProps {
  open: boolean;
  documents: DocumentItem[];
  selectedId: string | null;
  importing: boolean;
  onClose: () => void;
  onImport: () => Promise<void>;
  onSelect: (id: string) => void;
  onDeleteDocument: (id: string) => Promise<void>;
  copy: CopyBundle;
}

export default function DocumentsPage(props: DocumentsPageProps): JSX.Element | null {
  const { open, documents, selectedId, importing, onClose, onImport, onSelect, onDeleteDocument, copy } = props;
  const [query, setQuery] = useState<string>("");
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);

  const statusLabel: Record<DocumentStatus, string> = {
    imported: copy.imported,
    processing: copy.processing,
    indexed: copy.indexed,
    failed: copy.failed
  };

  const filteredDocuments = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return documents;
    }
    return documents.filter((doc) => doc.name.toLowerCase().includes(normalized));
  }, [documents, query]);

  if (!open) {
    return null;
  }

  const handleDeleteDocument = async (documentId: string): Promise<void> => {
    setDeletingDocId(documentId);
    try {
      await onDeleteDocument(documentId);
    } finally {
      setDeletingDocId(null);
    }
  };

  return (
    <div className="settings-overlay" role="dialog" aria-modal="true">
      <div className="documents-panel">
        <div className="settings-head">
          <div className="documents-head-copy">
            <h3>{copy.documentsPageTitle}</h3>
            <p>{copy.documentsPageSubtitle}</p>
          </div>
          <button className="ghost-btn" type="button" onClick={onClose}>
            {copy.close}
          </button>
        </div>
        <div className="documents-toolbar">
          <input
            className="doc-search-input"
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={copy.searchDocs}
          />
          <button className="primary-btn" type="button" onClick={() => void onImport()} disabled={importing}>
            {importing ? copy.importing : copy.importFiles}
          </button>
        </div>
        <div className="documents-grid">
          {filteredDocuments.length === 0 ? (
            <div className="doc-empty">{query.trim() ? copy.noSearchResults : copy.noDocuments}</div>
          ) : (
            filteredDocuments.map((doc) => (
              <article key={doc.id} className={`document-card ${doc.id === selectedId ? "active" : ""}`}>
                <button className="document-card-main" type="button" onClick={() => onSelect(doc.id)}>
                  <div className="document-card-head">
                    <div className="document-card-title-wrap">
                      <span className="document-card-title">{doc.name}</span>
                      <span className="doc-ext">{doc.extension.toUpperCase().replace(".", "")}</span>
                    </div>
                    <span className={`status-tag ${doc.status}`}>{statusLabel[doc.status]}</span>
                  </div>
                  <div className="document-card-metrics">
                    <span>{copy.chunksLabel}: {doc.chunkCount}</span>
                    <span>{copy.lastUpdated}: {new Date(doc.updatedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="document-card-path">{doc.filePath}</div>
                  {doc.errorMessage ? <div className="doc-error">{doc.errorMessage}</div> : null}
                </button>
                <div className="document-card-actions">
                  <button
                    className="ghost-btn compact-btn"
                    type="button"
                    onClick={() => void handleDeleteDocument(doc.id)}
                    disabled={deletingDocId === doc.id}
                  >
                    {deletingDocId === doc.id ? copy.deleting : copy.delete}
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
