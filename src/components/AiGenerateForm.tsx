import { useEffect, useRef, useState } from 'react'
import { Sparkles } from 'lucide-react'
import { AppIcon } from './LucideIcon'
import { buildSuggestionsFromText } from '../utils/documentSuggestions'

export type AiGenerateKind = 'chart' | 'table'

const HINTS: Record<AiGenerateKind, string> = {
  chart:
    'Descrivi il grafico che vuoi, oppure scegli una delle query suggerite dal documento.',
  table:
    'Descrivi la tabella che vuoi, oppure scegli una delle query suggerite dal documento.',
}

interface AiGenerateFormProps {
  kind: AiGenerateKind
  isLoading: boolean
  error: string | null
  onSubmit: (instruction: string) => void
  onCancel: () => void
  submitLabel?: string
  examples?: string[]
  examplesLoading?: boolean
  documentContext?: string
}

export function AiGenerateForm({
  kind,
  isLoading,
  error,
  onSubmit,
  onCancel,
  submitLabel = 'Genera',
  examples,
  examplesLoading = false,
  documentContext = '',
}: AiGenerateFormProps) {
  const [instruction, setInstruction] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const resolvedExamples =
    examples ?? buildSuggestionsFromText(kind, documentContext)

  const placeholder =
    kind === 'chart'
      ? resolvedExamples[0] ?? 'Es: grafico a barre basato sul documento'
      : resolvedExamples[0] ?? 'Es: tabella strutturata dal contenuto del documento'

  useEffect(() => {
    setInstruction('')
    setTimeout(() => textareaRef.current?.focus(), 50)
  }, [kind])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = instruction.trim()
    if (!trimmed || isLoading) return
    onSubmit(trimmed)
  }

  if (isLoading) {
    return (
      <div className="modal-loading" role="status" aria-live="polite">
        <div className="ai-loader" aria-hidden="true" />
        <p className="modal-loading-title">Generazione in corso</p>
        <p className="modal-loading-text">
          L&apos;AI sta creando {kind === 'chart' ? 'il grafico' : 'la tabella'}…
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <p className="modal-hint-block">{HINTS[kind]}</p>

      <label htmlFor={`ai-generate-${kind}`} className="modal-label">
        Cosa vuoi generare?
      </label>
      <textarea
        id={`ai-generate-${kind}`}
        ref={textareaRef}
        className="modal-textarea"
        value={instruction}
        onChange={(e) => setInstruction(e.target.value)}
        placeholder={placeholder}
        rows={4}
      />

      <p className="modal-examples-label">Altre idee dal documento</p>
      <ul className="modal-examples" role="list">
        {examplesLoading ? (
          <li role="listitem">
            <p className="modal-examples-loading">Generazione suggerimenti…</p>
          </li>
        ) : resolvedExamples.length > 0 ? (
          resolvedExamples.map((example) => (
            <li key={example} role="listitem">
              <button
                type="button"
                className="example-chip"
                onClick={() => setInstruction(example)}
              >
                {example}
              </button>
            </li>
          ))
        ) : (
          <li role="listitem">
            <p className="modal-examples-loading">
              Scrivi nel documento per ottenere suggerimenti personalizzati.
            </p>
          </li>
        )}
      </ul>

      {error && <p className="modal-error">{error}</p>}

      <div className="modal-actions">
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Annulla
        </button>
        <button
          type="submit"
          className="btn-primary btn-with-icon"
          disabled={!instruction.trim()}
        >
          <AppIcon icon={Sparkles} size="sm" />
          {submitLabel}
        </button>
      </div>
    </form>
  )
}
