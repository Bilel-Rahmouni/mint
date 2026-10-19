import type { CSSProperties } from 'react'
import { daysBetween, daysFromToday } from '../lib/dates'
import { formatDate } from '../lib/format'
import { adChannels, launchColor } from '../lib/growth'
import type { Launch, Project } from '../lib/types'
import { ProgressBar } from './ProgressBar'
import './LaunchCard.css'

type Props = {
  launch: Launch
  project?: Project
  index?: number
  onClick: () => void
}

function countdown(date: string) {
  const days = daysBetween(daysFromToday(0), date)
  if (days === 0) return 'Today'
  if (days > 0) return `in ${days}d`
  return `${Math.abs(days)}d ago`
}

export function LaunchCard({ launch, project, index = 0, onClick }: Props) {
  const color = launchColor[launch.stage]
  const total = launch.tasksTotal || 0

  return (
    <button
      type="button"
      className="launch-card"
      style={{ '--launch-color': color, '--i': index } as CSSProperties}
      onClick={onClick}
    >
      {project && <span className="launch-card__product">{project.name}</span>}
      <h3 className="launch-card__title">{launch.title}</h3>
      <div className="launch-card__when">
        <span>{formatDate(launch.date)}</span>
        <b>{countdown(launch.date)}</b>
      </div>
      {total > 0 && (
        <div className="launch-card__progress">
          <ProgressBar value={launch.tasksDone / total} color={color} />
          <span>
            {launch.tasksDone}/{total}
          </span>
        </div>
      )}
      {launch.channels.length > 0 && (
        <div className="launch-card__channels">
          {launch.channels.map((channel) => (
            <span
              key={channel}
              className="launch-card__channel"
              style={{ '--chip': adChannels[channel].color } as CSSProperties}
            >
              {adChannels[channel].label}
            </span>
          ))}
        </div>
      )}
    </button>
  )
}
