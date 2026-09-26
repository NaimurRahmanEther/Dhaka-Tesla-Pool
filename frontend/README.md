# Frontend — Dhaka Tesla Pool

React single-page app for the passenger and driver flows. It talks to the Express
API in [`../backend`](../backend) and renders everything: requesting a ride,
watching a driver arrive, sharing a seat, and paying a fare that can be checked by
hand.

The product write-up, the fare model, the ride lifecycle and the API reference all
live in the [root README](../README.md). This file covers only the frontend.

---

## Stack

| Package | Version | Why this one |
| --- | --- | --- |
| React | 19.2 | Plain function components and hooks. No TypeScript. |
| Vite | 8.3 | Dev server with HMR, and the production build. |
| Tailwind CSS | 4.3 | Utility CSS. v4 is configured from the Vite plugin, so there is no `tailwind.config.js` and no `postcss.config.js` — one CSS import is the entire setup. |
| react-router-dom | 7.x | Client-side routing. |
| ESLint | 10 | Linting, with `eslint-plugin-react-hooks` so hook misuse is caught statically rather than at runtime. |

**No state library, no data-fetching library, no component library.** Auth state is
`useState` plus context, requests use the browser's own `fetch`, and components are
plain local files. That is a deliberate trade: the brief rewards a small clean MVP
over a layered one, and every one of those libraries would be a thing to justify in
an interview.

## Requirements

- Node 20.19+ (Vite 8 requirement; developed on Node 24)
- The backend running on `http://localhost:8000`

## Setup

```bash
cd frontend; npm install
cp .env.example .env.local    # only needed if the backend is not on :8000
npm run dev
```

Then open <http://localhost:5173>.

That port is not arbitrary. The backend's `CORS_ORIGIN` defaults to
`http://localhost:5173` and it rejects any other origin, so the dev server is pinned
to 5173 with `strictPort: true` — otherwise Vite silently moves to 5174 when the
port is busy, the app appears to work, and every API call fails on CORS.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reload, port 5173 |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | ESLint over the project |

## Environment

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `VITE_API_URL` | no | `http://localhost:8000` | Base URL of the backend API |

Only `VITE_`-prefixed variables reach the browser, and Vite inlines them at build
time, so nothing secret belongs in `.env.local`. The real `.env*` files are
gitignored; only `.env.example` is committed.

---

## Project structure

```
src/
├── main.jsx           entry point. Wraps the app in its providers
├── App.jsx            renders the route table and nothing else
├── index.css          the Tailwind import
│
├── api/
│   └── client.js      the only file in the app that calls fetch()
│
├── lib/
│   ├── constants.js   enum strings only: roles, ride statuses, payment methods
│   └── format.js      Taka and date formatting
│
├── hooks/
│   ├── useApi.js      generic { data, loading, error, reload }
│   └── useAuth.js     reads the auth context
│
├── context/
│   ├── auth.context.js   the auth context object
│   └── AuthProvider.jsx  the signed-in user, the auth actions, session restore
│
├── routes/
│   ├── AppRoutes.jsx        the one route table
│   ├── ProtectedRoute.jsx   requires a signed-in user
│   ├── PublicOnlyRoute.jsx  keeps signed-in users off /login and /register
│   └── RoleRoute.jsx        requires PASSENGER or DRIVER
│
├── services/          one file per backend module; builds the request URLs
│
├── components/
│   ├── ui/            Button, Input, Select, Card, Badge, Spinner,
│   │                  Alert, EmptyState, PageHeader
│   └── layout/        Navbar, PageContainer
│
└── pages/
    ├── auth/          RegisterPage, LoginPage
    ├── passenger/     request a ride, my rides, ride detail, payments
    ├── driver/        my Tesla, request board, active trip
    └── account/       profile
```

### Conventions

1. **Only `src/api/client.js` calls `fetch`.** Pages never fetch directly.
2. **Only `src/services/*` build request URLs.** One service file per backend
   module, so there is one obvious place to look for "how do we call this endpoint".
3. **Pages never import each other.** Navigation is `<Link>` or `useNavigate`.
4. **No business logic inside pages.** Rules that need explaining — can this ride
   still be cancelled? — live in `lib/`, where they can be reasoned about and tested.
5. **Every screen that loads data renders three states: loading, error, and empty.**
6. **Pages compose the UI kit, never hand-roll UI.** Buttons, inputs, cards, badges,
   spinners, alerts and empty states come from `src/components/ui/`. The kit is
   strictly presentational — no component there fetches, navigates, or knows the
   backend exists. The one exception is `Badge`, which maps the status strings from
   `lib/constants.js` to colours.

### No hardcoded data

Every figure the user reads as a fact comes from the API. There are no mock
objects, no placeholder rows, and no numbers copied into a component.

