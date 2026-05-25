export type DiffPartType = 'equal' | 'removed' | 'added'

export interface DiffPart {
  type: DiffPartType
  text: string
}

function tokenize(text: string): string[] {
  return text.split(/(\s+)/).filter((part) => part.length > 0)
}

function buildLcsTable(a: string[], b: string[]): number[][] {
  const rows = a.length + 1
  const cols = b.length + 1
  const table = Array.from({ length: rows }, () => Array<number>(cols).fill(0))

  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      if (a[i - 1] === b[j - 1]) {
        table[i][j] = table[i - 1][j - 1] + 1
      } else {
        table[i][j] = Math.max(table[i - 1][j], table[i][j - 1])
      }
    }
  }

  return table
}

function pushPart(parts: DiffPart[], type: DiffPartType, text: string) {
  if (!text) return
  const last = parts[parts.length - 1]
  if (last?.type === type) {
    last.text += text
  } else {
    parts.push({ type, text })
  }
}

export function diffWords(before: string, after: string): DiffPart[] {
  const a = tokenize(before)
  const b = tokenize(after)
  const table = buildLcsTable(a, b)
  const parts: DiffPart[] = []

  let i = a.length
  let j = b.length

  const stack: DiffPart[] = []

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      pushPart(stack, 'equal', a[i - 1])
      i -= 1
      j -= 1
    } else if (j > 0 && (i === 0 || table[i][j - 1] >= table[i - 1][j])) {
      pushPart(stack, 'added', b[j - 1])
      j -= 1
    } else if (i > 0) {
      pushPart(stack, 'removed', a[i - 1])
      i -= 1
    }
  }

  while (stack.length > 0) {
    parts.push(stack.pop()!)
  }

  return parts.filter((part) => part.type !== 'equal' || part.text.trim().length > 0)
}

export function hasDiffChanges(parts: DiffPart[]): boolean {
  return parts.some((part) => part.type !== 'equal')
}

export function getChangedSnippet(
  before: string,
  after: string,
): { before: string; after: string } | null {
  const parts = diffWords(before, after)
  if (!hasDiffChanges(parts)) return null

  const removed = parts
    .filter((p) => p.type === 'removed')
    .map((p) => p.text)
    .join('')
  const added = parts
    .filter((p) => p.type === 'added')
    .map((p) => p.text)
    .join('')

  if (!removed && !added) return null
  return { before: removed, after: added }
}

export function compactDiffParts(parts: DiffPart[], maxLength = 200): DiffPart[] {
  let length = 0
  const compact: DiffPart[] = []

  for (const part of parts) {
    if (length >= maxLength) break

    const remaining = maxLength - length
    const text =
      part.text.length > remaining
        ? `${part.text.slice(0, remaining)}…`
        : part.text

    compact.push({ type: part.type, text })
    length += text.length
  }

  return compact
}
