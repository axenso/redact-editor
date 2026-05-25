import type { Editor } from '@tiptap/react'
import { normalizeTableHtml } from './normalizeTableHtml'

export interface ScrollSnapshot {
  windowX: number
  windowY: number
  containerTop: number | null
  editorTop: number
}

export function captureScroll(editor: Editor): ScrollSnapshot {
  const dom = editor.view.dom
  const container = dom.closest('.editor-shell')

  return {
    windowX: window.scrollX,
    windowY: window.scrollY,
    containerTop:
      container instanceof HTMLElement ? container.scrollTop : null,
    editorTop: dom.scrollTop,
  }
}

export function applyScroll(editor: Editor, snapshot: ScrollSnapshot): void {
  const dom = editor.view.dom
  const container = dom.closest('.editor-shell')

  window.scrollTo(snapshot.windowX, snapshot.windowY)

  if (container instanceof HTMLElement && snapshot.containerTop !== null) {
    container.scrollTop = snapshot.containerTop
  }

  dom.scrollTop = snapshot.editorTop
}

export function restoreEditorContent(
  editor: Editor,
  html: string,
  clearDiffMarks: (ed: Editor, scrollIntoView?: boolean) => void,
  options?: { preserveScroll?: boolean },
): void {
  const preserveScroll = options?.preserveScroll !== false
  const scrollSnapshot = preserveScroll ? captureScroll(editor) : null

  clearDiffMarks(editor, false)
  editor.commands.setContent(normalizeTableHtml(html), { emitUpdate: false })
  editor.commands.fixTables()
  editor.commands.blur()

  if (!scrollSnapshot) return

  requestAnimationFrame(() => {
    applyScroll(editor, scrollSnapshot)
    requestAnimationFrame(() => {
      applyScroll(editor, scrollSnapshot)
    })
  })
}
