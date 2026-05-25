import { Sigma } from 'lucide-react'
import type { WritingMode } from '../utils/writingMode'
import { AppIcon } from './LucideIcon'

interface SourceSnippet {
  id: string
  label: string
  title: string
  before: string
  after: string
  placeholder?: string
}

interface SourceEditorToolbarProps {
  mode: Exclude<WritingMode, 'visual'>
  onInsertSnippet: (
    before: string,
    after: string,
    placeholder?: string,
  ) => void
  onOpenFormula: (displayMode: boolean) => void
}

const MARKDOWN_SNIPPETS: SourceSnippet[] = [
  {
    id: 'heading',
    label: 'H2',
    title: 'Inserisci titolo (##)',
    before: '## ',
    after: '\n\n',
    placeholder: 'Titolo',
  },
  {
    id: 'bold',
    label: 'B',
    title: 'Grassetto (**testo**)',
    before: '**',
    after: '**',
    placeholder: 'testo',
  },
  {
    id: 'list',
    label: 'Lista',
    title: 'Elenco puntato',
    before: '- ',
    after: '\n',
    placeholder: 'elemento',
  },
  {
    id: 'table',
    label: 'Tabella',
    title: 'Template tabella Markdown',
    before: '| Colonna 1 | Colonna 2 |\n| --- | --- |\n| ',
    after: ' | valore |\n\n',
    placeholder: 'valore',
  },
]

const LATEX_SNIPPETS: SourceSnippet[] = [
  {
    id: 'section',
    label: 'Sezione',
    title: 'Inserisci \\section{}',
    before: '\\section{',
    after: '}\n\n',
    placeholder: 'Titolo',
  },
  {
    id: 'bold',
    label: 'B',
    title: 'Grassetto (\\textbf{})',
    before: '\\textbf{',
    after: '}',
    placeholder: 'testo',
  },
  {
    id: 'list',
    label: 'Lista',
    title: 'Ambiente itemize',
    before: '\\begin{itemize}\n  \\item ',
    after: '\n\\end{itemize}\n\n',
    placeholder: 'elemento',
  },
]

const TYPST_SNIPPETS: SourceSnippet[] = [
  {
    id: 'heading',
    label: 'H1',
    title: 'Inserisci titolo (=)',
    before: '= ',
    after: '\n\n',
    placeholder: 'Titolo',
  },
  {
    id: 'bold',
    label: 'B',
    title: 'Grassetto (*testo*)',
    before: '*',
    after: '*',
    placeholder: 'testo',
  },
  {
    id: 'list',
    label: 'Lista',
    title: 'Elenco puntato',
    before: '- ',
    after: '\n',
    placeholder: 'elemento',
  },
]

const MODE_LABELS: Record<Exclude<WritingMode, 'visual'>, string> = {
  markdown: 'Markdown',
  latex: 'LaTeX',
  typst: 'Typst',
}

const SNIPPETS: Record<Exclude<WritingMode, 'visual'>, SourceSnippet[]> = {
  markdown: MARKDOWN_SNIPPETS,
  latex: LATEX_SNIPPETS,
  typst: TYPST_SNIPPETS,
}

function ToolbarDivider() {
  return <span className="toolbar-divider" aria-hidden="true" />
}

export function SourceEditorToolbar({
  mode,
  onInsertSnippet,
  onOpenFormula,
}: SourceEditorToolbarProps) {
  const snippets = SNIPPETS[mode]

  return (
    <div
      className="toolbar source-editor-toolbar"
      role="toolbar"
      aria-label={`Comandi ${MODE_LABELS[mode]}`}
    >
      <span className="toolbar-group-label">{MODE_LABELS[mode]}</span>
      <div className="toolbar-group">
        {snippets.map((snippet) => (
          <button
            key={snippet.id}
            type="button"
            className="toolbar-btn source-editor-snippet-btn"
            title={snippet.title}
            onClick={() =>
              onInsertSnippet(
                snippet.before,
                snippet.after,
                snippet.placeholder,
              )
            }
          >
            {snippet.label}
          </button>
        ))}

        <ToolbarDivider />

        <button
          type="button"
          className="toolbar-btn"
          title="Formula inline"
          onClick={() => onOpenFormula(false)}
        >
          <AppIcon icon={Sigma} size="sm" />
        </button>
        <button
          type="button"
          className="toolbar-btn source-editor-math-block-btn"
          title="Formula in blocco"
          onClick={() => onOpenFormula(true)}
        >
          <span className="toolbar-math-block-label" aria-hidden="true">
            Σ
          </span>
        </button>
      </div>
    </div>
  )
}
