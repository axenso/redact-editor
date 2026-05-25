import { normalizeTableHtml } from './normalizeTableHtml'
import { mathHtmlToTypst, replaceTypstMathDelimiters } from './typstMath'

function escapeTypstText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/#/g, '\\#')
    .replace(/@/g, '\\@')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
}

function inlineNodeToTypst(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return escapeTypstText(node.textContent ?? '')
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
    return mathHtmlToTypst(el)
  }

  const inner = Array.from(el.childNodes).map(inlineNodeToTypst).join('')

  if (tag === 'strong' || tag === 'b') {
    return inner ? `*${inner}*` : ''
  }

  if (tag === 'em' || tag === 'i') {
    return inner ? `_${inner}_` : ''
  }

  if (tag === 'u') {
    return inner ? `#underline[${inner}]` : ''
  }

  if (tag === 'br') {
    return '\n\n'
  }

  if (tag === 'a') {
    const href = el.getAttribute('href')?.trim()
    return href ? `#link("${href}")[${inner || href}]` : inner
  }

  return inner
}

function headingMarks(level: number): string {
  return '='.repeat(Math.min(Math.max(level, 1), 6))
}

function blockNodeToTypst(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = (node.textContent ?? '').trim()
    return text ? escapeTypstText(text) : ''
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
    return mathHtmlToTypst(el)
  }

  if (/^h[1-6]$/.test(tag)) {
    const level = Number(tag.slice(1))
    const text = Array.from(el.childNodes).map(inlineNodeToTypst).join('').trim()
    if (!text) return ''
    return `${headingMarks(level)} ${text}`
  }

  if (tag === 'ul') {
    const items = Array.from(el.children)
      .filter((child) => child.tagName.toLowerCase() === 'li')
      .map((child) => {
        const text = Array.from(child.childNodes).map(inlineNodeToTypst).join('').trim()
        return text ? `- ${text}` : ''
      })
      .filter(Boolean)
    return items.join('\n')
  }

  if (tag === 'ol') {
    const items = Array.from(el.children)
      .filter((child) => child.tagName.toLowerCase() === 'li')
      .map((child) => {
        const text = Array.from(child.childNodes).map(inlineNodeToTypst).join('').trim()
        return text ? `+ ${text}` : ''
      })
      .filter(Boolean)
    return items.join('\n')
  }

  if (tag === 'table') {
    const rows = Array.from(el.querySelectorAll('tr')).map((row) =>
      Array.from(row.cells).map((cell) =>
        Array.from(cell.childNodes).map(inlineNodeToTypst).join('').trim(),
      ),
    )
    if (rows.length === 0) return ''

    const colCount = Math.max(...rows.map((row) => row.length), 1)
    const columns = Array.from({ length: colCount }, () => 'auto').join(', ')
    const cells = rows
      .flatMap((row) =>
        Array.from({ length: colCount }, (_, index) => `[${row[index] ?? ''}]`),
      )
      .join(',\n  ')

    return `#table(\n  columns: (${columns}),\n  ${cells},\n)`
  }

  if (tag === 'p' || tag === 'div') {
    return Array.from(el.childNodes).map(inlineNodeToTypst).join('').trim()
  }

  return Array.from(el.childNodes).map(blockNodeToTypst).filter(Boolean).join('\n\n')
}

export function htmlToTypst(html: string): string {
  const root = document.createElement('div')
  root.innerHTML = html

  const blocks = Array.from(root.childNodes)
    .map(blockNodeToTypst)
    .filter(Boolean)

  const body = blocks.join('\n\n')

  return [
    '#set page(paper: "a4")',
    '#set text(size: 11pt)',
    '',
    body,
    '',
  ].join('\n')
}

function stripTypstPreamble(source: string): string {
  return source
    .replace(/^\/\/.*$/gm, '')
    .replace(/^#set\s+[^\n]*$/gm, '')
    .replace(/^#show\s+[^\n]*$/gm, '')
    .trim()
}

function processTypstInline(text: string): string {
  let result = text
  result = result.replace(/\*([^*\n]+)\*/g, '<strong>$1</strong>')
  result = result.replace(/_([^_\n]+)_/g, '<em>$1</em>')
  result = result.replace(/#underline\[([^\]]+)\]/g, '<u>$1</u>')
  return result
}

function convertTypstBulletLists(source: string): string {
  return source.replace(
    /(?:^|\n)((?:-\s+.+(?:\n|$))+)/g,
    (_match, block: string) => {
      const items = block
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.startsWith('- '))
        .map((line) => `<li>${processTypstInline(line.slice(2).trim())}</li>`)
      if (items.length === 0) return block
      return `\n<ul>${items.join('')}</ul>\n`
    },
  )
}

function convertTypstOrderedLists(source: string): string {
  return source.replace(
    /(?:^|\n)((?:\+\s+.+(?:\n|$))+)/g,
    (_match, block: string) => {
      const items = block
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.startsWith('+ '))
        .map((line) => `<li>${processTypstInline(line.slice(2).trim())}</li>`)
      if (items.length === 0) return block
      return `\n<ol>${items.join('')}</ol>\n`
    },
  )
}

function convertTypstTables(source: string): string {
  return source.replace(
    /#table\(\s*columns:\s*\(([^)]*)\),([\s\S]*?)\)/g,
    (_match, _columns, body: string) => {
      const cells = Array.from(body.matchAll(/\[([\s\S]*?)\]/g)).map((match) =>
        processTypstInline(match[1].trim()),
      )
      if (cells.length === 0) return ''

      const colCount = Math.max(
        _columns.split(',').map((part) => part.trim()).filter(Boolean).length,
        1,
      )
      const rows: string[] = []
      for (let index = 0; index < cells.length; index += colCount) {
        const slice = cells.slice(index, index + colCount)
        rows.push(
          `<tr>${slice.map((cell) => `<td>${cell}</td>`).join('')}</tr>`,
        )
      }

      return `<table class="editor-table"><tbody>${rows.join('')}</tbody></table>`
    },
  )
}

function convertTypstBlocks(source: string): string {
  let body = stripTypstPreamble(source)
  body = replaceTypstMathDelimiters(body)
  body = convertTypstTables(body)
  body = convertTypstBulletLists(body)
  body = convertTypstOrderedLists(body)

  body = body.replace(/^(={1,6})\s+(.+)$/gm, (_match, marks: string, title: string) => {
    const level = marks.length
    return `<h${level}>${processTypstInline(title.trim())}</h${level}>`
  })

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
      return `<p>${processTypstInline(chunk.replace(/\n+/g, ' '))}</p>`
    })

  const html = parts.join('')
  if (!html.trim()) {
    return '<p></p>'
  }

  return normalizeTableHtml(html)
}

export function typstToHtml(source: string): string {
  const trimmed = source.trim()
  if (!trimmed) {
    return '<p></p>'
  }

  return convertTypstBlocks(trimmed)
}
