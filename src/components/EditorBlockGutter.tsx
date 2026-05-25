import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import {
  Code,
  GripVertical,
  Image,
  List,
  ListOrdered,
  Minus,
  Plus,
  Quote,
  Table,
} from 'lucide-react'
import type { Editor } from '@tiptap/react'
import { AppIcon } from './LucideIcon'
import {
  EditorInsertMenuPanel,
  type EditorInsertMenuGroup,
} from './EditorInsertMenuPanel'
import {
  focusBlockEnd,
  focusBlockStart,
  getBlockDropTarget,
  resolveDraggableBlock,
  resolveGutterAtPoint,
  type GutterPosition,
} from '../utils/findEditorBlock'
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
  const [hoverGutterPos, setHoverGutterPos] = useState<GutterPosition | null>(null)
  const [menuAnchor, setMenuAnchor] = useState<GutterPosition | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dropIndicator, setDropIndicator] = useState<DropIndicator | null>(null)

  const closeMenu = useCallback(() => {
    setMenuOpen(false)
    setMenuAnchor(null)
  }, [])

  const syncHoveredBlock = useCallback(
    (clientX: number, clientY: number) => {
      if (!enabled || !shellRef.current || menuOpen) return

      const next = resolveGutterAtPoint(
        editor,
        shellRef.current,
        clientX,
        clientY,
      )
      if (!next) {
        if (!dragRef.current) setHoverGutterPos(null)
        return
      }

      setHoverGutterPos(next)
    },
    [editor, enabled, menuOpen],
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
      const anchor = menuOpen ? menuAnchor : hoverGutterPos
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
    [editor, menuOpen, menuAnchor, hoverGutterPos, closeMenu],
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
      setHoverGutterPos(null)
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
      if (!menuOpen && !dragRef.current) setHoverGutterPos(null)
    }

    window.addEventListener('mousemove', onMouseMove)
    shellRef.current?.addEventListener('mouseleave', onMouseLeave)

    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      shellRef.current?.removeEventListener('mouseleave', onMouseLeave)
    }
  }, [enabled, menuOpen, syncHoveredBlock])

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

  const activeBlockPos = menuOpen ? menuAnchor : hoverGutterPos

  const runAtBlock = useCallback(
    (command: (ed: Editor) => void) => {
      if (!activeBlockPos) return
      const block = editor.state.doc.nodeAt(activeBlockPos.blockPos)
      if (!block) return

      focusBlockStart(editor, activeBlockPos.blockPos)
      command(editor)
      closeMenu()
    },
    [editor, activeBlockPos, closeMenu],
  )

  const runAfterBlock = useCallback(
    (command: () => void) => {
      if (!activeBlockPos) return
      const block = editor.state.doc.nodeAt(activeBlockPos.blockPos)
      if (!block) return

      focusBlockEnd(editor, activeBlockPos.blockPos, block)
      command()
      closeMenu()
    },
    [editor, activeBlockPos, closeMenu],
  )

  const menuGroups: EditorInsertMenuGroup[] = [
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
            runAfterBlock(onInsertImage)
          },
        },
        {
          id: 'table',
          label: 'Table',
          icon: Table,
          onSelect: () => {
            if (!onInsertTable) return
            runAfterBlock(onInsertTable)
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
            runAfterBlock(onInsertImage)
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

  if (!enabled) return null

  const gutterPos = menuOpen ? menuAnchor : hoverGutterPos

  return (
    <div
      ref={shellRef}
      className={`editor-block-gutter-shell${isDragging ? ' editor-block-gutter-shell-dragging' : ''}${menuOpen ? ' editor-block-gutter-shell-menu-open' : ''}`}
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
          className={`editor-block-gutter${isDragging ? ' editor-block-gutter-active' : ''}`}
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
              if (!hoverGutterPos) return
              setMenuAnchor(hoverGutterPos)
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
