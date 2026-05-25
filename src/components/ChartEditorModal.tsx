import { useEffect, useRef, useState } from 'react'
import {
  DEFAULT_CHART_ATTRS,
  chartAttrsToForm,
  type ChartBlockAttrs,
  type ChartType,
} from '../extensions/ChartBlock'
import { AiGenerateForm } from './AiGenerateForm'
import { ModalInsertTabs, type InsertModalTab } from './ModalInsertTabs'
import { useDocumentAiSuggestions } from '../hooks/useDocumentAiSuggestions'
import type { Reference } from '../types/reference'

interface ChartEditorModalProps {
  isOpen: boolean
  mode: 'insert' | 'edit'
  initialAttrs?: ChartBlockAttrs | null
  initialTab?: InsertModalTab
  documentContext?: string
  activeRefs?: Reference[]
  aiLoading?: boolean
  aiError?: string | null
  onClose: () => void
  onSave: (attrs: ChartBlockAttrs) => void
  onAiGenerate?: (instruction: string) => void
}

const CHART_TYPES: { id: ChartType; label: string }[] = [
  { id: 'bar', label: 'Barre' },
  { id: 'line', label: 'Linee' },
  { id: 'pie', label: 'Torta' },
]

function parseList(value: string): string[] {
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

function parseNumbers(value: string): number[] {
  return parseList(value)
    .map((s) => Number(s))
    .filter((n) => !Number.isNaN(n))
}

export function ChartEditorModal({
  isOpen,
  mode,
  initialAttrs,
  initialTab = 'manual',
  documentContext = '',
  activeRefs = [],
  aiLoading = false,
  aiError = null,
  onClose,
  onSave,
  onAiGenerate,
}: ChartEditorModalProps) {
  const [tab, setTab] = useState<InsertModalTab>('manual')
  const showAiTab = Boolean(onAiGenerate)
  const aiSubmitLabel =
    mode === 'edit' ? 'Rigenera grafico' : 'Genera grafico'
  const { suggestions: chartSuggestions, loading: suggestionsLoading } =
    useDocumentAiSuggestions(
      'chart',
      documentContext,
      isOpen && tab === 'ai' && showAiTab,
      activeRefs,
    )
  const [chartType, setChartType] = useState<ChartType>('bar')
  const [title, setTitle] = useState(DEFAULT_CHART_ATTRS.title)
  const [labelsText, setLabelsText] = useState('Gen, Feb, Mar, Apr, Mag')
  const [dataText, setDataText] = useState('12, 19, 8, 15, 22')
  const [error, setError] = useState<string | null>(null)
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isOpen) return

    const form = chartAttrsToForm(initialAttrs ?? DEFAULT_CHART_ATTRS)
    setChartType(form.chartType)
    setTitle(form.title)
    setLabelsText(form.labelsText)
    setDataText(form.dataText)
    setError(null)
    setTab(mode === 'insert' ? initialTab : 'manual')
    setTimeout(() => titleRef.current?.focus(), 50)
  }, [isOpen, initialAttrs, initialTab, mode])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const labels = parseList(labelsText)
    const data = parseNumbers(dataText)

    if (labels.length === 0) {
      setError('Inserisci almeno un\'etichetta.')
      return
    }
    if (data.length === 0) {
      setError('Inserisci almeno un valore numerico.')
      return
    }
    if (labels.length !== data.length) {
      setError('Etichette e valori devono avere lo stesso numero di elementi.')
      return
    }

    onSave({
      chartType,
      title: title.trim() || 'Grafico',
      labels: JSON.stringify(labels),
      data: JSON.stringify(data),
    })
    onClose()
  }

  const handleClose = () => {
    if (aiLoading) return
    onClose()
  }

  const heading = mode === 'edit' ? 'Modifica grafico' : 'Inserisci grafico'
  const submitLabel = mode === 'edit' ? 'Salva modifiche' : 'Inserisci grafico'

  return (
    <div className="modal-overlay" onClick={handleClose} role="presentation">
      <div
        className="modal"
        role="dialog"
        aria-labelledby="chart-modal-title"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="chart-modal-title">{heading}</h2>

        {showAiTab && (
          <ModalInsertTabs activeTab={tab} onChange={setTab} aiDisabled={aiLoading} />
        )}

        {showAiTab && tab === 'ai' ? (
          <AiGenerateForm
            kind="chart"
            isLoading={aiLoading}
            error={aiError}
            documentContext={documentContext}
            examples={chartSuggestions}
            examplesLoading={suggestionsLoading}
            onSubmit={(instruction) => onAiGenerate?.(instruction)}
            onCancel={handleClose}
            submitLabel={aiSubmitLabel}
          />
        ) : (
          <form onSubmit={handleSubmit}>
            <label htmlFor="chart-type" className="modal-label">
              Tipo
            </label>
            <select
              id="chart-type"
              className="modal-input"
              value={chartType}
              onChange={(e) => setChartType(e.target.value as ChartType)}
            >
              {CHART_TYPES.map(({ id, label }) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>

            <label htmlFor="chart-title" className="modal-label">
              Titolo
            </label>
            <input
              id="chart-title"
              ref={titleRef}
              type="text"
              className="modal-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <label htmlFor="chart-labels" className="modal-label">
              Etichette (separate da virgola)
            </label>
            <input
              id="chart-labels"
              type="text"
              className="modal-input"
              value={labelsText}
              onChange={(e) => setLabelsText(e.target.value)}
            />

            <label htmlFor="chart-data" className="modal-label">
              Valori (separati da virgola)
            </label>
            <input
              id="chart-data"
              type="text"
              className="modal-input"
              value={dataText}
              onChange={(e) => setDataText(e.target.value)}
            />

            {error && <p className="modal-error">{error}</p>}

            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={handleClose}>
                Annulla
              </button>
              <button type="submit" className="btn-primary">
                {submitLabel}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
