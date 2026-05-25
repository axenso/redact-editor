import { useState } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import type { Reference, ReferenceType } from '../types/reference'
import {
  REFERENCE_TYPE_LABELS,
  REFERENCE_TYPES,
} from '../types/reference'
import { REFERENCE_TOKEN_LIMIT } from '../utils/buildPrompt'
import { AppIcon } from './LucideIcon'

interface ReferencePanelProps {
  isOpen: boolean
  references: Reference[]
  activeCount: number
  activeTokenEstimate: number
  isOverTokenLimit: boolean
  onClose: () => void
  onToggle: (id: string) => void
  onRemove: (id: string) => void
  onAdd: (ref: Omit<Reference, 'id' | 'createdAt'>) => void
}

export function ReferencePanel({
  isOpen,
  references,
  activeCount,
  activeTokenEstimate,
  isOverTokenLimit,
  onClose,
  onToggle,
  onRemove,
  onAdd,
}: ReferencePanelProps) {
  const [label, setLabel] = useState('')
  const [type, setType] = useState<ReferenceType>('style')
  const [content, setContent] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleAdd = () => {
    const trimmedLabel = label.trim()
    const trimmedContent = content.trim()

    if (!trimmedLabel || !trimmedContent) {
      setFormError('Inserisci un nome e il contenuto della referenza.')
      return
    }

    onAdd({
      label: trimmedLabel,
      type,
      content: trimmedContent,
      active: true,
    })
    setLabel('')
    setContent('')
    setType('style')
    setFormError(null)
  }

  return (
    <div
      className="reference-panel-overlay"
      role="presentation"
      onClick={onClose}
    >
      <aside
        className="reference-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reference-panel-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="reference-panel-header">
          <div>
            <h2 id="reference-panel-title" className="reference-panel-title">
              Referenze contestuali
            </h2>
            <p className="reference-panel-subtitle">
              {activeCount === 0
                ? 'Nessuna referenza attiva'
                : activeCount === 1
                  ? '1 referenza attiva'
                  : `${activeCount} referenze attive`}
              {' · '}
              ~{activeTokenEstimate.toLocaleString('it-IT')} token
            </p>
          </div>
          <button
            type="button"
            className="reference-panel-close"
            title="Chiudi"
            onClick={onClose}
          >
            <AppIcon icon={X} size="sm" />
          </button>
        </div>

        {isOverTokenLimit && (
          <p className="reference-panel-warning" role="alert">
            Le referenze attive superano ~{REFERENCE_TOKEN_LIMIT.toLocaleString('it-IT')}{' '}
            token. Riduci il contenuto o disattiva alcune referenze per evitare
            troncamenti o errori API.
          </p>
        )}

        <div className="reference-panel-body">
          {references.length === 0 ? (
            <p className="reference-panel-empty">
              Aggiungi glossari, linee guida di stile, esempi o istruzioni da
              includere automaticamente nelle query AI.
            </p>
          ) : (
            <ul className="reference-list">
              {references.map((ref) => (
                <li key={ref.id} className="reference-item">
                  <label className="reference-item-toggle">
                    <input
                      type="checkbox"
                      checked={ref.active}
                      onChange={() => onToggle(ref.id)}
                    />
                    <span className="reference-item-body">
                      <span className="reference-item-label">{ref.label}</span>
                      <span className="reference-item-meta">
                        {REFERENCE_TYPE_LABELS[ref.type]}
                      </span>
                      <span className="reference-item-preview">
                        {ref.content.slice(0, 120)}
                        {ref.content.length > 120 ? '…' : ''}
                      </span>
                    </span>
                  </label>
                  <button
                    type="button"
                    className="reference-item-delete"
                    title="Elimina referenza"
                    onClick={() => onRemove(ref.id)}
                  >
                    <AppIcon icon={Trash2} size="sm" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="reference-panel-form">
          <h3 className="reference-panel-form-title">Nuova referenza</h3>
          {formError && <p className="reference-panel-form-error">{formError}</p>}

          <label className="reference-form-field">
            <span className="reference-form-label">Nome</span>
            <input
              type="text"
              className="reference-form-input"
              value={label}
              placeholder="Es. Stile aziendale"
              onChange={(e) => setLabel(e.target.value)}
            />
          </label>

          <label className="reference-form-field">
            <span className="reference-form-label">Tipo</span>
            <select
              className="reference-form-input"
              value={type}
              onChange={(e) => setType(e.target.value as ReferenceType)}
            >
              {REFERENCE_TYPES.map((refType) => (
                <option key={refType} value={refType}>
                  {REFERENCE_TYPE_LABELS[refType]}
                </option>
              ))}
            </select>
          </label>

          <label className="reference-form-field">
            <span className="reference-form-label">Contenuto</span>
            <textarea
              className="reference-form-textarea"
              value={content}
              rows={5}
              placeholder="Linee guida, glossario, tono, vincoli…"
              onChange={(e) => setContent(e.target.value)}
            />
          </label>

          <button
            type="button"
            className="reference-form-submit btn-with-icon"
            onClick={handleAdd}
          >
            <AppIcon icon={Plus} size="sm" />
            Aggiungi referenza
          </button>
        </div>
      </aside>
    </div>
  )
}
