import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { Editor } from '@tiptap/react'
import {
  findPaletteColor,
  TEXT_COLOR_PALETTE,
} from '../constants/textColors'
import {
  colorsEqual,
  normalizeColor,
  toColorInputValue,
  toDisplayColor,
} from '../utils/colorUtils'
import { AppIcon } from './LucideIcon'

interface ToolbarColorMenuProps {
  editor: Editor
}

interface CurrentColorState {
  value: string | null
  label: string
  preview: string
}

function getCurrentColorState(editor: Editor): CurrentColorState {
  const raw = editor.getAttributes('textStyle').color
  if (typeof raw !== 'string' || !raw.trim()) {
    return {
      value: null,
      label: 'Automatico',
      preview: '#1a1a1a',
    }
  }

  const normalized = normalizeColor(raw)
  const preset = findPaletteColor(normalized)

  return {
    value: normalized,
    label: preset?.label ?? normalized.toUpperCase(),
    preview: toDisplayColor(normalized),
  }
}

export function ToolbarColorMenu({ editor }: ToolbarColorMenuProps) {
  const [open, setOpen] = useState(false)
  const [currentColor, setCurrentColor] = useState<CurrentColorState>(() =>
    getCurrentColorState(editor),
  )
  const [customColor, setCustomColor] = useState('#2563eb')
  const rootRef = useRef<HTMLDivElement>(null)
  const savedSelectionRef = useRef<{ from: number; to: number } | null>(null)

  useEffect(() => {
    const sync = () => {
      const next = getCurrentColorState(editor)
      setCurrentColor(next)
      if (next.value) {
        setCustomColor(toColorInputValue(next.value))
      }
    }

    sync()
    editor.on('selectionUpdate', sync)
    editor.on('transaction', sync)

    return () => {
      editor.off('selectionUpdate', sync)
      editor.off('transaction', sync)
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

  const applyColor = (value: string | null) => {
    const saved = savedSelectionRef.current
    let chain = editor.chain().focus()

    if (saved) {
      chain = chain.setTextSelection(saved)
    }

    if (value) {
      chain.setColor(value).run()
    } else {
      chain.unsetColor().run()
    }

    setOpen(false)
    savedSelectionRef.current = null
  }

  const toggleOpen = () => {
    if (!open) {
      const { from, to } = editor.state.selection
      savedSelectionRef.current = { from, to }
      if (currentColor.value) {
        setCustomColor(toColorInputValue(currentColor.value))
      }
    }
    setOpen((wasOpen) => !wasOpen)
  }

  const isPaletteColorActive = (value: string) =>
    currentColor.value !== null && colorsEqual(currentColor.value, value)

  return (
    <div className="toolbar-color-menu">
      {/* <AppIcon icon={Palette} size="sm" className="toolbar-color-menu-icon" /> */}
      <div className="toolbar-dropdown" ref={rootRef}>
        <button
          type="button"
          className="toolbar-dropdown-trigger toolbar-color-trigger btn-with-icon"
          aria-label="Colore testo"
          aria-haspopup="dialog"
          aria-expanded={open}
          onMouseDown={(event) => {
            event.preventDefault()
            toggleOpen()
          }}
        >
          <span
            className={
              currentColor.value
                ? 'color-swatch color-swatch-trigger'
                : 'color-swatch color-swatch-trigger color-swatch-auto'
            }
            style={{ backgroundColor: currentColor.preview }}
            aria-hidden
          />
          {currentColor.label}
          <AppIcon icon={ChevronDown} size="xs" />
        </button>
        {open && (
          <div
            className="toolbar-dropdown-menu toolbar-color-menu-panel"
            role="dialog"
            aria-label="Colore testo"
          >
            <button
              type="button"
              className={
                currentColor.value === null
                  ? 'toolbar-color-auto active'
                  : 'toolbar-color-auto'
              }
              onMouseDown={(event) => {
                event.preventDefault()
                applyColor(null)
              }}
            >
              <span
                className="color-swatch color-swatch-auto"
                aria-hidden
              />
              Automatico
            </button>

            <div
              className="toolbar-color-palette"
              role="listbox"
              aria-label="Tavolozza colori"
            >
              {TEXT_COLOR_PALETTE.map(({ label, value }) => (
                <button
                  key={value}
                  type="button"
                  role="option"
                  title={label}
                  aria-label={label}
                  aria-selected={isPaletteColorActive(value)}
                  className={
                    isPaletteColorActive(value)
                      ? 'toolbar-color-palette-swatch active'
                      : 'toolbar-color-palette-swatch'
                  }
                  style={{ backgroundColor: value }}
                  onMouseDown={(event) => {
                    event.preventDefault()
                    applyColor(value)
                  }}
                />
              ))}
            </div>

            <div className="toolbar-color-custom">
              <label className="toolbar-color-custom-label" htmlFor="toolbar-custom-color">
                Personalizzato
              </label>
              <input
                id="toolbar-custom-color"
                type="color"
                className="toolbar-color-custom-input"
                value={customColor}
                onChange={(event) => setCustomColor(event.target.value)}
              />
              <button
                type="button"
                className="toolbar-color-custom-apply"
                onMouseDown={(event) => {
                  event.preventDefault()
                  applyColor(customColor)
                }}
              >
                Applica
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
