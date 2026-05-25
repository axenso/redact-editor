import type { PageLayout } from '../constants/pageFormat'
import { mmToPx, pageSizeAtRule } from '../constants/pageFormat'
import {
  buildMarkdownDocument,
  buildPlainTextDocument,
} from './formatExportText'
import { prepareExportHtml } from './prepareExportHtml'
import { stripDiffMarksFromHtml } from './sanitizeHtml'

export type ExportFormat = 'html' | 'txt' | 'md' | 'pdf'

/** Margini pagina PDF/HTML export (mm). */
export const PDF_MARGIN_MM = 20

/** Bilanciamento qualità/dimensione file (1 = 96dpi, 2 = doppia risoluzione). */
const PDF_RENDER_SCALE = 1.5

const PDF_JPEG_QUALITY = 0.82

export interface ExportOptions {
  documentTitle: string
  pageLayout: PageLayout
}

function slugify(title: string): string {
  const slug = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return slug || 'documento'
}

function timestampForFilename(): string {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function buildHtmlDocument(bodyHtml: string, options: ExportOptions): string {
  const { documentTitle, pageLayout } = options
  const pageSize = pageSizeAtRule(pageLayout)

  return `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(documentTitle)}</title>
  <style>
    @page {
      size: ${pageSize};
      margin: ${PDF_MARGIN_MM}mm;
    }
    body {
      font-family: Inter, system-ui, sans-serif;
      max-width: ${pageLayout.widthMm - PDF_MARGIN_MM * 2}mm;
      margin: 0 auto;
      padding: 0 0 3rem;
      line-height: 1.6;
      color: #08060d;
    }
    h1 { font-size: 2rem; margin: 0 0 1rem; }
    h2 { font-size: 1.5rem; margin: 1.5rem 0 0.75rem; }
    h3 { font-size: 1.2rem; margin: 1.25rem 0 0.5rem; }
    p { margin: 0 0 0.85rem; }
    ul, ol { margin: 0 0 0.85rem; padding-left: 1.5rem; }
    blockquote {
      border-left: 3px solid #aa3bff;
      margin: 0 0 0.85rem;
      padding-left: 1rem;
      color: #6e6e7a;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1rem 0;
    }
    th, td {
      border: 1px solid #d8d8e0;
      padding: 0.5rem 0.65rem;
      vertical-align: top;
      text-align: left;
    }
    th {
      background: #f7f7f9;
      font-weight: 600;
    }
    .tableWrapper {
      margin: 1rem 0;
      overflow-x: auto;
    }
    img {
      display: block;
      max-width: 100%;
      height: auto;
      margin: 1rem auto;
    }
    .export-chart {
      margin: 1.25rem 0;
      text-align: center;
    }
    .export-chart-image {
      display: block;
      width: 100%;
      max-width: 100%;
      height: auto;
      margin: 0 auto;
      border: 1px solid #e6e6ec;
      border-radius: 4px;
    }
    .export-chart figcaption {
      margin-top: 0.5rem;
      font-size: 0.85rem;
      color: #6e6e7a;
    }
  </style>
</head>
<body>
${bodyHtml}
</body>
</html>`
}

const PDF_CONTENT_STYLES = `
  font-family: Inter, system-ui, sans-serif;
  font-size: 14px;
  line-height: 1.6;
  color: #08060d;
  background: #ffffff;
`

const PDF_ELEMENT_STYLES = `
  h1 { font-size: 24px; margin: 0 0 12px; }
  h2 { font-size: 20px; margin: 20px 0 10px; }
  h3 { font-size: 16px; margin: 16px 0 8px; }
  p { margin: 0 0 10px; }
  ul, ol { margin: 0 0 10px; padding-left: 24px; }
  blockquote {
    border-left: 3px solid #aa3bff;
    margin: 0 0 10px;
    padding-left: 12px;
    color: #6e6e7a;
  }
  .tableWrapper {
    margin: 12px 0;
    overflow: visible;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 0;
    table-layout: fixed;
  }
  th, td {
    border: 1px solid #d8d8e0;
    padding: 8px;
    vertical-align: top;
    word-wrap: break-word;
  }
  th {
    background: #f7f7f9;
    font-weight: 600;
    text-align: left;
  }
  img {
    max-width: 100%;
    height: auto;
    display: block;
    margin: 12px auto;
  }
  .export-chart {
    margin: 16px 0;
    page-break-inside: avoid;
  }
  .export-chart-image {
    display: block;
    width: 100%;
    max-width: 100%;
    height: auto;
    margin: 0 auto;
    border: 1px solid #e6e6ec;
  }
  .export-chart figcaption {
    margin-top: 6px;
    font-size: 12px;
    color: #6e6e7a;
    text-align: center;
  }
  .export-chart-placeholder {
    margin: 0;
    padding: 24px 12px;
    text-align: center;
    color: #6e6e7a;
    border: 1px dashed #d8d8e0;
  }
`

/** Spazio extra sotto al contenuto export per evitare tagli sull'ultima riga. */
const PDF_CONTENT_BOTTOM_PADDING_PX = 32

const PDF_BLOCK_SELECTORS =
  'p, h1, h2, h3, h4, h5, h6, li, blockquote, figcaption, tr, .export-chart, .tableWrapper'

interface ContentBlockRect {
  top: number
  bottom: number
}

interface PdfSliceRange {
  start: number
  end: number
}

function getElementCaptureHeight(element: HTMLElement): number {
  return Math.ceil(
    Math.max(
      element.scrollHeight,
      element.offsetHeight,
      element.getBoundingClientRect().height,
    ),
  )
}

function printablePageHeightCss(pageLayout: PageLayout): number {
  return mmToPx(pageLayout.heightMm - PDF_MARGIN_MM * 2)
}

function collectContentBlocks(root: HTMLElement): ContentBlockRect[] {
  const rootRect = root.getBoundingClientRect()

  return Array.from(root.querySelectorAll(PDF_BLOCK_SELECTORS))
    .map((node) => {
      const rect = (node as HTMLElement).getBoundingClientRect()
      const top = rect.top - rootRect.top
      const bottom = rect.bottom - rootRect.top

      if (bottom <= top + 1) return null

      return { top, bottom }
    })
    .filter((block): block is ContentBlockRect => block !== null)
    .sort((a, b) => a.top - b.top)
}

function adjustSliceEndToBlockBoundary(
  start: number,
  idealEnd: number,
  pageHeight: number,
  blocks: ContentBlockRect[],
): number {
  const splittableBlock = blocks.find(
    (block) =>
      block.top < idealEnd - 1 &&
      block.bottom > idealEnd + 1 &&
      block.bottom - block.top <= pageHeight * 0.98,
  )

  if (splittableBlock && splittableBlock.top > start + 1) {
    return splittableBlock.top
  }

  const breakBeforeIdealEnd = blocks
    .map((block) => block.bottom + 2)
    .filter((y) => y > start + 1 && y <= idealEnd + 1)

  if (breakBeforeIdealEnd.length > 0) {
    return Math.max(...breakBeforeIdealEnd)
  }

  const nextBoundary = blocks
    .map((block) => block.bottom + 2)
    .filter((y) => y > idealEnd && y - start <= pageHeight * 1.08)
    .sort((a, b) => a - b)[0]

  return nextBoundary ?? idealEnd
}

function computePdfSliceRanges(
  totalHeight: number,
  pageHeight: number,
  blocks: ContentBlockRect[],
): PdfSliceRange[] {
  const ranges: PdfSliceRange[] = []
  let start = 0

  while (start < totalHeight - 0.5) {
    if (start + pageHeight >= totalHeight - 0.5) {
      ranges.push({ start, end: totalHeight })
      break
    }

    let end = adjustSliceEndToBlockBoundary(
      start,
      start + pageHeight,
      pageHeight,
      blocks,
    )

    if (end <= start + 1) {
      end = Math.min(start + pageHeight, totalHeight)
    }

    ranges.push({ start, end })
    start = end
  }

  return ranges
}

function cssSliceRangesToCanvas(
  ranges: PdfSliceRange[],
  captureHeight: number,
  canvasHeight: number,
): PdfSliceRange[] {
  const scale = canvasHeight / captureHeight
  const canvasRanges = ranges.map(({ start, end }) => ({
    start: Math.round(start * scale),
    end: Math.round(end * scale),
  }))

  for (let index = 1; index < canvasRanges.length; index += 1) {
    canvasRanges[index].start = canvasRanges[index - 1].end
  }

  if (canvasRanges.length > 0) {
    canvasRanges[canvasRanges.length - 1].end = canvasHeight
  }

  return canvasRanges
}

function appendPdfPagesFromCanvas(
  pdf: import('jspdf').jsPDF,
  canvas: HTMLCanvasElement,
  pageLayout: PageLayout,
  sliceRanges: PdfSliceRange[],
): void {
  const pageWidthMm = pdf.internal.pageSize.getWidth()
  const pageHeightMm = pdf.internal.pageSize.getHeight()
  const printableWidthMm = pageWidthMm - PDF_MARGIN_MM * 2
  const printableHeightMm = pageHeightMm - PDF_MARGIN_MM * 2
  const pxPerMm = canvas.width / printableWidthMm

  sliceRanges.forEach((range, pageIndex) => {
    const slicePx = range.end - range.start
    if (slicePx <= 0) return

    if (pageIndex > 0) {
      pdf.addPage(
        pageLayout.jsPdfFormat,
        pageLayout.orientation === 'landscape' ? 'l' : 'p',
      )
    }

    const imgData = sliceCanvasToJpeg(
      canvas,
      range.start,
      slicePx,
      PDF_JPEG_QUALITY,
    )
    const sliceHeightMm = slicePx / pxPerMm

    pdf.addImage(
      imgData,
      'JPEG',
      PDF_MARGIN_MM,
      PDF_MARGIN_MM,
      printableWidthMm,
      Math.min(sliceHeightMm, printableHeightMm),
      undefined,
      'FAST',
    )
  })
}

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function sliceCanvasToJpeg(
  source: HTMLCanvasElement,
  sourceY: number,
  sliceHeightPx: number,
  quality: number,
): string {
  const sliceCanvas = document.createElement('canvas')
  sliceCanvas.width = source.width
  sliceCanvas.height = sliceHeightPx

  const ctx = sliceCanvas.getContext('2d')
  if (!ctx) {
    throw new Error('Impossibile preparare il PDF.')
  }

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height)
  ctx.drawImage(
    source,
    0,
    sourceY,
    source.width,
    sliceHeightPx,
    0,
    0,
    source.width,
    sliceHeightPx,
  )

  return sliceCanvas.toDataURL('image/jpeg', quality)
}

