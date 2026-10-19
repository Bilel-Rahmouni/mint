import type { ReactNode } from 'react'
import './LegalSection.css'

type Props = {
  title: string
  children: ReactNode
}

export function LegalSection({ title, children }: Props) {
  return (
    <section className="legal-section">
      <h2 className="legal-section__title">{title}</h2>
      <div className="legal-section__body">{children}</div>
    </section>
  )
}
