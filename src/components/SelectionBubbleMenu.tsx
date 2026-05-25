import { BubbleMenu } from '@tiptap/react/menus'
import type { Editor } from '@tiptap/react'
import { EditorInsertMenuPanel } from './EditorInsertMenuPanel'
import { buildAiInsertMenuGroups } from '../utils/editorInsertMenuGroups'

interface SelectionBubbleMenuProps {
  editor: Editor
  enabled: boolean
  onAiClick: () => void
  onAiQuickAction: (instruction: string) => void
}

export function SelectionBubbleMenu({
  editor,
  enabled,
  onAiClick,
  onAiQuickAction,
}: SelectionBubbleMenuProps) {
  const groups = buildAiInsertMenuGroups({ onAiClick, onAiQuickAction })

  return (
    <BubbleMenu
      editor={editor}
      appendTo={() => document.body}
      className="selection-bubble-menu-host"
      options={{
        placement: 'bottom-start',
        offset: 8,
      }}
      shouldShow={({ editor: ed, state, view, element }) => {
        if (!enabled) return false

        const { from, to } = state.selection
        if (from === to || ed.isActive('codeBlock')) return false

        return view.hasFocus() || element.contains(document.activeElement)
      }}
    >
      <EditorInsertMenuPanel groups={groups} className="editor-insert-menu-bubble" />
    </BubbleMenu>
  )
}
