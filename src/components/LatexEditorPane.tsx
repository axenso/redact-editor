interface LatexEditorPaneProps {
  value: string
  onChange: (value: string) => void
}

export function LatexEditorPane({ value, onChange }: LatexEditorPaneProps) {
  return (
    <div className="latex-editor-pane">
      {/* <label className="latex-editor-label" htmlFor="latex-editor-source">
        Sorgente LaTeX
      </label> */}
      <textarea
        id="latex-editor-source"
        className="latex-editor-textarea"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        spellCheck={false}
        aria-label="Editor LaTeX"
      />
    </div>
  )
}
