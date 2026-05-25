import { Extension } from '@tiptap/core'

export type LineHeightOptions = {
  types: string[]
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    lineHeight: {
      setLineHeight: (lineHeight: string) => ReturnType
      unsetLineHeight: () => ReturnType
    }
  }
}

function updateLineHeightInSelection(
  lineHeight: string | null,
  types: string[],
): (props: {
  tr: import('@tiptap/pm/state').Transaction
  state: import('@tiptap/pm/state').EditorState
  dispatch?: (tr: import('@tiptap/pm/state').Transaction) => void
}) => boolean {
  return ({ tr, state, dispatch }) => {
    const { from, to } = state.selection
    let changed = false

    const applyToNode = (node: import('@tiptap/pm/model').Node, pos: number) => {
      if (!types.includes(node.type.name)) return

      const attrs = { ...node.attrs }
      if (lineHeight === null) {
        delete attrs.lineHeight
      } else {
        attrs.lineHeight = lineHeight
      }

      tr.setNodeMarkup(pos, undefined, attrs)
      changed = true
    }

    if (from === to) {
      const { $from } = state.selection
      for (let depth = $from.depth; depth > 0; depth -= 1) {
        const node = $from.node(depth)
        if (types.includes(node.type.name)) {
          applyToNode(node, $from.before(depth))
          break
        }
      }
    } else {
      state.doc.nodesBetween(from, to, applyToNode)
    }

    if (dispatch && changed) {
      dispatch(tr)
    }

    return changed
  }
}

export const LineHeight = Extension.create<LineHeightOptions>({
  name: 'lineHeight',

  addOptions() {
    return {
      types: ['heading', 'paragraph'],
    }
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          lineHeight: {
            default: null,
            parseHTML: (element) => {
              const value = element.style.lineHeight
              return value ? value.replace(/['"]+/g, '') : null
            },
            renderHTML: (attributes) => {
              if (!attributes.lineHeight) {
                return {}
              }
              return { style: `line-height: ${attributes.lineHeight}` }
            },
          },
        },
      },
    ]
  },

  addCommands() {
    return {
      setLineHeight:
        (lineHeight) =>
        ({ tr, state, dispatch }) =>
          updateLineHeightInSelection(lineHeight, this.options.types)({
            tr,
            state,
            dispatch,
          }),

      unsetLineHeight:
        () =>
        ({ tr, state, dispatch }) =>
          updateLineHeightInSelection(null, this.options.types)({
            tr,
            state,
            dispatch,
          }),
    }
  },
})

export const LINE_HEIGHT_OPTIONS = [
  { label: '1', value: '1' },
  { label: '1,15', value: '1.15' },
  { label: '1,5', value: '1.5' },
  { label: '1,75', value: '1.75' },
  { label: '2', value: '2' },
] as const
