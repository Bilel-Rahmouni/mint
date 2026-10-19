import { Link } from 'react-router-dom'
import { adminPath } from '../lib/paths'
import type { Alert } from '../lib/status'
import { stagger } from '../lib/style'
import './AlertStrip.css'

type Props = {
  alerts: Alert[]
}

export function AlertStrip({ alerts }: Props) {
  if (!alerts.length) return null

  return (
    <ul className="alerts reveal" style={stagger(2)}>
      {alerts.map((alert) => (
        <li key={alert.id}>
          <Link to={adminPath.project(alert.projectId)} className={`alerts__item alerts__item--${alert.level}`}>
            <span className="alerts__project">{alert.project}</span>
            <span className="alerts__message mono">{alert.message}</span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
