import type { AiGenerateKind } from './AiGenerateForm'
import { AiGenerateForm } from './AiGenerateForm'
import type { Reference } from '../types/reference'
import { useDocumentAiSuggestions } from '../hooks/useDocumentAiSuggestions'

export type { AiGenerateKind }

interface AiGenerateModalProps {
  kind: AiGenerateKind
  isOpen: boolean
  documentContext?: string
  activeRefs?: Reference[]
  isLoading: boolean
  error: string | null
  mode?: 'insert' | 'regenerate'
  onSubmit: (instruction: string) => void
  onClose: () => void
}

const TITLES: Record<AiGenerateKind, string> = {
  chart: 'Grafico con AI',
  table: 'Tabella con AI',
}

const REGENERATE_LABELS: Record<AiGenerateKind, string> = {
  chart: 'Rigenera grafico con AI',
  table: 'Rigenera tabella con AI',
}

export function AiGenerateModal({
  kind,
  isOpen,
  documentContext = '',
  activeRefs = [],
  isLoading,
  error,
  mode = 'insert',
  onSubmit,
  onClose,
}: AiGenerateModalProps) {
  const { suggestions, loading: suggestionsLoading } = useDocumentAiSuggestions(
    kind,
    documentContext,
    isOpen,
    activeRefs,
  )

  if (!isOpen) return null

  return (
    <div
      className="modal-overlay"
      onClick={isLoading ? undefined : onClose}
      role="presentation"
    >
      <div
        className="modal"
        role="dialog"
        aria-labelledby="ai-generate-title"
        aria-busy={isLoading}
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="ai-generate-title">
          {mode === 'regenerate' ? REGENERATE_LABELS[kind] : TITLES[kind]}
        </h2>

        <AiGenerateForm
          kind={kind}
          isLoading={isLoading}
          error={error}
          documentContext={documentContext}
          examples={suggestions}
          examplesLoading={suggestionsLoading}
          onSubmit={onSubmit}
          onCancel={onClose}
          submitLabel={mode === 'regenerate' ? 'Rigenera' : undefined}
        />
      </div>
    </div>
  )
}
