import { Navigate, Route, Routes } from "react-router-dom"

import { GuestRoute, ProtectedRoute } from "@/components/protected-route"
import { CenteredLayout } from "@/components/layouts/centered"
import { DashboardPage } from "@/pages/dashboard-page"
import { RegisterPage } from "@/pages/register-page"
import { RequestCodePage } from "@/pages/request-code-page"
import { ReportsPage } from "@/pages/reports-page"
import { SettingsPage } from "@/pages/settings-page"
import { SimulationPage } from "@/pages/simulation-page"
import { VerifyCodePage } from "@/pages/verify-code-page"
import { WorkspacesPage } from "@/pages/workspaces/workspaces-page"
import { paths, routePatterns } from "@/routes/paths"
import "./App.css"

function App() {
  return (
    <Routes>
      <Route element={<CenteredLayout />}>
        <Route element={<GuestRoute />}>
          <Route path={paths.register} element={<RegisterPage />} />
          <Route path={paths.login} element={<RequestCodePage />} />
          <Route path={paths.verify} element={<VerifyCodePage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path={paths.workspaces} element={<WorkspacesPage />} />
        <Route path={routePatterns.dashboard} element={<DashboardPage />} />
        <Route path={paths.reports} element={<ReportsPage />} />
        <Route path={paths.simulation} element={<SimulationPage />} />
        <Route path={paths.settings} element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to={paths.workspaces} replace />} />
    </Routes>
  )
}

export default App
