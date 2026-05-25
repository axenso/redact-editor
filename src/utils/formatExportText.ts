import TurndownService from 'turndown'

export interface TextExportOptions {
  documentTitle: string
  exportedAt?: Date
}

const GENERATOR_NAME = 'REACTA'

function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

function formatExportTimestamp(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function repeatChar(char: string, length: number): string {
  return char.repeat(Math.max(length, 3))
}

function inlinePlainText(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent ?? ''
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return ''
  }

  const el = node as HTMLElement
  const tag = el.tagName.toLowerCase()

  if (tag === 'br') return '\n'

  const inner = Array.from(el.childNodes).map(inlinePlainText).join('')

  if (tag === 'strong' || tag === 'b') {
    const text = normalizeWhitespace(inner)
    return text ? `**${text}**` : ''
  }

  if (tag === 'em' || tag === 'i') {
    const text = normalizeWhitespace(inner)
    return text ? `*${text}*` : ''
  }

  if (tag === 'u') {
    const text = normalizeWhitespace(inner)
    return text ? `_${text}_` : ''
  }

  if (tag === 'a') {
    const label = normalizeWhitespace(inner) || el.getAttribute('href') || 'link'
    const href = el.getAttribute('href')?.trim()
    return href ? `${label} (${href})` : label
  }

  return inner
}

function formatPlainTable(table: HTMLTableElement): string[] {
  const rows = Array.from(table.rows).map((row) =>
    Array.from(row.cells).map((cell) => normalizeWhitespace(cell.textContent ?? '')),
  )

  if (rows.length === 0) return []

  const colCount = Math.max(...rows.map((row) => row.length), 0)
  const normalized = rows.map((row) =>
    Array.from({ length: colCount }, (_, index) => row[index] ?? ''),
  )
  const colWidths = Array.from({ length: colCount }, (_, colIndex) =>
    Math.max(...normalized.map((row) => row[colIndex].length), 3),
  )

  const formatRow = (row: string[]) =>
    row.map((cell, index) => cell.padEnd(colWidths[index])).join(' | ')

  return [
    formatRow(normalized[0]),
    colWidths.map((width) => repeatChar('-', width)).join('-+-'),
    ...normalized.slice(1).map(formatRow),
  ]
}

function formatMediaBlock(label: string, caption?: string): string[] {
  const line = repeatChar('─', Math.max(label.length + 4, 40))
  return caption && caption !== label
    ? [line, label, caption, line]
    : [line, label, line]
}

interface PlainWalkState {
  lines: string[]
}

function pushBlankLine(state: PlainWalkState): void {
  if (state.lines.length === 0) return
  if (state.lines[state.lines.length - 1] !== '') {
    state.lines.push('')
  }
}

function pushHeading(state: PlainWalkState, text: string, level: number): void {
  const heading = normalizeWhitespace(text)
  if (!heading) return

  pushBlankLine(state)

  if (level === 1) {
    state.lines.push(heading, repeatChar('=', heading.length))
  } else if (level === 2) {
    state.lines.push(heading, repeatChar('-', heading.length))
  } else {
    const prefix = '#'.repeat(Math.min(level, 6))
    state.lines.push(`${prefix} ${heading}`)
  }

  state.lines.push('')
}

