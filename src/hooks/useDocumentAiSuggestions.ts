import { useEffect, useState } from 'react'
import type { AiGenerateKind } from '../components/AiGenerateForm'
import { generateDocumentSuggestionsWithAI } from '../services/aiService'
import {
  buildSuggestionsFromText,
  type DocumentSuggestionKind,
} from '../utils/documentSuggestions'

export function useDocumentAiSuggestions(
  kind: DocumentSuggestionKind | AiGenerateKind,
  documentContext: string,
  enabled: boolean,
) {
  const [suggestions, setSuggestions] = useState<string[]>(() =>
    buildSuggestionsFromText(kind, documentContext),
  )
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!enabled) return

    let cancelled = false
    setLoading(true)
    setSuggestions(buildSuggestionsFromText(kind, documentContext))

    void generateDocumentSuggestionsWithAI(kind, documentContext)
      .then((items) => {
        if (!cancelled) setSuggestions(items)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [kind, documentContext, enabled])

  return { suggestions, loading }
}
