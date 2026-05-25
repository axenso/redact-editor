import { colorsEqual } from '../utils/colorUtils'

export interface TextColorOption {
  label: string
  value: string
}

export const TEXT_COLOR_PALETTE: TextColorOption[] = [
  { label: 'Nero', value: '#1a1a1a' },
  { label: 'Grigio scuro', value: '#374151' },
  { label: 'Grigio', value: '#6b7280' },
  { label: 'Grigio chiaro', value: '#9ca3af' },
  { label: 'Bianco', value: '#ffffff' },
  { label: 'Rosso', value: '#dc2626' },
  { label: 'Arancione', value: '#ea580c' },
  { label: 'Ambra', value: '#d97706' },
  { label: 'Giallo', value: '#ca8a04' },
  { label: 'Lime', value: '#65a30d' },
  { label: 'Verde', value: '#16a34a' },
  { label: 'Smeraldo', value: '#059669' },
  { label: 'Teal', value: '#0d9488' },
  { label: 'Ciano', value: '#0891b2' },
  { label: 'Azzurro', value: '#0284c7' },
  { label: 'Blu', value: '#2563eb' },
  { label: 'Indaco', value: '#4f46e5' },
  { label: 'Viola', value: '#7c3aed' },
  { label: 'Fucsia', value: '#c026d3' },
  { label: 'Rosa', value: '#db2777' },
]

export function findPaletteColor(color: string): TextColorOption | undefined {
  return TEXT_COLOR_PALETTE.find((option) => colorsEqual(option.value, color))
}
