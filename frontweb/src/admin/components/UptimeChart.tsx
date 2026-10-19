import { useId, useMemo, useState } from 'react'
import { formatDateTime, formatMs } from '../lib/format'
import type { Check } from '../lib/types'
import './UptimeChart.css'

type Props = {
  checks: Check[]
}

type Bucket = {
  from: string
  avgMs: number | null
  total: number
  down: number
}

const MAX_BUCKETS = 120
const WIDTH = 1000
const HEIGHT = 200
const PAD_TOP = 14

function toBuckets(checks: Check[]): Bucket[] {
  const size = Math.max(1, Math.ceil(checks.length / MAX_BUCKETS))
  const buckets: Bucket[] = []
  for (let i = 0; i < checks.length; i += size) {
    const slice = checks.slice(i, i + size)
    const times = slice.filter((c) => c.up && c.responseTimeMs != null).map((c) => c.responseTimeMs as number)
    buckets.push({
      from: slice[0].checkedAt,
      avgMs: times.length ? times.reduce((a, b) => a + b, 0) / times.length : null,
      total: slice.length,
      down: slice.filter((c) => !c.up).length,
    })
  }
  return buckets
}

export function UptimeChart({ checks }: Props) {
  const gradientId = `uptime-${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  const buckets = useMemo(() => toBuckets(checks), [checks])
  const [hover, setHover] = useState<number | null>(null)

  if (buckets.length < 2) {
    return <div className="uptime-chart uptime-chart--empty mono">No checks in this range</div>
  }

  const max = Math.max(...buckets.map((b) => b.avgMs ?? 0), 100)
  const step = WIDTH / (buckets.length - 1)
  const y = (ms: number) => PAD_TOP + (1 - ms / max) * (HEIGHT - PAD_TOP)

  const line = buckets
    .map((b, i) => `${i ? 'L' : 'M'}${(i * step).toFixed(1)},${y(b.avgMs ?? 0).toFixed(1)}`)
    .join(' ')
  const area = `${line} L${WIDTH},${HEIGHT} L0,${HEIGHT} Z`
  const active = hover != null ? buckets[hover] : null

  return (
    <div className="uptime-chart" onMouseLeave={() => setHover(null)}>
      <div className="uptime-chart__plot">
        <span className="uptime-chart__axis mono">{formatMs(max)}</span>
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="none" className="uptime-chart__svg">
          <defs>
            <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--color-mint)" stopOpacity="0.32" />
              <stop offset="100%" stopColor="var(--color-mint)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75].map((f) => (
            <line key={f} x1={0} x2={WIDTH} y1={HEIGHT * f} y2={HEIGHT * f} className="uptime-chart__grid" vectorEffect="non-scaling-stroke" />
          ))}
          {buckets.map((b, i) =>
            b.down ? (
              <rect
                key={`d${i}`}
                x={i * step - step / 2}
                width={step}
                y={0}
                height={HEIGHT}
                className="uptime-chart__outage"
                opacity={Math.min(1, 0.25 + b.down / b.total)}
              />
            ) : null,
          )}
          <path d={area} fill={`url(#${gradientId})`} />
          <path d={line} className="uptime-chart__line" vectorEffect="non-scaling-stroke" />
          {hover != null && (
            <line x1={hover * step} x2={hover * step} y1={0} y2={HEIGHT} className="uptime-chart__cursor" vectorEffect="non-scaling-stroke" />
          )}
          {buckets.map((_, i) => (
            <rect
              key={`h${i}`}
              x={i * step - step / 2}
              width={step}
              y={0}
              height={HEIGHT}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
            />
          ))}
        </svg>

        {active && hover != null && (
          <div
            className="uptime-chart__tooltip"
            style={{ left: `${(hover / (buckets.length - 1)) * 100}%` }}
          >
            <span className="mono">{formatDateTime(active.from)}</span>
            <strong className="mono">{formatMs(active.avgMs)}</strong>
            {active.down > 0 && <span className="uptime-chart__tooltip-down mono">{active.down} failed</span>}
          </div>
        )}
      </div>

      <div className="uptime-chart__strip">
        {buckets.map((b, i) => (
          <span
            key={i}
            className={`uptime-chart__tick ${b.down ? 'is-down' : ''} ${hover === i ? 'is-hover' : ''}`}
            onMouseEnter={() => setHover(i)}
          />
        ))}
      </div>

      <div className="uptime-chart__range mono">
        <span>{formatDateTime(buckets[0].from)}</span>
        <span>{formatDateTime(buckets[buckets.length - 1].from)}</span>
      </div>
    </div>
  )
}
