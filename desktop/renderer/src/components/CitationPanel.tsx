import { useEffect, useMemo, useState } from "react";

import type { CopyBundle } from "../i18n";
import type { Citation } from "../types/dto";

interface CitationPanelProps {
  citations: Citation[];
  selectedDocument: string;
  copy: CopyBundle;
}

interface CitationGroup {
  documentId: string;
  documentName: string;
  topScore: number;
  items: Citation[];
}

export default function CitationPanel(props: CitationPanelProps): JSX.Element {
  const { citations, selectedDocument, copy } = props;
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);

  const groupedCitations = useMemo<CitationGroup[]>(() => {
    const groups = new Map<string, CitationGroup>();
    for (const item of citations) {
      const existing = groups.get(item.documentId);
      if (!existing) {
        groups.set(item.documentId, {
          documentId: item.documentId,
          documentName: item.documentName,
          topScore: item.score,
          items: [item]
        });
      } else {
        existing.items.push(item);
        existing.topScore = Math.max(existing.topScore, item.score);
      }
    }
    return Array.from(groups.values()).sort((left, right) => right.topScore - left.topScore);
  }, [citations]);

  useEffect(() => {
    if (groupedCitations.length === 0) {
      setActiveDocumentId(null);
      return;
    }

    if (!activeDocumentId || !groupedCitations.some((item) => item.documentId === activeDocumentId)) {
      setActiveDocumentId(groupedCitations[0].documentId);
    }
  }, [activeDocumentId, groupedCitations]);

  const activeGroup = groupedCitations.find((item) => item.documentId === activeDocumentId) ?? null;

  return (
    <aside className="panel panel-right">
      <div className="panel-head panel-head-android">
        <h2>{copy.citations}</h2>
      </div>
      <p className="citation-summary">
        {copy.selectedDoc}: {selectedDocument}
      </p>
      <div className="citation-browser">
        <div className="citation-doc-groups">
          {groupedCitations.length === 0 ? (
            <div className="citation-empty">{copy.noCitations}</div>
          ) : (
            groupedCitations.map((group) => (
              <button
                key={group.documentId}
                type="button"
                className={`citation-doc-card ${group.documentId === activeDocumentId ? "active" : ""}`}
                onClick={() => setActiveDocumentId(group.documentId)}
              >
                <div className="citation-doc-card-head">
                  <span className="citation-doc">{group.documentName}</span>
                  <span className="citation-score">{group.topScore.toFixed(3)}</span>
                </div>
                <div className="citation-doc-card-meta">
                  <span>{copy.matchedSnippets}: {group.items.length}</span>
                  <span>{copy.openCitationDetail}</span>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="citation-detail-pane">
          {!activeGroup ? (
            <div className="citation-empty">{copy.noCitations}</div>
          ) : (
            <>
              <div className="citation-detail-head">
                <span className="citation-doc">{activeGroup.documentName}</span>
                <span className="citation-detail-meta">{copy.matchedSnippets}: {activeGroup.items.length}</span>
              </div>
              <div className="citation-snippet-list">
                {activeGroup.items.map((item) => (
                  <article key={item.id} className="citation-snippet-card">
                    <div className="citation-head">
                      <span className="citation-submeta">{copy.citationChunk} #{item.chunkIndex}</span>
                      <span className="citation-score">{copy.citationScore} {item.score.toFixed(3)}</span>
                    </div>
                    <p>{item.content}</p>
                  </article>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
