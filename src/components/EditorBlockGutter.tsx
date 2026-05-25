import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import {
  GripVertical,
  Plus,
} from 'lucide-react'
import type { Editor } from '@tiptap/react'
import { AppIcon } from './LucideIcon'
import {
  EditorInsertMenuPanel,
} from './EditorInsertMenuPanel'
import {
  focusBlockEnd,
  focusBlockStart,
  getBlockDropTarget,
  resolveDraggableBlock,
  resolveGutterAtPoint,
  resolveGutterForBlockPos,
  resolveGutterFromFocus,
  type GutterPosition,
} from '../utils/findEditorBlock'
import {
  buildBlockInsertMenuGroups,
} from '../utils/editorInsertMenuGroups'
import { moveEditorBlock } from '../utils/moveEditorBlock'

interface EditorBlockGutterProps {
  editor: Editor
  enabled: boolean
  onInsertImage?: () => void
  onInsertTable?: () => void
}

interface DropIndicator {
  top: number
}

export function EditorBlockGutter({
  editor,
  enabled,
  onInsertImage,
  onInsertTable,
}: EditorBlockGutterProps) {
  const shellRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{
    blockPos: number
    pointerId: number
  } | null>(null)
  const hoverGutterPosRef = useRef<GutterPosition | null>(null)
  const [hoverGutterPos, setHoverGutterPos] = useState<GutterPosition | null>(null)
  const [focusGutterPos, setFocusGutterPos] = useState<GutterPosition | null>(null)
  const [menuAnchor, setMenuAnchor] = useState<GutterPosition | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dropIndicator, setDropIndicator] = useState<DropIndicator | null>(null)

  const closeMenu = useCallback(() => {
    setMenuOpen(false)
    setMenuAnchor(null)
  }, [])

  const updateHoverGutterPos = useCallback((next: GutterPosition | null) => {
    hoverGutterPosRef.current = next
    setHoverGutterPos(next)
  }, [])

  const refreshHoverGutterPos = useCallback(() => {
    const shell = shellRef.current
    const current = hoverGutterPosRef.current
    if (!shell || !current) return

    const updated = resolveGutterForBlockPos(editor, shell, current.blockPos)
    if (updated) updateHoverGutterPos(updated)
  }, [editor, updateHoverGutterPos])

  const syncFocusGutter = useCallback(() => {
    const shell = shellRef.current
    if (!shell || !enabled) {
      setFocusGutterPos(null)
      return
    }

    setFocusGutterPos(resolveGutterFromFocus(editor, shell))
  }, [editor, enabled])

  const syncMenuAnchorToFocus = useCallback(() => {
    const shell = shellRef.current
    if (!shell) return

    const next = resolveGutterFromFocus(editor, shell)
    if (!next) return

    updateHoverGutterPos(next)
    setMenuAnchor(next)
    setMenuOpen(true)
  }, [editor, updateHoverGutterPos])

  const keepMenuOpenAfterCommand = useCallback(() => {
    if (!menuOpen) {
      closeMenu()
      return
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(syncMenuAnchorToFocus)
    })
  }, [menuOpen, closeMenu, syncMenuAnchorToFocus])

  const syncHoveredBlock = useCallback(
    (clientX: number, clientY: number) => {
      if (!enabled || !shellRef.current || menuOpen) return

      const target = document.elementFromPoint(clientX, clientY)
      if (
        target?.closest('.editor-block-gutter') ||
        target?.closest('.editor-block-gutter-menu')
      ) {
        refreshHoverGutterPos()
        return
      }

      const next = resolveGutterAtPoint(
        editor,
        shellRef.current,
        clientX,
        clientY,
      )
      if (!next) {
        if (!dragRef.current && !focusGutterPos) updateHoverGutterPos(null)
        return
      }

      updateHoverGutterPos(next)
    },
    [
      editor,
      enabled,
      menuOpen,
      focusGutterPos,
      refreshHoverGutterPos,
      updateHoverGutterPos,
    ],
  )

  const handleDragMove = useCallback(
    (clientY: number) => {
      const drag = dragRef.current
      const shell = shellRef.current
      if (!drag || !shell) return

      const shellRect = shell.getBoundingClientRect()
      const dropTarget = getBlockDropTarget(
        editor,
        clientY,
        shellRect.top,
        drag.blockPos,
      )
      setDropIndicator(dropTarget ? { top: dropTarget.indicatorTop } : null)
    },
    [editor],
  )

  const finishDrag = useCallback(
    (clientY: number | null) => {
      const drag = dragRef.current
      dragRef.current = null
      setIsDragging(false)
      setDropIndicator(null)

      if (!drag || clientY == null) return

      const shell = shellRef.current
      if (!shell) return

      const shellRect = shell.getBoundingClientRect()
      const dropTarget = getBlockDropTarget(
        editor,
        clientY,
        shellRect.top,
        drag.blockPos,
      )

      if (dropTarget) {
        moveEditorBlock(editor, drag.blockPos, dropTarget.insertPos)
      }
    },
    [editor],
  )

  const handleHandlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      const anchor = menuOpen
        ? menuAnchor
        : (focusGutterPos ?? hoverGutterPos)
      if (!anchor) return

      const draggable = resolveDraggableBlock(editor, anchor.blockPos)
      if (!draggable) return

      event.preventDefault()
      event.stopPropagation()
      closeMenu()

      dragRef.current = {
        blockPos: draggable.pos,
        pointerId: event.pointerId,
      }
      setIsDragging(true)
      event.currentTarget.setPointerCapture(event.pointerId)
    },
    [editor, menuOpen, menuAnchor, hoverGutterPos, focusGutterPos, closeMenu],
  )

  const handleHandlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      if (dragRef.current?.pointerId !== event.pointerId) return
      handleDragMove(event.clientY)
    },
    [handleDragMove],
  )

  const handleHandlePointerUp = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      if (dragRef.current?.pointerId !== event.pointerId) return

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId)
      }

      finishDrag(event.clientY)
    },
    [finishDrag],
  )

  const handleHandlePointerCancel = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      if (dragRef.current?.pointerId !== event.pointerId) return

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId)
      }

      finishDrag(null)
    },
    [finishDrag],
  )

  useEffect(() => {
    if (!isDragging) return

    document.body.classList.add('editor-block-dragging')
    return () => {
      document.body.classList.remove('editor-block-dragging')
    }
  }, [isDragging])

  useEffect(() => {
    if (!enabled) {
      updateHoverGutterPos(null)
      setFocusGutterPos(null)
      setMenuAnchor(null)
      setMenuOpen(false)
      setIsDragging(false)
      setDropIndicator(null)
      dragRef.current = null
      return
    }

    const onMouseMove = (event: MouseEvent) => {
      syncHoveredBlock(event.clientX, event.clientY)
    }

    const onMouseLeave = () => {
      if (!menuOpen && !dragRef.current && !focusGutterPos) {
        updateHoverGutterPos(null)
      }
    }

    window.addEventListener('mousemove', onMouseMove)
    shellRef.current?.addEventListener('mouseleave', onMouseLeave)

    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      shellRef.current?.removeEventListener('mouseleave', onMouseLeave)
    }
  }, [enabled, menuOpen, focusGutterPos, syncHoveredBlock, updateHoverGutterPos])

  useEffect(() => {
    if (!enabled || !hoverGutterPos) return

    const sync = () => refreshHoverGutterPos()

    window.addEventListener('scroll', sync, true)
    window.addEventListener('resize', sync)

    return () => {
      window.removeEventListener('scroll', sync, true)
      window.removeEventListener('resize', sync)
    }
  }, [enabled, hoverGutterPos, refreshHoverGutterPos])

  useEffect(() => {
    if (!enabled) return

    const sync = () => syncFocusGutter()

    sync()
    editor.on('selectionUpdate', sync)
    editor.on('transaction', sync)
    window.addEventListener('scroll', sync, true)
    window.addEventListener('resize', sync)

    return () => {
      editor.off('selectionUpdate', sync)
      editor.off('transaction', sync)
      window.removeEventListener('scroll', sync, true)
      window.removeEventListener('resize', sync)
    }
  }, [editor, enabled, syncFocusGutter])

  useEffect(() => {
    if (!enabled || !menuOpen) return

    const syncMenuAnchor = () => {
      const shell = shellRef.current
      if (!shell) return

      const next = resolveGutterFromFocus(editor, shell)
      if (next) setMenuAnchor(next)
    }

    syncMenuAnchor()
    editor.on('selectionUpdate', syncMenuAnchor)
    editor.on('transaction', syncMenuAnchor)
    window.addEventListener('scroll', syncMenuAnchor, true)
    window.addEventListener('resize', syncMenuAnchor)

    return () => {
      editor.off('selectionUpdate', syncMenuAnchor)
      editor.off('transaction', syncMenuAnchor)
      window.removeEventListener('scroll', syncMenuAnchor, true)
      window.removeEventListener('resize', syncMenuAnchor)
    }
  }, [editor, enabled, menuOpen])

  useEffect(() => {
    if (!menuOpen) return

    const handleDismiss = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (
        menuRef.current?.contains(target) ||
        target.closest('.editor-block-gutter-shell') ||
        target.closest('.editor-block-gutter')
      ) {
        return
      }
      closeMenu()
    }

    window.addEventListener('mousedown', handleDismiss)
    window.addEventListener('scroll', closeMenu, true)

    return () => {
      window.removeEventListener('mousedown', handleDismiss)
      window.removeEventListener('scroll', closeMenu, true)
    }
  }, [menuOpen, closeMenu])

  const activeBlockPos = menuOpen
    ? menuAnchor
    : (focusGutterPos ?? hoverGutterPos)

  const runAtBlock = useCallback(
    (command: (ed: Editor) => void) => {
      const blockPos = menuOpen ? menuAnchor?.blockPos : activeBlockPos?.blockPos
      if (blockPos == null) return

      const block = editor.state.doc.nodeAt(blockPos)
      if (!block) return

      focusBlockStart(editor, blockPos)
      command(editor)
      keepMenuOpenAfterCommand()
    },
    [editor, menuOpen, menuAnchor, activeBlockPos, keepMenuOpenAfterCommand],
  )

  const runAfterBlock = useCallback(
    (command: () => void, closeAfter = false) => {
      const blockPos = menuOpen ? menuAnchor?.blockPos : activeBlockPos?.blockPos
      if (blockPos == null) return

      const block = editor.state.doc.nodeAt(blockPos)
      if (!block) return

      focusBlockEnd(editor, blockPos, block)
      command()

      if (closeAfter) {
        closeMenu()
        return
      }

      keepMenuOpenAfterCommand()
    },
    [
      editor,
      menuOpen,
      menuAnchor,
      activeBlockPos,
      closeMenu,
      keepMenuOpenAfterCommand,
    ],
  )

  const menuGroups = buildBlockInsertMenuGroups({
    runAtBlock,
    runAfterBlock,
    onInsertImage,
    onInsertTable,
  })

  if (!enabled) return null

  const gutterPos = menuOpen ? menuAnchor : (focusGutterPos ?? hoverGutterPos)
  const isGutterActive = Boolean(gutterPos && !menuOpen)

  return (
    <div
      ref={shellRef}
      className={`editor-block-gutter-shell${isDragging ? ' editor-block-gutter-shell-dragging' : ''}${menuOpen ? ' editor-block-gutter-shell-menu-open' : ''}${isGutterActive ? ' editor-block-gutter-shell-active' : ''}`}
      aria-hidden={!gutterPos && !dropIndicator && !menuOpen}
    >
      {dropIndicator && (
        <div
          className="editor-block-drop-indicator"
          style={{ top: dropIndicator.top }}
        />
      )}

      {gutterPos && (
        <div
          className={`editor-block-gutter${isDragging ? ' editor-block-gutter-active' : ''}${isGutterActive ? ' editor-block-gutter-visible' : ''}`}
          style={{ top: gutterPos.top }}
        >
          <button
            type="button"
            className="editor-block-gutter-handle"
            tabIndex={-1}
            aria-label="Trascina per spostare il blocco"
            onPointerDown={handleHandlePointerDown}
            onPointerMove={handleHandlePointerMove}
            onPointerUp={handleHandlePointerUp}
            onPointerCancel={handleHandlePointerCancel}
          >
            <AppIcon icon={GripVertical} size="sm" />
          </button>
          <button
            type="button"
            className="editor-block-gutter-plus"
            aria-label="Inserisci blocco"
            aria-expanded={menuOpen}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              if (menuOpen) {
                closeMenu()
                return
              }
              if (!hoverGutterPos && !focusGutterPos) return
              setMenuAnchor(focusGutterPos ?? hoverGutterPos)
              setMenuOpen(true)
            }}
          >
            <AppIcon icon={Plus} size="sm" />
          </button>
        </div>
      )}

      {menuAnchor && menuOpen && (
        <div
          ref={menuRef}
          className="editor-block-gutter-menu"
          style={{ top: menuAnchor.top + 28 }}
        >
          <EditorInsertMenuPanel groups={menuGroups} />
        </div>
      )}
    </div>
  )
}
