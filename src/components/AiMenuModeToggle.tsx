import type { AiMenuMode } from '../hooks/useLocalStorage'

interface AiMenuModeToggleProps {
  mode: AiMenuMode
  onChange: (mode: AiMenuMode) => void
}

export function AiMenuModeToggle({ mode, onChange }: AiMenuModeToggleProps) {
  return (
    <div className="ai-menu-toggle" role="group" aria-label="Modalità menu AI">
      <span className="ai-menu-toggle-label">Options:</span>
      <button
        type="button"
        className={mode === 'bubble' ? 'ai-menu-toggle-btn active' : 'ai-menu-toggle-btn'}
        aria-pressed={mode === 'bubble'}
        onClick={() => onChange('bubble')}
        title="Menu a comparsa sulla selezione del testo"
      >
        ONE
      </button>
      <button
        type="button"
        className={
          mode === 'contextmenu' ? 'ai-menu-toggle-btn active' : 'ai-menu-toggle-btn'
        }
        aria-pressed={mode === 'contextmenu'}
        onClick={() => onChange('contextmenu')}
        title="Menu contestuale al click destro sulla selezione"
      >
        TWO
      </button>
      <button
        type="button"
        className={mode === 'toolbar' ? 'ai-menu-toggle-btn active' : 'ai-menu-toggle-btn'}
        aria-pressed={mode === 'toolbar'}
        onClick={() => onChange('toolbar')}
        title="Usa solo il pulsante Modifica con AI nella barra di editing"
      >
        THREE
      </button>
    </div>
  )
}
