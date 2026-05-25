import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  BetweenHorizontalEnd,
  BetweenHorizontalStart,
  BetweenVerticalEnd,
  BetweenVerticalStart,
  Sparkles,
  X,
} from 'lucide-react'
import type { Editor } from '@tiptap/react'
import { AppIcon } from './LucideIcon'
import { BlockHoverButton } from './BlockHoverButton'
import { findTablePosFromDom, runTableCommand } from '../utils/insertAiTable'

interface TableHoverControlsProps {
  editor: Editor
  onAiGenerateTable?: (tablePos: number) => void
}

function resolveTableWrapper(element: HTMLElement | null): HTMLElement | null {
  if (!element) return null

  const wrapper = element.closest('.tableWrapper')
  if (wrapper instanceof HTMLElement) return wrapper

  const table = element.closest('table')
  if (!(table instanceof HTMLTableElement)) return null

  const parent = table.parentElement
  if (parent?.classList.contains('tableWrapper')) return parent

  return table.parentElement instanceof HTMLElement ? table.parentElement : null
}

function getTableWrapper(editor: Editor): HTMLElement | null {
  const { $from } = editor.state.selection

  for (let depth = $from.depth; depth > 0; depth -= 1) {
    if ($from.node(depth).type.name !== 'table') continue

    const pos = $from.before(depth)
    const dom = editor.view.nodeDOM(pos)
    if (!(dom instanceof HTMLElement)) continue

    return resolveTableWrapper(dom)
  }

  return null
}

export function TableHoverControls({
  editor,
  onAiGenerateTable,
}: TableHoverControlsProps) {
  const [hoveredWrapper, setHoveredWrapper] = useState<HTMLElement | null>(null)
  const [activeWrapper, setActiveWrapper] = useState<HTMLElement | null>(null)

  const syncActiveTable = useCallback(() => {
    document
      .querySelectorAll('.tableWrapper.table-wrapper-active')
      .forEach((el) => el.classList.remove('table-wrapper-active'))

    if (editor.isActive('table')) {
      const wrapper = getTableWrapper(editor)
      wrapper?.classList.add('table-wrapper-active')
      setActiveWrapper(wrapper)
    } else if (!hoveredWrapper) {
      setActiveWrapper(null)
    }
  }, [editor, hoveredWrapper])

  useEffect(() => {
    const root = editor.view.dom

    const onMouseMove = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      const wrapper = resolveTableWrapper(target)
      setHoveredWrapper(wrapper)

      document
        .querySelectorAll('.tableWrapper.table-wrapper-active')
        .forEach((el) => el.classList.remove('table-wrapper-active'))

      if (wrapper) {
        wrapper.classList.add('table-wrapper-active')
        setActiveWrapper(wrapper)
      } else if (!editor.isActive('table')) {
        setActiveWrapper(null)
      }
    }

    const onMouseLeave = () => {
      setHoveredWrapper(null)
      if (!editor.isActive('table')) {
        document
          .querySelectorAll('.tableWrapper.table-wrapper-active')
          .forEach((el) => el.classList.remove('table-wrapper-active'))
        setActiveWrapper(null)
      }
    }

    root.addEventListener('mousemove', onMouseMove)
    root.addEventListener('mouseleave', onMouseLeave)

    return () => {
      root.removeEventListener('mousemove', onMouseMove)
      root.removeEventListener('mouseleave', onMouseLeave)
    }
  }, [editor])

  useEffect(() => {
    editor.on('selectionUpdate', syncActiveTable)
    return () => {
      editor.off('selectionUpdate', syncActiveTable)
    }
  }, [editor, syncActiveTable])

  const runInTable = (
    run: (chain: ReturnType<Editor['chain']>) => ReturnType<Editor['chain']>,
  ) => {
    const table = activeWrapper?.querySelector('table')
    const tablePos =
      table instanceof HTMLTableElement
        ? findTablePosFromDom(editor, table)?.pos
        : undefined

    runTableCommand(editor, run, tablePos)
  }

  if (!activeWrapper) return null

  return createPortal(
    <div
      className="block-hover-actions block-hover-actions-table"
      role="toolbar"
      aria-label="Modifica tabella"
      onMouseDown={(e) => e.preventDefault()}
    >
      <span className="block-hover-group-label">Struttura</span>
      <BlockHoverButton
        title="Aggiungi riga"
        onClick={() => runInTable((chain) => chain.addRowAfter())}
      >
        <AppIcon icon={BetweenVerticalEnd} size="xs" />
      </BlockHoverButton>
      <BlockHoverButton
        title="Aggiungi colonna"
        onClick={() => runInTable((chain) => chain.addColumnAfter())}
      >
        <AppIcon icon={BetweenHorizontalEnd} size="xs" />
      </BlockHoverButton>
      <BlockHoverButton
        title="Elimina riga"
        onClick={() => runInTable((chain) => chain.deleteRow())}
      >
        <AppIcon icon={BetweenVerticalStart} size="xs" />
      </BlockHoverButton>
      <BlockHoverButton
        title="Elimina colonna"
        onClick={() => runInTable((chain) => chain.deleteColumn())}
      >
        <AppIcon icon={BetweenHorizontalStart} size="xs" />
      </BlockHoverButton>
      {onAiGenerateTable && (
        <>
          <span className="block-hover-divider" aria-hidden="true" />
          <span className="block-hover-group-label">AI</span>
          <BlockHoverButton
            title="Rigenera tabella con AI"
            onClick={() => {
              const table = activeWrapper?.querySelector('table')
              if (!(table instanceof HTMLTableElement)) return

              const found = findTablePosFromDom(editor, table)
              if (!found) return

              runInTable((chain) => chain)
              onAiGenerateTable(found.pos)
            }}
          >
            <AppIcon icon={Sparkles} size="xs" />
          </BlockHoverButton>
        </>
      )}
      <span className="block-hover-divider" aria-hidden="true" />
      <BlockHoverButton
        title="Elimina tabella"
        onClick={() => runInTable((chain) => chain.deleteTable())}
      >
        <AppIcon icon={X} size="xs" />
      </BlockHoverButton>
    </div>,
    activeWrapper,
  )
}
