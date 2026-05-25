import type { AiTableData } from './tableContent'

function stripInlineMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    .trim()
}

function getNonEmptyLines(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

export function isTableConversionInstruction(instruction: string): boolean {
  const normalized = instruction
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')

  if (/\b(in|come|a)\s+(una\s+)?tabell/.test(normalized)) return true
  if (/\btabell[a-z]*\s+(struttur|format)/.test(normalized)) return true
  if (/\b(converti|convertire|trasforma|trasformare|formatta|formattare)\b.*\btabell/.test(normalized)) {
    return true
  }

  return (
    /\b(converti|convertire|trasforma|trasformare|formatta|formattare|organizza|organizzare|metti|mettere|rendi|rendere|crea|creare|genera|generare|struttura|strutturare)\b/.test(
      normalized,
    ) && /\btabell/.test(normalized)
  )
}

export function wantsTableOutput(instruction: string): boolean {
  return isTableConversionInstruction(instruction) || /\btabell/i.test(instruction)
}

function parseRow(line: string): string[] {
  let row = line.trim()
  if (row.startsWith('|')) row = row.slice(1)
  if (row.endsWith('|')) row = row.slice(0, -1)
  return row.split('|').map(stripInlineMarkdown)
}

function isSeparatorRow(line: string): boolean {
  const cells = parseRow(line)
  return (
    cells.length > 0 &&
    cells.every((cell) => /^:?-{2,}:?$/.test(cell) || cell === '')
  )
}

function extractTableLines(text: string): string[] {
  const trimmed = text.trim()
  if (!trimmed.includes('|')) return []

  const multiline = trimmed
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.includes('|'))

  if (multiline.length >= 2) return multiline

  const splitRows = trimmed
    .split(/\|\s+(?=\|)/)
    .map((line) => line.trim())
    .filter((line) => line.includes('|'))
    .map((line) => {
      const withStart = line.startsWith('|') ? line : `| ${line}`
      return withStart.endsWith('|') ? withStart : `${withStart} |`
    })

  if (splitRows.length >= 2) return splitRows

  const rowMatches = trimmed.match(/\|(?:[^|]|\|(?!\s*\|))+\|/g)
  if (rowMatches && rowMatches.length >= 2) {
    return rowMatches.map((row) => row.trim())
  }

  return multiline
}

function normalizeTableShape(
  headers: string[],
  rows: string[][],
): AiTableData | null {
  const colCount = Math.max(headers.length, ...rows.map((row) => row.length))
  if (colCount < 2 || headers.length === 0 || rows.length === 0) return null

  const normalizeRow = (row: string[]) => {
    const padded = [...row]
    while (padded.length < colCount) padded.push('')
    return padded.slice(0, colCount).map(stripInlineMarkdown)
  }

  return {
    headers: normalizeRow(headers),
    rows: rows.map(normalizeRow),
  }
}

function looksLikeQuantity(value: string): boolean {
  return /^\d+$/.test(value.trim())
}

function isLikelyTitle(line: string): boolean {
  const lower = line.toLowerCase()
  const headerWords = [
    'descrizione',
    'attività',
    'attivita',
    'costo',
    'totale',
    'quantità',
    'quantita',
  ]
  if (headerWords.some((word) => lower === word || lower.startsWith(`${word} `))) {
    return false
  }
  return line.length > 24
}

function splitCellValue(line: string): string[] {
  if (line.includes('|')) {
    return line.split('|').map(stripInlineMarkdown).filter(Boolean)
  }
  return [stripInlineMarkdown(line)]
}

function looksLikeHeaderCell(line: string): boolean {
  if (line.length <= 4) return true
  if (line.length <= 28) {
    const lower = line.toLowerCase()
    return /^(descrizione|attivit|costo|totale|quant|prezzo|importo|unit|note|q)$/i.test(
      lower,
    ) || /^(descrizione|attivit|costo|totale|quant|prezzo|importo)/i.test(lower)
  }
  return false
}

function looksLikeRowStart(line: string, headerCount: number): boolean {
  if (headerCount < 2) return false
  if (looksLikeQuantity(line)) return true
  if (/€|eur|\d+[.,]\d{2}/i.test(line)) return true
  if (line.includes('|')) return true
  return line.length > 32 && !looksLikeHeaderCell(line)
}

