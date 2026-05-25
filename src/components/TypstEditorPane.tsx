import { forwardRef } from 'react'

interface TypstEditorPaneProps {
  value: string
  onChange: (value: string) => void
}

export const TypstEditorPane = forwardRef<
  HTMLTextAreaElement,
  TypstEditorPaneProps
>(function TypstEditorPane({ value, onChange }, ref) {
  return (
    <div className="typst-editor-pane">
      <textarea
        ref={ref}
        id="typst-editor-source"
        className="typst-editor-textarea source-editor-textarea"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        spellCheck={false}
        aria-label="Editor Typst"
      />
    </div>
  )
})
