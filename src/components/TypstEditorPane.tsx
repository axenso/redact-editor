interface TypstEditorPaneProps {
  value: string
  onChange: (value: string) => void
}

export function TypstEditorPane({ value, onChange }: TypstEditorPaneProps) {
  return (
    <div className="typst-editor-pane">
      {/* <label className="typst-editor-label" htmlFor="typst-editor-source">
        Sorgente Typst
      </label> */}
      <textarea
        id="typst-editor-source"
        className="typst-editor-textarea"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        spellCheck={false}
        aria-label="Editor Typst"
      />
    </div>
  )
}
