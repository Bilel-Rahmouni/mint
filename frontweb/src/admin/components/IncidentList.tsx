import { useMemo } from 'react'
import { formatDateTime, formatDuration } from '../lib/format'
import type { Check } from '../lib/types'
import './IncidentList.css'

type Props = {
  checks: Check[]
}

type Incident = {
  start: string
  end: string | null
  reason: string
}

function toIncidents(checks: Check[]): Incident[] {
  const incidents: Incident[] = []
  let current: Incident | null = null

  for (const check of checks) {
    if (!check.up && !current) {
      current = {
        start: check.checkedAt,
        end: null,
        reason: check.statusCode ? `HTTP ${check.statusCode}` : check.error || 'No response',
      }
    } else if (check.up && current) {
      current.end = check.checkedAt
      incidents.push(current)
      current = null
    }
  }
  if (current) incidents.push(current)

  return incidents.reverse()
}

export function IncidentList({ checks }: Props) {
  const incidents = useMemo(() => toIncidents(checks), [checks])

  if (!incidents.length) {
    return <p className="incidents__clear mono">0 incidents</p>
  }

  return (
    <ol className="incidents">
      {incidents.map((incident) => {
        const ongoing = incident.end == null
        const duration = new Date(incident.end ?? Date.now()).getTime() - new Date(incident.start).getTime()
        return (
          <li key={incident.start} className={`incidents__item ${ongoing ? 'is-ongoing' : ''}`}>
            <span className="incidents__reason mono">{incident.reason}</span>
            <span className="incidents__time mono">{formatDateTime(incident.start)}</span>
            <span className="incidents__duration mono">{ongoing ? 'ongoing' : formatDuration(duration)}</span>
          </li>
        )
      })}
    </ol>
  )
}
