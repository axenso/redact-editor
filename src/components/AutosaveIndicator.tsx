import type { AutosaveStatus } from '../hooks/useAutosave'

interface AutosaveIndicatorProps {
  status: AutosaveStatus
  lastSavedAt: Date | null
}

function formatSavedTime(date: Date): string {
  return new Intl.DateTimeFormat('it-IT', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function AutosaveIndicator({ status, lastSavedAt }: AutosaveIndicatorProps) {
  let label = 'Salvato'
  let className = 'autosave-indicator autosave-saved'

  if (status === 'saving') {
    label = 'Salvataggio…'
    className = 'autosave-indicator autosave-saving'
  } else if (status === 'error') {
    label = 'Errore salvataggio'
    className = 'autosave-indicator autosave-error'
  } else if (lastSavedAt) {
    label = `Salvato alle ${formatSavedTime(lastSavedAt)}`
  }

  return (
    <span className={className} role="status" aria-live="polite">
      <span className="autosave-dot" aria-hidden="true" />
      {label}
    </span>
  )
}
