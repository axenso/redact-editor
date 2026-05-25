import type { Editor } from '@tiptap/react'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'

const SKIP_BLOCK_TYPES = new Set([
  'doc',
  'table',
  'tableRow',
  'tableCell',
  'tableHeader',
])

export interface EditorBlockMatch {
  pos: number
  node: ProseMirrorNode
}

export function findBlockAtPos(
  editor: Editor,
  pos: number,
): EditorBlockMatch | null {
  const $pos = editor.state.doc.resolve(pos)

  for (let depth = $pos.depth; depth > 0; depth -= 1) {
    const node = $pos.node(depth)
    if (!node.isBlock || SKIP_BLOCK_TYPES.has(node.type.name)) continue

    return {
      pos: $pos.before(depth),
      node,
    }
  }

  return null
}

/** Blocco spostabile: figlio diretto del doc o voce di elenco. */
export function findDraggableBlockAtPos(
  editor: Editor,
  pos: number,
): EditorBlockMatch | null {
  const $pos = editor.state.doc.resolve(pos)

  for (let depth = $pos.depth; depth > 0; depth -= 1) {
    const node = $pos.node(depth)
    const parent = depth > 0 ? $pos.node(depth - 1) : null

    if (!node.isBlock || SKIP_BLOCK_TYPES.has(node.type.name)) continue

    if (node.type.name === 'listItem') {
      return { pos: $pos.before(depth), node }
    }

    if (parent?.type.name === 'doc') {
      return { pos: $pos.before(depth), node }
    }
  }

  return null
}

export function resolveDraggableBlock(
  editor: Editor,
  blockPos: number,
): EditorBlockMatch | null {
  const node = editor.state.doc.nodeAt(blockPos)
  if (!node) return null

  return findDraggableBlockAtPos(editor, blockPos + 1)
}

export interface GutterPosition {
  top: number
  blockPos: number
}

export function resolveGutterAtPoint(
  editor: Editor,
  shell: HTMLElement,
  clientX: number,
  clientY: number,
): GutterPosition | null {
  const shellRect = shell.getBoundingClientRect()
  if (
    clientX < shellRect.left ||
    clientX > shellRect.right ||
    clientY < shellRect.top ||
    clientY > shellRect.bottom
  ) {
    return null
  }

  const coords = editor.view.posAtCoords({ left: clientX, top: clientY })
  if (!coords) return null

  const block = findBlockAtPos(editor, coords.pos)
  if (!block) return null

  const blockDom = editor.view.nodeDOM(block.pos)
  if (!(blockDom instanceof HTMLElement)) return null

  const blockRect = blockDom.getBoundingClientRect()
  return {
    top: blockRect.top - shellRect.top + 2,
    blockPos: block.pos,
  }
}

export function focusBlockStart(editor: Editor, blockPos: number): boolean {
  return editor.chain().focus().setTextSelection(blockPos + 1).run()
}

export function focusBlockEnd(
  editor: Editor,
  blockPos: number,
  blockNode: ProseMirrorNode,
): boolean {
  const end = blockPos + blockNode.nodeSize - 1
  return editor.chain().focus().setTextSelection(end).run()
}

export interface BlockDropTarget {
  insertPos: number
  indicatorTop: number
  targetPos: number
}

export function getBlockDropTarget(
  editor: Editor,
  clientY: number,
  shellTop: number,
  draggedPos: number,
): BlockDropTarget | null {
  const editorRect = editor.view.dom.getBoundingClientRect()
  const coords = editor.view.posAtCoords({
    left: editorRect.left + editorRect.width / 2,
    top: clientY,
  })

  if (!coords) return null

  const target = findDraggableBlockAtPos(editor, coords.pos)
  if (!target || target.pos === draggedPos) return null

  const targetDom = editor.view.nodeDOM(target.pos)
  if (!(targetDom instanceof HTMLElement)) return null

  const rect = targetDom.getBoundingClientRect()
  const insertBefore = clientY < rect.top + rect.height / 2
  const insertPos = insertBefore
    ? target.pos
    : target.pos + target.node.nodeSize

  const draggedNode = editor.state.doc.nodeAt(draggedPos)
  if (!draggedNode) return null

  const draggedEnd = draggedPos + draggedNode.nodeSize
  if (insertPos > draggedPos && insertPos < draggedEnd) return null

  return {
    insertPos,
    indicatorTop: (insertBefore ? rect.top : rect.bottom) - shellTop,
    targetPos: target.pos,
  }
}
