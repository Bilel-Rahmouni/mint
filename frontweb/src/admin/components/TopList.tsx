import { formatCount } from '../lib/format'
import './TopList.css'

export type TopListRow = {
  key: string
  value: number
  detail?: string
}

type Props = {
  rows: TopListRow[]
  emptyLabel: string
  format?: (value: number) => string
}

export function TopList({ rows, emptyLabel, format = formatCount }: Props) {
  if (!rows.length) {
    return <p className="top-list__empty mono">{emptyLabel}</p>
  }

  const max = Math.max(...rows.map((r) => r.value), 1)

  return (
    <ol className="top-list">
      {rows.map((row, i) => (
        <li key={row.key} className="top-list__row" style={{ animationDelay: `${i * 40}ms` }}>
          <span className="top-list__bar" style={{ width: `${(row.value / max) * 100}%` }} />
          <span className="top-list__key" title={row.key}>
            {row.key}
          </span>
          {row.detail && <span className="top-list__detail mono">{row.detail}</span>}
          <span className="top-list__value mono">{format(row.value)}</span>
        </li>
      ))}
    </ol>
  )
}
