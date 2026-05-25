import type { LucideIcon } from 'lucide-react'
import { AppIcon } from './LucideIcon'

export interface EditorInsertMenuItem {
  id: string
  label: string
  icon: LucideIcon
  onSelect: () => void
}

export interface EditorInsertMenuGroup {
  label: string
  items: EditorInsertMenuItem[]
}

interface EditorInsertMenuPanelProps {
  groups: EditorInsertMenuGroup[]
  className?: string
}

export function EditorInsertMenuPanel({
  groups,
  className = '',
}: EditorInsertMenuPanelProps) {
  return (
    <div
      className={`editor-insert-menu ${className}`.trim()}
      role="menu"
      onMouseDown={(event) => event.preventDefault()}
    >
      {groups.map((group) => (
        <div key={group.label} className="editor-insert-menu-group" role="presentation">
          <div className="editor-insert-menu-label">{group.label}</div>
          {group.items.map((item) => (
            <button
              key={item.id}
              type="button"
              className="editor-insert-menu-item"
              role="menuitem"
              onClick={item.onSelect}
            >
              <AppIcon icon={item.icon} size="sm" />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      ))}
    </div>
  )
}
