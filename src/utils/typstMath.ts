import { buildMathHtml } from './latexMath'

export function mathHtmlToTypst(node: HTMLElement): string {
  const latex = node.getAttribute('data-latex')?.trim()
  if (!latex) return node.textContent ?? ''

  const display = node.getAttribute('data-math-display') === 'block'
  return display ? `$ ${latex} $` : `$${latex}$`
}

export function replaceTypstMathDelimiters(text: string): string {
  let result = text.replace(/\$\s([\s\S]+?)\s\$/g, (_match, body) =>
    buildMathHtml(String(body).trim(), true),
  )

  result = result.replace(/\$([^\s$][^$\n]*?)\$/g, (_match, body) =>
    buildMathHtml(String(body).trim(), false),
  )

  return result
}
