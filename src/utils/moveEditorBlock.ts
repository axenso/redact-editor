import type { Editor } from '@tiptap/react'

export function moveEditorBlock(
  editor: Editor,
  fromPos: number,
  insertPos: number,
): boolean {
  const { state } = editor
  const node = state.doc.nodeAt(fromPos)
  if (!node) return false

  const fromEnd = fromPos + node.nodeSize
  let mappedInsertPos = insertPos

  if (insertPos > fromPos) {
    mappedInsertPos -= node.nodeSize
  }

  if (mappedInsertPos === fromPos) return false
  if (mappedInsertPos >= fromPos && mappedInsertPos < fromEnd) return false

  return editor
    .chain()
    .focus()
    .command(({ tr, dispatch }) => {
      tr.delete(fromPos, fromEnd)
      tr.insert(mappedInsertPos, node)
      if (dispatch) dispatch(tr.scrollIntoView())
      return true
    })
    .run()
}