/** Converte testo plain (righe separate) in tabella strutturata. */
export function parsePlainTextTable(text: string): AiTableData | null {
  const lines = getNonEmptyLines(text)
  if (lines.length < 4) return null

  let start = 0
  if (isLikelyTitle(lines[0])) start = 1

  const headers: string[] = []
  let index = start

  while (index < lines.length) {
    const line = lines[index]
    if (headers.length >= 2 && looksLikeRowStart(line, headers.length)) break

    if (looksLikeHeaderCell(line) || headers.length === 0) {
      headers.push(...splitCellValue(line))
      index += 1
      continue
    }

    if (headers.length >= 2) break

    headers.push(...splitCellValue(line))
    index += 1
  }

  if (headers.length < 2) return null

  const colCount = headers.length
  const rows: string[][] = []

  while (index < lines.length) {
    const row: string[] = []

    while (row.length < colCount && index < lines.length) {
      const parts = splitCellValue(lines[index])
      index += 1
      for (const part of parts) {
        if (row.length < colCount) row.push(part)
      }
    }

    if (row.some((cell) => cell.length > 0)) {
      rows.push(row)
    }
  }

  return normalizeTableShape(headers, rows)
}

function parseJsonTable(text: string): AiTableData | null {
  try {
    const match = text.match(/\{[\s\S]*"headers"[\s\S]*"rows"[\s\S]*\}/)
    const raw = match?.[0] ?? text.trim()
    if (!raw.startsWith('{')) return null

    const parsed = JSON.parse(raw) as { headers?: unknown; rows?: unknown }
    if (!Array.isArray(parsed.headers) || !Array.isArray(parsed.rows)) return null

    const headers = parsed.headers.map(String).map(stripInlineMarkdown)
    const rows = parsed.rows
      .filter(Array.isArray)
      .map((row) => (row as unknown[]).map(String).map(stripInlineMarkdown))

    return normalizeTableShape(headers, rows)
  } catch {
    return null
  }
}

/** Converte una tabella Markdown in dati strutturati per l'editor. */
export function parseMarkdownTable(text: string): AiTableData | null {
  const lines = extractTableLines(text)
  if (lines.length < 2) return null

  const rows = lines
    .filter((line) => !isSeparatorRow(line))
    .map(parseRow)
    .filter((row) => row.some((cell) => cell.length > 0))

  if (rows.length < 2) return null

  return normalizeTableShape(rows[0], rows.slice(1))
}

export function parseTableFromAiResponse(text: string): AiTableData | null {
  return parseStructuredTableText(text)
}

/** Solo Markdown o JSON già strutturati — evita falsi positivi sul testo libero. */
export function parseStructuredTableText(text: string): AiTableData | null {
  return parseMarkdownTable(text) ?? parseJsonTable(text)
}

export function sanitizeTableData(table: AiTableData): AiTableData {
  const colCount = Math.max(
    table.headers.length,
    ...table.rows.map((row) => row.length),
    2,
  )

  const headers = Array.from({ length: colCount }, (_, index) =>
    stripInlineMarkdown(String(table.headers[index] ?? '')),
  )

  const rows = table.rows
    .map((row) =>
      Array.from({ length: colCount }, (_, index) =>
        stripInlineMarkdown(String(row[index] ?? '')),
      ),
    )
    .filter((row) => row.some((cell) => cell.length > 0))

  return { headers, rows }
}

export function isUsableTableData(
  table: AiTableData | null,
): table is AiTableData {
  if (!table) return false

  const { headers, rows } = sanitizeTableData(table)
  const filledHeaders = headers.filter((cell) => cell.trim()).length
  const filledCells = rows.flat().filter((cell) => cell.trim()).length

  if (filledHeaders < 2 || rows.length < 1) return false
  if (filledCells < 1) return false

  return true
}

export function parseLineListAsTable(text: string): AiTableData | null {
  const lines = getNonEmptyLines(text)
  if (lines.length < 2) return null

  const numberedLines = lines.filter((line) => /^\d+[.)]?\s+\S/.test(line))
  if (numberedLines.length < Math.ceil(lines.length * 0.5)) return null

  const rows = lines.map((line) => {
    const match = line.match(/^(\d+[.)]?)\s+(.*)$/)
    if (match) {
      return [match[1].replace(/[.)]$/, ''), match[2].trim()]
    }

    return ['', line]
  })

  return sanitizeTableData({
    headers: ['#', 'Contenuto'],
    rows,
  })
}

export function tableDataToPlainText(table: AiTableData): string {
  const { headers, rows } = table
  return [headers.join(' | '), ...rows.map((row) => row.join(' | '))].join('\n')
}
