import {
  Code,
  Image,
  Languages,
  List,
  ListOrdered,
  Minus,
  Quote,
  Scissors,
  Sparkles,
  SpellCheck,
  Table,
  WandSparkles,
} from 'lucide-react'
import type { Editor } from '@tiptap/react'
import type { EditorInsertMenuGroup } from '../components/EditorInsertMenuPanel'

interface AiInsertMenuOptions {
  onAiClick: () => void
  onAiQuickAction: (instruction: string) => void
  includeAiGroup?: boolean
}

export function buildAiInsertMenuGroups({
  onAiClick,
  onAiQuickAction,
  includeAiGroup = true,
}: AiInsertMenuOptions): EditorInsertMenuGroup[] {
  if (!includeAiGroup) return []

  return [
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
}

interface BlockInsertMenuOptions {
  runAtBlock: (command: (editor: Editor) => void) => void
  runAfterBlock: (command: () => void, closeMenu?: boolean) => void
  onInsertImage?: () => void
  onInsertTable?: () => void
}

export function buildBlockInsertMenuGroups({
  runAtBlock,
  runAfterBlock,
  onInsertImage,
  onInsertTable,
}: BlockInsertMenuOptions): EditorInsertMenuGroup[] {
  return [
    {
      label: 'Lists',
      items: [
        {
          id: 'bullet-list',
          label: 'Unordered List',
          icon: List,
          onSelect: () =>
            runAtBlock((ed) => ed.chain().focus().toggleBulletList().run()),
        },
        {
          id: 'ordered-list',
          label: 'Ordered List',
          icon: ListOrdered,
          onSelect: () =>
            runAtBlock((ed) => ed.chain().focus().toggleOrderedList().run()),
        },
      ],
    },
    {
      label: 'Blocks',
      items: [
        {
          id: 'code',
          label: 'Code',
          icon: Code,
          onSelect: () =>
            runAtBlock((ed) => ed.chain().focus().toggleCodeBlock().run()),
        },
        {
          id: 'media',
          label: 'Media Block',
          icon: Image,
          onSelect: () => {
            if (!onInsertImage) return
            runAfterBlock(onInsertImage, true)
          },
        },
        {
          id: 'table',
          label: 'Table',
          icon: Table,
          onSelect: () => {
            if (!onInsertTable) return
            runAfterBlock(onInsertTable, true)
          },
        },
      ],
    },
    {
      label: 'Basic',
      items: [
        {
          id: 'upload',
          label: 'Upload',
          icon: Image,
          onSelect: () => {
            if (!onInsertImage) return
            runAfterBlock(onInsertImage, true)
          },
        },
        {
          id: 'blockquote',
          label: 'Blockquote',
          icon: Quote,
          onSelect: () =>
            runAtBlock((ed) => ed.chain().focus().toggleBlockquote().run()),
        },
        {
          id: 'hr',
          label: 'Horizontal Rule',
          icon: Minus,
          onSelect: () =>
            runAtBlock((ed) => ed.chain().focus().setHorizontalRule().run()),
        },
      ],
    },
  ]
}

export function hasAiTextSelection(editor: Editor): boolean {
  const { from, to } = editor.state.selection
  return from !== to && !editor.isActive('codeBlock')
}
