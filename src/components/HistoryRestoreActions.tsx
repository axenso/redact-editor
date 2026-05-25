import { Sparkles } from 'lucide-react'
import type { AutosaveStatus } from '../hooks/useAutosave'
import { AppIcon } from './LucideIcon'

interface HistoryRestoreActionsProps {
  showRestoreLinks: boolean
  canRestoreOriginal: boolean
  canRestoreLatest: boolean
  onRestoreOriginal: () => void
  onRestoreLatest: () => void
  autosaveStatus: AutosaveStatus
  showAiButton?: boolean
  hasTextSelection?: boolean
  onAiClick?: () => void
}

export function HistoryRestoreActions({
  showRestoreLinks,
  canRestoreOriginal,
  canRestoreLatest,
  onRestoreOriginal,
  onRestoreLatest,
  autosaveStatus,
  showAiButton = false,
  hasTextSelection = false,
  onAiClick,
}: HistoryRestoreActionsProps) {
  const isChanged =
    autosaveStatus === 'saving' ||
    autosaveStatus === 'error' ||
    canRestoreOriginal ||
    canRestoreLatest

  return (
    <div className="history-restore-actions editor-meta-bar">
      <div className="editor-meta-item">
        <span className="editor-meta-label">Stato:</span>
        <strong className="editor-meta-value">
          {isChanged ? 'Modificato' : 'Salvato'}
        </strong>
        {showRestoreLinks && canRestoreOriginal && (
          <>
            <span className="editor-meta-sep" aria-hidden="true">
              —
            </span>
            <button
              type="button"
              className="editor-meta-link"
              onClick={onRestoreOriginal}
              title="Ripristina il documento prima della prima query AI"
            >
              Ripristina originale
            </button>
          </>
        )}
        {showRestoreLinks && canRestoreLatest && (
          <>
            <span className="editor-meta-sep" aria-hidden="true">
              —
            </span>
            <button
              type="button"
              className="editor-meta-link"
              onClick={onRestoreLatest}
              title="Mostra il risultato dell'ultima query AI"
            >
              Ultima versione
            </button>
          </>
        )}
      </div>

      <div className="editor-meta-bar-actions">
        {showAiButton && hasTextSelection && onAiClick && (
          <button
            type="button"
            className="toolbar-ai-toggle active btn-with-icon"
            title="Modifica con AI"
            onMouseDown={(event) => event.preventDefault()}
            onClick={onAiClick}
          >
            <AppIcon icon={Sparkles} size="sm" />
            Modifica con AI
          </button>
        )}
      </div>
    </div>
  )
}
