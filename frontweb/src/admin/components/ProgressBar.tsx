import type { CSSProperties } from 'react'
import './ProgressBar.css'

type Props = {
  value: number
  color?: string
}

export function ProgressBar({ value, color = 'var(--color-mint)' }: Props) {
  const pct = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0))
  return (
    <span className="progress" style={{ '--bar': color } as CSSProperties}>
      <span className="progress__fill" style={{ width: `${pct * 100}%` }} />
    </span>
  )
}
