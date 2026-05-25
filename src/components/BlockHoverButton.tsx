import type { ReactNode } from 'react'

interface BlockHoverButtonProps {
  title: string
  onClick: () => void
  isActive?: boolean
  children: ReactNode
}

export function BlockHoverButton({
  title,
  onClick,
  isActive = false,
  children,
}: BlockHoverButtonProps) {
  return (
    <button
      type="button"
      className={
        isActive ? 'block-hover-btn block-hover-btn-active' : 'block-hover-btn'
      }
      title={title}
      data-block-action
      onMouseDown={(e) => e.preventDefault()}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onClick()
      }}
    >
      {children}
    </button>
  )
}
