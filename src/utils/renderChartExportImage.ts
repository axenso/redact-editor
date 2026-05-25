import { Chart as ChartJS } from 'chart.js/auto'
import type { ChartBlockAttrs, ChartType } from '../extensions/ChartBlock'
import {
  parseNumberArray,
  parseStringArray,
} from '../extensions/ChartBlock'

const CHART_COLORS = [
  'rgba(170, 59, 255, 0.75)',
  'rgba(99, 102, 241, 0.75)',
  'rgba(34, 197, 94, 0.75)',
  'rgba(251, 146, 60, 0.75)',
  'rgba(236, 72, 153, 0.75)',
  'rgba(14, 165, 233, 0.75)',
]

export function readChartAttrsFromElement(el: Element): ChartBlockAttrs {
  return {
    chartType: (el.getAttribute('data-chart-type') ?? 'bar') as ChartType,
    title: el.getAttribute('data-chart-title') ?? '',
    labels: el.getAttribute('data-chart-labels') ?? '[]',
    data: el.getAttribute('data-chart-data') ?? '[]',
  }
}

export async function renderChartToDataUrl(
  attrs: Partial<ChartBlockAttrs>,
  width = 640,
  height = 360,
): Promise<string | null> {
  const labels = parseStringArray(attrs.labels)
  const values = parseNumberArray(attrs.data)
  const chartType = (attrs.chartType ?? 'bar') as ChartType

  if (labels.length === 0 || values.length === 0) {
    return null
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const chart = new ChartJS(canvas, {
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
      responsive: false,
      animation: false,
      plugins: {
        legend: { display: chartType === 'pie' },
        title: {
          display: Boolean(attrs.title),
          text: attrs.title || '',
        },
      },
    },
  })

  chart.update('none')

  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve())
  })

  try {
    return canvas.toDataURL('image/png')
  } finally {
    chart.destroy()
  }
}
