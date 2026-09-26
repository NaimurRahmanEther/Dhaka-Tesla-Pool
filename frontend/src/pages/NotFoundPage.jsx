import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-6 text-center">
      <p className="text-sm font-semibold tracking-wide text-sky-700 uppercase">
        404
      </p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">
        This page does not exist
      </h1>
      <p className="mt-3 text-slate-600">
        The address you followed is not part of the app. It may be a stale link, or
        the page may not be built yet.
      </p>
      <Link
        to="/"
        className="mt-6 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
      >
        Back to the home page
      </Link>
    </main>
  )
}
