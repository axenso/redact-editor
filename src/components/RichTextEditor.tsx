import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getPageFormatLabel, getPageLayout } from '../constants/pageFormat'
import type { PageFormatId, PageOrientation } from '../constants/pageFormat'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TextAlign from '@tiptap/extension-text-align'
import { Color } from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import Underline from '@tiptap/extension-underline'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import { DiffAdded, DiffRemoved } from '../extensions/DiffMarks'
import { FontFamily } from '../extensions/FontFamily'
import { FontSize } from '../extensions/FontSize'
import { LineHeight } from '../extensions/LineHeight'
import {
  ChartBlock,
  type ChartBlockAttrs,
  type ChartBlockStorage,
} from '../extensions/ChartBlock'
import {
  ImageBlock,
  type ImageBlockAttrs,
  type ImageBlockStorage,
} from '../extensions/ImageBlock'
import { AppShell } from './AppShell'
import { Toolbar } from './Toolbar'
import { AiMenuModeToggle } from './AiMenuModeToggle'
import { EditorBlockGutter } from './EditorBlockGutter'
import { MarkdownEditorPane } from './MarkdownEditorPane'
import { LatexEditorPane } from './LatexEditorPane'
import { TypstEditorPane } from './TypstEditorPane'
import { WritingModeSelect } from './WritingModeSelect'
import { MathFormulaModal } from './MathFormulaModal'
import { AiPromptModal } from './AiPromptModal'
import { EditorInsertContextMenu } from './EditorInsertContextMenu'
import { EditorMetaFooter } from './EditorMetaFooter'
import { HistoryRestoreActions } from './HistoryRestoreActions'
import { HistorySidebar } from './HistorySidebar'
import { ExportMenu } from './ExportMenu'
import { PageFormatSelect } from './PageFormatSelect'
import { ImageEditorModal } from './ImageEditorModal'
import { ChartEditorModal } from './ChartEditorModal'
import {
  convertTextToTableWithAI,
  generateTableWithAI,
  generateChartWithAI,
  modifyTextWithAI,
} from '../services/aiService'
import {
  applyTableDataAtSelection,
  insertAiTable,
  updateAiTableAt,
} from '../utils/insertAiTable'
import {
  isUsableTableData,
  parseLineListAsTable,
  parseStructuredTableText,
  sanitizeTableData,
  tableDataToPlainText,
  wantsTableOutput,
} from '../utils/parseMarkdownTable'
import { getSelectedTextFromRange } from '../utils/selectionText'
import {
  convertHtmlToWritingModeSource,
  resolveWritingModeHtml,
  type WritingMode,
} from '../utils/writingMode'
import { MathBlock, MathInline } from '../extensions/MathFormula'
import { TableHoverControls } from './TableHoverControls'
import { AiGenerateModal } from './AiGenerateModal'
import type { AiGenerateKind } from './AiGenerateForm'
import { TableInsertModal } from './TableInsertModal'
import type { InsertModalTab } from './ModalInsertTabs'
import { useAutosave } from '../hooks/useAutosave'
import { useEditHistory } from '../hooks/useEditHistory'
import { docHasDiffMarks, useInlineDiff } from '../hooks/useInlineDiff'
import { restoreEditorContent } from '../utils/restoreEditorContent'
import { scrollEditorToHistoryChange } from '../utils/historyScrollTarget'
import {
  canRestoreFirstVersion,
  canRestoreLatestVersion,
  getFirstVersionContent,
  getLatestVersionEntry,
} from '../utils/getRestorableEntry'
import { stripDiffMarksFromHtml } from '../utils/sanitizeHtml'
import { normalizeTableHtml } from '../utils/normalizeTableHtml'
import type { EditHistoryEntry } from '../types/editHistory'
import {
  DEFAULT_CONTENT,
  loadAiMenuMode,
  loadContent,
  loadWritingMode,
  loadPageFormat,
  loadPageOrientation,
  saveAiMenuMode,
  saveWritingMode,
  savePageFormat,
  savePageOrientation,
  type AiMenuMode,
} from '../hooks/useLocalStorage'

interface SelectionRange {
  from: number
  to: number
}

const initialEditorHtml = normalizeTableHtml(loadContent() ?? DEFAULT_CONTENT)

