import { formatDate, hostOf } from '../lib/format'
import type { Project } from '../lib/types'
import { Icon } from './ui/Icon'
import { Tag } from './ui/Tag'
import './ProjectInfo.css'

type Props = {
  project: Project
}

function ExternalValue({ href }: { href?: string }) {
  if (!href) return <span className="project-info__empty">—</span>
  return (
    <a href={href} target="_blank" rel="noreferrer" className="project-info__link mono">
      {hostOf(href)}
      <Icon name="external" size={12} />
    </a>
  )
}

export function ProjectInfo({ project }: Props) {
  const rows = [
    { label: 'Client', value: project.client || <span className="project-info__empty">—</span> },
    { label: 'Hosting', value: project.hosting || <span className="project-info__empty">—</span> },
    {
      label: 'Stack',
      value: project.stack.length ? (
        <span className="project-info__tags">
          {project.stack.map((s) => (
            <Tag key={s}>{s}</Tag>
          ))}
        </span>
      ) : (
        <span className="project-info__empty">—</span>
      ),
    },
    { label: 'Repository', value: <ExternalValue href={project.repoUrl} /> },
    ...(project.type === 'app' || project.storeUrl
      ? [{ label: 'Store', value: <ExternalValue href={project.storeUrl} /> }]
      : []),
    ...(project.packageName
      ? [{ label: 'Package', value: <span className="mono">{project.packageName}</span> }]
      : []),
    { label: 'Registrar', value: project.domain?.registrar || <span className="project-info__empty">—</span> },
    { label: 'SSL issuer', value: project.ssl?.issuer || <span className="project-info__empty">—</span> },
    {
      label: 'Portfolio',
      value: project.showOnSite ? <Tag tone="mint">visible</Tag> : <Tag>hidden</Tag>,
    },
    { label: 'Added', value: <span className="mono">{formatDate(project.createdAt)}</span> },
  ]

  return (
    <section className="project-info">
      <dl className="project-info__list">
        {rows.map((row) => (
          <div key={row.label} className="project-info__row">
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
      {project.notes && <p className="project-info__notes">{project.notes}</p>}
    </section>
  )
}
