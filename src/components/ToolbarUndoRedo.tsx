import { useEffect, useState } from 'react'
import { Redo2, Undo2 } from 'lucide-react'
import type { Editor } from '@tiptap/react'
import { AppIcon } from './LucideIcon'

interface ToolbarUndoRedoProps {
  editor: Editor
}

export function ToolbarUndoRedo({ editor }: ToolbarUndoRedoProps) {
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  useEffect(() => {
    const sync = () => {
      setCanUndo(editor.can().undo())
      setCanRedo(editor.can().redo())
    }

    sync()
    editor.on('transaction', sync)

    return () => {
      editor.off('transaction', sync)
    }
  }, [editor])

  return (
    <>
      <button
        type="button"
        className="toolbar-btn"
        title="Annulla (⌘Z)"
        disabled={!canUndo}
        onClick={() => editor.chain().focus().undo().run()}
      >
        <AppIcon icon={Undo2} size="sm" />
      </button>
      <button
        type="button"
        className="toolbar-btn"
        title="Ripeti (⇧⌘Z)"
        disabled={!canRedo}
        onClick={() => editor.chain().focus().redo().run()}
      >
        <AppIcon icon={Redo2} size="sm" />
      </button>
    </>
  )
}
