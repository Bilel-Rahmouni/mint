import type { ReactNode } from 'react'
import './PageHeader.css'

type Props = {
  title: ReactNode
  aside?: ReactNode
  children?: ReactNode
}

export function PageHeader({ title, aside, children }: Props) {
  return (
    <header className="page-header reveal">
      <div className="page-header__main">
        <h1 className="page-header__title">{title}</h1>
        {children}
      </div>
      {aside && <div className="page-header__aside">{aside}</div>}
    </header>
  )
}