const PDF_EXPORT_ROOT = 'pdf-export-root'

function scopeCssRules(rootId: string, css: string): string {
  return css.replace(/([^{}]+)\{/g, (match, selectors: string) => {
    const trimmed = selectors.trim()
    if (!trimmed) return match

    const scoped = trimmed
      .split(',')
      .map((selector) => `#${rootId} ${selector.trim()}`)
      .join(', ')

    return `${scoped} {`
  })
}

function buildPdfExportStyles(contentWidthPx: number): string {
  return `
#${PDF_EXPORT_ROOT} {
  ${PDF_CONTENT_STYLES}
  width: ${contentWidthPx}px;
  box-sizing: border-box;
  padding-bottom: ${PDF_CONTENT_BOTTOM_PADDING_PX}px;
}
${scopeCssRules(PDF_EXPORT_ROOT, PDF_ELEMENT_STYLES)}
`
}

async function exportAsPdf(
  html: string,
  filename: string,
  pageLayout: PageLayout,
): Promise<void> {
  const [{ jsPDF }, { default: html2canvas }] = await Promise.all([
    import('jspdf'),
    import('html2canvas'),
  ])

  const contentWidthMm = pageLayout.widthMm - PDF_MARGIN_MM * 2
  const contentWidthPx = mmToPx(contentWidthMm)

  const styleEl = document.createElement('style')
  styleEl.setAttribute('data-pdf-export', 'true')
  styleEl.textContent = buildPdfExportStyles(contentWidthPx)

  const content = document.createElement('div')
  content.id = PDF_EXPORT_ROOT
  content.innerHTML = html
  content.style.cssText = `
    position: fixed;
    left: -20000px;
    top: 0;
    width: ${contentWidthPx}px;
    pointer-events: none;
    background: #ffffff;
  `

  document.head.appendChild(styleEl)
  document.body.appendChild(content)

  try {
    await waitForImages(content)

    if (document.fonts?.ready) {
      await document.fonts.ready
    }

    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    })

    const captureHeight = getElementCaptureHeight(content)
    const pageHeightCss = printablePageHeightCss(pageLayout)
    const contentBlocks = collectContentBlocks(content)
    const sliceRangesCss = computePdfSliceRanges(
      captureHeight,
      pageHeightCss,
      contentBlocks,
    )

    const canvas = await html2canvas(content, {
      scale: PDF_RENDER_SCALE,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: contentWidthPx,
      height: captureHeight,
      windowWidth: contentWidthPx,
      windowHeight: captureHeight,
      scrollX: 0,
      scrollY: 0,
    })

    if (canvas.width === 0 || canvas.height === 0) {
      throw new Error(
        'Impossibile generare il PDF: contenuto non renderizzabile.',
      )
    }

    const pdf = new jsPDF({
      orientation: pageLayout.orientation === 'landscape' ? 'l' : 'p',
      unit: 'mm',
      format: pageLayout.jsPdfFormat,
    })

    const sliceRangesCanvas = cssSliceRangesToCanvas(
      sliceRangesCss,
      captureHeight,
      canvas.height,
    )

    appendPdfPagesFromCanvas(pdf, canvas, pageLayout, sliceRangesCanvas)

    pdf.save(filename)
  } finally {
    content.remove()
    styleEl.remove()
  }
}

