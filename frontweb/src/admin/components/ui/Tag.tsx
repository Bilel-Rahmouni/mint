import type { ReactNode } from 'react'
import './Tag.css'

type Props = {
  children: ReactNode
  tone?: 'neutral' | 'mint' | 'warn' | 'danger' | 'web' | 'app'
}

export function Tag({ children, tone = 'neutral' }: Props) {
  return <span className={`tag tag--${tone}`}>{children}</span>
}
