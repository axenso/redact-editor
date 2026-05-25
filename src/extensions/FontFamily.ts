import { Extension } from '@tiptap/core'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    fontFamily: {
      setFontFamily: (fontFamily: string) => ReturnType
      unsetFontFamily: () => ReturnType
    }
  }
}

export const EDITOR_FONT_OPTIONS = [
  { label: 'Predefinito', value: '' },
  { label: 'Inter', value: 'Inter, system-ui, sans-serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Times New Roman', value: '"Times New Roman", Times, serif' },
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Helvetica', value: 'Helvetica, Arial, sans-serif' },
  { label: 'Courier New', value: '"Courier New", Courier, monospace' },
] as const

export const FontFamily = Extension.create({
  name: 'fontFamily',

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
          fontFamily: {
            default: null,
            parseHTML: (element) => {
              const value = element.style.fontFamily
              return value ? value.replace(/['"]+/g, '') : null
            },
            renderHTML: (attributes) => {
              if (!attributes.fontFamily) return {}
              return { style: `font-family: ${attributes.fontFamily}` }
            },
          },
        },
      },
    ]
  },

  addCommands() {
    return {
      setFontFamily:
        (fontFamily) =>
        ({ chain }) =>
          chain().setMark('textStyle', { fontFamily }).run(),

      unsetFontFamily:
        () =>
        ({ chain }) =>
          chain()
            .setMark('textStyle', { fontFamily: null })
            .removeEmptyTextStyle()
            .run(),
    }
  },
})

export function getFontFamilyLabel(value: string): string {
  if (!value) return 'Predefinito'
  return (
    EDITOR_FONT_OPTIONS.find((option) => option.value === value)?.label ?? value
  )
}
