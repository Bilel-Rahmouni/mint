import { Icon } from './ui/Icon'
import './SidebarToggle.css'

type Props = {
  collapsed: boolean
  onClick: () => void
}

export function SidebarToggle({ collapsed, onClick }: Props) {
  return (
    <button
      type="button"
      className={`sidebar-toggle ${collapsed ? 'is-collapsed' : ''}`}
      onClick={onClick}
      aria-expanded={!collapsed}
      aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
    >
      <Icon name="back" size={16} />
    </button>
  )
}
