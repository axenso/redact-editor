import { normalizeTableHtml } from './normalizeTableHtml'
import {
  mathHtmlToLatex,
  replaceLatexMathDelimiters,
} from './latexMath'

function escapeLatexText(text: string): string {
  return text
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/([#%&_{}])/g, '\\$1')
    .replace(/\^/g, '\\^{}')
    .replace(/~/g, '\\~{}')
}

function inlineNodeToLatex(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return escapeLatexText(node.textContent ?? '')
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return ''
  }

  const el = node as HTMLElement
  const tag = el.tagName.toLowerCase()

  if (
    el.classList.contains('math-formula') ||
    (el.hasAttribute('data-latex') && el.hasAttribute('data-math-display'))
  ) {
    return mathHtmlToLatex(el)
  }

  const inner = Array.from(el.childNodes).map(inlineNodeToLatex).join('')

  if (tag === 'strong' || tag === 'b') {
    return inner ? `\\textbf{${inner}}` : ''
  }

  if (tag === 'em' || tag === 'i') {
    return inner ? `\\textit{${inner}}` : ''
  }

  if (tag === 'u') {
    return inner ? `\\underline{${inner}}` : ''
  }

  if (tag === 'br') {
    return '\\\\'
  }

  if (tag === 'a') {
    const href = el.getAttribute('href')?.trim()
    return href ? `\\href{${href}}{${inner || href}}` : inner
  }

  return inner
}

function blockNodeToLatex(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = (node.textContent ?? '').trim()
    return text ? escapeLatexText(text) : ''
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return ''
  }

  const el = node as HTMLElement
  const tag = el.tagName.toLowerCase()

  if (
    el.classList.contains('math-formula') ||
    (el.hasAttribute('data-latex') && el.hasAttribute('data-math-display'))
  ) {
    return mathHtmlToLatex(el)
  }

  if (/^h[1-6]$/.test(tag)) {
    const level = Number(tag.slice(1))
    const text = Array.from(el.childNodes).map(inlineNodeToLatex).join('').trim()
    if (!text) return ''
    if (level === 1) return `\\section{${text}}`
    if (level === 2) return `\\subsection{${text}}`
    if (level === 3) return `\\subsubsection{${text}}`
    return `\\paragraph{${text}}`
  }

  if (tag === 'ul') {
    const items = Array.from(el.children)
      .filter((child) => child.tagName.toLowerCase() === 'li')
      .map((child) => `  \\item ${Array.from(child.childNodes).map(inlineNodeToLatex).join('').trim()}`)
      .filter(Boolean)
    if (items.length === 0) return ''
    return ['\\begin{itemize}', ...items, '\\end{itemize}'].join('\n')
  }

  if (tag === 'ol') {
    const items = Array.from(el.children)
      .filter((child) => child.tagName.toLowerCase() === 'li')
      .map((child) => `  \\item ${Array.from(child.childNodes).map(inlineNodeToLatex).join('').trim()}`)
      .filter(Boolean)
    if (items.length === 0) return ''
    return ['\\begin{enumerate}', ...items, '\\end{enumerate}'].join('\n')
  }

  if (tag === 'table') {
    const rows = Array.from(el.querySelectorAll('tr')).map((row) =>
      Array.from(row.cells)
        .map((cell) =>
          Array.from(cell.childNodes).map(inlineNodeToLatex).join('').trim(),
        )
        .join(' & '),
    )
    if (rows.length === 0) return ''
    const colCount = Math.max(...rows.map((row) => row.split(' & ').length), 1)
    const spec = '|' + 'c|'.repeat(colCount)
    return [
      '\\begin{tabular}{' + spec + '}',
      '\\hline',
      ...rows.map((row) => `${row} \\\\`),
      '\\hline',
      '\\end{tabular}',
    ].join('\n')
  }

  if (tag === 'p' || tag === 'div') {
    const text = Array.from(el.childNodes).map(inlineNodeToLatex).join('').trim()
    return text
  }

  return Array.from(el.childNodes).map(blockNodeToLatex).filter(Boolean).join('\n\n')
}

