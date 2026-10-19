import type { ReactNode } from 'react'
import { stagger } from '../lib/style'
import './StatCard.css'

type Props = {
  label: string
  value: ReactNode
  detail?: ReactNode
  tone?: 'default' | 'mint' | 'warn' | 'danger'
  index?: number
}

export function StatCard({ label, value, detail, tone = 'default', index = 0 }: Props) {
  return (
    <div className={`stat stat--${tone} reveal`} style={stagger(index)}>
      <span className="stat__label">{label}</span>
      <span className="stat__value mono">{value}</span>
      {detail && <span className="stat__detail">{detail}</span>}
    </div>
  )
}
