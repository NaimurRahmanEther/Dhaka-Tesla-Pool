import Brand from '@/components/layout/Brand'
import { Icon, LinkButton } from '@/components/ui'
export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col px-6 py-8">
      <div className="mx-auto w-full max-w-6xl">
        <Brand />
      </div>
      <main className="m-auto max-w-md py-20 text-center">
        <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-brand-100 text-brand-700">
          <Icon name="route" className="h-9 w-9" />
        </span>
        <p className="eyebrow mt-8">404 · A little off route</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-brand-900">
          Let’s get you back on track.
        </h1>
        <p className="mt-5 text-sm leading-7 text-slate-500">
          We couldn’t find this page. Head home to find your next journey.
        </p>
        <LinkButton to="/" className="mt-7">
          <Icon name="back" />
          Back to home
        </LinkButton>
      </main>
    </div>
  )
}
