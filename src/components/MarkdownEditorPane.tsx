import { forwardRef } from 'react'

interface MarkdownEditorPaneProps {
  value: string
  onChange: (value: string) => void
}

export const MarkdownEditorPane = forwardRef<
  HTMLTextAreaElement,
  MarkdownEditorPaneProps
>(function MarkdownEditorPane({ value, onChange }, ref) {
  return (
    <div className="markdown-editor-pane">
      <textarea
        ref={ref}
        id="markdown-editor-source"
        className="markdown-editor-textarea source-editor-textarea"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        spellCheck={false}
        aria-label="Editor Markdown"
      />
    </div>
  )
})
