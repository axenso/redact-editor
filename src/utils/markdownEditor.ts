import { marked } from 'marked'
import { htmlToMarkdown } from './formatExportText'
import { normalizeTableHtml } from './normalizeTableHtml'
import { replaceMarkdownMathDelimiters } from './latexMath'

marked.setOptions({
  gfm: true,
  breaks: true,
})

export { htmlToMarkdown }

export function markdownToHtml(markdown: string): string {
  const trimmed = markdown.trim()
  if (!trimmed) {
    return '<p></p>'
  }

  const withMath = replaceMarkdownMathDelimiters(trimmed)
  const html = marked.parse(withMath, { async: false })
  if (typeof html !== 'string' || !html.trim()) {
    return '<p></p>'
  }

  return normalizeTableHtml(html)
}
