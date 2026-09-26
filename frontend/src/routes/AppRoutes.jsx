import { Route, Routes } from 'react-router-dom'
import AppShell from '@/components/layout/AppShell'
import useAuth from '@/hooks/useAuth'
import { ROLES } from '@/lib/constants'
import LandingPage from '@/pages/LandingPage'
import NotFoundPage from '@/pages/NotFoundPage'
import ProfilePage from '@/pages/account/ProfilePage'
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import DriverHome from '@/pages/driver/DriverHome'
import ActiveTripPage from '@/pages/driver/ActiveTripPage'
import MyTeslaPage from '@/pages/driver/MyTeslaPage'
import RequestsPage from '@/pages/driver/RequestsPage'
import MyRidesPage from '@/pages/passenger/MyRidesPage'
import PassengerHome from '@/pages/passenger/PassengerHome'
import RequestRidePage from '@/pages/passenger/RequestRidePage'
import RideDetailPage from '@/pages/passenger/RideDetailPage'
import JoinPoolPage from '@/pages/passenger/JoinPoolPage'
import PaymentsPage from '@/pages/passenger/PaymentsPage'
import PassengerHistoryPage from '@/pages/passenger/HistoryPage'
import DriverHistoryPage from '@/pages/driver/HistoryPage'
import ProtectedRoute from '@/routes/ProtectedRoute'
import PublicOnlyRoute from '@/routes/PublicOnlyRoute'
import RoleRoute from '@/routes/RoleRoute'

function HistoryPage() {
  const { user } = useAuth()
  return user.role === ROLES.DRIVER ? <DriverHistoryPage /> : <PassengerHistoryPage />
}
const passenger = (page) => <RoleRoute role={ROLES.PASSENGER}>{page}</RoleRoute>
const driver = (page) => <RoleRoute role={ROLES.DRIVER}>{page}</RoleRoute>

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
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="/passenger" element={passenger(<PassengerHome />)} />
        <Route path="/request" element={passenger(<RequestRidePage />)} />
        <Route path="/my-rides" element={passenger(<MyRidesPage />)} />
        <Route path="/my-rides/:rideId" element={passenger(<RideDetailPage />)} />
        <Route path="/join-pool" element={passenger(<JoinPoolPage />)} />
        <Route path="/payments" element={passenger(<PaymentsPage />)} />
        <Route path="/driver" element={driver(<DriverHome />)} />
        <Route path="/tesla" element={driver(<MyTeslaPage />)} />
        <Route path="/requests" element={driver(<RequestsPage />)} />
        <Route path="/active-trip" element={driver(<ActiveTripPage />)} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
