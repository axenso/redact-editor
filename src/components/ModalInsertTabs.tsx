import { Sparkles, Wrench } from 'lucide-react'
import { AppIcon } from './LucideIcon'

export type InsertModalTab = 'manual' | 'ai'

interface ModalInsertTabsProps {
  activeTab: InsertModalTab
  onChange: (tab: InsertModalTab) => void
  aiDisabled?: boolean
}

export function ModalInsertTabs({
  activeTab,
  onChange,
  aiDisabled = false,
}: ModalInsertTabsProps) {
  return (
    <div className="modal-insert-tabs" role="tablist" aria-label="Modalità inserimento">
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === 'manual'}
        className={
          activeTab === 'manual'
            ? 'modal-insert-tab active'
            : 'modal-insert-tab'
        }
        onClick={() => onChange('manual')}
      >
        <AppIcon icon={Wrench} size="xs" />
        Manuale
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === 'ai'}
        className={activeTab === 'ai' ? 'modal-insert-tab active' : 'modal-insert-tab'}
        disabled={aiDisabled}
        onClick={() => onChange('ai')}
      >
        <AppIcon icon={Sparkles} size="xs" />
        Con AI
      </button>
    </div>
  )
}
