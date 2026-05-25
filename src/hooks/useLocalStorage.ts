import type { PageFormatId, PageOrientation } from '../constants/pageFormat'
import { PAGE_FORMAT_IDS } from '../constants/pageFormat'

export const STORAGE_KEY = 'interactive-chat-content'
export const DOCUMENT_META_KEY = 'interactive-chat-document-meta'
export const AI_MENU_MODE_KEY = 'interactive-chat-ai-menu-mode'
export const AI_MENU_PREFS_KEY = 'interactive-chat-ai-menu-prefs'
export const PAGE_FORMAT_KEY = 'interactive-chat-page-format'
export const PAGE_ORIENTATION_KEY = 'interactive-chat-page-orientation'
export const HISTORY_SIDEBAR_WIDTH_KEY = 'interactive-chat-history-sidebar-width'
export const EDITOR_PAGE_WIDTHS_KEY = 'interactive-chat-editor-page-widths'

const DEFAULT_HISTORY_SIDEBAR_WIDTH = 360
const MIN_HISTORY_SIDEBAR_WIDTH = 260
const MAX_HISTORY_SIDEBAR_WIDTH = 640
const MIN_EDITOR_PAGE_WIDTH = 320
const MAX_EDITOR_PAGE_WIDTH = 1600
const MIN_EDITOR_PAGE_HEIGHT = 320
const MAX_EDITOR_PAGE_HEIGHT = 3200

/** Modalità menu AI (mutuamente esclusiva). */
export type AiMenuMode = 'bubble' | 'contextmenu' | 'toolbar'

const AI_MENU_MODES: AiMenuMode[] = ['bubble', 'contextmenu', 'toolbar']

function migrateAiMenuPreferences(raw: string | null): AiMenuMode | null {
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as {
      bubble?: boolean
      contextMenu?: boolean
    }

    if (typeof parsed.bubble !== 'boolean' || typeof parsed.contextMenu !== 'boolean') {
      return null
    }

    if (parsed.bubble && !parsed.contextMenu) return 'bubble'
    if (parsed.contextMenu && !parsed.bubble) return 'contextmenu'
    if (!parsed.bubble && !parsed.contextMenu) return 'toolbar'
    return 'bubble'
  } catch {
    return null
  }
}

export function loadAiMenuMode(): AiMenuMode {
  try {
    const value = localStorage.getItem(AI_MENU_MODE_KEY)
    if (AI_MENU_MODES.includes(value as AiMenuMode)) {
      return value as AiMenuMode
    }

    const migrated = migrateAiMenuPreferences(
      localStorage.getItem(AI_MENU_PREFS_KEY),
    )
    if (migrated) return migrated

    return 'toolbar'
  } catch {
    return 'toolbar'
  }
}

export function saveAiMenuMode(mode: AiMenuMode): void {
  try {
    localStorage.setItem(AI_MENU_MODE_KEY, mode)
  } catch {
    // localStorage unavailable
  }
}

/** @deprecated Usare AiMenuMode */
export interface AiMenuPreferences {
  bubble: boolean
  contextMenu: boolean
}

/** @deprecated Usare loadAiMenuMode */
export function loadAiMenuPreferences(): AiMenuPreferences {
  const mode = loadAiMenuMode()
  return {
    bubble: mode === 'bubble',
    contextMenu: mode === 'contextmenu',
  }
}

/** @deprecated Usare saveAiMenuMode */
export function saveAiMenuPreferences(preferences: AiMenuPreferences): void {
  if (preferences.bubble && !preferences.contextMenu) {
    saveAiMenuMode('bubble')
    return
  }

  if (preferences.contextMenu && !preferences.bubble) {
    saveAiMenuMode('contextmenu')
    return
  }

  saveAiMenuMode('toolbar')
}

export function loadPageFormat(): PageFormatId {
  try {
    const value = localStorage.getItem(PAGE_FORMAT_KEY)
    return PAGE_FORMAT_IDS.includes(value as PageFormatId)
      ? (value as PageFormatId)
      : 'a4'
  } catch {
    return 'a4'
  }
}

