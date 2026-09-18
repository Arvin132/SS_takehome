import { Navigate, Route, Routes } from 'react-router-dom'

import { AuthProvider } from './auth/AuthProvider'
import { LoginPage } from './auth/LoginPage'
import { RedirectIfAuthenticated, RequireAuth } from './auth/RequireAuth'
import { AnalyticsPage } from './features/AnalyticsPage'
import { CrewDetailPage } from './features/CrewDetailPage'
import { DashboardPage } from './features/DashboardPage'
import { PlantDetailPage } from './features/PlantDetailPage'
import { AppShell } from './layout/AppShell'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<RedirectIfAuthenticated />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>

        <Route element={<RequireAuth />}>
          <Route element={<AppShell />}>
            <Route index element={<Navigate to="/analytics" replace />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="plants" element={<DashboardPage />} />
            <Route path="plants/:plantId" element={<PlantDetailPage />} />
            <Route path="crews" element={<DashboardPage />} />
            <Route path="crews/:crewId" element={<CrewDetailPage />} />
            <Route path="assignments" element={<DashboardPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}
