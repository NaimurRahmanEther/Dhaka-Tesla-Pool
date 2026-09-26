import Navbar from '@/components/layout/Navbar'
import PageContainer from '@/components/layout/PageContainer'

// The signed-in frame. Every protected page is just content inside this shell,
// so the navbar and the content column exist exactly once. The plan's filename
// for this was "app shell" - Navbar + PageContainer composed here, nothing more.
export default function AppShell({ children }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <PageContainer className="py-8">
        <main>{children}</main>
      </PageContainer>
    </div>
  )
}