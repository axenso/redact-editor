export type DocumentSuggestionKind = 'chart' | 'table'

export const DOCUMENT_SUGGESTION_LIMIT = 6

const DEFAULT_CHART_SUGGESTIONS = [
  'Grafico a barre dei dati principali nel documento',
  'Andamento nel tempo dei valori citati',
  'Confronto tra le voci più rilevanti',
  'Grafico a torta delle proporzioni nel testo',
  'Trend dei numeri menzionati nel documento',
  'Distribuzione per categoria dei temi trattati',
]

const DEFAULT_TABLE_SUGGESTIONS = [
  'Tabella riepilogativa dei punti chiave del documento',
  'Tabella comparativa delle voci principali',
  'Schema a colonne dei dati citati nel testo',
  'Tabella con metriche e valori menzionati',
  'Elenco strutturato degli elementi del documento',
  'Tabella di confronto tra le sezioni del testo',
]

function truncate(text: string, max: number): string {
  const trimmed = text.trim()
  if (trimmed.length <= max) return trimmed
  return `${trimmed.slice(0, max - 1).trim()}…`
}

function uniqueSuggestions(items: string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []

  for (const item of items) {
    const normalized = item.trim().replace(/\s+/g, ' ')
    if (!normalized || seen.has(normalized.toLowerCase())) continue
    seen.add(normalized.toLowerCase())
    result.push(normalized)
  }

  return result
}

function padSuggestions(
  items: string[],
  fallbacks: string[],
  limit = DOCUMENT_SUGGESTION_LIMIT,
): string[] {
  const merged = uniqueSuggestions(items)
  for (const fallback of fallbacks) {
    if (merged.length >= limit) break
    merged.push(fallback)
  }
  return merged.slice(0, limit)
}

function extractTopics(text: string): string[] {
  const topics: string[] = []

  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length >= 6 && line.length <= 120)
  topics.push(...lines)

  const sentences = text
    .split(/[.!?]\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length >= 12 && sentence.length <= 140)
  topics.push(...sentences.slice(0, 6))

  const bullets =
    text.match(/(?:^|\n)\s*(?:[-•*]|\d+[.)])\s+(.+)/g)?.map((line) =>
      line.replace(/(?:^|\n)\s*(?:[-•*]|\d+[.)])\s+/, '').trim(),
    ) ?? []
  topics.push(...bullets.filter((item) => item.length >= 4 && item.length <= 100))

  const labeled = text.match(
    /[A-Za-zÀ-ú][A-Za-zÀ-ú0-9\s,'()/]{2,48}:\s*[^\n.]{3,80}/g,
  )
  if (labeled) topics.push(...labeled.map((item) => item.trim()))

  return uniqueSuggestions(topics)
}

export function buildSuggestionsFromText(
  kind: DocumentSuggestionKind,
  context: string,
): string[] {
  const text = context.trim()
  const defaults =
    kind === 'chart' ? DEFAULT_CHART_SUGGESTIONS : DEFAULT_TABLE_SUGGESTIONS

  if (!text) return [...defaults]

  const topics = extractTopics(text)
  const suggestions: string[] = []

  if (kind === 'chart') {
    for (const topic of topics.slice(0, 5)) {
      const short = truncate(topic, 52)
      suggestions.push(`Grafico a barre: ${short}`)
      suggestions.push(`Andamento nel tempo: ${short}`)
      suggestions.push(`Grafico a torta: ${short}`)
      suggestions.push(`Confronto visivo: ${short}`)
    }

    if (/\d/.test(text)) {
      suggestions.push('Grafico a barre dei valori numerici nel documento')
      suggestions.push('Trend a linee dei dati quantitativi citati')
      suggestions.push('Grafico a torta delle percentuali menzionate')
    }

    if (/trimestre|mensil|annu|gennaio|febbraio|marzo|q1|q2|q3|q4|20\d{2}/i.test(text)) {
      suggestions.push('Grafico a linee dell’andamento nel periodo descritto')
      suggestions.push('Confronto trimestrale dei valori nel testo')
    }

    if (/percent|%|quota|ripartizione|confronto|vs\.?|rispetto a/i.test(text)) {
      suggestions.push('Grafico a torta delle quote citate nel documento')
      suggestions.push('Confronto a barre tra le voci del testo')
    }
  } else {
    for (const topic of topics.slice(0, 5)) {
      const short = truncate(topic, 52)
      suggestions.push(`Tabella riepilogativa: ${short}`)
      suggestions.push(`Tabella comparativa su ${short}`)
      suggestions.push(`Organizza in colonne: ${short}`)
    }

    if (/\d/.test(text)) {
      suggestions.push('Tabella con metriche e valori numerici del documento')
      suggestions.push('Schema dati per voci e importi citati')
    }

    if (labeledPairs(text).length >= 2) {
      suggestions.push('Tabella chiave-valore dei dati nel testo')
      suggestions.push('Riepilogo strutturato delle coppie nome/dato')
    }

    if (bullets(text).length >= 3) {
      suggestions.push('Tabella dagli elenco puntati del documento')
    }
  }

  return padSuggestions(suggestions, defaults)
}

function labeledPairs(text: string): string[] {
  return (
    text.match(/[A-Za-zÀ-ú][A-Za-zÀ-ú0-9\s,'()/]{2,40}:\s*[^\n,;]+/g) ?? []
  )
}

function bullets(text: string): string[] {
  return (
    text.match(/(?:^|\n)\s*(?:[-•*]|\d+[.)])\s+(.+)/g)?.map((line) =>
      line.replace(/(?:^|\n)\s*(?:[-•*]|\d+[.)])\s+/, '').trim(),
    ) ?? []
  )
}

/** @deprecated Usa buildSuggestionsFromText('chart', context) */
export function buildChartSuggestionsFromText(context: string): string[] {
  return buildSuggestionsFromText('chart', context)
}

export { DEFAULT_CHART_SUGGESTIONS }
