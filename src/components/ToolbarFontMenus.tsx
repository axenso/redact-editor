import { useEffect, useRef, useState } from 'react'
import { CaseSensitive, ChevronDown, Type } from 'lucide-react'
import type { Editor } from '@tiptap/react'
import {
  EDITOR_FONT_OPTIONS,
  getFontFamilyLabel,
} from '../extensions/FontFamily'
import {
  EDITOR_FONT_SIZE_OPTIONS,
  getFontSizeAtCursor,
  getFontSizeLabel,
} from '../extensions/FontSize'
import { AppIcon } from './LucideIcon'

interface ToolbarFontMenusProps {
  editor: Editor
}

interface FontDropdownProps {
  editor: Editor
  ariaLabel: string
  icon: typeof Type
  currentLabel: string
  options: ReadonlyArray<{ label: string; value: string }>
  currentValue: string
  onApply: (
    editor: Editor,
    value: string,
    selection: { from: number; to: number } | null,
  ) => void
  minWidth?: string
}

function FontDropdown({
  editor,
  ariaLabel,
  icon,
  currentLabel,
  options,
  currentValue,
  onApply,
  minWidth = '4.75rem',
}: FontDropdownProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const savedSelectionRef = useRef<{ from: number; to: number } | null>(null)

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

  const applyValue = (value: string) => {
    const saved = savedSelectionRef.current
    onApply(editor, value, saved)
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
    <div className="toolbar-font-control">
      <AppIcon icon={icon} size="sm" className="toolbar-font-control-icon" />
      <div className="toolbar-dropdown" ref={rootRef}>
        <button
          type="button"
          className="toolbar-dropdown-trigger btn-with-icon"
          aria-label={ariaLabel}
          aria-haspopup="listbox"
          aria-expanded={open}
          style={{ minWidth }}
          onMouseDown={(event) => {
            event.preventDefault()
            toggleOpen()
          }}
        >
          {currentLabel}
          <AppIcon icon={ChevronDown} size="xs" />
        </button>
        {open && (
          <ul
            className="toolbar-dropdown-menu"
            role="listbox"
            aria-label={ariaLabel}
          >
            {options.map(({ label, value }) => (
              <li key={value || 'default'} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={currentValue === value}
                  className={
                    currentValue === value
                      ? 'toolbar-dropdown-option active'
                      : 'toolbar-dropdown-option'
                  }
                  style={value && ariaLabel === 'Carattere' ? { fontFamily: value } : undefined}
                  onMouseDown={(event) => {
                    event.preventDefault()
                    applyValue(value)
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

function applyFontFamily(
  editor: Editor,
  value: string,
  selection: { from: number; to: number } | null,
) {
  let chain = editor.chain().focus()
  if (selection) {
    chain = chain.setTextSelection(selection)
  }
  if (value) {
    chain.setFontFamily(value).run()
    return
  }
  chain.unsetFontFamily().run()
}

function applyFontSize(
  editor: Editor,
  value: string,
  selection: { from: number; to: number } | null,
) {
  let chain = editor.chain().focus()
  if (selection) {
    chain = chain.setTextSelection(selection)
  }
  if (value) {
    chain.setFontSize(value).run()
    return
  }
  chain.unsetFontSize().run()
}

export function ToolbarFontMenus({ editor }: ToolbarFontMenusProps) {
  const [fontFamily, setFontFamily] = useState('')
  const [fontSize, setFontSize] = useState('')

  useEffect(() => {
    const sync = () => {
      const textStyle = editor.getAttributes('textStyle')
      setFontFamily(
        typeof textStyle.fontFamily === 'string' ? textStyle.fontFamily : '',
      )
      setFontSize(getFontSizeAtCursor(editor))
    }

    sync()
    editor.on('selectionUpdate', sync)
    editor.on('transaction', sync)

    return () => {
      editor.off('selectionUpdate', sync)
      editor.off('transaction', sync)
    }
  }, [editor])

  return (
    <div className="toolbar-font-menus">
      <FontDropdown
        editor={editor}
        ariaLabel="Carattere"
        icon={CaseSensitive}
        currentLabel={getFontFamilyLabel(fontFamily)}
        currentValue={fontFamily}
        options={EDITOR_FONT_OPTIONS}
        onApply={applyFontFamily}
        minWidth="6.5rem"
      />
      <FontDropdown
        editor={editor}
        ariaLabel="Dimensione testo"
        icon={Type}
        currentLabel={getFontSizeLabel(fontSize)}
        currentValue={fontSize}
        options={EDITOR_FONT_SIZE_OPTIONS}
        onApply={applyFontSize}
        minWidth="3.75rem"
      />
    </div>
  )
}
