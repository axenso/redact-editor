import { useEffect, useRef, useState } from 'react'
import {
  ChevronDown,
  Monitor,
  RotateCwSquare,
  type LucideIcon,
} from 'lucide-react'
import {
  PAGE_FORMATS,
  PAGE_ORIENTATION_OPTIONS,
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
  const [formatOpen, setFormatOpen] = useState(false)
  const [orientationOpen, setOrientationOpen] = useState(false)
  const formatRootRef = useRef<HTMLDivElement>(null)
  const orientationRootRef = useRef<HTMLDivElement>(null)
  const activeFormat = PAGE_FORMATS.find((format) => format.id === formatId)
  const activeOrientation = PAGE_ORIENTATION_OPTIONS.find(
    (option) => option.id === orientation,
  )

  useEffect(() => {
    if (!formatOpen) return

    const handlePointerDown = (event: PointerEvent) => {
      if (
        formatRootRef.current &&
        !formatRootRef.current.contains(event.target as Node)
      ) {
        setFormatOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [formatOpen])

  useEffect(() => {
    if (!orientationOpen) return

    const handlePointerDown = (event: PointerEvent) => {
      if (
        orientationRootRef.current &&
        !orientationRootRef.current.contains(event.target as Node)
      ) {
        setOrientationOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [orientationOpen])

  const handleFormatSelect = (nextFormatId: PageFormatId) => {
    onFormatChange(nextFormatId)
    setFormatOpen(false)
  }

  const handleOrientationSelect = (nextOrientation: PageOrientation) => {
    onOrientationChange(nextOrientation)
    setOrientationOpen(false)
  }

  return (
    <div className="page-format-select" role="group" aria-label="Formato pagina">
      <div className="export-menu page-format-dropdown" ref={formatRootRef}>
        <button
          type="button"
          className={
            formatOpen
              ? 'export-menu-trigger ai-menu-trigger page-format-trigger active'
              : 'export-menu-trigger ai-menu-trigger page-format-trigger'
          }
          aria-haspopup="menu"
          aria-expanded={formatOpen}
          aria-label={`Formato pagina: ${activeFormat?.label ?? formatId}`}
          title={activeFormat?.hint ?? 'Formato pagina'}
          onMouseDown={(event) => event.stopPropagation()}
          onClick={() => {
            setOrientationOpen(false)
            setFormatOpen((wasOpen) => !wasOpen)
          }}
        >
          <span className="ai-menu-trigger-label">
            {activeFormat?.label ?? formatId}
          </span>
          <AppIcon icon={ChevronDown} size="xs" className="ai-menu-trigger-chevron" />
        </button>

        {formatOpen && (
          <ul
            className="export-menu-dropdown page-format-dropdown-panel"
            role="menu"
            aria-label="Formato pagina"
          >
            {PAGE_FORMATS.map(({ id, label, hint }) => (
              <li key={id} role="none">
                <button
                  type="button"
                  role="menuitemradio"
                  aria-checked={formatId === id}
                  className={
                    formatId === id
                      ? 'export-menu-item export-menu-item-active'
                      : 'export-menu-item'
                  }
                  onClick={() => handleFormatSelect(id)}
                >
                  <span className="export-menu-item-label">{label}</span>
                  <span className="export-menu-item-hint">{hint}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div
        className="export-menu page-format-orientation-dropdown"
        ref={orientationRootRef}
      >
        <button
          type="button"
          className={
            orientationOpen
              ? 'export-menu-trigger ai-menu-trigger page-format-orientation-trigger active'
              : 'export-menu-trigger ai-menu-trigger page-format-orientation-trigger'
          }
          aria-haspopup="menu"
          aria-expanded={orientationOpen}
          aria-label={`Orientamento pagina: ${activeOrientation?.label ?? orientation}`}
          title={activeOrientation?.hint ?? 'Orientamento pagina'}
          onMouseDown={(event) => event.stopPropagation()}
          onClick={() => {
            setFormatOpen(false)
            setOrientationOpen((wasOpen) => !wasOpen)
          }}
        >
          <AppIcon icon={ORIENTATION_ICONS[orientation]} size="sm" />
          <span className="ai-menu-trigger-label">
            {activeOrientation?.label ?? orientation}
          </span>
          <AppIcon icon={ChevronDown} size="xs" className="ai-menu-trigger-chevron" />
        </button>

        {orientationOpen && (
          <ul
            className="export-menu-dropdown page-format-orientation-dropdown-panel"
            role="menu"
            aria-label="Orientamento pagina"
          >
            {PAGE_ORIENTATION_OPTIONS.map(({ id, label, hint }) => (
              <li key={id} role="none">
                <button
                  type="button"
                  role="menuitemradio"
                  aria-checked={orientation === id}
                  className={
                    orientation === id
                      ? 'export-menu-item export-menu-item-active'
                      : 'export-menu-item'
                  }
                  onClick={() => handleOrientationSelect(id)}
                >
                  <span className="export-menu-item-label">{label}</span>
                  <span className="export-menu-item-hint">{hint}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
