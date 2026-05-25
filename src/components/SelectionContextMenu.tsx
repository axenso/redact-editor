import { useCallback, useEffect, useRef, useState } from 'react'
import { Sparkles } from 'lucide-react'
import type { Editor } from '@tiptap/react'
import { AppIcon } from './LucideIcon'

interface SelectionContextMenuProps {
  editor: Editor
  enabled: boolean
  onAiClick: () => void
}

interface MenuPosition {
  x: number
  y: number
}

function hasTextSelection(editor: Editor): boolean {
  const { from, to } = editor.state.selection
  return from !== to && !editor.isActive('codeBlock')
}

export function SelectionContextMenu({
  editor,
  enabled,
  onAiClick,
}: SelectionContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState<MenuPosition | null>(null)

  const closeMenu = useCallback(() => setPosition(null), [])

  useEffect(() => {
    if (!enabled) {
      setPosition(null)
      return
    }

    const dom = editor.view.dom

    const handleContextMenu = (event: MouseEvent) => {
      if (!hasTextSelection(editor)) return

      event.preventDefault()
      setPosition({ x: event.clientX, y: event.clientY })
    }

    dom.addEventListener('contextmenu', handleContextMenu)
    return () => dom.removeEventListener('contextmenu', handleContextMenu)
  }, [editor, enabled])

  useEffect(() => {
    if (!position) return

    const handleDismiss = (event: MouseEvent) => {
      if (menuRef.current?.contains(event.target as Node)) return
      closeMenu()
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMenu()
    }

    window.addEventListener('mousedown', handleDismiss)
    window.addEventListener('scroll', handleDismiss, true)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('mousedown', handleDismiss)
      window.removeEventListener('scroll', handleDismiss, true)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [position, closeMenu])

  const handleAiClick = () => {
    closeMenu()
    onAiClick()
  }

  if (!enabled || !position) return null

  return (
    <div
      ref={menuRef}
      className="context-menu"
      style={{ top: position.y, left: position.x }}
      role="menu"
    >
      <button
        type="button"
        className="context-menu-btn btn-with-icon"
        role="menuitem"
        onMouseDown={(event) => event.preventDefault()}
        onClick={handleAiClick}
      >
        <AppIcon icon={Sparkles} size="sm" />
        Modifica con AI
      </button>
    </div>
  )
}
