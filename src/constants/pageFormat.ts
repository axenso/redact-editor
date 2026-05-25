export type PageFormatId = 'a4' | 'letter' | 'legal' | 'a5'
export type PageOrientation = 'portrait' | 'landscape'

export interface PageFormatDefinition {
  id: PageFormatId
  label: string
  hint: string
  widthMm: number
  heightMm: number
}

export const PAGE_FORMATS: PageFormatDefinition[] = [
  { id: 'a4', label: 'A4', hint: '210 × 297 mm', widthMm: 210, heightMm: 297 },
  { id: 'letter', label: 'Letter', hint: '216 × 279 mm', widthMm: 216, heightMm: 279 },
  { id: 'legal', label: 'Legal', hint: '216 × 356 mm', widthMm: 216, heightMm: 356 },
  { id: 'a5', label: 'A5', hint: '148 × 210 mm', widthMm: 148, heightMm: 210 },
]

export const PAGE_FORMAT_IDS = PAGE_FORMATS.map((f) => f.id)

export const PAGE_ORIENTATION_OPTIONS: {
  id: PageOrientation
  label: string
  hint: string
}[] = [
  { id: 'portrait', label: 'Verticale', hint: 'Altezza maggiore della larghezza' },
  { id: 'landscape', label: 'Orizzontale', hint: 'Larghezza maggiore dell\'altezza' },
]

export interface PageLayout {
  formatId: PageFormatId
  orientation: PageOrientation
  widthMm: number
  heightMm: number
  widthPx: number
  heightPx: number
  jsPdfFormat: PageFormatId
}

export function getPageFormatDefinition(id: PageFormatId): PageFormatDefinition {
  return PAGE_FORMATS.find((f) => f.id === id) ?? PAGE_FORMATS[0]
}

export function mmToPx(mm: number, dpi = 96): number {
  return Math.round((mm / 25.4) * dpi)
}

export function getPageLayout(
  formatId: PageFormatId,
  orientation: PageOrientation,
): PageLayout {
  const base = getPageFormatDefinition(formatId)
  const portrait = orientation === 'portrait'

  const widthMm = portrait ? base.widthMm : base.heightMm
  const heightMm = portrait ? base.heightMm : base.widthMm

  return {
    formatId,
    orientation,
    widthMm,
    heightMm,
    widthPx: mmToPx(widthMm),
    heightPx: mmToPx(heightMm),
    jsPdfFormat: formatId,
  }
}

export function getPageFormatLabel(layout: PageLayout): string {
  const name = getPageFormatDefinition(layout.formatId).label
  return `${name} · ${layout.orientation === 'portrait' ? 'Verticale' : 'Orizzontale'}`
}

export function pageSizeAtRule(layout: PageLayout): string {
  const suffix = layout.orientation === 'landscape' ? ' landscape' : ''
  const format = getPageFormatDefinition(layout.formatId).label
  return `${format}${suffix}`
}
