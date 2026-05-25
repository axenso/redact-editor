import { useCallback, useRef, useState } from 'react'
import type { EditHistoryEntry, EditHistoryType } from '../types/editHistory'
import { normalizeTableHtml } from '../utils/normalizeTableHtml'
import { stripDiffMarksFromHtml } from '../utils/sanitizeHtml'

export const HISTORY_STORAGE_KEY = 'interactive-chat-edit-history'
const MAX_ENTRIES = 50

export function normalizeHistoryHtml(html: string): string {
  return normalizeTableHtml(stripDiffMarksFromHtml(html))
}

export function findHistoryEntryForContent(
  entries: EditHistoryEntry[],
  html: string,
): EditHistoryEntry | null {
  const clean = normalizeHistoryHtml(html)
  return entries.find((entry) => normalizeHistoryHtml(entry.contentHtml) === clean) ?? null
}

function countMatches(html: string, pattern: RegExp): number {
  return (html.match(pattern) || []).length
}

export function buildChangeSummary(before: string, after: string): string {
  const chartsBefore = countMatches(before, /data-chart-block/g)
  const chartsAfter = countMatches(after, /data-chart-block/g)
  if (chartsAfter < chartsBefore) return 'Grafico eliminato'
  if (chartsAfter > chartsBefore) return 'Grafico inserito'

  const imagesBefore = countMatches(before, /data-image-block/g)
  const imagesAfter = countMatches(after, /data-image-block/g)
  if (imagesAfter < imagesBefore) return 'Immagine eliminata'
  if (imagesAfter > imagesBefore) return 'Immagine inserita'

  const tablesBefore = countMatches(before, /<table/gi)
  const tablesAfter = countMatches(after, /<table/gi)
  if (tablesAfter < tablesBefore) return 'Tabella eliminata'
  if (tablesAfter > tablesBefore) return 'Tabella inserita'

  return 'Modifica documento'
}

function normalizeLoadedEntry(entry: EditHistoryEntry): EditHistoryEntry {
  const type: EditHistoryType =
    entry.type === 'ai' || entry.type === 'document'
      ? entry.type
      : entry.instruction
        ? 'ai'
        : 'document'

  return {
    ...entry,
    type,
    contentHtml: normalizeHistoryHtml(entry.contentHtml),
    contentHtmlBefore: entry.contentHtmlBefore
      ? normalizeHistoryHtml(entry.contentHtmlBefore)
      : undefined,
  }
}

export function filterAiHistoryEntries(
  entries: EditHistoryEntry[],
): EditHistoryEntry[] {
  return entries.filter((entry) => entry.type === 'ai')
}

export function loadEditHistory(): EditHistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as EditHistoryEntry[]
    if (!Array.isArray(parsed)) return []

    const normalized = parsed
      .filter((entry) => entry && typeof entry.contentHtml === 'string')
      .map(normalizeLoadedEntry)
    const aiEntries = filterAiHistoryEntries(normalized)

    if (aiEntries.length !== normalized.length) {
      saveEditHistory(aiEntries)
    }

    return aiEntries
  } catch {
    return []
  }
}

function saveEditHistory(entries: EditHistoryEntry[]): boolean {
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(entries))
    return true
  } catch {
    return false
  }
}

function createEntry(
  partial: Omit<EditHistoryEntry, 'id' | 'timestamp'>,
): EditHistoryEntry {
  return {
    ...partial,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  }
}

export function truncateText(text: string, maxLength = 60): string {
  const trimmed = text.replace(/\s+/g, ' ').trim()
  if (trimmed.length <= maxLength) return trimmed
  return `${trimmed.slice(0, maxLength)}…`
}

export function historyTypeLabel(_type: EditHistoryType): string {
  return 'Query AI'
}

export function formatHistoryTime(timestamp: number): string {
  return new Intl.DateTimeFormat('it-IT', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp))
}