export function RichTextEditor() {
  const [aiModalOpen, setAiModalOpen] = useState(false)
  const [selectedText, setSelectedText] = useState('')
  const [selectionRange, setSelectionRange] = useState<SelectionRange | null>(
    null,
  )
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [aiMenuMode, setAiMenuMode] = useState<AiMenuMode>(loadAiMenuMode)
  const [writingMode, setWritingMode] = useState<WritingMode>(loadWritingMode)
  const [markdownSource, setMarkdownSource] = useState('')
  const [latexSource, setLatexSource] = useState('')
  const [typstSource, setTypstSource] = useState('')
  const [writingModeError, setWritingModeError] = useState<string | null>(null)
  const [mathModalOpen, setMathModalOpen] = useState(false)
  const [mathModalDisplayMode, setMathModalDisplayMode] = useState(false)
  const [pageFormatId, setPageFormatId] = useState<PageFormatId>(loadPageFormat)
  const [pageOrientation, setPageOrientation] =
    useState<PageOrientation>(loadPageOrientation)
  const [hasTextSelection, setHasTextSelection] = useState(false)
  const [isInTable, setIsInTable] = useState(false)
  const [correctionsEntryId, setCorrectionsEntryId] = useState<string | null>(
    null,
  )
  const [imageModalOpen, setImageModalOpen] = useState(false)
  const [imageModalMode, setImageModalMode] = useState<'insert' | 'edit'>(
    'insert',
  )
  const [imageEditPos, setImageEditPos] = useState<number | null>(null)
  const [imageEditAttrs, setImageEditAttrs] = useState<ImageBlockAttrs | null>(
    null,
  )
  const [tableModalOpen, setTableModalOpen] = useState(false)
  const [tableInsertTab, setTableInsertTab] = useState<InsertModalTab>('manual')
  const [chartModalOpen, setChartModalOpen] = useState(false)
  const [chartInsertTab, setChartInsertTab] = useState<InsertModalTab>('manual')
  const [chartModalMode, setChartModalMode] = useState<'insert' | 'edit'>(
    'insert',
  )
  const [chartEditPos, setChartEditPos] = useState<number | null>(null)
  const [chartEditAttrs, setChartEditAttrs] = useState<ChartBlockAttrs | null>(
    null,
  )
  const [aiGenerateKind, setAiGenerateKind] = useState<AiGenerateKind | null>(
    null,
  )
  const [aiGenerateTarget, setAiGenerateTarget] = useState<{
    chartPos?: number
    tablePos?: number
  } | null>(null)
  const [aiGenerateLoading, setAiGenerateLoading] = useState(false)
  const [aiGenerateError, setAiGenerateError] = useState<string | null>(null)
  const { status, lastSavedAt, documentMeta, scheduleSave, saveNow, flushPending } =
    useAutosave()
  const {
    entries: historyEntries,
    activeId: activeHistoryId,
    saveError: historySaveError,
    recordAppliedEdit,
    setHistoryBaseline,
    pauseHistoryRecording,
    resumeHistoryRecording,
    getLatestEntry,
    getPreviousContent,
    setActiveEntry,
    syncActiveEntry,
    clearHistory,
  } = useEditHistory(initialEditorHtml)
  const syncActiveEntryRef = useRef(syncActiveEntry)
  syncActiveEntryRef.current = syncActiveEntry
  const pauseHistoryRecordingRef = useRef(pauseHistoryRecording)
  pauseHistoryRecordingRef.current = pauseHistoryRecording
  const resumeHistoryRecordingRef = useRef(resumeHistoryRecording)
  resumeHistoryRecordingRef.current = resumeHistoryRecording
  const setHistoryBaselineRef = useRef(setHistoryBaseline)
  setHistoryBaselineRef.current = setHistoryBaseline
  const {
    clearAllDiffMarks,
    finalizeDiff,
    showDiffInDocument,
    shouldFinalizeOnEdit,
  } = useInlineDiff()

  const writingModeRef = useRef(writingMode)
  writingModeRef.current = writingMode
  const sourceEditorActiveRef = useRef(writingMode !== 'visual')
  sourceEditorActiveRef.current = writingMode !== 'visual'
  const markdownSourceInitializedRef = useRef(false)
  const latexSourceInitializedRef = useRef(false)
  const typstSourceInitializedRef = useRef(false)

  const handleAiMenuModeChange = useCallback((mode: AiMenuMode) => {
    setAiMenuMode(mode)
    saveAiMenuMode(mode)
  }, [])

  const handlePageFormatChange = useCallback((format: PageFormatId) => {
    setPageFormatId(format)
    savePageFormat(format)
  }, [])

  const handlePageOrientationChange = useCallback(
    (orientation: PageOrientation) => {
      setPageOrientation(orientation)
      savePageOrientation(orientation)
    },
    [],
  )

  const pageLayout = useMemo(
    () => getPageLayout(pageFormatId, pageOrientation),
    [pageFormatId, pageOrientation],
  )

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      FontFamily,
      FontSize,
      Color,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      LineHeight,
      ImageBlock,
      Table.configure({
        resizable: true,
        renderWrapper: true,
        allowTableNodeSelection: true,
        HTMLAttributes: { class: 'editor-table' },
      }),
      TableRow,
      TableHeader,
      TableCell,
      ChartBlock,
      MathInline,
      MathBlock,
      DiffAdded,
      DiffRemoved,
    ],
    content: initialEditorHtml,
    onCreate: ({ editor: ed }) => {
      ed.commands.fixTables()
    },
    onUpdate: ({ editor: ed, transaction }) => {
      if (transaction.docChanged && shouldFinalizeOnEdit(ed)) {
        finalizeDiff(ed)
      }
      if (
        !sourceEditorActiveRef.current &&
        !docHasDiffMarks(ed) &&
        transaction.docChanged
      ) {
        const html = ed.getHTML()
        scheduleSave(html)
        syncActiveEntryRef.current(html)
      }
    },
    onSelectionUpdate: ({ editor: ed }) => {
      const { from, to } = ed.state.selection
      setHasTextSelection(from !== to && !ed.isActive('codeBlock'))
      setIsInTable(ed.isActive('table'))
    },
    editorProps: {
      attributes: {
        class: 'tiptap-editor',
      },
    },
  })

  const handleWritingModeChange = useCallback(
    (nextMode: WritingMode) => {
      if (!editor || nextMode === writingMode) return

      setWritingModeError(null)

      try {
        const canonicalHtml = resolveWritingModeHtml(writingMode, {
          editorHtml: editor.getHTML(),
          markdown: markdownSource,
          latex: latexSource,
          typst: typstSource,
        })

        restoreEditorContent(editor, canonicalHtml, clearAllDiffMarks, {
          preserveScroll: nextMode === 'visual',
        })

        if (nextMode === 'markdown') {
          setMarkdownSource(convertHtmlToWritingModeSource('markdown', canonicalHtml))
        }

        if (nextMode === 'latex') {
          setLatexSource(convertHtmlToWritingModeSource('latex', canonicalHtml))
        }

        if (nextMode === 'typst') {
          setTypstSource(convertHtmlToWritingModeSource('typst', canonicalHtml))
        }

        saveNow(canonicalHtml)
        setHistoryBaselineRef.current(canonicalHtml)
        syncActiveEntryRef.current(canonicalHtml)
        setWritingMode(nextMode)
        saveWritingMode(nextMode)
      } catch {
        setWritingModeError(
          'Impossibile convertire il contenuto nella modalità selezionata.',
        )
      }
    },
    [
      editor,
      writingMode,
      markdownSource,
      latexSource,
      typstSource,
      clearAllDiffMarks,
      saveNow,
    ],
  )

  const handleMarkdownSourceChange = useCallback(
    (value: string) => {
      setMarkdownSource(value)
      setWritingModeError(null)

      try {
        const html = resolveWritingModeHtml('markdown', {
          editorHtml: editor?.getHTML() ?? '',
          markdown: value,
          latex: latexSource,
          typst: typstSource,
        })
        scheduleSave(html)
        syncActiveEntryRef.current(html)
      } catch {
        // Mantieni l'ultima versione salvata finché il Markdown non è valido.
      }
    },
    [editor, latexSource, typstSource, scheduleSave],
  )

  const handleLatexSourceChange = useCallback(
    (value: string) => {
      setLatexSource(value)
      setWritingModeError(null)

      try {
        const html = resolveWritingModeHtml('latex', {
          editorHtml: editor?.getHTML() ?? '',
          markdown: markdownSource,
          latex: value,
          typst: typstSource,
        })
        scheduleSave(html)
        syncActiveEntryRef.current(html)
      } catch {
        // Mantieni l'ultima versione salvata finché il LaTeX non è valido.
      }
    },
    [editor, markdownSource, typstSource, scheduleSave],
  )

  const handleTypstSourceChange = useCallback(
    (value: string) => {
      setTypstSource(value)
      setWritingModeError(null)

      try {
        const html = resolveWritingModeHtml('typst', {
          editorHtml: editor?.getHTML() ?? '',
          markdown: markdownSource,
          latex: latexSource,
          typst: value,
        })
        scheduleSave(html)
        syncActiveEntryRef.current(html)
      } catch {
        // Mantieni l'ultima versione salvata finché il Typst non è valido.
      }
    },
    [editor, markdownSource, latexSource, scheduleSave],
  )

  useEffect(() => {
    if (
      !editor ||
      writingMode !== 'markdown' ||
      markdownSourceInitializedRef.current
    ) {
      return
    }

    markdownSourceInitializedRef.current = true
    setMarkdownSource(
      convertHtmlToWritingModeSource(
        'markdown',
        stripDiffMarksFromHtml(editor.getHTML()),
      ),
    )
  }, [editor, writingMode])

  useEffect(() => {
    if (
      !editor ||
      writingMode !== 'latex' ||
      latexSourceInitializedRef.current
    ) {
      return
    }

    latexSourceInitializedRef.current = true
    setLatexSource(
      convertHtmlToWritingModeSource(
        'latex',
        stripDiffMarksFromHtml(editor.getHTML()),
      ),
    )
  }, [editor, writingMode])

  useEffect(() => {
    if (
      !editor ||
      writingMode !== 'typst' ||
      typstSourceInitializedRef.current
    ) {
      return
    }

    typstSourceInitializedRef.current = true
    setTypstSource(
      convertHtmlToWritingModeSource(
        'typst',
        stripDiffMarksFromHtml(editor.getHTML()),
      ),
    )
  }, [editor, writingMode])

  useEffect(() => {
    return () => {
      flushPending()
    }
  }, [flushPending])

  const syncSourceEditorFromHtml = useCallback((html: string) => {
    const clean = stripDiffMarksFromHtml(html)
    if (writingModeRef.current === 'markdown') {
      setMarkdownSource(convertHtmlToWritingModeSource('markdown', clean))
    } else if (writingModeRef.current === 'latex') {
      setLatexSource(convertHtmlToWritingModeSource('latex', clean))
    } else if (writingModeRef.current === 'typst') {
      setTypstSource(convertHtmlToWritingModeSource('typst', clean))
    }
  }, [])

  const openMathFormulaModal = useCallback((displayMode: boolean) => {
    setMathModalDisplayMode(displayMode)
    setMathModalOpen(true)
  }, [])

  const handleInsertMathFormula = useCallback(
    (latex: string, displayMode: boolean) => {
      if (!editor) return

      if (displayMode) {
        editor
          .chain()
          .focus()
          .insertContent({ type: 'mathBlock', attrs: { latex } })
          .run()
        return
      }

      editor
        .chain()
        .focus()
        .insertContent({ type: 'mathInline', attrs: { latex } })
        .run()
    },
    [editor],
  )

  const loadVersion = useCallback(
    (entry: EditHistoryEntry) => {
      if (!editor) return
      pauseHistoryRecordingRef.current()
      const cleanHtml = stripDiffMarksFromHtml(entry.contentHtml)
      restoreEditorContent(editor, cleanHtml, clearAllDiffMarks, {
        preserveScroll: false,
      })
      saveNow(cleanHtml)
      syncSourceEditorFromHtml(cleanHtml)
      setActiveEntry(entry.id)
      setHistoryBaselineRef.current(cleanHtml)
      resumeHistoryRecordingRef.current()

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          scrollEditorToHistoryChange(editor, entry)
        })
      })
    },
    [editor, setActiveEntry, clearAllDiffMarks, saveNow, syncSourceEditorFromHtml],
  )

  const handleRestoreHistory = useCallback(
    (entry: EditHistoryEntry) => {
      setCorrectionsEntryId(null)
      loadVersion(entry)
    },
    [loadVersion],
  )

  const handleToggleCorrections = useCallback(
    (entry: EditHistoryEntry) => {
      if (!editor) return

      if (correctionsEntryId === entry.id) {
        clearAllDiffMarks(editor, false)
        setCorrectionsEntryId(null)
        loadVersion(entry)
        return
      }

      setCorrectionsEntryId(entry.id)
      loadVersion(entry)

      if (entry.selectionBefore && entry.selectionAfter) {
        requestAnimationFrame(() => {
          showDiffInDocument(
            editor,
            entry.selectionBefore!,
            entry.selectionAfter!,
          )
          requestAnimationFrame(() => {
            scrollEditorToHistoryChange(editor, entry)
          })
        })
      }
    },
    [
      editor,
      correctionsEntryId,
      loadVersion,
      clearAllDiffMarks,
      showDiffInDocument,
    ],
  )

  const handleRestorePrevious = useCallback(
    (entry?: EditHistoryEntry) => {
      if (!editor) return

      const target = entry ?? getLatestEntry()
      const previousHtml = target
        ? getPreviousContent(target.id)
        : getPreviousContent()

      if (!previousHtml) return

      const entryIndex = historyEntries.findIndex((e) => e.id === target?.id)
      const priorEntryId =
        entryIndex >= 0 ? (historyEntries[entryIndex + 1]?.id ?? null) : null

      setCorrectionsEntryId(null)
      pauseHistoryRecordingRef.current()
      restoreEditorContent(
        editor,
        stripDiffMarksFromHtml(previousHtml),
        clearAllDiffMarks,
      )
      const restoredHtml = stripDiffMarksFromHtml(previousHtml)
      saveNow(restoredHtml)
      syncSourceEditorFromHtml(restoredHtml)
      setActiveEntry(priorEntryId)
      setHistoryBaselineRef.current(restoredHtml)
      resumeHistoryRecordingRef.current()
    },
    [
      editor,
      getLatestEntry,
      getPreviousContent,
      historyEntries,
      setActiveEntry,
      clearAllDiffMarks,
      saveNow,
      syncSourceEditorFromHtml,
    ],
  )

  const handleRestoreOriginal = useCallback(() => {
    if (!editor) return

    const firstHtml = getFirstVersionContent(historyEntries)
    if (!firstHtml) return

    setCorrectionsEntryId(null)
    pauseHistoryRecordingRef.current()
    const cleanHtml = stripDiffMarksFromHtml(firstHtml)
    restoreEditorContent(editor, cleanHtml, clearAllDiffMarks, {
      preserveScroll: false,
    })
    saveNow(cleanHtml)
    syncSourceEditorFromHtml(cleanHtml)
    syncActiveEntry(cleanHtml)
    setHistoryBaselineRef.current(cleanHtml)
    resumeHistoryRecordingRef.current()
  }, [
    editor,
    historyEntries,
    syncActiveEntry,
    clearAllDiffMarks,
    saveNow,
    syncSourceEditorFromHtml,
  ])

  const handleRestoreLatest = useCallback(() => {
    const latest = getLatestVersionEntry(historyEntries)
    if (!latest) return

    setCorrectionsEntryId(null)
    loadVersion(latest)
  }, [historyEntries, loadVersion])

  const handleClearHistory = useCallback(() => {
    clearHistory()
  }, [clearHistory])

  const openImageInsertModal = useCallback(() => {
    setImageModalMode('insert')
    setImageEditPos(null)
    setImageEditAttrs(null)
    setImageModalOpen(true)
  }, [])

  const handleSaveImage = useCallback(
    (attrs: ImageBlockAttrs) => {
      if (!editor) return

      if (imageModalMode === 'edit' && imageEditPos !== null) {
        editor.chain().focus().updateImageBlockAt(imageEditPos, attrs).run()
      } else {
        editor.chain().focus().insertImageBlock(attrs).run()
      }

      setImageEditPos(null)
      setImageEditAttrs(null)
    },
    [editor, imageModalMode, imageEditPos],
  )

  const openChartInsertModal = useCallback((tab: InsertModalTab = 'manual') => {
    setChartInsertTab(tab)
    setChartModalMode('insert')
    setChartEditPos(null)
    setChartEditAttrs(null)
    setAiGenerateError(null)
    setChartModalOpen(true)
  }, [])

  const openTableInsertModal = useCallback((tab: InsertModalTab = 'manual') => {
    setTableInsertTab(tab)
    setAiGenerateError(null)
    setTableModalOpen(true)
  }, [])

  const handleInsertManualTable = useCallback(
    (rows: number, cols: number) => {
      if (!editor) return
      editor
        .chain()
        .focus()
        .insertTable({ rows, cols, withHeaderRow: true })
        .run()
    },
    [editor],
  )

  const handleSaveChart = useCallback(
    (attrs: ChartBlockAttrs) => {
      if (!editor) return

      if (chartModalMode === 'edit' && chartEditPos !== null) {
        editor.chain().focus().updateChartAt(chartEditPos, attrs).run()
      } else {
        editor.chain().focus().insertChart(attrs).run()
      }

      setChartModalOpen(false)
      setChartEditPos(null)
      setChartEditAttrs(null)
    },
    [editor, chartModalMode, chartEditPos],
  )

  const openAiGenerate = useCallback(
    (
      kind: AiGenerateKind,
      target?: { chartPos?: number; tablePos?: number },
    ) => {
      setAiGenerateError(null)
      setAiGenerateTarget(target ?? null)
      setAiGenerateKind(kind)
    },
    [],
  )

  useEffect(() => {
    if (!editor) return

    const storage = editor.storage.imageBlock as ImageBlockStorage
    storage.onEditImage = (pos, attrs) => {
      setImageModalMode('edit')
      setImageEditPos(pos)
      setImageEditAttrs(attrs)
      setImageModalOpen(true)
    }

    return () => {
      storage.onEditImage = null
    }
  }, [editor])

  useEffect(() => {
    if (!editor) return

    const storage = editor.storage.chartBlock as ChartBlockStorage
    storage.onEditChart = (pos, attrs) => {
      setChartModalMode('edit')
      setChartEditPos(pos)
      setChartEditAttrs(attrs)
      setChartModalOpen(true)
    }
    storage.onAiGenerateChart = (pos) => {
      openAiGenerate('chart', { chartPos: pos })
    }

    return () => {
      storage.onEditChart = null
      storage.onAiGenerateChart = null
    }
  }, [editor, openAiGenerate])

  const getDocumentContext = useCallback(() => {
    if (writingModeRef.current === 'markdown') {
      return markdownSource.trim().slice(0, 2500)
    }
    if (writingModeRef.current === 'latex') {
      return latexSource.trim().slice(0, 2500)
    }
    if (writingModeRef.current === 'typst') {
      return typstSource.trim().slice(0, 2500)
    }
    if (!editor) return ''
    return editor.state.doc
      .textBetween(0, editor.state.doc.content.size, '\n', '\n')
      .trim()
      .slice(0, 2500)
  }, [editor, markdownSource, latexSource, typstSource])

  const runAiGenerate = useCallback(
    async (
      kind: AiGenerateKind,
      instruction: string,
      target?: { chartPos?: number; tablePos?: number } | null,
      onSuccess?: () => void,
    ) => {
      if (!editor) return

      setAiGenerateLoading(true)
      setAiGenerateError(null)

      try {
        const context = getDocumentContext()

        if (kind === 'chart') {
          let existingChart: ChartBlockAttrs | undefined
          if (target?.chartPos != null) {
            const node = editor.state.doc.nodeAt(target.chartPos)
            if (node?.type.name === 'chartBlock') {
              existingChart = node.attrs as ChartBlockAttrs
            }
          }

          const chartAttrs = await generateChartWithAI({
            instruction,
            context,
            existingChart,
          })
          if (target?.chartPos != null) {
            editor
              .chain()
              .focus()
              .updateChartAt(target.chartPos, chartAttrs)
              .run()
          } else {
            editor.chain().focus().insertChart(chartAttrs).run()
          }
        } else {
          const tableData = await generateTableWithAI({
            instruction,
            context,
          })
          const ok =
            target?.tablePos != null
              ? updateAiTableAt(editor, target.tablePos, tableData)
              : insertAiTable(editor, tableData)
          if (!ok) {
            throw new Error(
              target?.tablePos != null
                ? 'Impossibile aggiornare la tabella nel documento.'
                : 'Impossibile inserire la tabella nel documento.',
            )
          }
        }

        onSuccess?.()
      } catch (err) {
        setAiGenerateError(
          err instanceof Error ? err.message : 'Errore durante la generazione',
        )
      } finally {
        setAiGenerateLoading(false)
      }
    },
    [editor, getDocumentContext],
  )

  const handleAiGenerateSubmit = useCallback(
    async (instruction: string) => {
      if (!aiGenerateKind) return

      await runAiGenerate(aiGenerateKind, instruction, aiGenerateTarget, () => {
        setAiGenerateKind(null)
        setAiGenerateTarget(null)
      })
    },
    [aiGenerateKind, aiGenerateTarget, runAiGenerate],
  )

  const handleChartModalAi = useCallback(
    (instruction: string) => {
      const target =
        chartModalMode === 'edit' && chartEditPos !== null
          ? { chartPos: chartEditPos }
          : null

      void runAiGenerate('chart', instruction, target, () => {
        setChartModalOpen(false)
        setChartEditPos(null)
        setChartEditAttrs(null)
      })
    },
    [chartModalMode, chartEditPos, runAiGenerate],
  )

  const handleTableInsertAi = useCallback(
    (instruction: string) => {
      void runAiGenerate('table', instruction, null, () => {
        setTableModalOpen(false)
      })
    },
    [runAiGenerate],
  )

  const handleOpenAiModal = useCallback(() => {
    if (!editor) return

    const { from, to } = editor.state.selection
    if (from === to) return

    const text = getSelectedTextFromRange(editor.state.doc, from, to)
    setSelectionRange({ from, to })
    setSelectedText(text)
    setError(null)
    setAiModalOpen(true)
  }, [editor])

  const captureSelectionForAi = useCallback(() => {
    if (!editor) return null

    const { from, to } = editor.state.selection
    if (from === to) return null

    const text = getSelectedTextFromRange(editor.state.doc, from, to)
    setSelectionRange({ from, to })
    setSelectedText(text)
    setError(null)
    return { from, to, text }
  }, [editor])

  const handleCloseAiModal = useCallback(() => {
    if (isLoading) return
    setAiModalOpen(false)
    setError(null)
  }, [isLoading])

  const handleAiSubmit = useCallback(
    async (
      instruction: string,
      selectionOverride?: { from: number; to: number; text: string },
    ) => {
      if (!editor) return

      const from = selectionOverride?.from ?? selectionRange?.from
      const to = selectionOverride?.to ?? selectionRange?.to
      const currentSelectedText = selectionOverride?.text ?? selectedText

      if (from == null || to == null) return

      setIsLoading(true)
      setError(null)

      try {
        pauseHistoryRecordingRef.current()
        const contentHtmlBefore = editor.getHTML()

        const docSize = editor.state.doc.content.size
        if (from < 0 || to > docSize || from >= to) {
          throw new Error(
            'Selezione non più valida. Seleziona di nuovo il testo e riprova.',
          )
        }

        const selectedNow = getSelectedTextFromRange(editor.state.doc, from, to)
        if (selectedNow !== currentSelectedText) {
          throw new Error(
            'Il documento è cambiato durante la richiesta AI. Ripeti la selezione.',
          )
        }

        let selectionAfter = ''
        const tableRequested = wantsTableOutput(instruction)

        if (tableRequested) {
          let tableData =
            parseStructuredTableText(currentSelectedText) ??
            (await convertTextToTableWithAI(instruction, currentSelectedText))

          tableData = sanitizeTableData(tableData)

          if (!isUsableTableData(tableData)) {
            tableData = parseLineListAsTable(currentSelectedText)
          }

          if (!isUsableTableData(tableData)) {
            throw new Error(
              'Impossibile convertire il testo in tabella. Prova a selezionare di nuovo il blocco.',
            )
          }

          selectionAfter = tableDataToPlainText(tableData)

          if (!applyTableDataAtSelection(editor, from, to, tableData)) {
            throw new Error('Impossibile inserire o aggiornare la tabella.')
          }
        } else {
          const modified = await modifyTextWithAI({
            text: currentSelectedText,
            instruction,
            inTable: editor.isActive('table'),
          })

          selectionAfter = modified

          editor
            .chain()
            .focus()
            .deleteRange({ from, to })
            .insertContentAt(from, selectionAfter)
            .run()
        }

        const contentHtml = editor.getHTML()
        saveNow(contentHtml)
        const savedEntry = recordAppliedEdit({
          contentHtml,
          contentHtmlBefore,
          instruction,
          selectionBefore: currentSelectedText,
          selectionAfter,
        })

        if (savedEntry.error) {
          setError(savedEntry.error)
          return
        }

        setCorrectionsEntryId(null)
        setAiModalOpen(false)
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Errore durante la modifica',
        )
      } finally {
        resumeHistoryRecordingRef.current()
        setIsLoading(false)
      }
    },
    [
      editor,
      selectionRange,
      selectedText,
      recordAppliedEdit,
      saveNow,
    ],
  )

  const handleAiQuickAction = useCallback(
    (instruction: string) => {
      const selection = captureSelectionForAi()
      if (!selection) return
      void handleAiSubmit(instruction, selection)
    },
    [captureSelectionForAi, handleAiSubmit],
  )

  if (!editor) {
    return <div className="editor-loading">Caricamento editor…</div>
  }

  const sourceEditorActive = writingMode !== 'visual'

  const getCurrentDocumentHtml = () => {
    try {
      return resolveWritingModeHtml(writingMode, {
        editorHtml: editor.getHTML(),
        markdown: markdownSource,
        latex: latexSource,
        typst: typstSource,
      })
    } catch {
      return stripDiffMarksFromHtml(editor.getHTML())
    }
  }

  const currentDocumentHtml = getCurrentDocumentHtml()
  const canRestoreOriginal = canRestoreFirstVersion(
    historyEntries,
    currentDocumentHtml,
  )
  const canRestoreLatest = canRestoreLatestVersion(
    historyEntries,
    currentDocumentHtml,
    activeHistoryId,
  )

  return (
    <AppShell
      title="Il mio documento"
      subtitle="Editor testuale con AI e storico versioni"
      headerActions={
        <>
          <PageFormatSelect
            formatId={pageFormatId}
            orientation={pageOrientation}
            onFormatChange={handlePageFormatChange}
            onOrientationChange={handlePageOrientationChange}
          />
          <WritingModeSelect
            mode={writingMode}
            error={writingModeError}
            onChange={handleWritingModeChange}
          />
          <ExportMenu
            getHtml={() => getCurrentDocumentHtml()}
            documentTitle="Il mio documento"
            pageLayout={pageLayout}
          />
          <AiMenuModeToggle mode={aiMenuMode} onChange={handleAiMenuModeChange} />
        </>
      }
      toolbar={
        sourceEditorActive ? null : (
          <Toolbar
            editor={editor}
            isInTable={isInTable}
            onInsertImage={openImageInsertModal}
            onInsertTable={() => openTableInsertModal()}
            onInsertChart={() => openChartInsertModal()}
            onInsertInlineMath={() => openMathFormulaModal(false)}
            onInsertBlockMath={() => openMathFormulaModal(true)}
          />
        )
      }
      metaBar={
        <HistoryRestoreActions
          showRestoreLinks={historyEntries.length > 0}
          canRestoreOriginal={canRestoreOriginal}
          canRestoreLatest={canRestoreLatest}
          onRestoreOriginal={handleRestoreOriginal}
          onRestoreLatest={handleRestoreLatest}
          autosaveStatus={status}
          showAiButton={aiMenuMode === 'toolbar' && !sourceEditorActive}
          hasTextSelection={hasTextSelection}
          onAiClick={handleOpenAiModal}
        />
      }
      sidebar={
        <HistorySidebar
          entries={historyEntries}
          activeId={activeHistoryId}
          saveError={historySaveError}
          correctionsEntryId={correctionsEntryId}
          onRestore={handleRestoreHistory}
          onRestorePrevious={handleRestorePrevious}
          onToggleCorrections={handleToggleCorrections}
          onClear={handleClearHistory}
        />
      }
    >
      <div className="editor-shell">
        <div
          className="editor-canvas"
          data-page-format={getPageFormatLabel(pageLayout)}
        >
          <div
            className="editor-page"
            style={{ minHeight: pageLayout.heightPx }}
          >
            {writingMode === 'markdown' ? (
              <div className="editor-content-shell editor-content-shell--markdown">
                {writingModeError && (
                  <p className="source-editor-error" role="alert">
                    {writingModeError}
                  </p>
                )}
                <MarkdownEditorPane
                  value={markdownSource}
                  onChange={handleMarkdownSourceChange}
                />
              </div>
            ) : writingMode === 'latex' ? (
              <div className="editor-content-shell editor-content-shell--latex">
                {writingModeError && (
                  <p className="source-editor-error" role="alert">
                    {writingModeError}
                  </p>
                )}
                <LatexEditorPane
                  value={latexSource}
                  onChange={handleLatexSourceChange}
                />
              </div>
            ) : writingMode === 'typst' ? (
              <div className="editor-content-shell editor-content-shell--typst">
                {writingModeError && (
                  <p className="source-editor-error" role="alert">
                    {writingModeError}
                  </p>
                )}
                <TypstEditorPane
                  value={typstSource}
                  onChange={handleTypstSourceChange}
                />
              </div>
            ) : (
              <>
                <div
                  className={
                    aiMenuMode === 'bubble'
                      ? 'editor-content-shell editor-content-shell--bubble'
                      : 'editor-content-shell'
                  }
                >
                  <EditorContent editor={editor} />
                  <EditorBlockGutter
                    editor={editor}
                    enabled={aiMenuMode === 'bubble'}
                    onInsertImage={openImageInsertModal}
                    onInsertTable={() => openTableInsertModal()}
                  />
                </div>
                <TableHoverControls
                  editor={editor}
                  onAiGenerateTable={(tablePos) =>
                    openAiGenerate('table', { tablePos })
                  }
                />
              </>
            )}
          </div>
        </div>
        <EditorMetaFooter
          autosaveStatus={status}
          lastSavedAt={lastSavedAt}
          documentMeta={documentMeta}
        />
        {!sourceEditorActive && (
          <EditorInsertContextMenu
            editor={editor}
            enabled={aiMenuMode === 'bubble' || aiMenuMode === 'contextmenu'}
            onAiClick={handleOpenAiModal}
            onAiQuickAction={handleAiQuickAction}
          />
        )}
      </div>

      <AiPromptModal
        selectedText={selectedText}
        isOpen={aiModalOpen}
        isLoading={isLoading}
        error={error}
        onSubmit={handleAiSubmit}
        onClose={handleCloseAiModal}
      />

      <ImageEditorModal
        isOpen={imageModalOpen}
        mode={imageModalMode}
        initialAttrs={imageEditAttrs}
        onClose={() => {
          setImageModalOpen(false)
          setImageEditPos(null)
          setImageEditAttrs(null)
        }}
        onSave={handleSaveImage}
      />

      <TableInsertModal
        isOpen={tableModalOpen}
        initialTab={tableInsertTab}
        documentContext={getDocumentContext()}
        aiLoading={aiGenerateLoading}
        aiError={aiGenerateError}
        onClose={() => {
          if (aiGenerateLoading) return
          setTableModalOpen(false)
          setAiGenerateError(null)
        }}
        onInsertManual={handleInsertManualTable}
        onAiGenerate={handleTableInsertAi}
      />

      {aiGenerateKind && (
        <AiGenerateModal
          kind={aiGenerateKind}
          isOpen={aiGenerateKind !== null}
          documentContext={getDocumentContext()}
          isLoading={aiGenerateLoading}
          error={aiGenerateError}
          mode={
            aiGenerateTarget?.chartPos != null ||
            aiGenerateTarget?.tablePos != null
              ? 'regenerate'
              : 'insert'
          }
          onSubmit={handleAiGenerateSubmit}
          onClose={() => {
            if (aiGenerateLoading) return
            setAiGenerateKind(null)
            setAiGenerateTarget(null)
            setAiGenerateError(null)
          }}
        />
      )}

      <ChartEditorModal
        isOpen={chartModalOpen}
        mode={chartModalMode}
        initialAttrs={chartEditAttrs}
        initialTab={chartInsertTab}
        documentContext={getDocumentContext()}
        aiLoading={aiGenerateLoading}
        aiError={aiGenerateError}
        onClose={() => {
          if (aiGenerateLoading) return
          setChartModalOpen(false)
          setChartEditPos(null)
          setChartEditAttrs(null)
          setAiGenerateError(null)
        }}
        onSave={handleSaveChart}
        onAiGenerate={handleChartModalAi}
      />

      <MathFormulaModal
        isOpen={mathModalOpen}
        displayMode={mathModalDisplayMode}
        onClose={() => setMathModalOpen(false)}
        onSubmit={handleInsertMathFormula}
      />
    </AppShell>
  )
}
