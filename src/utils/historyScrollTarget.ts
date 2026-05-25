import type { Editor } from '@tiptap/react'
import type { EditHistoryEntry } from '../types/editHistory'
import { htmlToText } from './htmlToText'
import { diffWords } from './textDiff'

type ScrollTarget =
  | { kind: 'text'; text: string }
  | { kind: 'dom'; selector: string; index: number }

const BLOCK_MARKERS = [
  { pattern: /data-chart-block/g, selector: '[data-chart-block], .chart-block' },
  { pattern: /data-image-block/g, selector: '[data-image-block], .image-block' },
  { pattern: /<table/gi, selector: 'table' },
] as const

function countPattern(html: string, pattern: RegExp): number {
  return (html.match(pattern) || []).length
}

function getAddedTextSnippet(before: string, after: string): string | null {
  const parts = diffWords(htmlToText(before), htmlToText(after))
  const added = parts.find((part) => part.type === 'added' && part.text.trim())
  if (!added) return null

  const snippet = added.text.replace(/\s+/g, ' ').trim().slice(0, 120)
  return snippet.length >= 3 ? snippet : null
}

function getContextBeforeBlock(html: string, blockSelector: string): string | null {
  const root = document.createElement('div')
  root.innerHTML = html

  const block = root.querySelector(blockSelector)
  if (!block) return null

  const blocks = Array.from(
    root.querySelectorAll('p, h1, h2, h3, h4, li, blockquote'),
  )
  const blockIndex = blocks.findIndex(
    (element) => element === block || element.contains(block),
  )

  if (blockIndex > 0) {
    const text = (blocks[blockIndex - 1].textContent ?? '').replace(/\s+/g, ' ').trim()
    if (text.length >= 8) return text.slice(-80)
  }

  const following = (block.nextElementSibling?.textContent ?? '')
    .replace(/\s+/g, ' ')
    .trim()
  if (following.length >= 8) return following.slice(0, 80)

  return null
}

export function findHistoryScrollTarget(
  entry: EditHistoryEntry,
): ScrollTarget | null {
  const before = entry.contentHtmlBefore ?? ''
  const after = entry.contentHtml

  if (entry.selectionAfter?.trim()) {
    return { kind: 'text', text: entry.selectionAfter.trim() }
  }

  for (const { pattern, selector } of BLOCK_MARKERS) {
    const beforeCount = countPattern(before, pattern)
    const afterCount = countPattern(after, pattern)

    if (afterCount > beforeCount) {
      return {
        kind: 'dom',
        selector,
        index: Math.max(0, afterCount - 1),
      }
    }

    if (afterCount < beforeCount) {
      const context = getContextBeforeBlock(before, selector.split(',')[0].trim())
      if (context) {
        return { kind: 'text', text: context }
      }
    }
  }

  if (before) {
    const addedSnippet = getAddedTextSnippet(before, after)
    if (addedSnippet) {
      return { kind: 'text', text: addedSnippet }
    }
  }

  if (entry.selectionBefore?.trim()) {
    return { kind: 'text', text: entry.selectionBefore.trim() }
  }

  return null
}

function textOffsetToPos(editor: Editor, targetOffset: number): number | null {
  let offset = 0
  let result: number | null = null

  editor.state.doc.descendants((node, pos) => {
    if (result !== null) return false
    if (!node.isText) return

    const text = node.text ?? ''
    const next = offset + text.length

    if (targetOffset < next) {
      result = pos + Math.max(0, targetOffset - offset)
      return false
    }

    offset = next
  })

  return result
}

function scrollElementIntoEditorView(
  editor: Editor,
  element: HTMLElement,
): void {
  try {
    const pos = editor.view.posAtDOM(element, 0)
    editor.chain().focus().setTextSelection(pos).scrollIntoView().run()
  } catch {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    return
  }

  element.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

function scrollEditorToText(editor: Editor, searchText: string): boolean {
  const normalized = searchText.replace(/\s+/g, ' ').trim()
  if (!normalized) return false

  const docText = editor.state.doc.textContent.replace(/\s+/g, ' ')
  const candidates = [
    normalized,
    normalized.slice(0, Math.min(80, normalized.length)),
    normalized.slice(0, Math.min(40, normalized.length)),
  ].filter(
    (candidate, index, list) =>
      candidate.length >= 4 && list.indexOf(candidate) === index,
  )

  for (const candidate of candidates) {
    const index = docText.indexOf(candidate)
    if (index === -1) continue

    const pos = textOffsetToPos(editor, index)
    if (pos === null) continue

    editor.chain().focus().setTextSelection(pos).scrollIntoView().run()

    const domAtPos = editor.view.domAtPos(pos)
    const node = domAtPos.node
    const element =
      node instanceof HTMLElement
        ? node
        : node.parentElement

    const block = element?.closest(
      'p, h1, h2, h3, h4, li, blockquote, table, [data-chart-block], [data-image-block], .chart-block, .image-block',
    )

    if (block instanceof HTMLElement) {
      block.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }

    return true
  }

  return false
}

function scrollEditorToDom(
  editor: Editor,
  selector: string,
  index: number,
): boolean {
  const elements = editor.view.dom.querySelectorAll(selector)
  if (elements.length === 0) return false

  const element = elements.item(Math.min(index, elements.length - 1))
  if (!(element instanceof HTMLElement)) return false

  scrollElementIntoEditorView(editor, element)
  return true
}

export function scrollEditorToHistoryChange(
  editor: Editor,
  entry: EditHistoryEntry,
): boolean {
  const target = findHistoryScrollTarget(entry)
  if (!target) return false

  if (target.kind === 'dom') {
    return scrollEditorToDom(editor, target.selector, target.index)
  }

  return scrollEditorToText(editor, target.text)
}
