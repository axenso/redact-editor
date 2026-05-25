import type { Node as ProseMirrorNode } from '@tiptap/pm/model'

/** Estrae il testo selezionato preservando i ritorni a capo tra blocchi. */
export function getSelectedTextFromRange(
  doc: ProseMirrorNode,
  from: number,
  to: number,
): string {
  return doc.textBetween(from, to, '\n', '\n')
}
