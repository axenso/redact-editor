import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { WritingMode } from '../utils/writingMode'
import { WRITING_MODE_OPTIONS } from '../utils/writingMode'
import { AppIcon } from './LucideIcon'

interface WritingModeSelectProps {
  mode: WritingMode
  error?: string | null
  onChange: (mode: WritingMode) => void
}

export function WritingModeSelect({
  mode,
  error,
  onChange,
}: WritingModeSelectProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const active = WRITING_MODE_OPTIONS.find((option) => option.id === mode)

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

  const handleSelect = (nextMode: WritingMode) => {
    onChange(nextMode)
    setOpen(false)
  }

  return (
    <div
      className="export-menu writing-mode-select"
      ref={rootRef}
      role="group"
      aria-label="Modalità di scrittura"
    >
      <button
        type="button"
        className={
          open
            ? 'export-menu-trigger ai-menu-trigger writing-mode-trigger active'
            : 'export-menu-trigger ai-menu-trigger writing-mode-trigger'
        }
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Modalità di scrittura: ${active?.label ?? mode}`}
        title={active?.hint ?? 'Modalità di scrittura'}
        onMouseDown={(event) => event.stopPropagation()}
        onClick={() => setOpen((wasOpen) => !wasOpen)}
      >
        <span className="ai-menu-trigger-label">{active?.label ?? mode}</span>
        <AppIcon icon={ChevronDown} size="xs" className="ai-menu-trigger-chevron" />
      </button>

      {open && (
        <ul
          className="export-menu-dropdown writing-mode-dropdown-panel"
          role="menu"
          aria-label="Modalità di scrittura"
        >
          {WRITING_MODE_OPTIONS.map(({ id, label, hint }) => (
            <li key={id} role="none">
              <button
                type="button"
                role="menuitemradio"
                aria-checked={mode === id}
                className={
                  mode === id
                    ? 'export-menu-item export-menu-item-active'
                    : 'export-menu-item'
                }
                onClick={() => handleSelect(id)}
              >
                <span className="export-menu-item-label">{label}</span>
                <span className="export-menu-item-hint">{hint}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p className="writing-mode-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
