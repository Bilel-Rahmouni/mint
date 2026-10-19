import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { isParkedHost } from './lib/parkedHosts'
import { HomePage } from './pages/HomePage'
import { ParkedPage } from './pages/ParkedPage'
import { PrivacyPage } from './pages/PrivacyPage'
import './index.css'

const AdminApp = lazy(() => import('./admin/AdminNow'))

function RootPage() {
  return isParkedHost() ? <ParkedPage /> : <HomePage />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootPage />} />
        <Route path="/available" element={<ParkedPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route
          path="/admin/*"
          element={
            <Suspense fallback={null}>
              <AdminApp />
            </Suspense>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