export function savePageFormat(format: PageFormatId): void {
  try {
    localStorage.setItem(PAGE_FORMAT_KEY, format)
  } catch {
    // localStorage unavailable
  }
}

export function loadPageOrientation(): PageOrientation {
  try {
    const value = localStorage.getItem(PAGE_ORIENTATION_KEY)
    return value === 'landscape' ? 'landscape' : 'portrait'
  } catch {
    return 'portrait'
  }
}

export function savePageOrientation(orientation: PageOrientation): void {
  try {
    localStorage.setItem(PAGE_ORIENTATION_KEY, orientation)
  } catch {
    // localStorage unavailable
  }
}

export function loadHistorySidebarWidth(): number {
  try {
    const value = Number.parseInt(
      localStorage.getItem(HISTORY_SIDEBAR_WIDTH_KEY) ?? '',
      10,
    )
    if (!Number.isFinite(value)) return DEFAULT_HISTORY_SIDEBAR_WIDTH
    return Math.min(
      MAX_HISTORY_SIDEBAR_WIDTH,
      Math.max(MIN_HISTORY_SIDEBAR_WIDTH, value),
    )
  } catch {
    return DEFAULT_HISTORY_SIDEBAR_WIDTH
  }
}

export function saveHistorySidebarWidth(width: number): void {
  try {
    const clamped = Math.min(
      MAX_HISTORY_SIDEBAR_WIDTH,
      Math.max(MIN_HISTORY_SIDEBAR_WIDTH, Math.round(width)),
    )
    localStorage.setItem(HISTORY_SIDEBAR_WIDTH_KEY, String(clamped))
  } catch {
    // localStorage unavailable
  }
}

export {
  DEFAULT_HISTORY_SIDEBAR_WIDTH,
  MIN_HISTORY_SIDEBAR_WIDTH,
  MAX_HISTORY_SIDEBAR_WIDTH,
  MIN_EDITOR_PAGE_WIDTH,
  MAX_EDITOR_PAGE_WIDTH,
  MIN_EDITOR_PAGE_HEIGHT,
  MAX_EDITOR_PAGE_HEIGHT,
}

interface EditorPageStoredSize {
  width?: number
  minHeight?: number
}

export interface EditorPageSize {
  width: number
  minHeight: number
}

function editorPageWidthKey(
  formatId: PageFormatId,
  orientation: PageOrientation,
): string {
  return `${formatId}:${orientation}`
}

function clampEditorPageWidth(width: number, defaultWidth: number): number {
  const min = Math.max(
    MIN_EDITOR_PAGE_WIDTH,
    Math.round(defaultWidth * 0.55),
  )
  const max = Math.min(
    MAX_EDITOR_PAGE_WIDTH,
    Math.max(min + 40, Math.round(defaultWidth * 1.65)),
  )
  return Math.min(max, Math.max(min, Math.round(width)))
}

function clampEditorPageHeight(height: number, defaultHeight: number): number {
  const min = Math.max(
    MIN_EDITOR_PAGE_HEIGHT,
    Math.round(defaultHeight * 0.55),
  )
  const max = Math.min(
    MAX_EDITOR_PAGE_HEIGHT,
    Math.max(min + 40, Math.round(defaultHeight * 2.5)),
  )
  return Math.min(max, Math.max(min, Math.round(height)))
}

function readStoredEditorPageSize(
  value: number | EditorPageStoredSize | undefined,
  defaults: EditorPageSize,
): EditorPageSize {
  if (typeof value === 'number') {
    return {
      width: clampEditorPageWidth(value, defaults.width),
      minHeight: defaults.minHeight,
    }
  }

  return {
    width: clampEditorPageWidth(value?.width ?? defaults.width, defaults.width),
    minHeight: clampEditorPageHeight(
      value?.minHeight ?? defaults.minHeight,
      defaults.minHeight,
    ),
  }
}

