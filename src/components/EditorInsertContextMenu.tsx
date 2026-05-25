import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Editor } from '@tiptap/react'
import {
  EditorInsertMenuPanel,
  type EditorInsertMenuGroup,
} from './EditorInsertMenuPanel'
import {
  buildAiInsertMenuGroups,
  hasAiTextSelection,
} from '../utils/editorInsertMenuGroups'

interface EditorInsertContextMenuProps {
  editor: Editor
  enabled: boolean
  onAiClick: () => void
  onAiQuickAction: (instruction: string) => void
}

interface MenuState {
  x: number
  y: number
}

export function EditorInsertContextMenu({
  editor,
  enabled,
  onAiClick,
  onAiQuickAction,
}: EditorInsertContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const [menuState, setMenuState] = useState<MenuState | null>(null)

  const closeMenu = useCallback(() => setMenuState(null), [])

  useEffect(() => {
    if (!enabled) {
      setMenuState(null)
      return
    }

    const dom = editor.view.dom

    const handleContextMenu = (event: MouseEvent) => {
      if (!hasAiTextSelection(editor)) return

      event.preventDefault()
      setMenuState({
        x: event.clientX,
        y: event.clientY,
      })
    }

    dom.addEventListener('contextmenu', handleContextMenu)
    return () => dom.removeEventListener('contextmenu', handleContextMenu)
  }, [editor, enabled])

  useEffect(() => {
    if (!menuState) return

    const handleDismiss = (event: MouseEvent) => {
      if (menuRef.current?.contains(event.target as Node)) return
      closeMenu()
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMenu()
    }

    window.addEventListener('mousedown', handleDismiss)
    window.addEventListener('scroll', closeMenu, true)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('mousedown', handleDismiss)
      window.removeEventListener('scroll', closeMenu, true)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [menuState, closeMenu])

  const groups = useMemo<EditorInsertMenuGroup[]>(() => {
    if (!menuState) return []

    return buildAiInsertMenuGroups({
      onAiClick: () => {
        closeMenu()
        onAiClick()
      },
      onAiQuickAction: (instruction) => {
        closeMenu()
        onAiQuickAction(instruction)
      },
    })
  }, [menuState, closeMenu, onAiClick, onAiQuickAction])

  if (!enabled || !menuState || groups.length === 0) return null

  return (
    <div
      ref={menuRef}
      className="editor-insert-context-menu"
      style={{ top: menuState.y, left: menuState.x }}
      role="presentation"
    >
      <EditorInsertMenuPanel groups={groups} className="editor-insert-menu-bubble" />
    </div>
  )
}
