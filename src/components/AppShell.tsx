import type { ReactNode } from 'react'

interface AppShellProps {
  title: string
  subtitle?: string
  headerActions?: ReactNode
  toolbar?: ReactNode
  metaBar?: ReactNode
  sidebar?: ReactNode
  children: ReactNode
}

export function AppShell({
  title,
  subtitle,
  headerActions,
  toolbar,
  metaBar,
  sidebar,
  children,
}: AppShellProps) {
  return (
    <div className="redacta-app">
      <div className="redacta-sticky-chrome">
        <header className="redacta-header">
          <div className="redacta-brand" aria-label="REDACTA">
            <span className="redacta-brand-mark" aria-hidden="true">
              R
            </span>
            <span className="redacta-brand-name">REDACTA</span>
          </div>

          <div className="redacta-header-meta">
            <h1 className="redacta-doc-title">{title}</h1>
            {subtitle && <p className="redacta-doc-subtitle">{subtitle}</p>}
          </div>

          {headerActions && (
            <div className="redacta-header-actions">{headerActions}</div>
          )}
        </header>

        {toolbar && <div className="redacta-toolbar-band">{toolbar}</div>}

        {metaBar && <div className="redacta-meta-bar">{metaBar}</div>}
      </div>

      <div className="redacta-workspace">
        <div className="redacta-main">{children}</div>
        {sidebar}
      </div>
    </div>
  )
}
