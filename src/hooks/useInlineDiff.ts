import { useCallback, useRef } from 'react'
import type { Editor } from '@tiptap/react'
import { applyScroll, captureScroll } from '../utils/restoreEditorContent'

const DIFF_DURATION_MS = 5000

function collectRemovedRanges(editor: Editor): { from: number; to: number }[] {
  const { diffRemoved } = editor.schema.marks
  const ranges: { from: number; to: number }[] = []

  editor.state.doc.descendants((node, pos) => {
    if (!node.isText) return
    if (node.marks.some((m) => m.type === diffRemoved)) {
      ranges.push({ from: pos, to: pos + node.nodeSize })
    }
  })

  return ranges.sort((a, b) => b.from - a.from)
}

export function docHasDiffMarks(editor: Editor): boolean {
  const { diffAdded, diffRemoved } = editor.schema.marks
  let found = false

  editor.state.doc.descendants((node) => {
    if (!node.isText || found) return
    if (node.marks.some((m) => m.type === diffAdded || m.type === diffRemoved)) {
      found = true
    }
  })

  return found
}

export function useInlineDiff() {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const suppressFinalizeRef = useRef(false)

  const clearDiffTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  const finalizeDiff = useCallback(
    (editor: Editor, scrollIntoView = true) => {
      clearDiffTimeout()

      const { diffAdded } = editor.schema.marks
      const removedRanges = collectRemovedRanges(editor)

      let chain = editor.chain()
      if (scrollIntoView) chain = chain.focus()

      removedRanges.forEach(({ from, to }) => {
        chain = chain.deleteRange({ from, to })
      })

      chain.run()

      editor.chain().command(({ tr, state, dispatch }) => {
        if (!dispatch) return true

        state.doc.descendants((node, pos) => {
          if (!node.isText) return
          if (node.marks.some((m) => m.type === diffAdded)) {
            tr.removeMark(pos, pos + node.nodeSize, diffAdded)
          }
        })

        return true
      }).run()
    },
    [clearDiffTimeout],
  )

  const clearAllDiffMarks = useCallback(
    (editor: Editor, scrollIntoView = true) => {
      finalizeDiff(editor, scrollIntoView)
    },
    [finalizeDiff],
  )

  const scheduleFinalize = useCallback(
    (editor: Editor) => {
      clearDiffTimeout()
      timeoutRef.current = setTimeout(() => {
        finalizeDiff(editor)
      }, DIFF_DURATION_MS)
    },
    [clearDiffTimeout, finalizeDiff],
  )

  const applyAiDiff = useCallback(
    (
      editor: Editor,
      from: number,
      to: number,
      beforeText: string,
      afterText: string,
    ) => {
      clearDiffTimeout()
      suppressFinalizeRef.current = true

      editor
        .chain()
        .focus()
        .deleteRange({ from, to })
        .insertContentAt(from, [
          {
            type: 'text',
            marks: [{ type: 'diffRemoved' }],
            text: beforeText,
          },
          {
            type: 'text',
            marks: [{ type: 'diffAdded' }],
            text: afterText,
          },
        ])
        .run()

      suppressFinalizeRef.current = false
      scheduleFinalize(editor)
    },
    [clearDiffTimeout, scheduleFinalize],
  )

  const showDiffInDocument = useCallback(
    (editor: Editor, beforeText: string, afterText: string) => {
      const scrollSnapshot = captureScroll(editor)
      clearAllDiffMarks(editor, false)
      suppressFinalizeRef.current = true

      const docText = editor.state.doc.textContent
      let from = docText.indexOf(afterText)

      if (from === -1 && beforeText) {
        from = docText.indexOf(beforeText)
      }

      if (from === -1) {
        from = editor.state.doc.content.size
      }

      const to =
        afterText && from !== -1 && docText.indexOf(afterText) !== -1
          ? from + afterText.length
          : from + beforeText.length

      if (afterText && docText.indexOf(afterText) !== -1) {
        editor
          .chain()
          .deleteRange({ from, to })
          .insertContentAt(from, [
            {
              type: 'text',
              marks: [{ type: 'diffRemoved' }],
              text: beforeText,
            },
            {
              type: 'text',
              marks: [{ type: 'diffAdded' }],
              text: afterText,
            },
          ])
          .run()
      } else if (beforeText) {
        editor
          .chain()
          .insertContentAt(from, [
            {
              type: 'text',
              marks: [{ type: 'diffRemoved' }],
              text: beforeText,
            },
            {
              type: 'text',
              marks: [{ type: 'diffAdded' }],
              text: afterText,
            },
          ])
          .run()
      }

      suppressFinalizeRef.current = false

      requestAnimationFrame(() => {
        applyScroll(editor, scrollSnapshot)
      })
    },
    [clearAllDiffMarks],
  )

  const shouldFinalizeOnEdit = useCallback((editor: Editor) => {
    if (suppressFinalizeRef.current) return false
    return docHasDiffMarks(editor)
  }, [])

  return {
    applyAiDiff,
    showDiffInDocument,
    clearAllDiffMarks,
    finalizeDiff,
    shouldFinalizeOnEdit,
  }
}
