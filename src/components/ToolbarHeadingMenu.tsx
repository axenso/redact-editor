import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { Editor } from '@tiptap/react'
import { AppIcon } from './LucideIcon'

interface ToolbarHeadingMenuProps {
  editor: Editor
}

const HEADING_OPTIONS = [
  { label: 'Titolo 1', level: 1 as const },
  { label: 'Titolo 2', level: 2 as const },
  { label: 'Titolo 3', level: 3 as const },
]

function getHeadingLabel(editor: Editor): string {
  for (const { label, level } of HEADING_OPTIONS) {
    if (editor.isActive('heading', { level })) return label
  }
  return 'Titolo'
}

export function ToolbarHeadingMenu({ editor }: ToolbarHeadingMenuProps) {
  const [open, setOpen] = useState(false)
  const [currentLabel, setCurrentLabel] = useState(() => getHeadingLabel(editor))
  const rootRef = useRef<HTMLDivElement>(null)
  const savedSelectionRef = useRef<{ from: number; to: number } | null>(null)

  useEffect(() => {
    const syncLabel = () => setCurrentLabel(getHeadingLabel(editor))
    syncLabel()
    editor.on('selectionUpdate', syncLabel)
    editor.on('transaction', syncLabel)
    return () => {
      editor.off('selectionUpdate', syncLabel)
      editor.off('transaction', syncLabel)
    }
  }, [editor])

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [open])

  const applyHeading = (level: 1 | 2 | 3) => {
    const saved = savedSelectionRef.current
    const chain = editor.chain().focus()

    if (saved) {
      chain.setTextSelection(saved)
    }

    chain.toggleHeading({ level }).run()
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

  const activeLevel = HEADING_OPTIONS.find(({ level }) =>
    editor.isActive('heading', { level }),
  )?.level
  const isHeadingActive = activeLevel !== undefined

  return (
    <div className="toolbar-dropdown" ref={rootRef}>
      <button
        type="button"
        className={
          isHeadingActive
            ? 'toolbar-dropdown-trigger btn-with-icon active'
            : 'toolbar-dropdown-trigger btn-with-icon'
        }
        aria-label="Titolo"
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
        <ul className="toolbar-dropdown-menu" role="listbox" aria-label="Titolo">
          {HEADING_OPTIONS.map(({ label, level }) => (
            <li key={level} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={activeLevel === level}
                className={
                  activeLevel === level
                    ? 'toolbar-dropdown-option active'
                    : 'toolbar-dropdown-option'
                }
                onMouseDown={(event) => {
                  event.preventDefault()
                  applyHeading(level)
                }}
              >
                {label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
