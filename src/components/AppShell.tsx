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
    <div className="reacta-app">
      <div className="reacta-sticky-chrome">
        <header className="reacta-header">
          <div className="reacta-brand" aria-label="REACTA">
            <span className="reacta-brand-mark" aria-hidden="true">
              R
            </span>
            <span className="reacta-brand-name">REACTA</span>
          </div>

          <div className="reacta-header-meta">
            <h1 className="reacta-doc-title">{title}</h1>
            {subtitle && <p className="reacta-doc-subtitle">{subtitle}</p>}
          </div>

          {headerActions && (
            <div className="reacta-header-actions">{headerActions}</div>
          )}
        </header>

        {toolbar && <div className="reacta-toolbar-band">{toolbar}</div>}

        {metaBar && <div className="reacta-meta-bar">{metaBar}</div>}
      </div>

      <div className="reacta-workspace">
        <div className="reacta-main">{children}</div>
        {sidebar}
      </div>
    </div>
  )
}
