import { useCallback, useMemo, useState } from 'react'
import type { Reference, ReferenceType } from '../types/reference'
import { REFERENCE_TYPES } from '../types/reference'
import {
  estimateReferenceTokens,
  REFERENCE_TOKEN_LIMIT,
} from '../utils/buildPrompt'

export const REFERENCES_STORAGE_KEY = 'interactive-chat-references'

function isReferenceType(value: unknown): value is ReferenceType {
  return typeof value === 'string' && REFERENCE_TYPES.includes(value as ReferenceType)
}

function parseReference(value: unknown): Reference | null {
  if (!value || typeof value !== 'object') return null

  const obj = value as Record<string, unknown>
  if (typeof obj.id !== 'string' || typeof obj.label !== 'string') return null
  if (typeof obj.content !== 'string' || typeof obj.active !== 'boolean') return null
  if (!isReferenceType(obj.type)) return null

  const createdAt =
    typeof obj.createdAt === 'string'
      ? obj.createdAt
      : new Date().toISOString()

  return {
    id: obj.id,
    label: obj.label.trim(),
    type: obj.type,
    content: obj.content,
    active: obj.active,
    createdAt,
  }
}

export function loadReferences(): Reference[] {
  try {
    const raw = localStorage.getItem(REFERENCES_STORAGE_KEY)
    if (!raw) return []

    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []

    return parsed
      .map(parseReference)
      .filter((ref): ref is Reference => ref !== null && ref.label.length > 0)
  } catch {
    return []
  }
}

function saveReferences(references: Reference[]): void {
  try {
    localStorage.setItem(REFERENCES_STORAGE_KEY, JSON.stringify(references))
  } catch {
    // localStorage full or unavailable
  }
}

export function useReferences() {
  const [references, setReferences] = useState<Reference[]>(loadReferences)

  const persist = useCallback((next: Reference[]) => {
    setReferences(next)
    saveReferences(next)
  }, [])

  const addReference = useCallback(
    (ref: Omit<Reference, 'id' | 'createdAt'>) => {
      const label = ref.label.trim()
      const content = ref.content.trim()
      if (!label || !content) return

      const entry: Reference = {
        id: crypto.randomUUID(),
        label,
        type: ref.type,
        content,
        active: ref.active,
        createdAt: new Date().toISOString(),
      }

      persist([entry, ...references])
    },
    [persist, references],
  )

  const toggleReference = useCallback(
    (id: string) => {
      persist(
        references.map((ref) =>
          ref.id === id ? { ...ref, active: !ref.active } : ref,
        ),
      )
    },
    [persist, references],
  )

  const removeReference = useCallback(
    (id: string) => {
      persist(references.filter((ref) => ref.id !== id))
    },
    [persist, references],
  )

  const getActiveRefs = useCallback(
    () => references.filter((ref) => ref.active),
    [references],
  )

  const activeRefs = useMemo(
    () => references.filter((ref) => ref.active),
    [references],
  )

  const activeCount = useMemo(
    () => activeRefs.length,
    [activeRefs],
  )

  const activeTokenEstimate = useMemo(
    () => estimateReferenceTokens(activeRefs),
    [activeRefs],
  )

  const isOverTokenLimit = activeTokenEstimate > REFERENCE_TOKEN_LIMIT

  return {
    references,
    activeRefs,
    addReference,
    toggleReference,
    removeReference,
    getActiveRefs,
    activeCount,
    activeTokenEstimate,
    isOverTokenLimit,
  }
}
