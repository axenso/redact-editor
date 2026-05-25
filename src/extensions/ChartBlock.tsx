import { Node, mergeAttributes } from '@tiptap/core'
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from '@tiptap/react'
import { Chart as ChartJS } from 'chart.js/auto'
import {
  BarChart3,
  LineChart,
  PieChart,
  Pencil,
  Sparkles,
  X,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useRef } from 'react'
import { AppIcon } from '../components/LucideIcon'
import { BlockHoverButton } from '../components/BlockHoverButton'

export type ChartType = 'bar' | 'line' | 'pie'

export interface ChartBlockAttrs {
  chartType: ChartType
  title: string
  labels: string
  data: string
}

export interface ChartBlockStorage {
  onEditChart: ((pos: number, attrs: ChartBlockAttrs) => void) | null
  onAiGenerateChart:
    | ((pos: number, attrs: ChartBlockAttrs) => void)
    | null
}

export const DEFAULT_CHART_ATTRS: ChartBlockAttrs = {
  chartType: 'bar',
  title: 'Andamento vendite',
  labels: JSON.stringify(['Gen', 'Feb', 'Mar', 'Apr', 'Mag']),
  data: JSON.stringify([12, 19, 8, 15, 22]),
}

const CHART_COLORS = [
  'rgba(170, 59, 255, 0.75)',
  'rgba(99, 102, 241, 0.75)',
  'rgba(34, 197, 94, 0.75)',
  'rgba(251, 146, 60, 0.75)',
  'rgba(236, 72, 153, 0.75)',
  'rgba(14, 165, 233, 0.75)',
]

export function parseStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(String)
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) return parsed.map(String)
    } catch {
      return value
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    }
  }
  return []
}

export function parseNumberArray(value: unknown): number[] {
  if (Array.isArray(value)) {
    return value.map(Number).filter((n) => !Number.isNaN(n))
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) {
        return parsed.map(Number).filter((n) => !Number.isNaN(n))
      }
    } catch {
      return value
        .split(',')
        .map((s) => Number(s.trim()))
        .filter((n) => !Number.isNaN(n))
    }
  }
  return []
}

export function chartAttrsToForm(attrs: ChartBlockAttrs) {
  return {
    chartType: (attrs.chartType ?? 'bar') as ChartType,
    title: attrs.title ?? '',
    labelsText: parseStringArray(attrs.labels).join(', '),
    dataText: parseNumberArray(attrs.data).join(', '),
  }
}

function normalizeChartAttrs(
  attrs?: Partial<ChartBlockAttrs>,
): ChartBlockAttrs {
  return {
    ...DEFAULT_CHART_ATTRS,
    ...attrs,
    labels:
      typeof attrs?.labels === 'string'
        ? attrs.labels
        : JSON.stringify(attrs?.labels ?? []),
    data:
      typeof attrs?.data === 'string'
        ? attrs.data
        : JSON.stringify(attrs?.data ?? []),
  }
}

const CHART_TYPE_OPTIONS: {
  type: ChartType
  icon: LucideIcon
  title: string
}[] = [
  { type: 'bar', icon: BarChart3, title: 'Grafico a barre' },
  { type: 'line', icon: LineChart, title: 'Grafico a linee' },
  { type: 'pie', icon: PieChart, title: 'Grafico a torta' },
]

