import {
  Monitor,
  RotateCwSquare,
  type LucideIcon,
} from 'lucide-react'
import {
  PAGE_FORMATS,
  type PageFormatId,
  type PageOrientation,
} from '../constants/pageFormat'
import { AppIcon } from './LucideIcon'

interface PageFormatSelectProps {
  formatId: PageFormatId
  orientation: PageOrientation
  onFormatChange: (format: PageFormatId) => void
  onOrientationChange: (orientation: PageOrientation) => void
}

const ORIENTATION_ICONS: Record<PageOrientation, LucideIcon> = {
  portrait: Monitor,
  landscape: RotateCwSquare,
}

export function PageFormatSelect({
  formatId,
  orientation,
  onFormatChange,
  onOrientationChange,
}: PageFormatSelectProps) {
  const nextOrientation = orientation === 'portrait' ? 'landscape' : 'portrait'

  return (
    <div className="page-format-select" role="group" aria-label="Formato pagina">
      <label className="page-format-field">
        <span className="page-format-label">Pagina</span>
        <select
          className="page-format-dropdown"
          value={formatId}
          aria-label="Formato pagina"
          onMouseDown={(e) => e.stopPropagation()}
          onChange={(e) => onFormatChange(e.target.value as PageFormatId)}
        >
          {PAGE_FORMATS.map(({ id, label }) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
      </label>

      <button
        type="button"
        className={
          orientation === 'landscape'
            ? 'page-format-orientation active'
            : 'page-format-orientation'
        }
        title={
          orientation === 'portrait'
            ? 'Passa a orizzontale'
            : 'Passa a verticale'
        }
        aria-label={
          orientation === 'portrait'
            ? 'Orientamento orizzontale'
            : 'Orientamento verticale'
        }
        aria-pressed={orientation === 'landscape'}
        onClick={() => onOrientationChange(nextOrientation)}
      >
        <AppIcon icon={ORIENTATION_ICONS[orientation]} size="sm" />
      </button>
    </div>
  )
}
