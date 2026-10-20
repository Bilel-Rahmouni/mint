import type { CareerJob } from '../lib/types'
import { Tag } from './ui/Tag'

export function jobLabel(job: CareerJob) {
  if (job.role) return job.company ? `${job.role} · ${job.company}` : job.role
  const line = job.text.split('\n')[0].trim()
  try {
    return new URL(line).hostname
  } catch {
    return line.slice(0, 72)
  }
}

export function shortError(error: string) {
  const cut = error.split(' imported from ')[0].trim()
  return cut.length > 72 ? `${cut.slice(0, 69)}…` : cut
}

type Props = {
  job: CareerJob
  compact?: boolean
}

export function CareerJobRow({ job, compact = false }: Props) {
  const link = job.url || (job.text.startsWith('http') ? job.text.split('\n')[0] : '')

  return (
    <div className={`career-job ${compact ? 'career-job--compact' : ''}`}>
      <div className="career-job__main">
        <span className="career-job__role">{jobLabel(job)}</span>
      </div>
      <div className="career-job__meta">
        {job.status === 'scoring' && <Tag>Scoring</Tag>}
        {job.status === 'error' && <Tag tone="danger">{shortError(job.error || 'Failed')}</Tag>}
        {job.status === 'scored' && job.score != null && <span className="mono">{job.score}/5</span>}
        {job.verdict === 'apply' && <Tag tone="mint">Apply</Tag>}
        {job.verdict === 'skip' && <Tag>Skip</Tag>}
        {link && (
          <a className="career-job__link" href={link} target="_blank" rel="noreferrer">
            Open
          </a>
        )}
      </div>
      {!compact && job.reason && <p className="career-job__reason">{job.reason}</p>}
    </div>
  )
}
