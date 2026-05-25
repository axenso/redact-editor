import { useEffect, useRef, useState } from 'react'
import type { WritingMode } from '../utils/writingMode'
import { EditorModal } from './EditorModal'

interface MathFormulaModalProps {
  isOpen: boolean
  initialDisplayMode: boolean
  writingMode: WritingMode
  onClose: () => void
  onSubmit: (latex: string, displayMode: boolean) => void
}

const MODE_HINTS: Record<WritingMode, string> = {
  visual: 'La formula verrà inserita nel documento con rendering KaTeX.',
  markdown: 'Sintassi salvata come $inline$ o blocco $$...$$ nel Markdown.',
  latex: 'Sintassi salvata come $...$ o \\[...\\] nel sorgente LaTeX.',
  typst: 'Sintassi salvata come $...$ o $ ... $ (con spazi) in Typst.',
}

export function MathFormulaModal({
  isOpen,
  initialDisplayMode,
  writingMode,
  onClose,
  onSubmit,
}: MathFormulaModalProps) {
  const [displayMode, setDisplayMode] = useState(initialDisplayMode)
  const [latex, setLatex] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!isOpen) return
    setDisplayMode(initialDisplayMode)
    setLatex('')
    setTimeout(() => textareaRef.current?.focus(), 50)
  }, [isOpen, initialDisplayMode])

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const trimmed = latex.trim()
    if (!trimmed) return
    onSubmit(trimmed, displayMode)
    onClose()
  }

  return (
    <EditorModal
      isOpen={isOpen}
      title="Inserisci formula"
      titleId="math-formula-modal-title"
      onClose={onClose}
      className="modal--formula"
    >
      <p className="modal-hint">{MODE_HINTS[writingMode]}</p>

      <div
        className="modal-segmented"
        role="group"
        aria-label="Tipo formula"
      >
        <button
          type="button"
          className={
            !displayMode
              ? 'modal-segmented-btn active'
              : 'modal-segmented-btn'
          }
          aria-pressed={!displayMode}
          onClick={() => setDisplayMode(false)}
        >
          Inline
        </button>
        <button
          type="button"
          className={
            displayMode ? 'modal-segmented-btn active' : 'modal-segmented-btn'
          }
          aria-pressed={displayMode}
          onClick={() => setDisplayMode(true)}
        >
          Blocco
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <label htmlFor="math-formula-latex" className="modal-label">
          Espressione (KaTeX / LaTeX)
        </label>
        <textarea
          id="math-formula-latex"
          ref={textareaRef}
          className="modal-textarea modal-textarea--mono"
          value={latex}
          rows={displayMode ? 4 : 2}
          placeholder={
            displayMode ? '\\int_0^1 x^2\\,dx' : 'E=mc^2'
          }
          onChange={(event) => setLatex(event.target.value)}
        />

        <p className="modal-hint">
          Esempi: <code>E=mc^2</code>, <code>{'\\frac{a}{b}'}</code>,{' '}
          <code>{'\\sum_{i=1}^{n} x_i'}</code>
        </p>

        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Annulla
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={!latex.trim()}
          >
            Inserisci
          </button>
        </div>
      </form>
    </EditorModal>
  )
}
