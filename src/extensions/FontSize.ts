import { Extension } from '@tiptap/core'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    fontSize: {
      setFontSize: (fontSize: string) => ReturnType
      unsetFontSize: () => ReturnType
    }
  }
}

export const EDITOR_FONT_SIZE_OPTIONS = [
  { label: 'Auto', value: '' },
  { label: '10', value: '10px' },
  { label: '11', value: '11px' },
  { label: '12', value: '12px' },
  { label: '14', value: '14px' },
  { label: '16', value: '16px' },
  { label: '18', value: '18px' },
  { label: '20', value: '20px' },
  { label: '24', value: '24px' },
  { label: '28', value: '28px' },
  { label: '32', value: '32px' },
  { label: '36', value: '36px' },
] as const

export const FontSize = Extension.create({
  name: 'fontSize',

  addOptions() {
    return {
      types: ['textStyle'],
    }
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) => {
              const value = element.style.fontSize
              return value || null
            },
            renderHTML: (attributes) => {
              if (!attributes.fontSize) return {}
              return { style: `font-size: ${attributes.fontSize}` }
            },
          },
        },
      },
    ]
  },

  addCommands() {
    return {
      setFontSize:
        (fontSize) =>
        ({ chain }) =>
          chain().setMark('textStyle', { fontSize }).run(),

      unsetFontSize:
        () =>
        ({ chain }) =>
          chain()
            .setMark('textStyle', { fontSize: null })
            .removeEmptyTextStyle()
            .run(),
    }
  },
})

export function getFontSizeLabel(value: string): string {
  if (!value) return 'Auto'
  const preset = EDITOR_FONT_SIZE_OPTIONS.find(
    (option) => option.value === normalizeFontSizeValue(value),
  )
  if (preset) return preset.label
  return value.replace(/px$/, '')
}

export function normalizeFontSizeValue(value: string): string {
  const pxMatch = value.trim().match(/^([\d.]+)px$/i)
  if (!pxMatch) return value
  const normalized = `${Math.round(Number(pxMatch[1]))}px`
  return (
    EDITOR_FONT_SIZE_OPTIONS.find((option) => option.value === normalized)
      ?.value ?? normalized
  )
}

export function getFontSizeAtCursor(editor: {
  getAttributes: (name: string) => Record<string, unknown>
}): string {
  const fontSize = editor.getAttributes('textStyle').fontSize
  if (typeof fontSize !== 'string' || !fontSize.trim()) return ''
  return normalizeFontSizeValue(fontSize)
}
