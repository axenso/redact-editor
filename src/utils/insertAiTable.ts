import type { Editor } from '@tiptap/react'
import { TextSelection } from '@tiptap/pm/state'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import type { AiTableData } from './tableContent'

function normalizeTableData(table: AiTableData) {
  const colCount = Math.max(
    table.headers.length,
    ...table.rows.map((row) => row.length),
    2,
  )

  const headers = Array.from({ length: colCount }, (_, index) =>
    String(table.headers[index] ?? ''),
  )

  const rows = table.rows
    .map((row) =>
      Array.from({ length: colCount }, (_, index) => String(row[index] ?? '')),
    )
    .filter((row) => row.some((cell) => cell.trim().length > 0))

  return { headers, rows, colCount }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function buildTableHtml(table: AiTableData): string {
  const { headers, rows, colCount } = normalizeTableData(table)

  const headerRow = `<tr>${headers
    .map((header) => `<th><p>${escapeHtml(header)}</p></th>`)
    .join('')}</tr>`

  const bodyRows = rows
    .map(
      (row) =>
        `<tr>${Array.from({ length: colCount }, (_, index) => {
          const value = row[index] ?? ''
          return `<td><p>${escapeHtml(value)}</p></td>`
        }).join('')}</tr>`,
    )
    .join('')

  return `<table class="editor-table"><tbody>${headerRow}${bodyRows}</tbody></table>`
}

function findTableAtResolvedPos($from: {
  depth: number
  node: (depth: number) => ProseMirrorNode
  before: (depth: number) => number
}) {
  for (let depth = $from.depth; depth > 0; depth -= 1) {
    const node = $from.node(depth)
    if (node.type.name === 'table') {
      return { node, pos: $from.before(depth) }
    }
  }

  return null
}

export function findTableAtSelection(
  editor: Editor,
  pos: number,
): { node: ProseMirrorNode; pos: number } | null {
  if (pos < 0 || pos > editor.state.doc.content.size) return null
  return findTableAtResolvedPos(editor.state.doc.resolve(pos))
}

export function findTablePosFromDom(editor: Editor, tableEl: HTMLTableElement) {
  const pos = editor.view.posAtDOM(tableEl, 0)
  if (pos < 0) return null

  return findTableAtResolvedPos(editor.state.doc.resolve(pos))
}

export function focusTableEditor(editor: Editor, tablePos: number): boolean {
  const tableNode = editor.state.doc.nodeAt(tablePos)
  if (!tableNode || tableNode.type.name !== 'table') return false

  const selection = TextSelection.near(editor.state.doc.resolve(tablePos + 1))
  return editor.chain().focus().setTextSelection(selection.from).run()
}

function selectionCoversTable(
  from: number,
  to: number,
  tablePos: number,
  tableNode: ProseMirrorNode,
): boolean {
  const tableEnd = tablePos + tableNode.nodeSize
  return from >= tablePos && to <= tableEnd
}

/** Applica dati tabella sostituendo la selezione o aggiornando la tabella corrente. */
export function applyTableDataAtSelection(
  editor: Editor,
  from: number,
  to: number,
  table: AiTableData,
): boolean {
  const tableAtSelection = findTableAtSelection(editor, from)

  if (
    tableAtSelection &&
    selectionCoversTable(
      from,
      to,
      tableAtSelection.pos,
      tableAtSelection.node,
    )
  ) {
    return updateAiTableAt(editor, tableAtSelection.pos, table)
  }

  const html = buildTableHtml(table)

  return editor
    .chain()
    .focus()
    .deleteRange({ from, to })
    .insertContentAt(from, html)
    .run()
}

/** Inserisce una tabella AI al cursore. */
export function insertAiTable(editor: Editor, table: AiTableData): boolean {
  return editor.chain().focus().insertContent(buildTableHtml(table)).run()
}

/** Aggiorna una tabella esistente con i dati generati dall'AI. */
export function updateAiTableAt(
  editor: Editor,
  tablePos: number,
  table: AiTableData,
): boolean {
  const tableNode = editor.state.doc.nodeAt(tablePos)
  if (!tableNode || tableNode.type.name !== 'table') return false

  const end = tablePos + tableNode.nodeSize
  const html = buildTableHtml(table)

  return editor
    .chain()
    .focus()
    .deleteRange({ from: tablePos, to: end })
    .insertContentAt(tablePos, html)
    .run()
}

export function runTableCommand(
  editor: Editor,
  run: (chain: ReturnType<Editor['chain']>) => ReturnType<Editor['chain']>,
  tablePos?: number,
): boolean {
  if (!editor.isActive('table')) {
    let targetPos = tablePos ?? null

    if (targetPos == null) {
      const { $from } = editor.state.selection
      for (let depth = $from.depth; depth > 0; depth -= 1) {
        if ($from.node(depth).type.name === 'table') {
          targetPos = $from.before(depth)
          break
        }
      }
    }

    if (targetPos == null || !focusTableEditor(editor, targetPos)) {
      return false
    }
  }

  return run(editor.chain().focus()).run()
}
