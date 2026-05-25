import { useEffect, useRef, useState } from 'react'
import { Sparkles } from 'lucide-react'
import { AppIcon } from './LucideIcon'

interface AiPromptModalProps {
  selectedText: string
  isOpen: boolean
  isLoading: boolean
  error: string | null
  onSubmit: (instruction: string) => void
  onClose: () => void
}

const PROMPT_EXAMPLES = [
  'Rendilo più formale',
  'Accorcialo a una frase',
  'Correggi grammatica e punteggiatura',
  'Traducilo in inglese',
]

export function AiPromptModal({
  selectedText,
  isOpen,
  isLoading,
  error,
  onSubmit,
  onClose,
}: AiPromptModalProps) {
  const [instruction, setInstruction] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isOpen) {
      setInstruction('')
      setTimeout(() => textareaRef.current?.focus(), 50)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = instruction.trim()
    if (!trimmed || isLoading) return
    onSubmit(trimmed)
  }

  return (
    <div
      className="modal-overlay"
      onClick={isLoading ? undefined : onClose}
      role="presentation"
    >
      <div
        className="modal"
        role="dialog"
        aria-labelledby="ai-modal-title"
        aria-busy={isLoading}
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="ai-modal-title">Modifica con AI</h2>
        <p className="modal-label">Testo selezionato</p>
        <blockquote className="modal-selection">{selectedText}</blockquote>

        {isLoading ? (
          <div className="modal-loading" role="status" aria-live="polite">
            <div className="ai-loader" aria-hidden="true" />
            <p className="modal-loading-title">Elaborazione in corso</p>
            <p className="modal-loading-text">
              L&apos;AI sta modificando il testo selezionato…
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label htmlFor="ai-instruction" className="modal-label">
              Come vuoi modificarlo?
            </label>
            <textarea
              id="ai-instruction"
              ref={textareaRef}
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="Es: rendilo più formale, traducilo in inglese..."
              rows={3}
            />

            <div className="modal-examples">
              {PROMPT_EXAMPLES.map((example) => (
                <button
                  key={example}
                  type="button"
                  className="example-chip"
                  onClick={() => setInstruction(example)}
                >
                  {example}
                </button>
              ))}
            </div>

            {error && <p className="modal-error">{error}</p>}

            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={onClose}>
                Annulla
              </button>
              <button
                type="submit"
                className="btn-primary btn-with-icon"
                disabled={!instruction.trim()}
              >
                <AppIcon icon={Sparkles} size="sm" />
                Applica
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