function walkPlainNode(node: Node, state: PlainWalkState): void {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = normalizeWhitespace(node.textContent ?? '')
    if (text) state.lines.push(text)
    return
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return

  const el = node as HTMLElement
  const tag = el.tagName.toLowerCase()

  if (el.classList.contains('export-chart')) {
    const caption =
      el.querySelector('figcaption')?.textContent?.trim() ||
      el.querySelector('img')?.getAttribute('alt')?.trim() ||
      'Grafico'
    pushBlankLine(state)
    state.lines.push(...formatMediaBlock(`[ Grafico: ${caption} ]`))
    state.lines.push('')
    return
  }

  if (el.classList.contains('tableWrapper')) {
    const table = el.querySelector('table')
    if (table) {
      pushBlankLine(state)
      state.lines.push(...formatPlainTable(table))
      state.lines.push('')
    }
    return
  }

  switch (tag) {
    case 'h1':
      pushHeading(state, el.textContent ?? '', 1)
      return
    case 'h2':
      pushHeading(state, el.textContent ?? '', 2)
      return
    case 'h3':
      pushHeading(state, el.textContent ?? '', 3)
      return
    case 'h4':
      pushHeading(state, el.textContent ?? '', 4)
      return
    case 'h5':
      pushHeading(state, el.textContent ?? '', 5)
      return
    case 'h6':
      pushHeading(state, el.textContent ?? '', 6)
      return
    case 'p': {
      const text = normalizeWhitespace(inlinePlainText(el))
      if (!text) return
      pushBlankLine(state)
      if (/^keywords\s*:/i.test(text)) {
        state.lines.push(`  ▸ ${text}`)
      } else {
        state.lines.push(text)
      }
      state.lines.push('')
      return
    }
    case 'blockquote': {
      const text = normalizeWhitespace(el.textContent ?? '')
      if (!text) return
      pushBlankLine(state)
      text.split('\n').forEach((line) => {
        if (line.trim()) state.lines.push(`> ${line.trim()}`)
      })
      state.lines.push('')
      return
    }
    case 'ul':
      pushBlankLine(state)
      Array.from(el.children).forEach((child) => walkPlainNode(child, state))
      state.lines.push('')
      return
    case 'ol': {
      pushBlankLine(state)
      let index = 1
      Array.from(el.children).forEach((child) => {
        if (child.tagName.toLowerCase() !== 'li') {
          walkPlainNode(child, state)
          return
        }
        const itemText = normalizeWhitespace(inlinePlainText(child))
        if (itemText) state.lines.push(`${index}. ${itemText}`)
        index += 1
      })
      state.lines.push('')
      return
    }
    case 'li': {
      const text = normalizeWhitespace(inlinePlainText(el))
      if (text) state.lines.push(`  • ${text}`)
      return
    }
    case 'table':
      pushBlankLine(state)
      state.lines.push(...formatPlainTable(el as HTMLTableElement))
      state.lines.push('')
      return
    case 'img': {
      const alt = el.getAttribute('alt')?.trim()
      pushBlankLine(state)
      state.lines.push(
        ...formatMediaBlock(alt ? `[ Immagine: ${alt} ]` : '[ Immagine ]'),
      )
      state.lines.push('')
      return
    }
    case 'hr':
      pushBlankLine(state)
      state.lines.push(repeatChar('─', 48))
      state.lines.push('')
      return
    case 'figure': {
      const caption = el.querySelector('figcaption')?.textContent?.trim()
      const alt = el.querySelector('img')?.getAttribute('alt')?.trim()
      const label = caption || alt || 'Figura'
      pushBlankLine(state)
      state.lines.push(...formatMediaBlock(`[ ${label} ]`, caption && alt ? alt : undefined))
      state.lines.push('')
      return
    }
    default:
      Array.from(el.childNodes).forEach((child) => walkPlainNode(child, state))
  }
}

function buildPlainTextHeader(options: TextExportOptions): string[] {
  const exportedAt = options.exportedAt ?? new Date()
  const title = normalizeWhitespace(options.documentTitle) || 'Documento'
  const border = repeatChar('═', Math.max(title.length + 8, 52))

  return [
    border,
    title.toUpperCase(),
    `Esportato: ${formatExportTimestamp(exportedAt)} · ${GENERATOR_NAME}`,
    border,
    '',
  ]
}

export function buildPlainTextDocument(
  html: string,
  options: TextExportOptions,
): string {
  const root = document.createElement('div')
  root.innerHTML = html

  const state: PlainWalkState = {
    lines: buildPlainTextHeader(options),
  }

  Array.from(root.childNodes).forEach((node) => walkPlainNode(node, state))

  while (state.lines.length > 0 && state.lines[state.lines.length - 1] === '') {
    state.lines.pop()
  }

  return `${state.lines.join('\n')}\n`
}

