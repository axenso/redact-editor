import { useEffect, useRef, useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import type { PageLayout } from '../constants/pageFormat'
import { exportEditorContent, type ExportFormat } from '../utils/exportContent'
import { AppIcon } from './LucideIcon'

interface ExportMenuProps {
  getHtml: () => string
  documentTitle?: string
  pageLayout: PageLayout
}

const EXPORT_OPTIONS: {
  format: ExportFormat
  label: string
  hint: string
}[] = [
  { format: 'html', label: 'HTML', hint: 'Pagina completa' },
  { format: 'md', label: 'Markdown', hint: 'File .md' },
  { format: 'pdf', label: 'PDF', hint: 'Usa formato pagina' },
  { format: 'txt', label: 'Testo', hint: 'Solo testo (.txt)' },
]

export function ExportMenu({
  getHtml,
  documentTitle = 'documento',
  pageLayout,
}: ExportMenuProps) {
  const [open, setOpen] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)

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

  const handleExport = async (format: ExportFormat) => {
    setExporting(true)
    setError(null)

    try {
      await exportEditorContent(getHtml(), format, {
        documentTitle,
        pageLayout,
      })
      setOpen(false)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Errore durante l\'esportazione',
      )
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="export-menu" ref={rootRef}>
      <button
        type="button"
        className={
          open ? 'export-menu-trigger active' : 'export-menu-trigger'
        }
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={exporting ? 'Esportazione in corso' : 'Esporta documento'}
        title={exporting ? 'Esportazione in corso…' : 'Esporta documento'}
        disabled={exporting}
        onClick={() => setOpen((wasOpen) => !wasOpen)}
      >
        <AppIcon
          icon={exporting ? Loader2 : Download}
          size="sm"
          className={exporting ? 'export-menu-icon export-menu-icon--spin' : 'export-menu-icon'}
        />
      </button>

      {error && (
        <p className="export-menu-error" role="alert">
          {error}
        </p>
      )}

      {open && !exporting && (
        <ul className="export-menu-dropdown" role="menu" aria-label="Esporta documento">
          {EXPORT_OPTIONS.map(({ format, label, hint }) => (
            <li key={format} role="none">
              <button
                type="button"
                role="menuitem"
                className="export-menu-item"
                onClick={() => handleExport(format)}
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
