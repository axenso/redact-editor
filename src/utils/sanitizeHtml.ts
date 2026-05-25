/** Rimuove i mark del diff inline salvati per errore nel contenuto. */
export function stripDiffMarksFromHtml(html: string): string {
  const div = document.createElement('div')
  div.innerHTML = html

  div.querySelectorAll('.diff-removed').forEach((el) => el.remove())

  div.querySelectorAll('.diff-added').forEach((el) => {
    const parent = el.parentNode
    if (!parent) return
    while (el.firstChild) {
      parent.insertBefore(el.firstChild, el)
    }
    el.remove()
  })

  return div.innerHTML
}
