import type { Status } from '../../lib/status'
import './StatusDot.css'

type Props = {
  status: Status
  size?: 'sm' | 'md'
}

export function StatusDot({ status, size = 'md' }: Props) {
  return <span className={`status-dot status-dot--${status} status-dot--${size}`} aria-hidden="true" />
}
