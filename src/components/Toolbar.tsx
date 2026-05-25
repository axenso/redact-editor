import type { ReactNode } from 'react'
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  BarChart3,
  Bold,
  Image,
  Italic,
  List,
  ListOrdered,
  Pilcrow,
  Table,
  Underline,
} from 'lucide-react'
import type { Editor } from '@tiptap/react'
import { AppIcon } from './LucideIcon'
import { ToolbarColorMenu } from './ToolbarColorMenu'
import { ToolbarFontMenus } from './ToolbarFontMenus'
import { ToolbarHeadingMenu } from './ToolbarHeadingMenu'
import { ToolbarLineHeightMenu } from './ToolbarLineHeightMenu'
import { ToolbarTableControls } from './ToolbarTableControls'
import { ToolbarUndoRedo } from './ToolbarUndoRedo'

interface ToolbarProps {
  editor: Editor
  isInTable?: boolean
  onInsertImage?: () => void
  onInsertTable?: () => void
  onInsertChart?: () => void
}

interface ToolbarButtonProps {
  onClick: () => void
  isActive?: boolean
  title: string
  children: ReactNode
}

function ToolbarButton({ onClick, isActive, title, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={isActive ? 'toolbar-btn active' : 'toolbar-btn'}
      title={title}
    >
      {children}
    </button>
  )
}

function ToolbarDivider() {
  return <span className="toolbar-divider" aria-hidden="true" />
}

export function Toolbar({
  editor,
  isInTable = false,
  onInsertImage,
  onInsertTable,
  onInsertChart,
}: ToolbarProps) {
  return (
    <div className="toolbar" role="toolbar" aria-label="Formattazione testo">
      <div className="toolbar-group">
      <ToolbarUndoRedo editor={editor} />

      <ToolbarDivider />

      <ToolbarHeadingMenu editor={editor} />

      <ToolbarDivider />

      <ToolbarButton
        title="Paragrafo"
        isActive={editor.isActive('paragraph')}
        onClick={() => editor.chain().focus().setParagraph().run()}
      >
        <AppIcon icon={Pilcrow} size="sm" />
      </ToolbarButton>
      <ToolbarButton
        title="Grassetto"
        isActive={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <AppIcon icon={Bold} size="sm" />
      </ToolbarButton>
      <ToolbarButton
        title="Corsivo"
        isActive={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <AppIcon icon={Italic} size="sm" />
      </ToolbarButton>
      <ToolbarButton
        title="Sottolineato"
        isActive={editor.isActive('underline')}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <AppIcon icon={Underline} size="sm" />
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarColorMenu editor={editor} />

      <ToolbarDivider />

      <ToolbarFontMenus editor={editor} />

      <ToolbarDivider />

      <ToolbarLineHeightMenu editor={editor} />

      <ToolbarDivider />

      <ToolbarButton
        title="Allinea a sinistra"
        isActive={editor.isActive({ textAlign: 'left' })}
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
      >
        <AppIcon icon={AlignLeft} size="sm" />
      </ToolbarButton>
      <ToolbarButton
        title="Centra"
        isActive={editor.isActive({ textAlign: 'center' })}
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
      >
        <AppIcon icon={AlignCenter} size="sm" />
      </ToolbarButton>
      <ToolbarButton
        title="Allinea a destra"
        isActive={editor.isActive({ textAlign: 'right' })}
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
      >
        <AppIcon icon={AlignRight} size="sm" />
      </ToolbarButton>
      <ToolbarButton
        title="Giustifica"
        isActive={editor.isActive({ textAlign: 'justify' })}
        onClick={() => editor.chain().focus().setTextAlign('justify').run()}
      >
        <AppIcon icon={AlignJustify} size="sm" />
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton
        title="Elenco puntato"
        isActive={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <AppIcon icon={List} size="sm" />
      </ToolbarButton>
      <ToolbarButton
        title="Elenco numerato"
        isActive={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <AppIcon icon={ListOrdered} size="sm" />
      </ToolbarButton>

      <ToolbarDivider />

      {onInsertTable && (
        <ToolbarButton title="Inserisci tabella" onClick={onInsertTable}>
          <AppIcon icon={Table} size="sm" />
        </ToolbarButton>
      )}

      {isInTable && <ToolbarTableControls editor={editor} />}

      {onInsertImage && (
        <ToolbarButton title="Inserisci immagine" onClick={onInsertImage}>
          <AppIcon icon={Image} size="sm" />
        </ToolbarButton>
      )}

      {onInsertChart && (
        <ToolbarButton title="Inserisci grafico" onClick={onInsertChart}>
          <AppIcon icon={BarChart3} size="sm" />
        </ToolbarButton>
      )}

      </div>
    </div>
  )
}
