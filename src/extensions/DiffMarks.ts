import { Mark } from '@tiptap/core'

export const DiffAdded = Mark.create({
  name: 'diffAdded',
  inclusive: false,
  parseHTML: () => [{ tag: 'span.diff-added' }],
  renderHTML: () => ['span', { class: 'diff-added' }, 0],
})

export const DiffRemoved = Mark.create({
  name: 'diffRemoved',
  inclusive: false,
  parseHTML: () => [{ tag: 'span.diff-removed' }],
  renderHTML: () => ['span', { class: 'diff-removed' }, 0],
})
