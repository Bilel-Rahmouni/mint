import type { CareerQueueJob } from '../lib/types'
import './CareerQueue.css'

type Props = {
  jobs: CareerQueueJob[]
}

export function CareerQueue({ jobs }: Props) {
  if (jobs.length === 0) return null

  return (
    <ul className="career-queue">
      {jobs.map((job) => (
        <li key={`${job.company}-${job.role}`} className="career-queue__job">
          <div className="career-queue__main">
            <a className="career-queue__role" href={job.apply} target="_blank" rel="noreferrer">
              {job.role}
            </a>
            <span className="career-queue__meta">
              {job.company}
              {job.city ? ` · ${job.city}` : ''}
            </span>
          </div>
          {job.note && <p className="career-queue__note">{job.note}</p>}
        </li>
      ))}
    </ul>
  )
}
