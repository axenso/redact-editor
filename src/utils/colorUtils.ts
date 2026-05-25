export function normalizeColor(color: string): string {
  const trimmed = color.trim().toLowerCase()

  if (trimmed.startsWith('#')) {
    if (trimmed.length === 4) {
      return `#${trimmed[1]}${trimmed[1]}${trimmed[2]}${trimmed[2]}${trimmed[3]}${trimmed[3]}`
    }
    return trimmed
  }

  const rgbMatch = trimmed.match(
    /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/,
  )
  if (rgbMatch) {
    const r = Number.parseInt(rgbMatch[1], 10)
    const g = Number.parseInt(rgbMatch[2], 10)
    const b = Number.parseInt(rgbMatch[3], 10)
    return `#${[r, g, b]
      .map((channel) => channel.toString(16).padStart(2, '0'))
      .join('')}`
  }

  return trimmed
}

export function colorsEqual(a: string, b: string): boolean {
  return normalizeColor(a) === normalizeColor(b)
}

export function toDisplayColor(color: string): string {
  const normalized = normalizeColor(color)
  return normalized.startsWith('#') ? normalized : color
}

export function toColorInputValue(color: string): string {
  const normalized = normalizeColor(color)
  return normalized.startsWith('#') ? normalized : '#1a1a1a'
}
