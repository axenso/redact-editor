import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return

          if (
            id.includes('@tiptap') ||
            id.includes('prosemirror') ||
            id.includes('prosemirror-')
          ) {
            return 'tiptap'
          }
          if (id.includes('chart.js')) {
            return 'chart'
          }
          if (id.includes('katex')) {
            return 'katex'
          }
          if (id.includes('jspdf')) {
            return 'jspdf'
          }
          if (id.includes('html2canvas')) {
            return 'html2canvas'
          }
          if (id.includes('marked') || id.includes('turndown')) {
            return 'markdown'
          }
          if (id.includes('lucide-react')) {
            return 'icons'
          }
        },
      },
    },
  },
})
