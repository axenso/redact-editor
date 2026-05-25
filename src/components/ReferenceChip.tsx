import { BookMarked } from 'lucide-react'
import { AppIcon } from './LucideIcon'

interface ReferenceChipProps {
  activeCount: number
  onClick: () => void
}

export function ReferenceChip({ activeCount, onClick }: ReferenceChipProps) {
  const hasActive = activeCount > 0
  const label =
    activeCount === 1
      ? '1 ref attiva'
      : hasActive
        ? `${activeCount} refs attive`
        : 'Referenze'

  return (
    <button
      type="button"
      className={
        hasActive
          ? 'reference-chip reference-chip-active btn-with-icon'
          : 'reference-chip btn-with-icon'
      }
      title="Gestisci referenze contestuali"
      onClick={onClick}
      aria-label={
        hasActive
          ? `${activeCount} referenze attive. Apri pannello referenze.`
          : 'Apri pannello referenze'
      }
    >
      <AppIcon icon={BookMarked} size="sm" />
      <span className="reference-chip-label">{label}</span>
      {hasActive && (
        <span className="reference-chip-badge" aria-hidden="true">
          {activeCount}
        </span>
      )}
    </button>
  )
}