export function useEditHistory(initialContentHtml?: string | null) {
  const initialNormalized = normalizeHistoryHtml(initialContentHtml ?? '')
  const [entries, setEntries] = useState<EditHistoryEntry[]>(loadEditHistory)
  const [activeId, setActiveId] = useState<string | null>(() => {
    const loaded = loadEditHistory()
    if (initialContentHtml) {
      return findHistoryEntryForContent(loaded, initialContentHtml)?.id ?? null
    }
    return loaded[0]?.id ?? null
  })
  const [saveError, setSaveError] = useState<string | null>(null)

  const baselineRef = useRef(initialNormalized)
  const pausedRef = useRef(false)
  const entriesRef = useRef(entries)
  entriesRef.current = entries
  const activeIdRef = useRef(activeId)
  activeIdRef.current = activeId

  const setHistoryBaseline = useCallback(
    (html: string) => {
      const normalized = normalizeHistoryHtml(html)
      baselineRef.current = normalized
    },
    [],
  )

  const pauseHistoryRecording = useCallback(() => {
    pausedRef.current = true
  }, [])

  const resumeHistoryRecording = useCallback(() => {
    pausedRef.current = false
  }, [])

  const pushEntry = useCallback(
    (partial: Omit<EditHistoryEntry, 'id' | 'timestamp'>) => {
      if (partial.type !== 'ai') {
        return { entry: null, error: null }
      }

      const entry = createEntry({
        ...partial,
        contentHtml: normalizeHistoryHtml(partial.contentHtml),
        contentHtmlBefore: partial.contentHtmlBefore
          ? normalizeHistoryHtml(partial.contentHtmlBefore)
          : undefined,
      })

      let duplicateId: string | null = null
      let saved = false
      let storageError: string | null = null

      setEntries((prev) => {
        const aiPrev = filterAiHistoryEntries(prev)
        if (aiPrev[0]?.contentHtml === entry.contentHtml) {
          duplicateId = aiPrev[0].id
          return aiPrev
        }

        const next = [entry, ...aiPrev].slice(0, MAX_ENTRIES)
        if (!saveEditHistory(next)) {
          storageError =
            'Impossibile salvare la versione: spazio di archiviazione insufficiente.'
          setSaveError(storageError)
          return prev
        }

        setSaveError(null)
        saved = true
        return next
      })

      if (storageError) {
        return { entry: null, error: storageError }
      }

      if (duplicateId) {
        setActiveId(duplicateId)
        return { entry: null, error: null }
      }

      if (saved) {
        setActiveId(entry.id)
        baselineRef.current = entry.contentHtml
        return { entry, error: null }
      }

      return { entry: null, error: null }
    },
    [],
  )

  const recordAppliedEdit = useCallback(
    (params: {
      contentHtml: string
      contentHtmlBefore: string
      instruction: string
      selectionBefore: string
      selectionAfter: string
    }) => {
      if (params.selectionBefore.trim() === params.selectionAfter.trim()) {
        return { entry: null, error: null }
      }

      const result = pushEntry({
        type: 'ai',
        summary: truncateText(params.instruction, 60),
        contentHtml: params.contentHtml,
        contentHtmlBefore: params.contentHtmlBefore,
        instruction: params.instruction,
        selectionBefore: params.selectionBefore,
        selectionAfter: params.selectionAfter,
      })

      if (result.entry) {
        setHistoryBaseline(params.contentHtml)
      }

      return result
    },
    [pushEntry, setHistoryBaseline],
  )

  const getLatestEntry = useCallback(() => entries[0] ?? null, [entries])

  const getPreviousContent = useCallback(
    (entryId?: string) => {
      const entry = entryId
        ? entries.find((e) => e.id === entryId)
        : entries[0]
      return entry?.contentHtmlBefore ?? null
    },
    [entries],
  )

  const setActiveEntry = useCallback((id: string | null) => {
    setActiveId(id)
  }, [])

  const syncActiveEntry = useCallback((html: string) => {
    const currentEntries = entriesRef.current
    const currentActiveId = activeIdRef.current
    const normalized = normalizeHistoryHtml(html)
    const latestId = currentEntries[0]?.id

    const activeEntry = currentActiveId
      ? currentEntries.find((entry) => entry.id === currentActiveId)
      : null

    if (activeEntry) {
      if (normalizeHistoryHtml(activeEntry.contentHtml) === normalized) {
        return
      }

      // Manual edits diverged from the restored version — don't re-link to Ultima versione.
      setActiveId(null)
      return
    }

    const match = findHistoryEntryForContent(currentEntries, html)
    if (match && match.id !== latestId) {
      setActiveId(match.id)
      return
    }

    setActiveId(null)
  }, [])

  const clearHistory = useCallback(() => {
    setEntries([])
    setActiveId(null)
    setSaveError(null)
    saveEditHistory([])
  }, [])

  return {
    entries,
    activeId,
    saveError,
    recordAppliedEdit,
    setHistoryBaseline,
    pauseHistoryRecording,
    resumeHistoryRecording,
    getLatestEntry,
    getPreviousContent,
    setActiveEntry,
    syncActiveEntry,
    clearHistory,
  }
}
