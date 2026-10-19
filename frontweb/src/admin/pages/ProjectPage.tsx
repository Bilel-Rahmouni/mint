import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { DeleteProjectModal } from '../components/DeleteProjectModal'
import { IncidentList } from '../components/IncidentList'
import { Loader } from '../components/Loader'
import { PageHeader } from '../components/PageHeader'
import { Panel } from '../components/Panel'
import { PlaySection } from '../components/PlaySection'
import { RevenueSection } from '../components/RevenueSection'
import { WebSection } from '../components/WebSection'
import { ProjectFormModal } from '../components/ProjectFormModal'
import { ProjectInfo } from '../components/ProjectInfo'
import { StatCard } from '../components/StatCard'
import { UptimeChart } from '../components/UptimeChart'
import { Button } from '../components/ui/Button'
import { Icon } from '../components/ui/Icon'
import { Segmented } from '../components/ui/Segmented'
import { StatusDot } from '../components/ui/StatusDot'
import { Tag } from '../components/ui/Tag'
import { useProject } from '../hooks/useProject'
import { api } from '../lib/api'
import { daysUntil, formatDate, formatDays, formatMs, formatPct, hostOf, relativeTime } from '../lib/format'
import { adminPath } from '../lib/paths'
import { DOMAIN_WARN_DAYS, isMonitored, projectStatus, SSL_WARN_DAYS, STATUS_LABEL } from '../lib/status'
import type { Range } from '../lib/types'
import './ProjectPage.css'

const RANGE_OPTIONS: { value: Range; label: string }[] = [
  { value: '24h', label: '24h' },
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' },
]

type Tone = 'default' | 'mint' | 'warn' | 'danger'

function expiryTone(days: number | null, warnAt: number): Tone {
  if (days == null) return 'default'
  if (days <= 7) return 'danger'
  if (days <= warnAt) return 'warn'
  return 'mint'
}

function uptimeTone(pct: number | null): Tone {
  if (pct == null) return 'default'
  if (pct >= 99.5) return 'mint'
  if (pct >= 97) return 'warn'
  return 'danger'
}

export function ProjectPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [range, setRange] = useState<Range>('24h')
  const { data, loading, error, reload } = useProject(id, range)
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [checking, setChecking] = useState(false)
  const [checkError, setCheckError] = useState<string | null>(null)

  if (loading && !data) return <Loader />
  if (error && !data) {
    return (
      <div className="project-page__missing">
        <p>{error}</p>
        <Link to={adminPath.overview} className="project-page__back">
          <Icon name="back" size={14} /> Overview
        </Link>
      </div>
    )
  }
  if (!data) return null

  const { project, checks, stats } = data
  const status = projectStatus(project)
  const link = project.url || project.storeUrl
  const sslDays = daysUntil(project.ssl?.validTo)
  const domainDays = daysUntil(project.domain?.expiresAt)

  const runCheck = async () => {
    setChecking(true)
    setCheckError(null)
    try {
      await api.checkProject(project._id)
      await reload()
    } catch (err) {
      setCheckError(err instanceof Error ? err.message : 'Check failed')
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="project-page">
      <Link to={adminPath.overview} className="project-page__back reveal">
        <Icon name="back" size={14} /> Overview
      </Link>

      <PageHeader
        title={project.name}
        aside={
          <>
            {project.url && (
              <Button icon="refresh" loading={checking} onClick={runCheck}>
                Check now
              </Button>
            )}
            <Button icon="edit" onClick={() => setEditing(true)}>
              Edit
            </Button>
            <Button variant="subtle" icon="trash" aria-label="Delete project" onClick={() => setDeleting(true)} />
          </>
        }
      >
        <div className="project-page__meta">
          <span className={`project-page__status project-page__status--${status}`}>
            <StatusDot status={status} size="sm" />
            {STATUS_LABEL[status]}
          </span>
          <Tag>{project.type === 'app' ? 'app' : 'web'}</Tag>
          {link && (
            <a href={link} target="_blank" rel="noreferrer" className="project-page__link mono">
              {hostOf(link)}
              <Icon name="external" size={12} />
            </a>
          )}
          {project.lastCheck && (
            <span className="project-page__checked mono">
              {project.lastCheck.statusCode ? `HTTP ${project.lastCheck.statusCode} · ` : ''}
              {relativeTime(project.lastCheck.checkedAt)}
            </span>
          )}
        </div>
      </PageHeader>

      {checkError && <p className="project-page__error">{checkError}</p>}

      {isMonitored(project) && (
        <div className="project-page__stats">
          <StatCard index={1} label="Uptime 24h" value={formatPct(stats['24h'].uptimePct)} tone={uptimeTone(stats['24h'].uptimePct)} />
          <StatCard index={2} label="Uptime 7d" value={formatPct(stats['7d'].uptimePct)} tone={uptimeTone(stats['7d'].uptimePct)} />
          <StatCard index={3} label="Uptime 30d" value={formatPct(stats['30d'].uptimePct)} tone={uptimeTone(stats['30d'].uptimePct)} />
          <StatCard index={4} label="Avg response" value={formatMs(stats['24h'].avgResponseMs)} detail="last 24h" />
          <StatCard
            index={5}
            label="SSL"
            value={formatDays(sslDays)}
            detail={project.ssl?.error ?? formatDate(project.ssl?.validTo)}
            tone={project.ssl?.error ? 'danger' : expiryTone(sslDays, SSL_WARN_DAYS)}
          />
          <StatCard
            index={6}
            label="Domain"
            value={formatDays(domainDays)}
            detail={project.domain?.expiresAt ? formatDate(project.domain.expiresAt) : project.domain?.name}
            tone={expiryTone(domainDays, DOMAIN_WARN_DAYS)}
          />
        </div>
      )}

      <div className="project-page__layout">
        {isMonitored(project) && (
          <Panel
            title="Response time"
            index={7}
            className="project-page__chart"
            aside={<Segmented ariaLabel="Range" value={range} options={RANGE_OPTIONS} onChange={setRange} />}
          >
            <UptimeChart checks={checks} />
          </Panel>
        )}

        <Panel title="Details" index={8} className="project-page__details">
          <ProjectInfo project={project} />
        </Panel>

        {isMonitored(project) && (
          <Panel title={`Incidents · ${range}`} index={9} className="project-page__incidents">
            <IncidentList checks={checks} />
          </Panel>
        )}
      </div>

      {project.revenue?.syncedAt && <RevenueSection project={project} onSynced={reload} index={10} />}
      {project.url && <WebSection project={project} onSynced={reload} index={10} />}
      {project.packageName && <PlaySection project={project} onSynced={reload} index={project.url ? 21 : 10} />}

      {editing && (
        <ProjectFormModal
          project={project}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false)
            reload()
          }}
        />
      )}

      {deleting && (
        <DeleteProjectModal
          project={project}
          onClose={() => setDeleting(false)}
          onDeleted={() => navigate(adminPath.overview, { replace: true })}
        />
      )}
    </div>
  )
}
