import { createTable } from '@tiptap/extension-table'
import type { Editor } from '@tiptap/react'
import { TextSelection, type Transaction } from '@tiptap/pm/state'
import type { Node as ProseMirrorNode, Schema } from '@tiptap/pm/model'
import type { AiTableData } from './tableContent'

interface CellUpdate {
  contentFrom: number
  contentTo: number
  text: string
}

function normalizeTableData(table: AiTableData) {
  const colCount = Math.max(
    table.headers.length,
    ...table.rows.map((row) => row.length),
    1,
  )

  const headers = Array.from({ length: colCount }, (_, i) =>
    String(table.headers[i] ?? ''),
  )

  const rows = table.rows.map((row) =>
    Array.from({ length: colCount }, (_, i) => String(row[i] ?? '')),
  )

  return { headers, rows, colCount }
}

function collectCellUpdates(
  tableNode: ProseMirrorNode,
  tablePos: number,
  headers: string[],
  rows: string[][],
): CellUpdate[] {
  const updates: CellUpdate[] = []
  let rowIndex = 0

  tableNode.forEach((row, rowOffset) => {
    const rowData = rowIndex === 0 ? headers : rows[rowIndex - 1]
    let colIndex = 0

    row.forEach((cell, cellOffset) => {
      const cellPos = tablePos + 1 + rowOffset + cellOffset
      updates.push({
        contentFrom: cellPos + 1,
        contentTo: cellPos + cell.nodeSize - 1,
        text: rowData[colIndex] ?? '',
      })
      colIndex += 1
    })

    rowIndex += 1
  })

  return updates.sort((a, b) => b.contentFrom - a.contentFrom)
}

function applyCellUpdatesToTransaction(
  tr: Transaction,
  schema: Schema,
  tableNode: ProseMirrorNode,
  tablePos: number,
  headers: string[],
  rows: string[][],
) {
  const updates = collectCellUpdates(tableNode, tablePos, headers, rows)

  for (const { contentFrom, contentTo, text } of updates) {
    const paragraph = schema.nodes.paragraph.create(
      {},
      text ? schema.text(text) : undefined,
    )
    tr.replaceWith(contentFrom, contentTo, paragraph)
  }

  const mappedTablePos = tr.mapping.map(tablePos)
  tr.setSelection(TextSelection.near(tr.doc.resolve(mappedTablePos + 1)))
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

  const deleted = editor.chain().focus().deleteRange({ from, to }).run()
  if (!deleted) return false

  return insertAiTable(editor, table)
}

/** Inserisce una tabella AI con lo stesso flusso di insertTable (wrapper, resize, editing). */
export function insertAiTable(editor: Editor, table: AiTableData): boolean {
  const { headers, rows, colCount } = normalizeTableData(table)
  const rowCount = rows.length + 1

  return editor
    .chain()
    .focus()
    .insertTable({ rows: rowCount, cols: colCount, withHeaderRow: true })
    .command(({ tr, state, dispatch }) => {
      const found = findTableAtResolvedPos(tr.selection.$from)
      if (!found) return false

      applyCellUpdatesToTransaction(
        tr,
        state.schema,
        found.node,
        found.pos,
        headers,
        rows,
      )

      if (dispatch) dispatch(tr)
      return true
    })
    .run()
}

/** Aggiorna una tabella esistente con i dati generati dall'AI. */
export function updateAiTableAt(
  editor: Editor,
  tablePos: number,
  table: AiTableData,
): boolean {
  const { headers, rows, colCount } = normalizeTableData(table)
  const rowCount = rows.length + 1

  return editor
    .chain()
    .focus()
    .command(({ tr, state, dispatch }) => {
      const tableNode = tr.doc.nodeAt(tablePos)
      if (!tableNode || tableNode.type.name !== 'table') return false

      const needsResize =
        tableNode.childCount !== rowCount ||
        tableNode.firstChild?.childCount !== colCount

      if (needsResize) {
        const newTable = createTable(state.schema, rowCount, colCount, true)
        tr.replaceWith(tablePos, tablePos + tableNode.nodeSize, newTable)
        const mappedPos = tr.mapping.map(tablePos)
        const inserted = tr.doc.nodeAt(mappedPos)
        if (!inserted) return false

        applyCellUpdatesToTransaction(
          tr,
          state.schema,
          inserted,
          mappedPos,
          headers,
          rows,
        )
      } else {
        applyCellUpdatesToTransaction(
          tr,
          state.schema,
          tableNode,
          tablePos,
          headers,
          rows,
        )
      }

      if (dispatch) dispatch(tr)
      return true
    })
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
