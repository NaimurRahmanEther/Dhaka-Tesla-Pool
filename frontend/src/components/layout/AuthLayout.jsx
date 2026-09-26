import Brand from '@/components/layout/Brand'
import RouteArt from '@/components/ui/RouteArt'
import { Icon } from '@/components/ui'

export default function AuthLayout({ children }) {
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-brand-900 p-12 xl:p-16 lg:flex">
        <Brand light />
        <div className="my-10">
          <p className="text-xs font-semibold tracking-widest text-lime-300 uppercase">
            A better way together
          </p>
          <h2 className="mt-5 max-w-md text-5xl leading-tight font-bold tracking-tight text-white">
            Good journeys
            <br />
            start with
            <br />
            <span className="text-lime-300">good company.</span>
          </h2>
          <RouteArt className="mx-auto mt-8 w-full max-w-sm -rotate-3" />
        </div>
        <p className="flex items-center gap-2 text-sm text-white/50">
          <Icon name="pin" className="h-4 w-4" />
          Built around your everyday in Dhaka.
        </p>
      </section>
      <section className="flex flex-col px-5 py-7 sm:px-10">
        <div className="lg:hidden">
          <Brand />
        </div>
        <div className="page-enter m-auto w-full max-w-md py-10">{children}</div>
        <p className="text-center text-xs text-slate-500">Your city. Your journey. Together.</p>
      </section>
    </main>
  )
}
