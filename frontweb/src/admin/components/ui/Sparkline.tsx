import { useId } from 'react'
import type { SparkPoint } from '../../lib/types'
import './Sparkline.css'

type Props = {
  points: SparkPoint[]
  height?: number
}

const WIDTH = 200

export function Sparkline({ points, height = 44 }: Props) {
  const gradientId = `spark-${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  const values = points.map((p) => p.t ?? 0)

  if (points.length < 2) {
    return <div className="sparkline sparkline--empty" style={{ height }} />
  }

  const max = Math.max(...values, 1)
  const min = Math.min(...values)
  const span = Math.max(max - min, 1)
  const step = WIDTH / (points.length - 1)
  const pad = 4

  const coords = points.map((p, i) => ({
    x: i * step,
    y: pad + (1 - ((p.t ?? max) - min) / span) * (height - pad * 2),
    up: p.up,
  }))

  const line = coords.map((c, i) => `${i ? 'L' : 'M'}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ')
  const area = `${line} L${WIDTH},${height} L0,${height} Z`

  return (
    <svg className="sparkline" viewBox={`0 0 ${WIDTH} ${height}`} preserveAspectRatio="none" style={{ height }}>
      <defs>
        <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--color-mint)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--color-mint)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradientId})`} />
      <path d={line} className="sparkline__line" vectorEffect="non-scaling-stroke" />
      {coords
        .filter((c) => !c.up)
        .map((c) => (
          <line key={c.x} x1={c.x} x2={c.x} y1={0} y2={height} className="sparkline__down" vectorEffect="non-scaling-stroke" />
        ))}
    </svg>
  )
}
