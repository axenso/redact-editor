/** Normalizza tabelle salvate (es. inserite via HTML grezzo) per wrapper e classe editor. */
export function normalizeTableHtml(html: string): string {
  const div = document.createElement('div')
  div.innerHTML = html

  div.querySelectorAll('table').forEach((table) => {
    table.classList.add('editor-table')

    const parent = table.parentElement
    if (parent?.classList.contains('tableWrapper')) return

    const wrapper = document.createElement('div')
    wrapper.className = 'tableWrapper'
    table.parentNode?.insertBefore(wrapper, table)
    wrapper.appendChild(table)
  })

  return div.innerHTML
}