function createTurndownService(): TurndownService {
  const service = new TurndownService({
    headingStyle: 'atx',
    bulletListMarker: '-',
    emDelimiter: '*',
    strongDelimiter: '**',
    codeBlockStyle: 'fenced',
    hr: '---',
  })

  service.addRule('underline', {
    filter: ['u'],
    replacement: (content) => (content ? `_${content}_` : ''),
  })

  service.addRule('strikethrough', {
    filter: (node) => {
      const tag = node.nodeName.toLowerCase()
      return tag === 'del' || tag === 's' || tag === 'strike'
    },
    replacement: (content) => (content ? `~~${content}~~` : ''),
  })

  service.addRule('tableWrapper', {
    filter: (node) =>
      node.nodeName === 'DIV' &&
      (node as HTMLElement).classList.contains('tableWrapper'),
    replacement: (_content, node) => {
      const table = (node as HTMLElement).querySelector('table')
      if (!table) return ''
      return service.turndown(table.outerHTML)
    },
  })

  service.addRule('table', {
    filter: 'table',
    replacement: (_content, node) => {
      const table = node as HTMLTableElement
      const rows = Array.from(table.rows)
      if (rows.length === 0) return ''

      const cells = rows.map((row) =>
        Array.from(row.cells).map((cell) =>
          normalizeWhitespace(cell.textContent ?? '')
            .replace(/\|/g, '\\|')
            .replace(/\n/g, ' '),
        ),
      )

      const colCount = Math.max(...cells.map((row) => row.length), 0)
      const normalized = cells.map((row) =>
        Array.from({ length: colCount }, (_, index) => row[index] ?? ''),
      )

      const header = normalized[0]
      const separator = header.map((cell) => {
        const width = Math.max(cell.length, 3)
        return repeatChar('-', width)
      })
      const body = normalized.slice(1)
      const formatRow = (row: string[]) => `| ${row.join(' | ')} |`

      return [
        '',
        formatRow(header),
        formatRow(separator),
        ...body.map(formatRow),
        '',
      ].join('\n')
    },
  })

  service.addRule('chartFigure', {
    filter: (node) =>
      node.nodeName === 'FIGURE' &&
      (node as HTMLElement).classList.contains('export-chart'),
    replacement: (_content, node) => {
      const figure = node as HTMLElement
      const caption = figure.querySelector('figcaption')?.textContent?.trim()
      const alt =
        figure.querySelector('img')?.getAttribute('alt')?.trim() ||
        caption ||
        'Grafico'
      const src = figure.querySelector('img')?.getAttribute('src')
      const title = caption || alt

      if (src?.startsWith('data:')) {
        return `\n\n![${alt}](${src})\n\n*${title}*\n`
      }

      return `\n\n> **Grafico:** ${title}\n\n`
    },
  })

  service.addRule('standaloneImage', {
    filter: (node) =>
      node.nodeName === 'IMG' &&
      !(node.parentElement?.classList.contains('export-chart')),
    replacement: (_content, node) => {
      const img = node as HTMLImageElement
      const alt = img.getAttribute('alt')?.trim() || 'Immagine'
      const src = img.getAttribute('src')?.trim()

      if (src?.startsWith('data:')) {
        return `\n\n![${alt}](${src})\n`
      }

      return `\n\n> **Immagine:** ${alt}\n\n`
    },
  })

  service.addRule('keywordsParagraph', {
    filter: (node) => {
      if (node.nodeName !== 'P') return false
      const text = normalizeWhitespace(node.textContent ?? '')
      return /^keywords\s*:/i.test(text)
    },
    replacement: (_content, node) => {
      const text = normalizeWhitespace((node as HTMLElement).textContent ?? '')
      return `\n\n**${text}**\n`
    },
  })

  return service
}

const turndown = createTurndownService()

function normalizeMarkdownBody(markdown: string): string {
  return markdown
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function contentStartsWithMatchingTitle(html: string, title: string): boolean {
  const root = document.createElement('div')
  root.innerHTML = html
  const firstHeading = root.querySelector('h1')
  if (!firstHeading) return false
  return (
    normalizeWhitespace(firstHeading.textContent ?? '').toLowerCase() ===
    normalizeWhitespace(title).toLowerCase()
  )
}

function buildMarkdownFrontmatter(options: TextExportOptions): string {
  const exportedAt = options.exportedAt ?? new Date()
  const title = options.documentTitle.replace(/"/g, '\\"')

  return [
    '---',
    `title: "${title}"`,
    `date: "${exportedAt.toISOString()}"`,
    `generator: "${GENERATOR_NAME}"`,
    '---',
    '',
  ].join('\n')
}

export function buildMarkdownDocument(
  html: string,
  options: TextExportOptions,
): string {
  const body = normalizeMarkdownBody(turndown.turndown(html))
  const parts: string[] = [buildMarkdownFrontmatter(options)]

  if (!contentStartsWithMatchingTitle(html, options.documentTitle)) {
    parts.push(`# ${options.documentTitle}`, '')
  }

  if (body) {
    parts.push(body)
  }

  parts.push('', '---', `*Esportato con ${GENERATOR_NAME}*`)

  return `${normalizeMarkdownBody(parts.join('\n'))}\n`
}

export function htmlToMarkdown(html: string): string {
  return normalizeMarkdownBody(turndown.turndown(html))
}
