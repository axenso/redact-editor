import { Node, mergeAttributes } from '@tiptap/core'
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from '@tiptap/react'
import { Maximize2, Minimize2, Pencil, Ratio, Square, X } from 'lucide-react'
import { AppIcon } from '../components/LucideIcon'
import { BlockHoverButton } from '../components/BlockHoverButton'

export interface ImageBlockAttrs {
  src: string
  alt: string
  width: string
  height: string
}

export interface ImageBlockStorage {
  onEditImage: ((pos: number, attrs: ImageBlockAttrs) => void) | null
}

export const DEFAULT_IMAGE_ATTRS: ImageBlockAttrs = {
  src: '',
  alt: '',
  width: '',
  height: '',
}

const WIDTH_PRESETS: { value: string; icon: typeof Square; title: string }[] = [
  { value: '25%', icon: Square, title: 'Piccola (25%)' },
  { value: '50%', icon: Ratio, title: 'Media (50%)' },
  { value: '100%', icon: Maximize2, title: 'Grande (100%)' },
  { value: '', icon: Minimize2, title: 'Larghezza automatica' },
]

export function normalizeCssSize(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (/^\d+$/.test(trimmed)) return `${trimmed}px`
  return trimmed
}

export function imageAttrsToForm(attrs: ImageBlockAttrs) {
  return {
    src: attrs.src ?? '',
    alt: attrs.alt ?? '',
    width: attrs.width ?? '',
    height: attrs.height ?? '',
  }
}

function normalizeImageAttrs(
  attrs?: Partial<ImageBlockAttrs>,
): ImageBlockAttrs {
  return {
    src: attrs?.src?.trim() ?? '',
    alt: attrs?.alt?.trim() ?? '',
    width: attrs?.width?.trim() ?? '',
    height: attrs?.height?.trim() ?? '',
  }
}

function readSizeFromElement(el: Element, attr: 'width' | 'height'): string {
  const value = el.getAttribute(attr)
  if (value) return value

  if (el instanceof HTMLElement) {
    const inline = el.style[attr]
    if (inline) return inline
  }

  return ''
}

function ImageNodeView({
  node,
  selected,
  editor,
  getPos,
  updateAttributes,
  deleteNode,
}: NodeViewProps) {
  const attrs = node.attrs as ImageBlockAttrs
  const hasSrc = Boolean(attrs.src)

  const openEditor = () => {
    const pos = getPos()
    if (typeof pos !== 'number') return
    const storage = editor.storage.imageBlock as ImageBlockStorage
    storage.onEditImage?.(pos, attrs)
  }

  const imgStyle: React.CSSProperties = {
    display: 'block',
    maxWidth: '100%',
    height: attrs.height ? normalizeCssSize(attrs.height) : 'auto',
    width: attrs.width ? normalizeCssSize(attrs.width) : 'auto',
    margin: '0 auto',
  }

  return (
    <NodeViewWrapper
      as="div"
      className={selected ? 'image-block image-block-selected' : 'image-block'}
      data-drag-handle
    >
      <div
        className="image-block-inner"
        onDoubleClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          openEditor()
        }}
      >
        {hasSrc ? (
          <img
            src={attrs.src}
            alt={attrs.alt || 'Immagine'}
            style={imgStyle}
            draggable={false}
          />
        ) : (
          <p className="image-block-empty">Immagine non disponibile</p>
        )}

        <div
          className="block-hover-actions block-hover-actions-image"
          role="toolbar"
          aria-label="Modifica immagine"
        >
          <span className="block-hover-group-label">Dimensione</span>
          {WIDTH_PRESETS.map(({ value, icon, title }) => (
            <BlockHoverButton
              key={value || 'auto'}
              title={title}
              isActive={value ? attrs.width === value : !attrs.width}
              onClick={() => updateAttributes({ width: value })}
            >
              <AppIcon icon={icon} size="xs" />
            </BlockHoverButton>
          ))}
          <span className="block-hover-divider" aria-hidden="true" />
          <span className="block-hover-group-label">Immagine</span>
          <BlockHoverButton title="Modifica immagine" onClick={openEditor}>
            <AppIcon icon={Pencil} size="xs" />
          </BlockHoverButton>
          <span className="block-hover-divider" aria-hidden="true" />
          <BlockHoverButton title="Elimina immagine" onClick={() => deleteNode()}>
            <AppIcon icon={X} size="xs" />
          </BlockHoverButton>
        </div>
      </div>
    </NodeViewWrapper>
  )
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    imageBlock: {
      insertImageBlock: (attrs: Partial<ImageBlockAttrs>) => ReturnType
      updateImageBlockAt: (
        pos: number,
        attrs: Partial<ImageBlockAttrs>,
      ) => ReturnType
    }
  }

  interface Storage {
    imageBlock: ImageBlockStorage
  }
}

