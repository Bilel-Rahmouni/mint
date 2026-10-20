import { Link } from 'react-router-dom'
import {
  daysUntil,
  formatCount,
  formatDays,
  formatMs,
  formatPct,
  formatRate,
  formatRating,
  hostOf,
  relativeTime,
} from '../lib/format'
import { adminPath } from '../lib/paths'
import { CRASH_RATE_LIMIT, vitalTone } from '../lib/play'
import type { Tone } from '../lib/play'
import { DOMAIN_WARN_DAYS, isMonitored, projectStatus, SSL_WARN_DAYS, STATUS_LABEL } from '../lib/status'
import { stagger } from '../lib/style'
import type { Project } from '../lib/types'
import { Icon } from './ui/Icon'
import { Sparkline } from './ui/Sparkline'
import { StatusDot } from './ui/StatusDot'
import { Tag } from './ui/Tag'
import './ProjectTile.css'

type Props = {
  project: Project
  index: number
}

function expiryTone(days: number | null, warnAt: number) {
  if (days == null) return ''
  if (days <= 7) return 'is-danger'
  if (days <= warnAt) return 'is-warn'
  return ''
}

const vitalClass = (tone: Tone) => (tone === 'danger' ? 'is-danger' : tone === 'warn' ? 'is-warn' : '')

export function ProjectTile({ project, index }: Props) {
  const status = projectStatus(project)
  const link = project.url || project.storeUrl
  const sslDays = daysUntil(project.ssl?.validTo)
  const domainDays = daysUntil(project.domain?.expiresAt)
  const stats = project.stats24h
  const play = project.play
  const showPlay = !isMonitored(project) && Boolean(project.packageName)

  return (
    <article className={`tile tile--${status} tile--${project.type === 'app' ? 'app' : 'web'} reveal`} style={stagger(index + 3)}>
      <Link to={adminPath.project(project._id)} className="tile__cover" aria-label={project.name} />

      <header className="tile__head">
        <StatusDot status={status} />
        <h3 className="tile__name">{project.name}</h3>
        <Tag tone={project.type === 'app' ? 'app' : 'web'}>{project.type === 'app' ? 'app' : 'web'}</Tag>
      </header>

      <div className="tile__host mono">
        <Icon name={project.type === 'app' ? 'phone' : 'globe'} size={13} />
        <span>{hostOf(link) || '—'}</span>
        {link && (
          <a href={link} target="_blank" rel="noreferrer" className="tile__open" aria-label={`Open ${project.name}`}>
            <Icon name="external" size={13} />
          </a>
        )}
      </div>

      <div className="tile__chart">
        <Sparkline points={stats?.sparkline ?? []} kind={project.type === 'app' ? 'app' : 'web'} />
      </div>

      {showPlay ? (
        <dl className="tile__metrics">
          <div>
            <dt>rating</dt>
            <dd className="mono">{formatRating(play?.rating)}</dd>
          </div>
          <div>
            <dt>devices</dt>
            <dd className="mono">{formatCount(play?.activeDevices)}</dd>
          </div>
          <div>
            <dt>30d</dt>
            <dd className="mono">{play?.installs30d != null ? `+${formatCount(play.installs30d)}` : '—'}</dd>
          </div>
          <div className={vitalClass(vitalTone(play?.crashRate, CRASH_RATE_LIMIT))}>
            <dt>crash</dt>
            <dd className="mono">{formatRate(play?.crashRate)}</dd>
          </div>
        </dl>
      ) : (
        <dl className="tile__metrics">
          <div>
            <dt>uptime</dt>
            <dd className="mono">{formatPct(stats?.uptimePct)}</dd>
          </div>
          <div>
            <dt>avg</dt>
            <dd className="mono">{formatMs(stats?.avgResponseMs)}</dd>
          </div>
          <div className={expiryTone(sslDays, SSL_WARN_DAYS)}>
            <dt>ssl</dt>
            <dd className="mono">{formatDays(sslDays)}</dd>
          </div>
          <div className={expiryTone(domainDays, DOMAIN_WARN_DAYS)}>
            <dt>domain</dt>
            <dd className="mono">{formatDays(domainDays)}</dd>
          </div>
        </dl>
      )}

      <footer className="tile__foot mono">
        <span>{STATUS_LABEL[status]}</span>
        <span>{relativeTime(project.lastCheck?.checkedAt)}</span>
      </footer>
    </article>
  )
}
