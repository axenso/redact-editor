import type { ChartBlockAttrs, ChartType } from '../extensions/ChartBlock'
import type { AiTableData } from '../utils/tableContent'
import type { Reference } from '../types/reference'
import { buildPrompt } from '../utils/buildPrompt'
import {
  buildSuggestionsFromText,
  type DocumentSuggestionKind,
  DOCUMENT_SUGGESTION_LIMIT,
} from '../utils/documentSuggestions'

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'

export interface ModifyTextOptions {
  text: string
  instruction: string
  activeRefs?: Reference[]
  inTable?: boolean
  wantsTableOutput?: boolean
}

export interface AiGenerateOptions {
  instruction: string
  context?: string
  activeRefs?: Reference[]
  existingChart?: ChartBlockAttrs
}

interface OpenAIMessage {
  role: 'system' | 'user'
  content: string
}

async function callOpenAI(
  messages: OpenAIMessage[],
  options?: { json?: boolean; maxTokens?: number },
): Promise<string> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY

  if (!apiKey) {
    throw new Error(
      'Chiave API mancante. Aggiungi VITE_OPENAI_API_KEY in .env.local',
    )
  }

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.4,
      max_tokens: options?.maxTokens ?? 1024,
      ...(options?.json ? { response_format: { type: 'json_object' } } : {}),
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    const message =
      (error as { error?: { message?: string } }).error?.message ??
      `Errore OpenAI (${response.status})`
    throw new Error(message)
  }

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string } }>
  }

  return data.choices[0].message.content.trim()
}

function parseJsonResponse<T>(raw: string): T {
  try {
    return JSON.parse(raw) as T
  } catch {
    throw new Error('Risposta AI non valida. Riprova con un\'istruzione più chiara.')
  }
}

const CHART_TYPES: ChartType[] = ['bar', 'line', 'pie']

function validateChartPayload(payload: unknown): ChartBlockAttrs {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Formato grafico non valido.')
  }

  const obj = payload as Record<string, unknown>
  const chartType = obj.chartType
  const title = typeof obj.title === 'string' ? obj.title.trim() : 'Grafico'
  const labels = Array.isArray(obj.labels)
    ? obj.labels.map(String).filter(Boolean)
    : []
  const data = Array.isArray(obj.data)
    ? obj.data.map(Number).filter((n) => !Number.isNaN(n))
    : []

  if (!CHART_TYPES.includes(chartType as ChartType)) {
    throw new Error('Tipo grafico non supportato.')
  }
  if (labels.length < 2 || labels.length > 12) {
    throw new Error('Il grafico deve avere tra 2 e 12 etichette.')
  }
  if (data.length !== labels.length) {
    throw new Error('Etichette e valori devono corrispondere.')
  }

  return {
    chartType: chartType as ChartType,
    title: title || 'Grafico',
    labels: JSON.stringify(labels),
    data: JSON.stringify(data),
  }
}

function validateTablePayload(payload: unknown): AiTableData {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Formato tabella non valido.')
  }

  const obj = payload as Record<string, unknown>
  const headers = Array.isArray(obj.headers)
    ? obj.headers.map(String)
    : []
  const rows = Array.isArray(obj.rows)
    ? obj.rows
        .filter(Array.isArray)
        .map((row) => (row as unknown[]).map(String))
    : []

  if (headers.length < 2 || headers.length > 8) {
    throw new Error('La tabella deve avere tra 2 e 8 colonne.')
  }
  if (rows.length < 1 || rows.length > 20) {
    throw new Error('La tabella deve avere tra 1 e 20 righe di dati.')
  }

  const colCount = headers.length
  const normalizedRows = rows.map((row) =>
    Array.from({ length: colCount }, (_, i) => String(row[i] ?? '')),
  )

  return { headers, rows: normalizedRows }
}

function buildContextBlock(context?: string): string {
  if (!context?.trim()) return ''
  return `\n\nContesto dal documento (usa se utile):\n"""${context.trim().slice(0, 2500)}"""`
}

function parseChartStringArray(value: string): string[] {
  try {
    const parsed = JSON.parse(value)
    if (Array.isArray(parsed)) return parsed.map(String)
  } catch {
    // ignore
  }
  return []
}

function parseChartNumberArray(value: string): number[] {
  try {
    const parsed = JSON.parse(value)
    if (Array.isArray(parsed)) {
      return parsed.map(Number).filter((n) => !Number.isNaN(n))
    }
  } catch {
    // ignore
  }
  return []
}

function buildExistingChartBlock(chart: ChartBlockAttrs): string {
  const labels = parseChartStringArray(chart.labels)
  const data = parseChartNumberArray(chart.data)

  return `\n\nGrafico attuale da aggiornare:
- Tipo: ${chart.chartType}
- Titolo: ${chart.title}
- Etichette: ${labels.join(', ') || '—'}
- Valori: ${data.join(', ') || '—'}`
}

export async function queryWithReferences(
  userQuery: string,
  activeRefs: Reference[],
  taskSystemPrompt: string,
  options?: { json?: boolean; maxTokens?: number },
): Promise<string> {
  const refs = activeRefs.filter((ref) => ref.active)

  if (refs.length === 0) {
    return callOpenAI(
      [
        { role: 'system', content: taskSystemPrompt },
        { role: 'user', content: userQuery },
      ],
      options,
    )
  }

  const { systemPrompt, userMessage } = buildPrompt(userQuery, refs)

  return callOpenAI(
    [
      {
        role: 'system',
        content: `${systemPrompt}\n\n${taskSystemPrompt}`,
      },
      { role: 'user', content: userMessage },
    ],
    options,
  )
}

