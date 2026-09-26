import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Navbar from '@/components/layout/Navbar'
import PageContainer from '@/components/layout/PageContainer'
import { Icon } from '@/components/ui'
import useAuth from '@/hooks/useAuth'

export default function AppShell({ children }) {
  const { user } = useAuth()
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return (
    <div className="min-h-screen bg-canvas">
      <a
        href="#main-content"
        className="sr-only fixed top-3 left-3 z-50 rounded-xl bg-white p-3 text-brand-900 focus:not-sr-only"
      >
        Skip to content
      </a>
      <Navbar />
      <div className="lg:pl-64">
        <div className="hidden h-20 items-center justify-between border-b border-slate-200/70 px-10 text-xs lg:flex">
          <span className="font-medium text-slate-500">
            Your city. Your journey. <span className="text-brand-700">Together.</span>
          </span>
          <span className="flex items-center gap-2 text-slate-500">
            <Icon name="pin" className="h-4 w-4" />
            Dhaka, Bangladesh
            <span className="mx-2 h-4 w-px bg-slate-200" />
            {user?.role === 'DRIVER' ? 'Driver' : 'Passenger'}
          </span>
        </div>
        <PageContainer className="py-8 sm:py-10">
          <main id="main-content" key={pathname} className="page-enter min-w-0" tabIndex={-1}>
            {children ?? <Outlet />}
          </main>
          <footer className="mt-14 flex flex-wrap justify-between gap-2 border-t border-slate-200 pt-5 text-xs text-slate-500">
            <span>Dhaka Tesla Pool</span>
            <span>Good journeys are better shared.</span>
          </footer>
        </PageContainer>
      </div>
    </div>
  )
}
