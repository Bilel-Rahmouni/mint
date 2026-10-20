import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { useAdminDocument } from './hooks/useAdminDocument'
import { AuthProvider } from './lib/auth'
import { adminPath } from './lib/paths'
import { CampaignsPage } from './pages/CampaignsPage'
import { CareerPage } from './pages/CareerPage'
import { ContentPage } from './pages/ContentPage'
import { LaunchesPage } from './pages/LaunchesPage'
import { LoginPage } from './pages/LoginPage'
import { OverviewPage } from './pages/OverviewPage'
import { PortfolioPage } from './pages/PortfolioPage'
import { ProjectPage } from './pages/ProjectPage'
import { RankingsPage } from './pages/RankingsPage'
import './styles/theme.css'
import './styles/base.css'

export default function AdminApp() {
  useAdminDocument()

  return (
    <AuthProvider>
      <div className="admin">
        <Routes>
          <Route path="login" element={<LoginPage />} />
          <Route element={<AppShell />}>
            <Route index element={<OverviewPage />} />
            <Route path="projects/:id" element={<ProjectPage />} />
            <Route path="portfolio" element={<PortfolioPage />} />
            <Route path="campaigns" element={<CampaignsPage />} />
            <Route path="content" element={<ContentPage />} />
            <Route path="rankings" element={<RankingsPage />} />
            <Route path="launches" element={<LaunchesPage />} />
            <Route path="career" element={<CareerPage />} />
          </Route>
          <Route path="*" element={<Navigate to={adminPath.overview} replace />} />
        </Routes>
      </div>
    </AuthProvider>
  )
}
