import { useMemo, useState } from 'react'
import { formatCount, formatDate } from '../lib/format'
import type { WebPoint } from '../lib/types'
import './WebTrendChart.css'

export type WebMetric = 'users' | 'views' | 'clicks' | 'impressions'

export const WEB_METRICS: { value: WebMetric; label: string }[] = [
  { value: 'users', label: 'Visitors' },
  { value: 'views', label: 'Views' },
  { value: 'clicks', label: 'Clicks' },
  { value: 'impressions', label: 'Impressions' },
]

type Props = {
  series: WebPoint[]
  metric: WebMetric
}

const WIDTH = 1000
const HEIGHT = 200
const PAD_TOP = 12

export function WebTrendChart({ series, metric }: Props) {
  const [hover, setHover] = useState<number | null>(null)
  const points = useMemo(() => series.filter((p) => p[metric] != null), [series, metric])
  const label = WEB_METRICS.find((m) => m.value === metric)?.label.toLowerCase()

  if (points.length < 2) {
    return <div className="web-chart web-chart--empty mono">No {label} data yet</div>
  }

  const max = Math.max(...points.map((p) => p[metric] ?? 0), 1)
  const step = WIDTH / (points.length - 1)
  const coords = points.map((p, i) => [i * step, HEIGHT - ((p[metric] ?? 0) / max) * (HEIGHT - PAD_TOP)] as const)
  const line = coords.map(([x, y], i) => `${i ? 'L' : 'M'}${x},${y}`).join(' ')
  const area = `${line} L${WIDTH},${HEIGHT} L0,${HEIGHT} Z`
  const active = hover != null ? points[hover] : null
  const activeCoord = hover != null ? coords[hover] : null

  return (
    <div className="web-chart" onMouseLeave={() => setHover(null)}>
      <div className="web-chart__plot" key={metric}>
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="none" className="web-chart__svg">
          <defs>
            <linearGradient id="web-chart-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" className="web-chart__stop-top" />
              <stop offset="100%" className="web-chart__stop-bottom" />
            </linearGradient>
          </defs>
          <path d={area} fill="url(#web-chart-fill)" />
          <path d={line} className="web-chart__line" vectorEffect="non-scaling-stroke" />
          {activeCoord && (
            <line
              x1={activeCoord[0]}
              x2={activeCoord[0]}
              y1={0}
              y2={HEIGHT}
              className="web-chart__cursor"
              vectorEffect="non-scaling-stroke"
            />
          )}
          {points.map((p, i) => (
            <rect
              key={p.date}
              x={i * step - step / 2}
              width={step}
              y={0}
              height={HEIGHT}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
            />
          ))}
        </svg>

        {active && activeCoord && (
          <>
            <span
              className="web-chart__dot"
              style={{ left: `${(activeCoord[0] / WIDTH) * 100}%`, top: `${(activeCoord[1] / HEIGHT) * 100}%` }}
            />
            <div className="web-chart__tooltip" style={{ left: `${(activeCoord[0] / WIDTH) * 100}%` }}>
              <span className="mono">{formatDate(active.date)}</span>
              <strong className="mono">{formatCount(active[metric])}</strong>
              <span className="mono">{label}</span>
            </div>
          </>
        )}
      </div>

      <div className="web-chart__range mono">
        <span>{formatDate(points[0].date)}</span>
        <span>{formatDate(points[points.length - 1].date)}</span>
      </div>
    </div>
  )
}