export async function modifyTextWithAI({
  text,
  instruction,
  activeRefs = [],
  inTable = false,
  wantsTableOutput = false,
}: ModifyTextOptions): Promise<string> {
  const userQuery = `Testo da modificare:\n"""${text}"""\n\nIstruzione: ${instruction}`

  const tableRules =
    inTable || wantsTableOutput
      ? `
Se il risultato è una tabella, rispondi con una tabella Markdown ben formattata:
- una riga per ogni riga della tabella;
- colonne separate da | ;
- riga separatrice con --- dopo l'intestazione;
- nessun testo fuori dalla tabella.`
      : ''

  return queryWithReferences(
    userQuery,
    activeRefs,
    `Sei un assistente di scrittura. L'utente seleziona un testo e chiede una modifica.
Rispondi SOLO con il testo modificato, senza spiegazioni, prefissi o virgolette.
Mantieni la lingua originale salvo richiesta esplicita di traduzione.${tableRules}`,
  )
}

export async function generateChartWithAI({
  instruction,
  context,
  activeRefs = [],
  existingChart,
}: AiGenerateOptions): Promise<ChartBlockAttrs> {
  const userQuery = `Crea un grafico: ${instruction}${buildContextBlock(context)}${
    existingChart ? buildExistingChartBlock(existingChart) : ''
  }`

  const raw = await queryWithReferences(
    userQuery,
    activeRefs,
    `Generi dati per grafici. Rispondi SOLO con JSON valido nel formato:
{
  "chartType": "bar" | "line" | "pie",
  "title": "titolo in italiano",
  "labels": ["etichetta1", "etichetta2"],
  "data": [10, 20]
}
Regole: labels e data stessa lunghezza (2-12 elementi); data solo numeri; titolo e labels in italiano salvo richiesta diversa; dati realistici e coerenti con l'istruzione.${
      existingChart
        ? ' Se è fornito un grafico attuale, aggiornalo secondo l\'istruzione mantenendo coerenza con il documento.'
        : ''
    }`,
    { json: true, maxTokens: 800 },
  )

  return validateChartPayload(parseJsonResponse(raw))
}

export async function generateTableWithAI({
  instruction,
  context,
  activeRefs = [],
}: AiGenerateOptions): Promise<AiTableData> {
  const userQuery = `Crea una tabella: ${instruction}${buildContextBlock(context)}`
  const conversionRules = context?.trim()
    ? `\nIl contesto contiene dati tabellari non strutturati (righe o celle separate). Estrai tutte le intestazioni, righe e colonne preservando i valori originali (importi, quantità, descrizioni).`
    : ''

  const raw = await queryWithReferences(
    userQuery,
    activeRefs,
    `Generi tabelle dati. Rispondi SOLO con JSON valido nel formato:
{
  "headers": ["Colonna 1", "Colonna 2"],
  "rows": [["valore", "valore"], ["valore", "valore"]]
}
Regole: 2-8 colonne in headers; 1-20 righe in rows; ogni riga ha tanti elementi quante le colonne; contenuti in italiano salvo richiesta diversa; dati realistici e coerenti con l'istruzione.${conversionRules}`,
    { json: true, maxTokens: 1500 },
  )

  return validateTablePayload(parseJsonResponse(raw))
}

const SUGGESTION_PROMPTS: Record<DocumentSuggestionKind, string> = {
  chart: `Generi ${DOCUMENT_SUGGESTION_LIMIT} brevi istruzioni (max 90 caratteri ciascuna) per creare un grafico basato sul documento.
Rispondi SOLO con JSON: {"suggestions": ["...", "..."]}.
Regole: in italiano; ogni suggerimento deve riferirsi a temi, metriche, periodi o confronti presenti nel testo; varia tipi (barre, linee, torta) e angoli (trend, confronto, ripartizione, riepilogo); non inventare argomenti assenti nel documento; nessuna ripetizione.`,
  table: `Generi ${DOCUMENT_SUGGESTION_LIMIT} brevi istruzioni (max 90 caratteri ciascuna) per creare una tabella basata sul documento.
Rispondi SOLO con JSON: {"suggestions": ["...", "..."]}.
Regole: in italiano; ogni suggerimento deve riferirsi a contenuti, elenchi, metriche o confronti presenti nel testo; varia formati (riepilogo, comparativa, chiave-valore, timeline); non inventare argomenti assenti nel documento; nessuna ripetizione.`,
}

function parseSuggestionList(raw: string, limit = DOCUMENT_SUGGESTION_LIMIT): string[] {
  const parsed = parseJsonResponse<{ suggestions?: unknown }>(raw)
  if (!Array.isArray(parsed.suggestions)) return []

  return parsed.suggestions
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, limit)
}

export async function generateDocumentSuggestionsWithAI(
  kind: DocumentSuggestionKind,
  context: string,
  activeRefs: Reference[] = [],
): Promise<string[]> {
  const trimmed = context.trim()
  const localFallback = () => buildSuggestionsFromText(kind, trimmed)

  if (!trimmed) return localFallback()

  try {
    const raw = await queryWithReferences(
      `Documento:${buildContextBlock(trimmed)}`,
      activeRefs,
      SUGGESTION_PROMPTS[kind],
      { json: true, maxTokens: 420 },
    )

    const items = parseSuggestionList(raw)
    if (items.length >= 3) return items
  } catch {
    // fallback locale sotto
  }

  return localFallback()
}

/** @deprecated Usa generateDocumentSuggestionsWithAI('chart', context) */
export async function generateChartSuggestionsWithAI(
  context: string,
): Promise<string[]> {
  return generateDocumentSuggestionsWithAI('chart', context)
}