export const ImageBlock = Node.create({
  name: 'imageBlock',

  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,

  addStorage() {
    return {
      onEditImage: null,
    } satisfies ImageBlockStorage
  },

  addAttributes() {
    return {
      src: {
        default: DEFAULT_IMAGE_ATTRS.src,
        parseHTML: (el) => {
          if (el instanceof HTMLImageElement) {
            return el.getAttribute('src') ?? ''
          }
          return el.getAttribute('data-image-src') ?? ''
        },
        renderHTML: (attrs) => ({ 'data-image-src': attrs.src }),
      },
      alt: {
        default: DEFAULT_IMAGE_ATTRS.alt,
        parseHTML: (el) => {
          if (el instanceof HTMLImageElement) {
            return el.getAttribute('alt') ?? ''
          }
          return el.getAttribute('data-image-alt') ?? ''
        },
        renderHTML: (attrs) => ({ 'data-image-alt': attrs.alt }),
      },
      width: {
        default: DEFAULT_IMAGE_ATTRS.width,
        parseHTML: (el) => {
          if (el instanceof HTMLImageElement) {
            return readSizeFromElement(el, 'width')
          }
          return el.getAttribute('data-image-width') ?? ''
        },
        renderHTML: (attrs) =>
          attrs.width ? { 'data-image-width': attrs.width } : {},
      },
      height: {
        default: DEFAULT_IMAGE_ATTRS.height,
        parseHTML: (el) => {
          if (el instanceof HTMLImageElement) {
            return readSizeFromElement(el, 'height')
          }
          return el.getAttribute('data-image-height') ?? ''
        },
        renderHTML: (attrs) =>
          attrs.height ? { 'data-image-height': attrs.height } : {},
      },
    }
  },

  parseHTML() {
    return [
      { tag: 'div[data-image-block]' },
      {
        tag: 'img[src]',
        getAttrs: (dom) => {
          if (!(dom instanceof HTMLImageElement)) return false
          return {
            src: dom.getAttribute('src') ?? '',
            alt: dom.getAttribute('alt') ?? '',
            width: readSizeFromElement(dom, 'width'),
            height: readSizeFromElement(dom, 'height'),
          }
        },
      },
    ]
  },

  renderHTML({ node, HTMLAttributes }) {
    const attrs = node.attrs as ImageBlockAttrs
    const imgAttrs: Record<string, string> = {
      src: attrs.src,
      alt: attrs.alt || '',
    }

    const styles: string[] = []
    if (attrs.width) styles.push(`width:${normalizeCssSize(attrs.width)}`)
    if (attrs.height) styles.push(`height:${normalizeCssSize(attrs.height)}`)
    if (styles.length > 0) imgAttrs.style = styles.join(';')

    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-image-block': '',
        class: 'image-block-static',
      }),
      ['img', imgAttrs],
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeView, {
      stopEvent: ({ event }) => {
        const target = event.target as HTMLElement
        return !target.closest('[data-block-action]')
      },
    })
  },

  addCommands() {
    return {
      insertImageBlock:
        (attrs) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: normalizeImageAttrs(attrs),
          }),

      updateImageBlockAt:
        (pos, attrs) =>
        ({ tr, state, dispatch }) => {
          const node = state.doc.nodeAt(pos)
          if (!node || node.type.name !== this.name) return false

          tr.setNodeMarkup(
            pos,
            undefined,
            normalizeImageAttrs({
              ...(node.attrs as ImageBlockAttrs),
              ...attrs,
            }),
          )

          if (dispatch) dispatch(tr)
          return true
        },
    }
  },
})
