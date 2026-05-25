interface MarkdownEditorPaneProps {
  value: string
  onChange: (value: string) => void
}

export function MarkdownEditorPane({ value, onChange }: MarkdownEditorPaneProps) {
  return (
    <div className="markdown-editor-pane">
      {/* <label className="markdown-editor-label" htmlFor="markdown-editor-source">
        Sorgente Markdown
      </label> */}
      <textarea
        id="markdown-editor-source"
        className="markdown-editor-textarea"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        spellCheck={false}
        aria-label="Editor Markdown"
      />
    </div>
  )
}