This matters more than usual here, because the fare is the thing the whole
project is judged on. The backend computes it in `modules/fare/fare.utils.js` and
stores the result on the ride as `fare_breakdown` JSONB — there is no fare
endpoint to call. So the frontend renders the line items the server returned and
recomputes nothing. A `210` hardcoded into a page would be indistinguishable from
a real one right up until it was wrong.

The same applies to everything else the server already knows: seats remaining,
detour distance, whether a request fits in a given Tesla, and pool occupancy are
all computed by the backend and sent down. The browser displays them; it does not
derive them.

The one deliberate exception is the enum vocabulary in `src/lib/constants.js` —
the literal strings `PASSENGER`, `DRIVER`, `MATCHED`, `CASH` and so on. The
frontend has to know those to render a status badge and to send the right role
back to the API. They are a contract with the backend, not data.

## How the interface behaves

A few rules the whole app follows, so the behaviour is consistent rather than
rediscovered page by page.

**Every screen that loads data renders three distinct states, and all three are
designed.** Loading shows a spinner and the name of what is loading. An error
shows what went wrong and what to try next. An empty state explains why it is
empty and offers the button that fills it — a driver with no Tesla should see
"You have not registered a Tesla yet", not `Error: 404`. Three backend endpoints
return 404 to mean "nothing here yet", and the app treats those as empty states.

**Errors use the backend's own wording.** The API already sends sentences meant
for humans, like "Not enough seats available: 1 left, 2 requested", and those are
shown verbatim rather than replaced with something generic.

**Status is always colour and text.** A badge never relies on colour alone to
convey meaning, so the word carries it and the colour just speeds it up.

**One primary action per screen, and irreversible actions are confirmed.**
Cancelling a ride cannot be undone, because the ride lifecycle only moves
forward, so it is confirmed before it happens. Every submit and accept button
disables while its request is in flight, so a double click cannot fire twice.

**Anything the backend cannot do, the UI does not pretend to do.** There is no
location tracking in this backend, so there is no map and no "driver is 2 minutes
away". A real status beats a convincing guess.

`src/routes/AppRoutes.jsx` is the single file that decides which URL shows which
page. Start there to understand the whole navigation surface.

---

## How data loading works

Every page follows the same shape, so there is one pattern to learn rather than
eleven.

`api/client.js` is the only place that knows the backend exists. It attaches the
bearer token, sends the refresh cookie, unwraps the API's
`{ success, message, data }` envelope, and throws a normal `Error` on failure:

```js
// a page never writes this
const res = await fetch(`${API}/rides/my`, { headers: { Authorization: `Bearer ${t}` } })
const json = await res.json()

// it writes this instead
const rides = await rideService.getMyRides()   // already unwrapped
```

`hooks/useApi.js` wraps that in the three states every screen must show:

```jsx
const { data, loading, error, reload } = useApi(rideService.getMyRides, [])

if (loading) return <Spinner />
if (error) return <Alert>{error}</Alert>
if (!data.length) return <EmptyState />
return data.map((ride) => <RideCard key={ride.id} ride={ride} />)
```

`reload` is what a cancel, an accept, or a status change calls so the list reflects
the server instead of guessing at the new state locally.

The landing page is the working example of this pattern: it fetches `GET /location`
through `useApi`, so the city-stop list it renders is a live answer from the
backend, not marketing copy. It deliberately shows no backend internals — no
health checks, no database state — because that is a customer-facing page, not a
monitoring dashboard.

### Token expiry

Access tokens last 15 minutes. When a request comes back `401`, `client.js` calls
`POST /auth/refresh-token` once, stores the new access token, and replays the
original request once. If that also fails it clears the session and the route
guards redirect to the login page. One retry, no queue, no state machine — without
it the app would break partway through a demo.

## Authentication

The session lives in `src/context/AuthProvider.jsx`, read anywhere in the tree
with `useAuth()` from `src/hooks/useAuth.js`.

- The **access token** sits in `localStorage`. The **refresh token** is an
  httpOnly cookie set by the backend, which the app never sees.
- On every change of the token — first load, login, logout — `AuthProvider`
  calls `GET /users/me` to learn who the token belongs to. The `user` object in
  context is therefore always the server's answer, never something stored
  client-side and trusted on faith.
- While that first check is running, `checking` is `true`; route guards wait on
  it so a hard page refresh does not flash a logged-out screen to a logged-in
  user.
- `register` sends the account to the backend and stops. The backend deliberately
  returns no token for a fresh registration, so the register page sends the user
  to `/login` instead of pretending to have signed them in.

The context object (`auth.context.js`) and the provider (`AuthProvider.jsx`) are
separate files so that `react-refresh/only-export-components` stays satisfied,
and their names were chosen to not collide case-insensitively on Windows, where
`AuthContext.jsx` and `authContext.js` would be the same file.