function ChartNodeView({
  node,
  selected,
  editor,
  getPos,
  updateAttributes,
  deleteNode,
}: NodeViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<ChartJS | null>(null)
  const attrs = node.attrs as ChartBlockAttrs

  const openEditor = () => {
    const pos = getPos()
    if (typeof pos !== 'number') return
    const storage = editor.storage.chartBlock as ChartBlockStorage
    storage.onEditChart?.(pos, attrs)
  }

  const openAiGenerate = () => {
    const pos = getPos()
    if (typeof pos !== 'number') return
    const storage = editor.storage.chartBlock as ChartBlockStorage
    storage.onAiGenerateChart?.(pos, attrs)
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const labels = parseStringArray(attrs.labels)
    const values = parseNumberArray(attrs.data)
    const chartType = (attrs.chartType ?? 'bar') as ChartType

    if (labels.length === 0 || values.length === 0) {
      return
    }

    let frameId = 0

    const renderChart = () => {
      chartRef.current?.destroy()

      chartRef.current = new ChartJS(canvas, {
        type: chartType,
        data: {
          labels,
          datasets: [
            {
              label: attrs.title || 'Dati',
              data: values,
              backgroundColor:
                chartType === 'pie'
                  ? CHART_COLORS.slice(0, labels.length)
                  : 'rgba(170, 59, 255, 0.65)',
              borderColor: '#aa3bff',
              borderWidth: chartType === 'line' ? 2 : 1,
              tension: 0.3,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: chartType === 'pie' },
            title: {
              display: Boolean(attrs.title),
              text: attrs.title,
            },
          },
        },
      })
    }

    frameId = requestAnimationFrame(renderChart)

    return () => {
      cancelAnimationFrame(frameId)
      chartRef.current?.destroy()
      chartRef.current = null
    }
  }, [attrs.chartType, attrs.title, attrs.labels, attrs.data])

  const labels = parseStringArray(attrs.labels)
  const values = parseNumberArray(attrs.data)
  const hasData = labels.length > 0 && values.length > 0

  return (
    <NodeViewWrapper
      as="div"
      className={selected ? 'chart-block chart-block-selected' : 'chart-block'}
      data-drag-handle
    >
      <div
        className="chart-block-inner"
        onDoubleClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          openEditor()
        }}
      >
        {hasData ? (
          <canvas ref={canvasRef} role="img" aria-label={attrs.title || 'Grafico'} />
        ) : (
          <p className="chart-block-empty">Dati grafico non disponibili</p>
        )}
        <div
          className="block-hover-actions block-hover-actions-chart"
          role="toolbar"
          aria-label="Modifica grafico"
        >
          <span className="block-hover-group-label">Forma</span>
          {CHART_TYPE_OPTIONS.map(({ type, icon, title }) => (
            <BlockHoverButton
              key={type}
              title={title}
              isActive={attrs.chartType === type}
              onClick={() => updateAttributes({ chartType: type })}
            >
              <AppIcon icon={icon} size="xs" />
            </BlockHoverButton>
          ))}
          <span className="block-hover-divider" aria-hidden="true" />
          <span className="block-hover-group-label">Dati</span>
          <BlockHoverButton title="Modifica dati" onClick={openEditor}>
            <AppIcon icon={Pencil} size="xs" />
          </BlockHoverButton>
          <span className="block-hover-divider" aria-hidden="true" />
          <span className="block-hover-group-label">AI</span>
          <BlockHoverButton title="Rigenera grafico con AI" onClick={openAiGenerate}>
            <AppIcon icon={Sparkles} size="xs" />
          </BlockHoverButton>
          <span className="block-hover-divider" aria-hidden="true" />
          <BlockHoverButton title="Elimina grafico" onClick={() => deleteNode()}>
            <AppIcon icon={X} size="xs" />
          </BlockHoverButton>
        </div>
      </div>
    </NodeViewWrapper>
  )
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    chartBlock: {
      insertChart: (attrs?: Partial<ChartBlockAttrs>) => ReturnType
      updateChartAt: (pos: number, attrs: Partial<ChartBlockAttrs>) => ReturnType
    }
  }

  interface Storage {
    chartBlock: ChartBlockStorage
  }
}

export const ChartBlock = Node.create({
  name: 'chartBlock',

  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,

  addStorage() {
    return {
      onEditChart: null,
      onAiGenerateChart: null,
    } satisfies ChartBlockStorage
  },

  addAttributes() {
    return {
      chartType: {
        default: DEFAULT_CHART_ATTRS.chartType,
        parseHTML: (el) => el.getAttribute('data-chart-type') ?? 'bar',
        renderHTML: (attrs) => ({ 'data-chart-type': attrs.chartType }),
      },
      title: {
        default: DEFAULT_CHART_ATTRS.title,
        parseHTML: (el) => el.getAttribute('data-chart-title') ?? '',
        renderHTML: (attrs) => ({ 'data-chart-title': attrs.title }),
      },
      labels: {
        default: DEFAULT_CHART_ATTRS.labels,
        parseHTML: (el) =>
          el.getAttribute('data-chart-labels') ?? DEFAULT_CHART_ATTRS.labels,
        renderHTML: (attrs) => ({ 'data-chart-labels': attrs.labels }),
      },
      data: {
        default: DEFAULT_CHART_ATTRS.data,
        parseHTML: (el) =>
          el.getAttribute('data-chart-data') ?? DEFAULT_CHART_ATTRS.data,
        renderHTML: (attrs) => ({ 'data-chart-data': attrs.data }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-chart-block]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-chart-block': '',
        class: 'chart-block-static',
      }),
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(ChartNodeView, {
      stopEvent: ({ event }) => {
        const target = event.target as HTMLElement
        return !target.closest('[data-block-action]')
      },
    })
  },

  addCommands() {
    return {
      insertChart:
        (attrs) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: normalizeChartAttrs(attrs),
          }),

      updateChartAt:
        (pos, attrs) =>
        ({ tr, state, dispatch }) => {
          const node = state.doc.nodeAt(pos)
          if (!node || node.type.name !== this.name) return false

          tr.setNodeMarkup(pos, undefined, normalizeChartAttrs({
            ...(node.attrs as ChartBlockAttrs),
            ...attrs,
          }))

          if (dispatch) dispatch(tr)
          return true
        },
    }
  },
})