async function waitForImages(root: HTMLElement): Promise<void> {
  const images = Array.from(root.querySelectorAll('img'))

  await Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete && img.naturalWidth > 0) {
            resolve()
            return
          }

          img.onload = () => resolve()
          img.onerror = () => resolve()
        }),
    ),
  )
}

export async function exportEditorContent(
  html: string,
  format: ExportFormat,
  options: ExportOptions,
): Promise<void> {
  const cleanHtml = stripDiffMarksFromHtml(html)
  const exportHtml = await prepareExportHtml(cleanHtml)
  const slug = slugify(options.documentTitle)
  const stamp = timestampForFilename()

  switch (format) {
    case 'html':
      downloadFile(
        buildHtmlDocument(exportHtml, options),
        `${slug}-${stamp}.html`,
        'text/html;charset=utf-8',
      )
      return

    case 'txt':
      downloadFile(
        buildPlainTextDocument(exportHtml, {
          documentTitle: options.documentTitle,
        }),
        `${slug}-${stamp}.txt`,
        'text/plain;charset=utf-8',
      )
      return

    case 'md':
      downloadFile(
        buildMarkdownDocument(exportHtml, {
          documentTitle: options.documentTitle,
        }),
        `${slug}-${stamp}.md`,
        'text/markdown;charset=utf-8',
      )
      return

    case 'pdf':
      await exportAsPdf(exportHtml, `${slug}-${stamp}.pdf`, options.pageLayout)
      return
  }
}
