import { Link } from 'react-router-dom'

// No hardcoded data on this page, by design.
//
// The first version printed a fare table showing 210 for a solo trip and 170 for
// a pooled one, copied out of the brief rather than fetched. That made the page
// assert a number the app had never computed, and nothing would have flagged it
// until it was wrong.
//
// There is also no fare endpoint to call. `modules/fare/` is a service and a util
// used inside the backend, and the server stores its result on each ride as
// `fare_breakdown` JSONB. So the real breakdown is rendered per ride, from the
// server's own figures, where a passenger can check it by hand. See section 5a of
// FRONTEND_BUILD_NOTES.md.
const STEPS = [
  {
    title: 'Request your ride',
    body: 'Pick a pickup point, a destination, and how many seats you need. Your request goes straight into the queue of open rides.',
  },
  {
    title: 'Get matched with a driver',
    body: 'Drivers online nearby see every open request, along with how far it would take them off their route and how many seats they have left.',
  },
  {
    title: 'Share the car, split the fare',
    body: 'If someone is already heading your way, you ride with them instead of paying for a whole car on your own.',
  },
  {
    title: 'Watch the trip happen',
    body: 'From accepted to arrived to completed, everyone sees the same status. No guessing, no phoning.',
  },
]

const ROLES = [
  {
    title: 'I need a ride',
    role: 'Passenger',
    points: [
      'Request a ride to any location in the city',
      'See exactly where your request sits',
      'Share a seat with someone going your way',
      'Pay by cash or Tesla wallet',
    ],
    cta: { to: '/register', label: 'Sign up as a passenger' },
  },
  {
    title: 'I want to drive',
    role: 'Driver',
    points: [
      'Register your Tesla and set your capacity',
      'Go online whenever you are free',
      'Choose requests by detour and seats free',
      'Run the trip and collect the fares',
    ],
    cta: { to: '/register', label: 'Sign up as a driver' },
  },
]

export default function LandingPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 pb-20">
      <section className="pt-16 text-center">
        <p className="text-sm font-semibold tracking-wide text-sky-700 uppercase">
          Ride pooling for Dhaka
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-balance sm:text-5xl">
          Share a ride. Pay less.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-pretty text-slate-600">
          Request a ride, and if another rider is already heading your way, join
          them in the same Tesla instead of paying for a whole car on your own.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            to="/register"
            className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            Get started
          </Link>
          <Link
            to="/login"
            className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            I already have an account
          </Link>
        </div>
      </section>

      <section className="mt-20">
        <h2 className="text-center text-2xl font-bold tracking-tight">
          How it works
        </h2>
        <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <li key={step.title}>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-sm font-semibold text-sky-800">
                {index + 1}
              </span>
              <h3 className="mt-3 font-semibold">{step.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-20">
        <h2 className="text-center text-2xl font-bold tracking-tight">
          Which one are you?
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-slate-600">
          You can only do one at a time, so pick a side to get started.
        </p>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {ROLES.map((item) => (
            <article
              key={item.role}
              className="flex flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <p className="text-xs font-semibold tracking-wide text-sky-700 uppercase">
                {item.role}
              </p>
              <h3 className="mt-1 text-xl font-semibold">{item.title}</h3>
              <ul className="mt-4 flex-1 space-y-2">
                {item.points.map((point) => (
                  <li key={point} className="flex gap-2.5 text-sm text-slate-600">
                    <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
                    {point}
                  </li>
                ))}
              </ul>
              <Link
                to={item.cta.to}
                className="mt-6 rounded-lg border border-slate-300 px-4 py-2 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                {item.cta.label}
              </Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
