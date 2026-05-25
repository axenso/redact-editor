import { BubbleMenu } from '@tiptap/react/menus'
import {
  Languages,
  Scissors,
  Sparkles,
  SpellCheck,
  WandSparkles,
} from 'lucide-react'
import type { Editor } from '@tiptap/react'
import {
  EditorInsertMenuPanel,
  type EditorInsertMenuGroup,
} from './EditorInsertMenuPanel'

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
  if (!enabled) return null

  const groups: EditorInsertMenuGroup[] = [
    {
      label: 'AI',
      items: [
        {
          id: 'ai-custom',
          label: 'Modifica con AI…',
          icon: Sparkles,
          onSelect: onAiClick,
        },
        {
          id: 'ai-formal',
          label: 'Rendilo più formale',
          icon: WandSparkles,
          onSelect: () => onAiQuickAction('Rendilo più formale'),
        },
        {
          id: 'ai-shorten',
          label: 'Accorcialo a una frase',
          icon: Scissors,
          onSelect: () => onAiQuickAction('Accorcialo a una frase'),
        },
        {
          id: 'ai-grammar',
          label: 'Correggi grammatica e punteggiatura',
          icon: SpellCheck,
          onSelect: () =>
            onAiQuickAction('Correggi grammatica e punteggiatura'),
        },
        {
          id: 'ai-translate',
          label: 'Traduci in inglese',
          icon: Languages,
          onSelect: () => onAiQuickAction('Traduci in inglese'),
        },
      ],
    },
  ]

  return (
    <BubbleMenu
      editor={editor}
      options={{
        placement: 'bottom-start',
        offset: 8,
      }}
      shouldShow={({ editor: ed, state }) => {
        if (!enabled) return false
        const { from, to } = state.selection
        return from !== to && !ed.isActive('codeBlock')
      }}
    >
      <EditorInsertMenuPanel groups={groups} className="editor-insert-menu-bubble" />
    </BubbleMenu>
  )
}
