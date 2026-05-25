interface MathFormulaModalProps {
  isOpen: boolean
  displayMode: boolean
  onClose: () => void
  onSubmit: (latex: string, displayMode: boolean) => void
}

export function MathFormulaModal({
  isOpen,
  displayMode,
  onClose,
  onSubmit,
}: MathFormulaModalProps) {
  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-panel math-formula-modal"
        role="dialog"
        aria-labelledby="math-formula-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="math-formula-modal-title" className="modal-title">
          Inserisci formula LaTeX
        </h2>
        <p className="math-formula-modal-hint">
          Usa la sintassi KaTeX, ad esempio <code>E=mc^2</code> o{' '}
          <code>{'\\frac{a}{b}'}</code>.
        </p>
        <form
          className="math-formula-modal-form"
          onSubmit={(event) => {
            event.preventDefault()
            const form = event.currentTarget
            const latex = new FormData(form).get('latex')
            if (typeof latex !== 'string' || !latex.trim()) return
            onSubmit(latex.trim(), displayMode)
            onClose()
          }}
        >
          <label className="math-formula-modal-label" htmlFor="math-formula-latex">
            Formula
          </label>
          <textarea
            id="math-formula-latex"
            name="latex"
            className="math-formula-modal-input"
            rows={displayMode ? 4 : 2}
            autoFocus
            placeholder={displayMode ? '\\int_0^1 x^2 dx' : 'E=mc^2'}
          />
          <div className="modal-actions">
            <button type="button" className="modal-btn modal-btn-secondary" onClick={onClose}>
              Annulla
            </button>
            <button type="submit" className="modal-btn modal-btn-primary">
              Inserisci
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
