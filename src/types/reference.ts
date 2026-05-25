export type ReferenceType =
  | 'style'
  | 'glossary'
  | 'example'
  | 'instruction'
  | 'custom'

export interface Reference {
  id: string
  label: string
  type: ReferenceType
  content: string
  active: boolean
  createdAt: string
}

export const REFERENCE_TYPES: ReferenceType[] = [
  'style',
  'glossary',
  'example',
  'instruction',
  'custom',
]

export const REFERENCE_TYPE_LABELS: Record<ReferenceType, string> = {
  style: 'Stile',
  glossary: 'Glossario',
  example: 'Esempio',
  instruction: 'Istruzione',
  custom: 'Personalizzato',
}
