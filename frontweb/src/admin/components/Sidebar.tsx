import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { adminPath } from '../lib/paths'
import { AlertBell } from './AlertBell'
import { Icon } from './ui/Icon'
import type { IconName } from './ui/Icon'
import { ConsoleLogo } from './ConsoleLogo'
import { SidebarToggle } from './SidebarToggle'
import './Sidebar.css'

const STORAGE_KEY = 'mint-admin-sidebar'

const NAV: { to: string; label: string; icon: IconName }[] = [
  { to: adminPath.overview, label: 'Overview', icon: 'grid' },
  { to: adminPath.portfolio, label: 'Portfolio', icon: 'layers' },
  { to: adminPath.campaigns, label: 'Campaigns', icon: 'megaphone' },
  { to: adminPath.content, label: 'Content', icon: 'calendar' },
  { to: adminPath.rankings, label: 'Rankings', icon: 'trending' },
  { to: adminPath.launches, label: 'Launches', icon: 'rocket' },
  { to: adminPath.career, label: 'Career', icon: 'briefcase' },
]

export function Sidebar() {
  const { user, logout } = useAuth()
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(STORAGE_KEY) === 'collapsed')

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, collapsed ? 'collapsed' : 'open')
  }, [collapsed])

  return (
    <aside className={`sidebar ${collapsed ? 'is-collapsed' : ''}`}>
      <div className="sidebar__brand">
        <ConsoleLogo />
        <AlertBell />
        <SidebarToggle collapsed={collapsed} onClick={() => setCollapsed((open) => !open)} />
      </div>

      <nav className="sidebar__nav">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === adminPath.overview}
            aria-label={item.label}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) => `sidebar__link ${isActive ? 'is-active' : ''}`}
          >
            <Icon name={item.icon} size={17} />
            <span>{item.label}</span>
          </NavLink>
        ))}
        <a href="/" target="_blank" rel="noreferrer" className="sidebar__link" aria-label="mintstudio.io" title={collapsed ? 'mintstudio.io' : undefined}>
          <Icon name="external" size={17} />
          <span>mintstudio.io</span>
        </a>
      </nav>

      {user && (
        <div className="sidebar__user">
          <span className="sidebar__avatar">{user.name.slice(0, 1).toUpperCase()}</span>
          <span className="sidebar__identity">
            <span className="sidebar__name">{user.name}</span>
            <span className="sidebar__email mono">{user.email}</span>
          </span>
          <button type="button" className="sidebar__logout" onClick={logout} aria-label="Log out">
            <Icon name="logout" size={16} />
          </button>
        </div>
      )}
    </aside>
  )
}
