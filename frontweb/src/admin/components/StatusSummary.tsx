import { Link } from 'react-router-dom'
import { adminPath } from '../lib/paths'
import { projectStatus, STATUS_LABEL } from '../lib/status'
import { stagger } from '../lib/style'
import type { Project } from '../lib/types'
import './StatusSummary.css'

type Props = {
  projects: Project[]
}

export function StatusSummary({ projects }: Props) {
  const statuses = projects.map((p) => ({ project: p, status: projectStatus(p) }))
  const monitored = statuses.filter((s) => s.status !== 'idle')
  const healthy = monitored.filter((s) => s.status === 'up' || s.status === 'warning').length
  const down = monitored.filter((s) => s.status === 'down').length

  return (
    <section className={`summary reveal ${down ? 'summary--alert' : ''}`} style={stagger(1)}>
      <div className="summary__figure">
        <span className="summary__count mono">{healthy}</span>
        <span className="summary__total mono">/{monitored.length}</span>
        <span className="summary__label">{down ? `${down} down` : 'online'}</span>
      </div>

      <div className="summary__bar" role="list">
        {statuses.map(({ project, status }) => (
          <Link
            key={project._id}
            to={adminPath.project(project._id)}
            role="listitem"
            className={`summary__segment summary__segment--${status}`}
            title={`${project.name} · ${STATUS_LABEL[status]}`}
          />
        ))}
      </div>
    </section>
  )
}
