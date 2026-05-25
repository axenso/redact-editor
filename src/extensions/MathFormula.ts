import { Node, mergeAttributes } from '@tiptap/core'
import katex from 'katex'

function createMathNode(displayMode: boolean) {
  const name = displayMode ? 'mathBlock' : 'mathInline'
  const group = displayMode ? 'block' : 'inline'
  const tag = displayMode ? 'div' : 'span'
  const className = displayMode
    ? 'math-formula math-formula-block'
    : 'math-formula math-formula-inline'
  const displayAttr = displayMode ? 'block' : 'inline'

  return Node.create({
    name,
    group,
    inline: !displayMode,
    atom: true,
    selectable: true,
    addAttributes() {
      return {
        latex: { default: '' },
      }
    },
    parseHTML() {
      return [
        {
          tag: `${tag}[data-latex][data-math-display="${displayAttr}"]`,
          getAttrs: (node) => ({
            latex: (node as HTMLElement).getAttribute('data-latex') ?? '',
          }),
        },
      ]
    },
    renderHTML({ node, HTMLAttributes }) {
      const latex = String(node.attrs.latex ?? '')
      const rendered = katex.renderToString(latex, {
        displayMode,
        throwOnError: false,
      })

      return [
        tag,
        mergeAttributes(HTMLAttributes, {
          class: className,
          'data-latex': latex,
          'data-math-display': displayAttr,
        }),
        ['span', { class: 'math-formula-render', innerHTML: rendered }],
      ]
    },
    addNodeView() {
      return ({ node }) => {
        const dom = document.createElement(tag)
        dom.className = className
        dom.setAttribute('data-latex', node.attrs.latex)
        dom.setAttribute('data-math-display', displayAttr)

        const render = document.createElement('span')
        render.className = 'math-formula-render'
        try {
          katex.render(node.attrs.latex, render, {
            displayMode,
            throwOnError: false,
          })
        } catch {
          render.textContent = node.attrs.latex
        }

        dom.appendChild(render)
        return { dom }
      }
    },
  })
}

export const MathInline = createMathNode(false)
export const MathBlock = createMathNode(true)
