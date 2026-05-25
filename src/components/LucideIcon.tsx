import type { LucideIcon as LucideIconComponent, LucideProps } from 'lucide-react'

export const ICON_SIZE = {
  xs: 14,
  sm: 16,
  md: 18,
  lg: 20,
} as const

export type IconSize = keyof typeof ICON_SIZE

interface AppIconProps extends Omit<LucideProps, 'ref'> {
  icon: LucideIconComponent
  size?: IconSize | number
}

export function AppIcon({
  icon: Icon,
  size = 'sm',
  className,
  strokeWidth = 2,
  ...props
}: AppIconProps) {
  const pixelSize = typeof size === 'number' ? size : ICON_SIZE[size]

  return (
    <Icon
      size={pixelSize}
      strokeWidth={strokeWidth}
      className={className ? `lucide-icon ${className}` : 'lucide-icon'}
      aria-hidden={props['aria-label'] ? undefined : true}
      {...props}
    />
  )
}
