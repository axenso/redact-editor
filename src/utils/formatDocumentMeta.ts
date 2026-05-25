export function formatRelativeSavedTime(date: Date): string {
  const diffMs = Date.now() - date.getTime()
  if (diffMs < 0) return 'proprio ora'

  const diffSec = Math.floor(diffMs / 1000)
  if (diffSec < 60) return 'meno di un minuto fa'

  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) {
    return diffMin === 1 ? '1 minuto fa' : `${diffMin} minuti fa`
  }

  const diffHours = Math.floor(diffMin / 60)
  if (diffHours < 24) {
    return diffHours === 1 ? '1 ora fa' : `${diffHours} ore fa`
  }

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) {
    return diffDays === 1 ? '1 giorno fa' : `${diffDays} giorni fa`
  }

  return formatDocumentTimestamp(date)
}

export function formatDocumentTimestamp(date: Date): string {
  const formatted = new Intl.DateTimeFormat('it-IT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)

  return formatted.replace(',', ' alle')
}
