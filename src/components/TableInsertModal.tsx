import { useEffect, useRef, useState } from 'react'
import { ModalInsertTabs, type InsertModalTab } from './ModalInsertTabs'
import { AiGenerateForm } from './AiGenerateForm'
import { useDocumentAiSuggestions } from '../hooks/useDocumentAiSuggestions'

interface TableInsertModalProps {
  isOpen: boolean
  initialTab?: InsertModalTab
  documentContext?: string
  aiLoading: boolean
  aiError: string | null
  onClose: () => void
  onInsertManual: (rows: number, cols: number) => void
  onAiGenerate: (instruction: string) => void
}

export function TableInsertModal({
  isOpen,
  initialTab = 'manual',
  documentContext = '',
  aiLoading,
  aiError,
  onClose,
  onInsertManual,
  onAiGenerate,
}: TableInsertModalProps) {
  const [tab, setTab] = useState<InsertModalTab>('manual')
  const { suggestions: tableSuggestions, loading: suggestionsLoading } =
    useDocumentAiSuggestions(
      'table',
      documentContext,
      isOpen && tab === 'ai',
    )
  const [rows, setRows] = useState(3)
  const [cols, setCols] = useState(3)
  const [error, setError] = useState<string | null>(null)
  const rowsRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isOpen) return
    setTab(initialTab)
    setRows(3)
    setCols(3)
    setError(null)
    setTimeout(() => rowsRef.current?.focus(), 50)
  }, [isOpen, initialTab])

  if (!isOpen) return null

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (rows < 1 || rows > 20 || cols < 1 || cols > 10) {
      setError('Usa tra 1 e 20 righe e tra 1 e 10 colonne.')
      return
    }
    onInsertManual(rows, cols)
    onClose()
  }

  const handleClose = () => {
    if (aiLoading) return
    onClose()
  }

  return (
    <div
      className="modal-overlay"
      onClick={handleClose}
      role="presentation"
    >
      <div
        className="modal"
        role="dialog"
        aria-labelledby="table-insert-title"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="table-insert-title">Inserisci tabella</h2>

        <ModalInsertTabs activeTab={tab} onChange={setTab} aiDisabled={aiLoading} />

        {tab === 'manual' ? (
          <form onSubmit={handleManualSubmit}>
            <label htmlFor="table-rows" className="modal-label">
              Righe (inclusa intestazione)
            </label>
            <input
              id="table-rows"
              ref={rowsRef}
              type="number"
              min={1}
              max={20}
              className="modal-input"
              value={rows}
              onChange={(e) => setRows(Number(e.target.value))}
            />

            <label htmlFor="table-cols" className="modal-label">
              Colonne
            </label>
            <input
              id="table-cols"
              type="number"
              min={1}
              max={10}
              className="modal-input"
              value={cols}
              onChange={(e) => setCols(Number(e.target.value))}
            />

            {error && <p className="modal-error">{error}</p>}

            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={handleClose}>
                Annulla
              </button>
              <button type="submit" className="btn-primary">
                Inserisci tabella
              </button>
            </div>
          </form>
        ) : (
          <AiGenerateForm
            kind="table"
            isLoading={aiLoading}
            error={aiError}
            documentContext={documentContext}
            examples={tableSuggestions}
            examplesLoading={suggestionsLoading}
            onSubmit={onAiGenerate}
            onCancel={handleClose}
            submitLabel="Genera tabella"
          />
        )}
      </div>
    </div>
  )
}
