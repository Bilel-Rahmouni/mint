import type { ReactNode } from 'react'
import { stagger } from '../lib/style'
import './Panel.css'

type Props = {
  title: string
  aside?: ReactNode
  children: ReactNode
  index?: number
  className?: string
}

export function Panel({ title, aside, children, index = 0, className = '' }: Props) {
  return (
    <section className={`panel reveal ${className}`} style={stagger(index)}>
      <header className="panel__head">
        <h2 className="panel__title">{title}</h2>
        {aside}
      </header>
      <div className="panel__body">{children}</div>
    </section>
  )
}
