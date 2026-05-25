import { stripDiffMarksFromHtml } from './sanitizeHtml'
import {
  readChartAttrsFromElement,
  renderChartToDataUrl,
} from './renderChartExportImage'

function removeEditorChrome(root: ParentNode): void {
  root
    .querySelectorAll(
      '.block-hover-actions, .column-resize-handle',
    )
    .forEach((el) => el.remove())

  root.querySelectorAll('.table-wrapper-active').forEach((el) => {
    el.classList.remove('table-wrapper-active')
  })

  root.querySelectorAll('.selectedCell').forEach((el) => {
    el.classList.remove('selectedCell')
  })
}

async function replaceChartsWithImages(root: HTMLElement): Promise<void> {
  const chartElements = Array.from(
    root.querySelectorAll('[data-chart-block], .chart-block'),
  )

  for (const el of chartElements) {
    const attrs = readChartAttrsFromElement(el)
    const figure = document.createElement('figure')
    figure.className = 'export-chart'

    const dataUrl = await renderChartToDataUrl(attrs)
    if (dataUrl) {
      const img = document.createElement('img')
      img.src = dataUrl
      img.alt = attrs.title || 'Grafico'
      img.className = 'export-chart-image'
      figure.appendChild(img)
    } else {
      const placeholder = document.createElement('p')
      placeholder.className = 'export-chart-placeholder'
      placeholder.textContent = attrs.title
        ? `[Grafico: ${attrs.title}]`
        : '[Grafico]'
      figure.appendChild(placeholder)
    }

    if (attrs.title && dataUrl) {
      const caption = document.createElement('figcaption')
      caption.textContent = attrs.title
      figure.appendChild(caption)
    }

    el.replaceWith(figure)
  }
}

async function inlineImageSrc(img: HTMLImageElement): Promise<void> {
  const src = img.getAttribute('src')?.trim()
  if (!src || src.startsWith('data:') || src.startsWith('blob:')) {
    return
  }

  try {
    const response = await fetch(src)
    if (!response.ok) return

    const blob = await response.blob()
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(blob)
    })

    img.src = dataUrl
  } catch {
    // Mantieni l'URL originale se il fetch fallisce (CORS, rete, ecc.)
  }
}

async function waitForImages(root: HTMLElement): Promise<void> {
  const images = Array.from(root.querySelectorAll('img'))

  await Promise.all(
    images.map(async (img) => {
      await inlineImageSrc(img)

      if (img.complete && img.naturalWidth > 0) {
        return
      }

      await new Promise<void>((resolve) => {
        img.onload = () => resolve()
        img.onerror = () => resolve()
      })
    }),
  )
}

/** Prepara l'HTML dell'editor per export PDF/HTML/MD con grafici, tabelle e immagini. */
export async function prepareExportHtml(html: string): Promise<string> {
  const root = document.createElement('div')
  root.innerHTML = stripDiffMarksFromHtml(html)

  removeEditorChrome(root)
  await replaceChartsWithImages(root)
  await waitForImages(root)

  return root.innerHTML
}
