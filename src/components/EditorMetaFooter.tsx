import { useEffect, useState } from 'react'
import type { AutosaveStatus } from '../hooks/useAutosave'
import type { DocumentMeta } from '../hooks/useLocalStorage'
import {
  formatDocumentTimestamp,
  formatRelativeSavedTime,
} from '../utils/formatDocumentMeta'

interface EditorMetaFooterProps {
  autosaveStatus: AutosaveStatus
  lastSavedAt: Date | null
  documentMeta: DocumentMeta
}

export function EditorMetaFooter({
  autosaveStatus,
  lastSavedAt,
  documentMeta,
}: EditorMetaFooterProps) {
  const [relativeSavedLabel, setRelativeSavedLabel] = useState(() =>
    getLastSavedLabel(autosaveStatus, lastSavedAt),
  )

  useEffect(() => {
    setRelativeSavedLabel(getLastSavedLabel(autosaveStatus, lastSavedAt))

    if (autosaveStatus !== 'saved' || !lastSavedAt) return

    const interval = window.setInterval(() => {
      setRelativeSavedLabel(getLastSavedLabel(autosaveStatus, lastSavedAt))
    }, 30000)

    return () => window.clearInterval(interval)
  }, [autosaveStatus, lastSavedAt])

  const createdAt = new Date(documentMeta.createdAt)
  const updatedAt = new Date(documentMeta.updatedAt)

  return (
    <div className="editor-meta-footer">
      <div className="editor-meta-item" role="status" aria-live="polite">
        <span className="editor-meta-label">Ultimo salvataggio</span>
        <span className="editor-meta-value">{relativeSavedLabel}</span>
      </div>

      <div className="editor-meta-item">
        <span className="editor-meta-label">Ultima modifica:</span>
        <strong className="editor-meta-value">
          {formatDocumentTimestamp(updatedAt)}
        </strong>
      </div>

      <div className="editor-meta-item">
        <span className="editor-meta-label">Creato:</span>
        <strong className="editor-meta-value">
          {formatDocumentTimestamp(createdAt)}
        </strong>
      </div>
    </div>
  )
}

function getLastSavedLabel(
  status: AutosaveStatus,
  lastSavedAt: Date | null,
): string {
  if (status === 'saving') return 'salvataggio in corso…'
  if (status === 'error') return 'errore salvataggio'
  if (!lastSavedAt) return 'non ancora salvato'
  return formatRelativeSavedTime(lastSavedAt)
}
