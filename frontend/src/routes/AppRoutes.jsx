import { Route, Routes } from 'react-router-dom'

import LandingPage from '@/pages/LandingPage'
import NotFoundPage from '@/pages/NotFoundPage'
import RegisterPage from '@/pages/auth/RegisterPage'

// The single source of truth for which URL renders which page. It grows one
// <Route> at a time as features land, and the auth guards arrive in the routing
// phase. Declarative <Routes> rather than createBrowserRouter, so it reads
// top-to-bottom like the route mounting in the backend's src/app.js.
export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
