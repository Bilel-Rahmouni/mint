import { useMemo, useState } from 'react'
import { formatDate, formatMoney } from '../lib/format'
import type { RevenuePoint } from '../lib/types'
import './RevenueChart.css'

type Props = {
  series: RevenuePoint[]
  currency?: string
}

const DAY_MS = 24 * 60 * 60 * 1000

const totalOf = (p: RevenuePoint) => (p.admob ?? 0) + (p.adsense ?? 0)

// Days without earnings are missing from the reports, the chart needs them as empty bars
function fillDays(series: RevenuePoint[]): RevenuePoint[] {
  if (series.length < 2) return series
  const byDate = new Map(series.map((p) => [p.date, p]))
  const start = Date.parse(`${series[0].date}T00:00:00Z`)
  const end = Date.parse(`${series[series.length - 1].date}T00:00:00Z`)
  const days: RevenuePoint[] = []
  for (let t = start; t <= end; t += DAY_MS) {
    const date = new Date(t).toISOString().slice(0, 10)
    days.push(byDate.get(date) ?? { date, admob: 0, adsense: 0 })
  }
  return days
}

export function RevenueChart({ series, currency }: Props) {
  const [hover, setHover] = useState<number | null>(null)
  const days = useMemo(() => fillDays(series), [series])

  if (!days.some((p) => totalOf(p) > 0)) {
    return <div className="revenue-chart revenue-chart--empty mono">No earnings yet</div>
  }

  const max = Math.max(...days.map(totalOf))
  const active = hover != null ? days[hover] : null

  return (
    <div className="revenue-chart" onMouseLeave={() => setHover(null)}>
      <div className="revenue-chart__plot">
        {days.map((p, i) => (
          <div
            key={p.date}
            className={`revenue-chart__col${hover === i ? ' revenue-chart__col--active' : ''}`}
            style={{ animationDelay: `${i * 8}ms` }}
            onMouseEnter={() => setHover(i)}
          >
            <span className="revenue-chart__bar revenue-chart__bar--adsense" style={{ height: `${((p.adsense ?? 0) / max) * 100}%` }} />
            <span className="revenue-chart__bar revenue-chart__bar--admob" style={{ height: `${((p.admob ?? 0) / max) * 100}%` }} />
          </div>
        ))}

        {active && hover != null && (
          <div className="revenue-chart__tooltip" style={{ left: `${((hover + 0.5) / days.length) * 100}%` }}>
            <span className="mono">{formatDate(active.date)}</span>
            <strong className="mono">{formatMoney(totalOf(active), currency)}</strong>
            <span className="revenue-chart__split mono">
              <i className="revenue-chart__swatch revenue-chart__swatch--admob" />
              {formatMoney(active.admob ?? 0, currency)}
            </span>
            <span className="revenue-chart__split mono">
              <i className="revenue-chart__swatch revenue-chart__swatch--adsense" />
              {formatMoney(active.adsense ?? 0, currency)}
            </span>
          </div>
        )}
      </div>

      <div className="revenue-chart__foot mono">
        <span>{formatDate(days[0].date)}</span>
        <span className="revenue-chart__legend">
          <span>
            <i className="revenue-chart__swatch revenue-chart__swatch--admob" />
            AdMob
          </span>
          <span>
            <i className="revenue-chart__swatch revenue-chart__swatch--adsense" />
            AdSense
          </span>
        </span>
        <span>{formatDate(days[days.length - 1].date)}</span>
      </div>
    </div>
  )
}
