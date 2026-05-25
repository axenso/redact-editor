import { useEffect, useRef, useState } from 'react'
import { Sparkles } from 'lucide-react'
import type { AiMenuMode } from '../hooks/useLocalStorage'
import { AppIcon } from './LucideIcon'

interface AiMenuModeToggleProps {
  mode: AiMenuMode
  onChange: (mode: AiMenuMode) => void
}

const AI_MENU_OPTIONS: {
  id: AiMenuMode
  label: string
  hint: string
}[] = [
  {
    id: 'bubble',
    label: 'ONE',
    hint: 'Gutter + e menu AI al click destro sulla selezione',
  },
  {
    id: 'contextmenu',
    label: 'TWO',
    hint: 'Menu contestuale al click destro sulla selezione',
  },
  {
    id: 'toolbar',
    label: 'THREE',
    hint: 'Solo pulsante Modifica con AI nella barra di editing',
  },
]

export function AiMenuModeToggle({ mode, onChange }: AiMenuModeToggleProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const active = AI_MENU_OPTIONS.find((option) => option.id === mode)

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

  const handleSelect = (nextMode: AiMenuMode) => {
    onChange(nextMode)
    setOpen(false)
  }

  return (
    <div className="export-menu ai-menu-dropdown" ref={rootRef}>
      <button
        type="button"
        className={
          open
            ? 'export-menu-trigger ai-menu-trigger active'
            : 'export-menu-trigger ai-menu-trigger'
        }
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Modalità menu AI: ${active?.label ?? mode}`}
        title={active?.hint ?? 'Modalità menu AI'}
        onClick={() => setOpen((wasOpen) => !wasOpen)}
      >
        <AppIcon icon={Sparkles} size="sm" />
        <span className="ai-menu-trigger-label">{active?.label ?? mode}</span>
      </button>

      {open && (
        <ul
          className="export-menu-dropdown ai-menu-dropdown-panel"
          role="menu"
          aria-label="Modalità menu AI"
        >
          {AI_MENU_OPTIONS.map(({ id, label, hint }) => (
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
    </div>
  )
}
