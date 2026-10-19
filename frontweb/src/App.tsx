import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { isParkedHost } from './lib/parkedHosts'
import { HomePage } from './pages/HomePage'
import { ParkedPage } from './pages/ParkedPage'
import { PrivacyPage } from './pages/PrivacyPage'

const AdminApp = lazy(() => import('./admin/AdminApp'))

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

export default App
