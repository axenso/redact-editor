import type { WritingMode } from '../utils/writingMode'
import { WRITING_MODE_OPTIONS } from '../utils/writingMode'

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
  const active = WRITING_MODE_OPTIONS.find((option) => option.id === mode)

  return (
    <div className="writing-mode-select" role="group" aria-label="Modalità di scrittura">
      <label className="writing-mode-field">
        {/* <span className="writing-mode-label">Modalità</span> */}
        <select
          className="writing-mode-dropdown"
          value={mode}
          aria-label="Modalità di scrittura"
          title={active?.hint}
          onMouseDown={(event) => event.stopPropagation()}
          onChange={(event) => onChange(event.target.value as WritingMode)}
        >
          {WRITING_MODE_OPTIONS.map(({ id, label, hint }) => (
            <option key={id} value={id} title={hint}>
              {label}
            </option>
          ))}
        </select>
      </label>
      {error && (
        <p className="writing-mode-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