export function loadEditorPageSize(
  formatId: PageFormatId,
  orientation: PageOrientation,
  defaults: EditorPageSize,
): EditorPageSize {
  try {
    const raw = localStorage.getItem(EDITOR_PAGE_WIDTHS_KEY)
    if (!raw) {
      return {
        width: clampEditorPageWidth(defaults.width, defaults.width),
        minHeight: clampEditorPageHeight(defaults.minHeight, defaults.minHeight),
      }
    }

    const stored = JSON.parse(raw) as Record<
      string,
      number | EditorPageStoredSize
    >
    return readStoredEditorPageSize(
      stored[editorPageWidthKey(formatId, orientation)],
      defaults,
    )
  } catch {
    return {
      width: clampEditorPageWidth(defaults.width, defaults.width),
      minHeight: clampEditorPageHeight(defaults.minHeight, defaults.minHeight),
    }
  }
}

/** @deprecated Usare loadEditorPageSize */
export function loadEditorPageWidth(
  formatId: PageFormatId,
  orientation: PageOrientation,
  defaultWidth: number,
): number {
  return loadEditorPageSize(formatId, orientation, {
    width: defaultWidth,
    minHeight: defaultWidth,
  }).width
}

export function saveEditorPageSize(
  formatId: PageFormatId,
  orientation: PageOrientation,
  size: EditorPageSize,
  defaults: EditorPageSize,
): void {
  try {
    const raw = localStorage.getItem(EDITOR_PAGE_WIDTHS_KEY)
    const stored = raw
      ? (JSON.parse(raw) as Record<string, number | EditorPageStoredSize>)
      : {}
    stored[editorPageWidthKey(formatId, orientation)] = {
      width: clampEditorPageWidth(size.width, defaults.width),
      minHeight: clampEditorPageHeight(size.minHeight, defaults.minHeight),
    }
    localStorage.setItem(EDITOR_PAGE_WIDTHS_KEY, JSON.stringify(stored))
  } catch {
    // localStorage unavailable
  }
}

/** @deprecated Usare saveEditorPageSize */
export function saveEditorPageWidth(
  formatId: PageFormatId,
  orientation: PageOrientation,
  width: number,
  defaultWidth: number,
): void {
  saveEditorPageSize(
    formatId,
    orientation,
    { width, minHeight: defaultWidth },
    { width: defaultWidth, minHeight: defaultWidth },
  )
}

export function loadContent(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

export interface DocumentMeta {
  createdAt: string
  updatedAt: string
}

export function loadDocumentMeta(): DocumentMeta | null {
  try {
    const raw = localStorage.getItem(DOCUMENT_META_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw) as Partial<DocumentMeta>
    if (
      typeof parsed.createdAt !== 'string' ||
      typeof parsed.updatedAt !== 'string'
    ) {
      return null
    }

    return {
      createdAt: parsed.createdAt,
      updatedAt: parsed.updatedAt,
    }
  } catch {
    return null
  }
}

function saveDocumentMeta(meta: DocumentMeta): void {
  try {
    localStorage.setItem(DOCUMENT_META_KEY, JSON.stringify(meta))
  } catch {
    // localStorage full or unavailable
  }
}

export function ensureDocumentMeta(): DocumentMeta {
  const existing = loadDocumentMeta()
  if (existing) return existing

  const now = new Date().toISOString()
  const meta = { createdAt: now, updatedAt: now }
  saveDocumentMeta(meta)
  return meta
}

export function touchDocumentMeta(): DocumentMeta {
  const now = new Date().toISOString()
  const existing = loadDocumentMeta()
  const meta = {
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  }
  saveDocumentMeta(meta)
  return meta
}

export function saveContent(html: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, html)
  } catch {
    // localStorage full or unavailable
  }
}

export const DEFAULT_CONTENT = `
<h1>Benvenuto in REACTA</h1>
<p>Inizia a scrivere il tuo documento. Usa la barra degli strumenti per titoli, stile e interlinea.</p>
<p>Seleziona un passaggio e scegli <strong>Modifica con AI</strong> dalla barra, dal menu contestuale o dal popup sulla selezione.</p>
`.trim()
