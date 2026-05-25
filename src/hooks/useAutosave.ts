import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ensureDocumentMeta,
  loadDocumentMeta,
  saveContent,
  touchDocumentMeta,
  type DocumentMeta,
} from './useLocalStorage'

export type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error'

const AUTOSAVE_DEBOUNCE_MS = 800

export function useAutosave() {
  const [status, setStatus] = useState<AutosaveStatus>('saved')
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(() => {
    const meta = loadDocumentMeta()
    return meta ? new Date(meta.updatedAt) : null
  })
  const [documentMeta, setDocumentMeta] = useState<DocumentMeta>(() =>
    ensureDocumentMeta(),
  )
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const latestHtmlRef = useRef<string | null>(null)

  useEffect(() => {
    setDocumentMeta(ensureDocumentMeta())
  }, [])

  const persist = useCallback((html: string) => {
    try {
      saveContent(html)
      const meta = touchDocumentMeta()
      setDocumentMeta(meta)
      setLastSavedAt(new Date(meta.updatedAt))
      setStatus('saved')
      return true
    } catch {
      setStatus('error')
      return false
    }
  }, [])

  const scheduleSave = useCallback(
    (html: string) => {
      latestHtmlRef.current = html
      setStatus('saving')

      if (debounceRef.current) clearTimeout(debounceRef.current)

      debounceRef.current = setTimeout(() => {
        if (latestHtmlRef.current !== null) {
          persist(latestHtmlRef.current)
        }
      }, AUTOSAVE_DEBOUNCE_MS)
    },
    [persist],
  )

  const saveNow = useCallback(
    (html: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      latestHtmlRef.current = html
      persist(html)
    },
    [persist],
  )

  const flushPending = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
      debounceRef.current = null
    }
    if (latestHtmlRef.current !== null) {
      persist(latestHtmlRef.current)
    }
  }, [persist])

  return {
    status,
    lastSavedAt,
    documentMeta,
    scheduleSave,
    saveNow,
    flushPending,
  }
}
