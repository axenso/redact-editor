export type EditHistoryType = 'ai' | 'document'

export interface EditHistoryEntry {
  id: string
  type: EditHistoryType
  timestamp: number
  summary: string
  contentHtml: string
  contentHtmlBefore?: string
  instruction?: string
  selectionBefore?: string
  selectionAfter?: string
}
