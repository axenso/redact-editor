import { CornerUpLeft, GripVertical, Sparkles } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  formatHistoryTime,
  historyTypeLabel,
  truncateText,
} from '../hooks/useEditHistory'
import {
  loadHistorySidebarWidth,
  MAX_HISTORY_SIDEBAR_WIDTH,
  MIN_HISTORY_SIDEBAR_WIDTH,
  saveHistorySidebarWidth,
} from '../hooks/useLocalStorage'
import type { EditHistoryEntry } from '../types/editHistory'
import { AppIcon } from './LucideIcon'

interface HistorySidebarProps {
  entries: EditHistoryEntry[]
  activeId: string | null
  saveError?: string | null
  correctionsEntryId: string | null
  onRestore: (entry: EditHistoryEntry) => void
  onRestorePrevious: (entry: EditHistoryEntry) => void
  onToggleCorrections: (entry: EditHistoryEntry) => void
  onClear: () => void
}

export function HistorySidebar({
  entries,
  activeId,
  saveError = null,
  correctionsEntryId,
  onRestore,
  onRestorePrevious,
  onToggleCorrections,
  onClear,
}: HistorySidebarProps) {
  const [sidebarWidth, setSidebarWidth] = useState(loadHistorySidebarWidth)
  const sidebarWidthRef = useRef(sidebarWidth)
  sidebarWidthRef.current = sidebarWidth

  const clampSidebarWidth = useCallback((width: number) => {
    return Math.min(
      MAX_HISTORY_SIDEBAR_WIDTH,
      Math.max(MIN_HISTORY_SIDEBAR_WIDTH, width),
    )
  }, [])

  useEffect(() => {
    document.documentElement.style.setProperty(
      '--history-sidebar-width',
      `${sidebarWidth}px`,
    )
  }, [sidebarWidth])

  const handleResizeStart = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      event.preventDefault()
      event.currentTarget.setPointerCapture(event.pointerId)

      const startX = event.clientX
      const startWidth = sidebarWidthRef.current

      document.body.classList.add('history-sidebar-resizing')

      const handlePointerMove = (moveEvent: PointerEvent) => {
        const nextWidth = clampSidebarWidth(
          startWidth + (startX - moveEvent.clientX),
        )
        setSidebarWidth(nextWidth)
      }

      const handlePointerUp = (upEvent: PointerEvent) => {
        document.body.classList.remove('history-sidebar-resizing')
        event.currentTarget.releasePointerCapture(upEvent.pointerId)
        event.currentTarget.removeEventListener('pointermove', handlePointerMove)
        event.currentTarget.removeEventListener('pointerup', handlePointerUp)
        event.currentTarget.removeEventListener('pointercancel', handlePointerUp)
        saveHistorySidebarWidth(sidebarWidthRef.current)
      }

      event.currentTarget.addEventListener('pointermove', handlePointerMove)
      event.currentTarget.addEventListener('pointerup', handlePointerUp)
      event.currentTarget.addEventListener('pointercancel', handlePointerUp)
    },
    [clampSidebarWidth],
  )

  return (
    <aside
      className="history-sidebar"
      aria-label="Cronologia query AI"
      style={{ width: sidebarWidth }}
    >
      <div
        className="resize-handle resize-handle--vertical history-sidebar-resize-handle"
        role="separator"
        aria-orientation="vertical"
        aria-label="Ridimensiona pannello cronologia"
        tabIndex={0}
        onPointerDown={handleResizeStart}
      >
        <span className="resize-handle-grip" aria-hidden>
          <AppIcon icon={GripVertical} size="xs" />
        </span>
      </div>
      <div className="history-sidebar-header">
        <h2 className="history-sidebar-title">Query AI</h2>
        {entries.length > 0 && (
          <button
            type="button"
            className="history-clear-btn"
            title="Svuota cronologia AI"
            onClick={onClear}
          >
            Svuota
          </button>
        )}
      </div>

      {saveError && (
        <p className="history-save-error" role="alert">
          {saveError}
        </p>
      )}

      <div className="history-sidebar-body">
        {entries.length === 0 ? (
          <p className="history-empty">
            Le query inviate a Modifica con AI vengono salvate qui. Clicca una voce
            per ripristinare il documento a quel punto.
          </p>
        ) : (
          <ul className="history-list">
            {entries.map((entry, index) => {
              const isActive = entry.id === activeId
              const isShowingCorrections = entry.id === correctionsEntryId
              const canRestorePrevious = Boolean(entry.contentHtmlBefore)
              const hasCorrections =
                Boolean(entry.selectionBefore) &&
                Boolean(entry.selectionAfter) &&
                entry.selectionBefore !== entry.selectionAfter

              return (
                <li key={entry.id}>
                  <div
                    className={
                      isActive ? 'history-item history-item-active' : 'history-item'
                    }
                  >
                    <button
                      type="button"
                      className="history-item-main"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => onRestore(entry)}
                    >
                      <span
                        className="history-icon history-icon-ai"
                        title={historyTypeLabel(entry.type)}
                      >
                        <AppIcon icon={Sparkles} size="sm" />
                      </span>
                      <span className="history-item-body">
                        <span className="history-item-meta">
                          <span className="history-item-type">
                            {historyTypeLabel(entry.type)} · #{entries.length - index}
                          </span>
                          <time
                            className="history-item-time"
                            dateTime={new Date(entry.timestamp).toISOString()}
                          >
                            {formatHistoryTime(entry.timestamp)}
                          </time>
                        </span>
                        <span className="history-item-summary">
                          {entry.instruction
                            ? truncateText(entry.instruction, 72)
                            : entry.summary}
                        </span>
                      </span>
                    </button>

                    <div className="history-item-actions">
                      {hasCorrections && (
                        <button
                          type="button"
                          className={
                            isShowingCorrections
                              ? 'history-corrections-btn active'
                              : 'history-corrections-btn'
                          }
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => onToggleCorrections(entry)}
                        >
                          {isShowingCorrections
                            ? 'Nascondi correzioni'
                            : 'Mostra correzioni'}
                        </button>
                      )}
                      {canRestorePrevious && (
                        <button
                          type="button"
                          className="history-restore-prev-btn btn-with-icon"
                          title="Ripristina il documento prima di questa query"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => onRestorePrevious(entry)}
                        >
                          <AppIcon icon={CornerUpLeft} size="xs" />
                          Precedente
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </aside>
  )
}