export function htmlToLatex(html: string): string {
  const root = document.createElement('div')
  root.innerHTML = html

  const blocks = Array.from(root.childNodes)
    .map(blockNodeToLatex)
    .filter(Boolean)

  const body = blocks.join('\n\n')

  return [
    '\\documentclass{article}',
    '\\usepackage{amsmath}',
    '\\begin{document}',
    '',
    body,
    '',
    '\\end{document}',
    '',
  ].join('\n')
}

function stripLatexDocumentPreamble(source: string): string {
  return source
    .replace(/\\documentclass(\[[^\]]*\])?\{[^}]*\}/g, '')
    .replace(/\\usepackage(\[[^\]]*\])?\{[^}]*\}/g, '')
    .replace(/\\begin\{document\}/g, '')
    .replace(/\\end\{document\}/g, '')
    .trim()
}

function convertLatexLists(source: string): string {
  return source.replace(
    /\\begin\{(itemize|enumerate)\}([\s\S]*?)\\end\{\1\}/g,
    (_match, env, body) => {
      const tag = env === 'enumerate' ? 'ol' : 'ul'
      const items = String(body)
        .split(/\\item/g)
        .slice(1)
        .map((item) => item.trim())
        .filter(Boolean)
        .map((item) => `<li>${processLatexInline(item)}</li>`)
      if (items.length === 0) return ''
      return `<${tag}>${items.join('')}</${tag}>`
    },
  )
}

function processLatexInline(text: string): string {
  let result = replaceLatexMathDelimiters(text)
  result = result.replace(/\\textbf\{([^}]*)\}/g, '<strong>$1</strong>')
  result = result.replace(/\\textit\{([^}]*)\}/g, '<em>$1</em>')
  result = result.replace(/\\emph\{([^}]*)\}/g, '<em>$1</em>')
  result = result.replace(/\\underline\{([^}]*)\}/g, '<u>$1</u>')
  result = result.replace(/\\\\/g, '<br>')
  return result
}

function convertLatexBlocks(source: string): string {
  let body = stripLatexDocumentPreamble(source)
  body = convertLatexLists(body)
  body = replaceLatexMathDelimiters(body)

  body = body.replace(/\\section\*?\{([^}]*)\}/g, '<h1>$1</h1>')
  body = body.replace(/\\subsection\*?\{([^}]*)\}/g, '<h2>$1</h2>')
  body = body.replace(/\\subsubsection\*?\{([^}]*)\}/g, '<h3>$1</h3>')
  body = body.replace(/\\paragraph\*?\{([^}]*)\}/g, '<h4>$1</h4>')

  body = body.replace(
    /\\begin\{tabular\}\{[^}]*\}([\s\S]*?)\\end\{tabular\}/g,
    (_match, tableBody) => {
      const rows = String(tableBody)
        .split('\\\\')
        .map((row) => row.replace(/\\hline/g, '').trim())
        .filter(Boolean)
        .map((row) => {
          const cells = row.split('&').map((cell) => cell.trim())
          return `<tr>${cells.map((cell) => `<td>${processLatexInline(cell)}</td>`).join('')}</tr>`
        })
      if (rows.length === 0) return ''
      return `<table class="editor-table"><tbody>${rows.join('')}</tbody></table>`
    },
  )

  const parts = body
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      if (/^<(h[1-6]|ul|ol|table|div|span)/.test(chunk)) {
        return chunk
      }
      if (chunk.includes('class="math-formula')) {
        return chunk
      }
      return `<p>${processLatexInline(chunk.replace(/\n+/g, ' '))}</p>`
    })

  const html = parts.join('')
  if (!html.trim()) {
    return '<p></p>'
  }

  return normalizeTableHtml(html)
}

export function latexToHtml(latex: string): string {
  const trimmed = latex.trim()
  if (!trimmed) {
    return '<p></p>'
  }

  return convertLatexBlocks(trimmed)
}
