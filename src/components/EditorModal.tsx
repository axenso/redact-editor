import type { ReactNode } from 'react'

interface EditorModalProps {
  isOpen: boolean
  title: string
  titleId: string
  onClose: () => void
  closeOnOverlay?: boolean
  busy?: boolean
  className?: string
  children: ReactNode
}

export function EditorModal({
  isOpen,
  title,
  titleId,
  onClose,
  closeOnOverlay = true,
  busy = false,
  className,
  children,
}: EditorModalProps) {
  if (!isOpen) return null

  return (
    <div
      className="modal-overlay"
      onClick={closeOnOverlay && !busy ? onClose : undefined}
      role="presentation"
    >
      <div
        className={className ? `modal ${className}` : 'modal'}
        role="dialog"
        aria-labelledby={titleId}
        aria-modal="true"
        aria-busy={busy || undefined}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id={titleId}>{title}</h2>
        {children}
      </div>
    </div>
  )
}
