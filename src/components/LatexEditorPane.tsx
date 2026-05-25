import { forwardRef } from 'react'

interface LatexEditorPaneProps {
  value: string
  onChange: (value: string) => void
}

export const LatexEditorPane = forwardRef<
  HTMLTextAreaElement,
  LatexEditorPaneProps
>(function LatexEditorPane({ value, onChange }, ref) {
  return (
    <div className="latex-editor-pane">
      <textarea
        ref={ref}
        id="latex-editor-source"
        className="latex-editor-textarea source-editor-textarea"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        spellCheck={false}
        aria-label="Editor LaTeX"
      />
    </div>
  )
})
