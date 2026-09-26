import { Route, Routes } from 'react-router-dom'

import AppShell from '@/components/layout/AppShell'
import { ROLES } from '@/lib/constants'
import LandingPage from '@/pages/LandingPage'
import NotFoundPage from '@/pages/NotFoundPage'
import ProfilePage from '@/pages/account/ProfilePage'
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import DriverHome from '@/pages/driver/DriverHome'
import MyTeslaPage from '@/pages/driver/MyTeslaPage'
import MyRidesPage from '@/pages/passenger/MyRidesPage'
import PassengerHome from '@/pages/passenger/PassengerHome'
import RequestRidePage from '@/pages/passenger/RequestRidePage'
import RideDetailPage from '@/pages/passenger/RideDetailPage'
import ProtectedRoute from '@/routes/ProtectedRoute'
import PublicOnlyRoute from '@/routes/PublicOnlyRoute'
import RoleRoute from '@/routes/RoleRoute'

// The single source of truth for which URL renders which page. It grows one
// <Route> at a time as features land. Declarative <Routes> rather than
// createBrowserRouter, so it reads top-to-bottom like the route mounting in the
// backend's src/app.js.
//
// Public pages sit directly in the table. Signed-in pages are wrapped in three
// layers, inside out:
//   AppShell         renders Navbar + the content column (Phase 6)
//   RoleRoute        blocks the wrong role (Phase 5)
//   ProtectedRoute   requires a signed-in user (Phase 5)
//
// The dashboard cards and the navbar link to feature pages (payments, history,
// requests, active trip) that 404 until their phases land - accepted in-progress
// state, consistent with earlier phases. /request is live since Phase 7,
// /my-rides and /my-rides/:rideId since Phase 8, /tesla since Phase 9.
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
      <Route
        path="/request"
        element={
          <ProtectedRoute>
            <RoleRoute role={ROLES.PASSENGER}>
              <AppShell>
                <RequestRidePage />
              </AppShell>
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-rides"
        element={
          <ProtectedRoute>
            <RoleRoute role={ROLES.PASSENGER}>
              <AppShell>
                <MyRidesPage />
              </AppShell>
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-rides/:rideId"
        element={
          <ProtectedRoute>
            <RoleRoute role={ROLES.PASSENGER}>
              <AppShell>
                <RideDetailPage />
              </AppShell>
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/passenger"
        element={
          <ProtectedRoute>
            <RoleRoute role={ROLES.PASSENGER}>
              <AppShell>
                <PassengerHome />
              </AppShell>
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/tesla"
        element={
          <ProtectedRoute>
            <RoleRoute role={ROLES.DRIVER}>
              <AppShell>
                <MyTeslaPage />
              </AppShell>
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/driver"
        element={
          <ProtectedRoute>
            <RoleRoute role={ROLES.DRIVER}>
              <AppShell>
                <DriverHome />
              </AppShell>
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <AppShell>
              <ProfilePage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}