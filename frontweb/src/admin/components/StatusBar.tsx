import { Link } from 'react-router-dom'
import { adminPath } from '../lib/paths'
import { projectStatus, STATUS_LABEL } from '../lib/status'
import { stagger } from '../lib/style'
import type { Project } from '../lib/types'
import './StatusBar.css'
import './StatusChips.css'
import './StatusArea.css'

type Props = {
  projects: Project[]
}

const CHIP = 56
const GAP = 10
const CHIP_MIN = 148

export function StatusBar({ projects }: Props) {
  const statuses = projects.map((p) => ({ project: p, status: projectStatus(p) }))
  const monitored = statuses.filter((s) => s.status !== 'idle' && s.status !== 'parked')
  const healthy = monitored.filter((s) => s.status === 'up' || s.status === 'warning').length
  const down = monitored.filter((s) => s.status === 'down').length
  const rows = Math.max(3, Math.ceil(statuses.length / 5))
  const barMinHeight = rows * CHIP + Math.max(0, rows - 1) * GAP

  return (
    <section
      className={`summary reveal ${down ? 'summary--alert' : ''}`}
      style={{ ...stagger(1), overflow: 'visible', height: 'auto' }}
    >
      <div className="summary__figure">
        <span className="summary__count mono">{healthy}</span>
        <span className="summary__total mono">/{monitored.length}</span>
        <span className="summary__label">{down ? `${down} down` : 'online'}</span>
      </div>

      <div
        className="summary__bar"
        role="list"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignContent: 'flex-start',
          gap: GAP,
          height: 'auto',
          minHeight: barMinHeight,
          overflow: 'visible',
        }}
      >
        {statuses.map(({ project, status }) => (
          <Link
            key={project._id}
            to={adminPath.project(project._id)}
            role="listitem"
            className={`summary__segment summary__segment--${status}`}
            title={`${project.name} · ${STATUS_LABEL[status]}`}
            style={{
              height: CHIP,
              minHeight: CHIP,
              minWidth: CHIP_MIN,
              maxWidth: 'none',
              flex: `1 1 ${CHIP_MIN}px`,
            }}
          >
            <span className="summary__name">{project.name}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
