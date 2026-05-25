import { useEffect, useRef, useState } from 'react'
import { ArrowUpDown, ChevronDown } from 'lucide-react'
import type { Editor } from '@tiptap/react'
import { LINE_HEIGHT_OPTIONS } from '../extensions/LineHeight'
import { AppIcon } from './LucideIcon'

interface ToolbarLineHeightMenuProps {
  editor: Editor
}

function getLineHeightAtCursor(editor: Editor): string {
  const { $from } = editor.state.selection
  for (let depth = $from.depth; depth > 0; depth -= 1) {
    const node = $from.node(depth)
    if (node.type.name === 'paragraph' || node.type.name === 'heading') {
      const lineHeight = node.attrs.lineHeight
      return typeof lineHeight === 'string' ? lineHeight : ''
    }
  }
  return ''
}

function getLineHeightLabel(value: string): string {
  if (!value) return 'Auto'
  return (
    LINE_HEIGHT_OPTIONS.find((option) => option.value === value)?.label ?? value
  )
}

export function ToolbarLineHeightMenu({ editor }: ToolbarLineHeightMenuProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const savedSelectionRef = useRef<{ from: number; to: number } | null>(null)

  const currentValue = getLineHeightAtCursor(editor)
  const currentLabel = getLineHeightLabel(currentValue)

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: PointerEvent) => {
      if (
        rootRef.current &&
        !rootRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [open])

  const applyLineHeight = (value: string) => {
    const saved = savedSelectionRef.current
    const chain = editor.chain().focus()

    if (saved) {
      chain.setTextSelection(saved)
    }

    if (value) {
      chain.setLineHeight(value).run()
    } else {
      chain.unsetLineHeight().run()
    }

    setOpen(false)
    savedSelectionRef.current = null
  }

  const toggleOpen = () => {
    if (!open) {
      const { from, to } = editor.state.selection
      savedSelectionRef.current = { from, to }
    }
    setOpen((wasOpen) => !wasOpen)
  }

  return (
    <div className="toolbar-line-height">
      <AppIcon icon={ArrowUpDown} size="sm" className="toolbar-line-height-icon" />
      <div className="toolbar-dropdown" ref={rootRef}>
        <button
          type="button"
          // className="toolbar-dropdown-trigger btn-with-icon"
          className="toolbar-dropdown-trigger "
          aria-label="Interlinea"
          aria-haspopup="listbox"
          aria-expanded={open}
          onMouseDown={(event) => {
            event.preventDefault()
            toggleOpen()
          }}
        >
          {currentLabel}
          <AppIcon icon={ChevronDown} size="xs" />
        </button>
        {open && (
          <ul className="toolbar-dropdown-menu" role="listbox" aria-label="Interlinea">
          <li role="presentation">
            <button
              type="button"
              role="option"
              aria-selected={currentValue === ''}
              className={
                currentValue === '' ? 'toolbar-dropdown-option active' : 'toolbar-dropdown-option'
              }
              onMouseDown={(event) => {
                event.preventDefault()
                applyLineHeight('')
              }}
            >
              Auto
            </button>
          </li>
          {LINE_HEIGHT_OPTIONS.map(({ label, value }) => (
            <li key={value} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={currentValue === value}
                className={
                  currentValue === value
                    ? 'toolbar-dropdown-option active'
                    : 'toolbar-dropdown-option'
                }
                onMouseDown={(event) => {
                  event.preventDefault()
                  applyLineHeight(value)
                }}
              >
                {label}
              </button>
            </li>
          ))}
        </ul>
        )}
      </div>
    </div>
  )
}
