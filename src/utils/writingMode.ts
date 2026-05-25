import { htmlToLatex, latexToHtml } from './latexEditor'
import { htmlToMarkdown, markdownToHtml } from './markdownEditor'
import { normalizeTableHtml } from './normalizeTableHtml'
import { stripDiffMarksFromHtml } from './sanitizeHtml'
import { htmlToTypst, typstToHtml } from './typstEditor'

export type WritingMode = 'visual' | 'markdown' | 'latex' | 'typst'

export interface WritingModeSources {
  editorHtml: string
  markdown: string
  latex: string
  typst: string
}

export const WRITING_MODE_OPTIONS: {
  id: WritingMode
  label: string
  hint: string
}[] = [
  { id: 'visual', label: 'Visuale', hint: 'Editor WYSIWYG' },
  { id: 'markdown', label: 'Markdown', hint: 'Sorgente con $formule$' },
  { id: 'latex', label: 'LaTeX', hint: 'Sorgente .tex' },
  { id: 'typst', label: 'Typst', hint: 'Sorgente .typ' },
]

export function resolveWritingModeHtml(
  mode: WritingMode,
  sources: WritingModeSources,
): string {
  if (mode === 'markdown') {
    return normalizeTableHtml(markdownToHtml(sources.markdown))
  }

  if (mode === 'latex') {
    return normalizeTableHtml(latexToHtml(sources.latex))
  }

  if (mode === 'typst') {
    return normalizeTableHtml(typstToHtml(sources.typst))
  }

  return normalizeTableHtml(stripDiffMarksFromHtml(sources.editorHtml))
}

export function convertHtmlToWritingModeSource(
  mode: WritingMode,
  html: string,
): string {
  const clean = stripDiffMarksFromHtml(html)

  if (mode === 'markdown') {
    return htmlToMarkdown(clean)
  }

  if (mode === 'latex') {
    return htmlToLatex(clean)
  }

  if (mode === 'typst') {
    return htmlToTypst(clean)
  }

  return clean
}
