import type { ReactNode } from 'react'
import {
  BetweenHorizontalEnd,
  BetweenHorizontalStart,
  BetweenVerticalEnd,
  BetweenVerticalStart,
  X,
} from 'lucide-react'
import type { Editor } from '@tiptap/react'
import { AppIcon } from './LucideIcon'
import { runTableCommand } from '../utils/insertAiTable'

interface ToolbarTableControlsProps {
  editor: Editor
}

function ToolbarTableButton({
  title,
  onClick,
  children,
}: {
  title: string
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      className="toolbar-btn"
      title={title}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

export function ToolbarTableControls({ editor }: ToolbarTableControlsProps) {
  return (
    <>
      <span className="toolbar-divider" aria-hidden="true" />
      <span className="toolbar-group-label">Tabella</span>
      <ToolbarTableButton
        title="Aggiungi riga"
        onClick={() => runTableCommand(editor, (chain) => chain.addRowAfter())}
      >
        <AppIcon icon={BetweenVerticalEnd} size="sm" />
      </ToolbarTableButton>
      <ToolbarTableButton
        title="Aggiungi colonna"
        onClick={() => runTableCommand(editor, (chain) => chain.addColumnAfter())}
      >
        <AppIcon icon={BetweenHorizontalEnd} size="sm" />
      </ToolbarTableButton>
      <ToolbarTableButton
        title="Elimina riga"
        onClick={() => runTableCommand(editor, (chain) => chain.deleteRow())}
      >
        <AppIcon icon={BetweenVerticalStart} size="sm" />
      </ToolbarTableButton>
      <ToolbarTableButton
        title="Elimina colonna"
        onClick={() => runTableCommand(editor, (chain) => chain.deleteColumn())}
      >
        <AppIcon icon={BetweenHorizontalStart} size="sm" />
      </ToolbarTableButton>
      <ToolbarTableButton
        title="Elimina tabella"
        onClick={() => runTableCommand(editor, (chain) => chain.deleteTable())}
      >
        <AppIcon icon={X} size="sm" />
      </ToolbarTableButton>
    </>
  )
}
