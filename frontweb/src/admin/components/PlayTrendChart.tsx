import { useMemo, useState } from 'react'
import { formatCount, formatDate } from '../lib/format'
import type { PlayPoint } from '../lib/types'
import './PlayTrendChart.css'

type Props = {
  series: PlayPoint[]
}

const WIDTH = 1000
const HEIGHT = 200
const BASELINE = HEIGHT * 0.68
const GAP = 0.28

export function PlayTrendChart({ series }: Props) {
  const points = useMemo(() => series.filter((p) => p.installs != null || p.uninstalls != null), [series])
  const [hover, setHover] = useState<number | null>(null)

  if (points.length < 2) {
    return <div className="play-chart play-chart--empty mono">No install data yet</div>
  }

  const maxUp = Math.max(...points.map((p) => p.installs ?? 0), 1)
  const maxDown = Math.max(...points.map((p) => p.uninstalls ?? 0), 1)
  const scale = Math.max(maxUp / BASELINE, maxDown / (HEIGHT - BASELINE))
  const slot = WIDTH / points.length
  const bar = slot * (1 - GAP)
  const active = hover != null ? points[hover] : null

  return (
    <div className="play-chart" onMouseLeave={() => setHover(null)}>
      <div className="play-chart__plot">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="none" className="play-chart__svg">
          <line x1={0} x2={WIDTH} y1={BASELINE} y2={BASELINE} className="play-chart__baseline" vectorEffect="non-scaling-stroke" />
          {points.map((p, i) => {
            const x = i * slot + (slot - bar) / 2
            const up = (p.installs ?? 0) / scale
            const down = (p.uninstalls ?? 0) / scale
            return (
              <g key={p.date} className={hover === i ? 'is-hover' : ''} onMouseEnter={() => setHover(i)}>
                <rect x={i * slot} width={slot} y={0} height={HEIGHT} fill="transparent" />
                <rect x={x} width={bar} y={BASELINE - up} height={up} rx={2} className="play-chart__up" />
                <rect x={x} width={bar} y={BASELINE} height={down} rx={2} className="play-chart__down" />
              </g>
            )
          })}
        </svg>

        {active && hover != null && (
          <div className="play-chart__tooltip" style={{ left: `${((hover + 0.5) / points.length) * 100}%` }}>
            <span className="mono">{formatDate(active.date)}</span>
            <strong className="mono">+{formatCount(active.installs ?? 0)}</strong>
            <span className="play-chart__tooltip-down mono">−{formatCount(active.uninstalls ?? 0)}</span>
            {active.activeDevices != null && (
              <span className="mono">{formatCount(active.activeDevices)} active</span>
            )}
          </div>
        )}
      </div>

      <div className="play-chart__range mono">
        <span>{formatDate(points[0].date)}</span>
        <span className="play-chart__legend">
          <i className="play-chart__swatch play-chart__swatch--up" /> installs
          <i className="play-chart__swatch play-chart__swatch--down" /> uninstalls
        </span>
        <span>{formatDate(points[points.length - 1].date)}</span>
      </div>
    </div>
  )
}
