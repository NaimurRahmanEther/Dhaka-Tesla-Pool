import { Route, Routes } from 'react-router-dom'

import LandingPage from '@/pages/LandingPage'
import NotFoundPage from '@/pages/NotFoundPage'
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import PublicOnlyRoute from '@/routes/PublicOnlyRoute'

// The single source of truth for which URL renders which page. It grows one
// <Route> at a time as features land, and the auth guards arrive in the routing
// phase. Declarative <Routes> rather than createBrowserRouter, so it reads
// top-to-bottom like the route mounting in the backend's src/app.js.
//
// The login and register pages are public-only: a signed-in user visiting them
// is bounced to their own dashboard by PublicOnlyRoute. ProtectedRoute and
// RoleRoute exist but mount nothing until Phase 6 brings the dashboards.
export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicOnlyRoute>
            <RegisterPage />
          </PublicOnlyRoute>
        }
      />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}