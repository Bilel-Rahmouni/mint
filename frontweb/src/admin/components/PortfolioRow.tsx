import { Link } from 'react-router-dom'
import { hostOf } from '../lib/format'
import { adminPath } from '../lib/paths'
import { projectStatus } from '../lib/status'
import { stagger } from '../lib/style'
import type { Project } from '../lib/types'
import { Button } from './ui/Button'
import { StatusDot } from './ui/StatusDot'
import { Tag } from './ui/Tag'
import { Toggle } from './ui/Toggle'
import './PortfolioRow.css'

type Props = {
  project: Project
  position: number
  isFirst: boolean
  isLast: boolean
  onMove: (direction: -1 | 1) => void
  onToggleVisible: (visible: boolean) => void
}

export function PortfolioRow({ project, position, isFirst, isLast, onMove, onToggleVisible }: Props) {
  const href = project.url || project.storeUrl

  return (
    <li className={`portfolio-row reveal ${project.showOnSite ? '' : 'is-hidden'}`} style={stagger(position + 1)}>
      <span className="portfolio-row__index mono">{String(position + 1).padStart(2, '0')}</span>

      <div className="portfolio-row__main">
        <Link to={adminPath.project(project._id)} className="portfolio-row__name">
          <StatusDot status={projectStatus(project)} size="sm" />
          {project.name}
        </Link>
        <span className="portfolio-row__host mono">{hostOf(href) || '—'}</span>
      </div>

      <Tag>{project.type === 'app' ? 'app' : 'web'}</Tag>

      <Toggle
        checked={project.showOnSite}
        onChange={onToggleVisible}
        disabled={!href}
        ariaLabel={`Show ${project.name} on mintstudio.io`}
      />

      <div className="portfolio-row__order">
        <Button size="sm" variant="subtle" icon="up" aria-label="Move up" disabled={isFirst} onClick={() => onMove(-1)} />
        <Button size="sm" variant="subtle" icon="down" aria-label="Move down" disabled={isLast} onClick={() => onMove(1)} />
      </div>
    </li>
  )
}
