import katex from 'katex'

export function renderLatexMarkup(
  latex: string,
  displayMode: boolean,
): string {
  const trimmed = latex.trim()
  if (!trimmed) return ''

  try {
    return katex.renderToString(trimmed, {
      displayMode,
      throwOnError: false,
    })
  } catch {
    return trimmed
  }
}

export function buildMathHtml(latex: string, displayMode: boolean): string {
  const trimmed = latex.trim()
  if (!trimmed) return ''

  const rendered = renderLatexMarkup(trimmed, displayMode)
  const tag = displayMode ? 'div' : 'span'
  const className = displayMode
    ? 'math-formula math-formula-block'
    : 'math-formula math-formula-inline'

  return `<${tag} class="${className}" data-latex="${escapeHtmlAttr(trimmed)}" data-math-display="${displayMode ? 'block' : 'inline'}"><span class="math-formula-render">${rendered}</span></${tag}>`
}

function escapeHtmlAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
}

export function replaceMarkdownMathDelimiters(markdown: string): string {
  let result = markdown.replace(/\$\$([\s\S]+?)\$\$/g, (_match, latex) =>
    buildMathHtml(String(latex), true),
  )

  result = result.replace(/(?<!\$)\$(?!\$)([^\n$]+?)\$(?!\$)/g, (_match, latex) =>
    buildMathHtml(String(latex), false),
  )

  return result
}

export function replaceLatexMathDelimiters(latex: string): string {
  let result = latex.replace(/\\\[([\s\S]+?)\\\]/g, (_match, body) =>
    buildMathHtml(String(body), true),
  )

  result = result.replace(/\\\(([\s\S]+?)\\\)/g, (_match, body) =>
    buildMathHtml(String(body), false),
  )

  result = result.replace(/\$\$([\s\S]+?)\$\$/g, (_match, body) =>
    buildMathHtml(String(body), true),
  )

  result = result.replace(/(?<!\$)\$(?!\$)([^\n$]+?)\$(?!\$)/g, (_match, body) =>
    buildMathHtml(String(body), false),
  )

  return result
}

export function mathHtmlToLatex(node: HTMLElement): string {
  const latex = node.getAttribute('data-latex')?.trim()
  if (!latex) return node.textContent ?? ''

  const display = node.getAttribute('data-math-display') === 'block'
  return display ? `\\[${latex}\\]` : `$${latex}$`
}
