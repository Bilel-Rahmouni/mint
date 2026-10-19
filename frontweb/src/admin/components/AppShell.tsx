import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { adminPath } from '../lib/paths'
import { Sidebar } from './Sidebar'
import { Loader } from './Loader'
import './AppShell.css'

export function AppShell() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <Loader fullscreen />
  if (!user) return <Navigate to={adminPath.login} replace state={{ from: location.pathname }} />

  return (
    <div className="shell">
      <Sidebar />
      <main className="shell__main">
        <Outlet />
      </main>
    </div>
  )
}
