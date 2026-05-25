export interface SourceInsertResult {
  value: string
  selectionStart: number
  selectionEnd: number
}

export function insertSourceText(
  textarea: HTMLTextAreaElement,
  text: string,
): SourceInsertResult {
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const value = textarea.value.slice(0, start) + text + textarea.value.slice(end)
  const caret = start + text.length

  return {
    value,
    selectionStart: caret,
    selectionEnd: caret,
  }
}

export function insertSourceAtCursor(
  textarea: HTMLTextAreaElement,
  before: string,
  after: string,
  placeholder = '',
): SourceInsertResult {
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const selected = textarea.value.slice(start, end) || placeholder
  const insert = `${before}${selected}${after}`
  const value = textarea.value.slice(0, start) + insert + textarea.value.slice(end)
  const selectionStart = start + before.length
  const selectionEnd = selectionStart + selected.length

  return { value, selectionStart, selectionEnd }
}

export function wrapSourceSelection(
  textarea: HTMLTextAreaElement,
  wrapper: string,
  placeholder = 'testo',
): SourceInsertResult {
  const half = Math.floor(wrapper.length / 2)
  const before = wrapper.slice(0, half)
  const after = wrapper.slice(half)
  return insertSourceAtCursor(textarea, before, after, placeholder)
}

export function formatMathForWritingMode(
  mode: 'markdown' | 'latex' | 'typst',
  latex: string,
  displayMode: boolean,
): string {
  if (displayMode) {
    if (mode === 'markdown') return `\n$$\n${latex}\n$$\n`
    if (mode === 'latex') return `\n\\[\n${latex}\n\\]\n`
    return `\n$ ${latex} $\n`
  }

  if (mode === 'latex') return `$${latex}$`
  return `$${latex}$`
}
