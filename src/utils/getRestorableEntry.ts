import type { EditHistoryEntry } from '../types/editHistory'
import {
  findHistoryEntryForContent,
  normalizeHistoryHtml,
} from '../hooks/useEditHistory'

/** Contenuto HTML della primissima versione salvata in cronologia. */
export function getFirstVersionContent(
  entries: EditHistoryEntry[],
): string | null {
  if (entries.length === 0) return null

  const oldest = entries[entries.length - 1]
  return oldest.contentHtmlBefore ?? oldest.contentHtml
}

/** Ultima versione registrata in cronologia (modifica più recente). */
export function getLatestVersionEntry(
  entries: EditHistoryEntry[],
): EditHistoryEntry | null {
  return entries[0] ?? null
}

export function canRestoreFirstVersion(
  entries: EditHistoryEntry[],
  currentHtml: string,
): boolean {
  const firstHtml = getFirstVersionContent(entries)
  if (!firstHtml) return false

  return (
    normalizeHistoryHtml(firstHtml) !== normalizeHistoryHtml(currentHtml)
  )
}

export function canRestoreLatestVersion(
  entries: EditHistoryEntry[],
  currentHtml: string,
  activeId: string | null = null,
): boolean {
  const latest = getLatestVersionEntry(entries)
  if (!latest) return false

  if (activeId === latest.id) return false

  return (
    normalizeHistoryHtml(latest.contentHtml) !==
    normalizeHistoryHtml(currentHtml)
  )
}

/** Entry whose AI-modified version is currently shown and can be reverted. */
export function getRestorableEntry(
  entries: EditHistoryEntry[],
  activeId: string | null,
  currentHtml: string,
): EditHistoryEntry | null {
  const activeEntry = activeId
    ? entries.find((e) => e.id === activeId)
    : entries[0]

  const candidate = activeEntry ?? entries[0]
  if (!candidate?.contentHtmlBefore) return null
  if (!findHistoryEntryForContent([candidate], currentHtml)) return null

  return candidate
}
