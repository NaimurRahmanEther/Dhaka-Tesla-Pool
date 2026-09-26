# Dhaka Tesla Pool

A ride-pooling service for Dhaka. Passengers request a ride, drivers run Teslas,
and people heading roughly the same way share one car — so everyone pays less
than they would alone, and fewer cars are on the road.

The pitch, in one example: Jashim's Tesla *Bullet* has three seats and is
already driving from Banani to Mohakhali. Nusrat and Rafiq both want that trip.
Nusrat books first and pays 210. Rafiq joins the same car and pays 170. When a
fifth passenger races for the last seat, exactly one of them gets it and the
rest are told how many seats were left.

## Repository layout

| Path | What it is |
| --- | --- |
| `backend/` | Express + PostgreSQL API |
| `frontend/` | Not built yet |

## Running it

Requires Node 20+ and a PostgreSQL 14+ database.

```bash
cd backend
cp .env.example .env      # then edit the database credentials
npm install
npm run migrate
npm run seed
npm run dev
```

Postgres needs to be running first, and the database itself must already exist
(`createdb tesla_pool`) — the migrations create tables inside it but cannot
create the database.

`npm run seed` loads only the reference data — the Dhaka locations and the roads
between them. It creates no accounts; those come from `POST /auth/register`. The
API is served on <http://localhost:8000>. Verify it:

```bash
curl http://localhost:8000/health
```

The app refuses to start if any required environment variable is missing, so a
misconfigured `.env` fails immediately with a clear message rather than at the
first request.

### Scripts

| Command | What it does |
| --- | --- |
| `npm start` | Run the server |
| `npm run dev` | Run with nodemon |
| `npm run migrate` | Apply pending migrations |
| `npm run migrate:down` | Roll the last migration back |
| `npm run seed` | Load the locations and roads |

## Accounts

There are no pre-made users. Every account is created through
`POST /auth/register` and signs in with `POST /auth/login`. Register with
`role: "DRIVER"` or `role: "PASSENGER"`.

```bash
curl -X POST http://localhost:8000/auth/register \
  -H 'content-type: application/json' \
  -d '{"name":"Jashim","email":"jashim@example.com","password":"DhakaTesla123","role":"DRIVER"}'

curl -X POST http://localhost:8000/auth/login \
  -H 'content-type: application/json' \
  -d '{"email":"jashim@example.com","password":"DhakaTesla123"}'
```

A driver's Tesla is then registered against that account, and only one is
allowed:

```bash
curl -X POST http://localhost:8000/vehicle \
  -H "Authorization: Bearer $TOKEN" -H 'content-type: application/json' \
  -d '{"model":"Bullet","capacity":3,"currentLocationId":1}'
```

Emails are matched case-insensitively, so `Jashim@example.com` and
`jashim@example.com` are the same account and the second registration is
refused with `Email already exists`.

## Trying it out

A driver registers a Tesla, goes online, then browses what passengers are asking
for and accepts one:

```bash
curl -X POST http://localhost:8000/vehicle \
  -H "Authorization: Bearer $TOKEN" -H 'content-type: application/json' \
  -d '{"model":"Bullet","capacity":3,"currentLocationId":1}'

# Required before accepting anything, otherwise 403
curl -X PATCH http://localhost:8000/vehicle/status \
  -H "Authorization: Bearer $TOKEN" -H 'content-type: application/json' \
  -d '{"status":"ONLINE"}'

curl http://localhost:8000/matching/requests -H "Authorization: Bearer $TOKEN"
curl -X POST http://localhost:8000/matching/1/accept -H "Authorization: Bearer $TOKEN"
```

Then take the trip forward one stage at a time — `arrive`, `start`, `complete` —
and settle up. Calling a stage out of order returns `409`.

## The fare model

Money is a whole number of Taka throughout. No decimal currency is used
anywhere in the product, so `rides.fare` and `payments.amount` are both
`INTEGER` and every component is rounded to a whole Taka.

```
passengerFare = baseFare + distanceCharge - poolDiscount
```

| Term | Value | Notes |
| --- | --- | --- |
| `baseFare` | 50 | Fixed per trip, never discounted |
| `distanceCharge` | 20 per km | Rounded to the nearest Taka |
| `poolDiscount` | 25% of the distance charge | Only when sharing a Tesla |

The discount applies to the distance charge only. The base fare still covers the
driver's fixed cost of making the trip at all, so a driver is never asked to
drive further for less than the fixed part of the fare.

Worked example — Nusrat and Rafiq both travel Banani → Mohakhali, 8 km:

```
alone    50 + round(8 x 20)                = 50 + 160        = 210
pooled   50 + 160 - round(160 x 0.25)      = 50 + 160 - 40   = 170
```

Nusrat books first and pays 210. Rafiq joins the same Tesla and pays 170. Both
figures are hand-checkable, and every accepted ride stores the full breakdown
in `rides.fare_breakdown` so a fare can always be explained afterwards.

The rates are constants in [`backend/src/modules/fare/fare.utils.js`](backend/src/modules/fare/fare.utils.js).

## The ride lifecycle

```
REQUESTED -> MATCHED -> DRIVER_ARRIVED -> ONGOING -> COMPLETED
     \            \
      \            `-> CANCELLED
       `-> CANCELLED
```

Forward only. A ride never moves back a stage, and stages cannot be skipped. The
legal moves are declared in
[`backend/src/modules/rides/rideStatus.js`](backend/src/modules/rides/rideStatus.js)
and each step is also guarded in SQL with a `WHERE status = ...` clause, so a
stale or replayed request changes zero rows and is rejected with `409` rather
than silently jumping the sequence.

Cancelling is allowed while the ride is `REQUESTED` or `MATCHED` only. Once the
driver is on the way the seats are committed. Cancelling a `MATCHED` ride also
frees its seat in the pool so somebody else can take it.

Each stage is timestamped on the ride itself (`requested_at`, `matched_at`,
`arrived_at`, `started_at`, `completed_at`, `cancelled_at`) and written to
`ride_history`, so `GET /rides/:id/history` can show the full trail with who did
what and when.

## Pooling, routing and capacity

A pool is one Tesla's current set of passengers. When a second passenger joins,
the pickup and destination are **inserted into the existing route** rather than
replacing it, and the extra driving is measured. Roads are a graph and shortest
paths are found with Dijkstra. A detour of more than 5 km is refused.

Capacity is the one rule that must never break, so it is enforced in the
transaction that allocates the seat:

1. **The service transaction.** `assignRideToPool` locks the Tesla's own row
   with `SELECT ... FOR UPDATE`, and only then re-checks the seats already
   allocated. Every booking for a given Tesla queues behind that one row lock, so
   two passengers claiming the last seat at the same instant are serialised: the
   second reads the committed total and is refused instead of overbooking the
   car. The pre-checks used to rank candidate Teslas are advisory only; the one
   inside the lock decides.
2. **The API.** A refused seat surfaces as `409` with a message saying how many
   seats were left, not as a crash.

The vehicle row is locked before the capacity read, not after, and it is the
vehicle rather than the pool because at the moment of the very first booking the
`pools` row does not exist yet and there would be nothing to lock. The same lock
is why a Tesla cannot end up running two trips at once: a pool is created only
when the locked vehicle has no `ACTIVE` pool yet.

A driver is also stopped from shrinking their Tesla below the seats already
booked in an active pool, so a pool cannot be stranded over capacity.

## API

Base URL `http://localhost:8000`. Every response is
`{ "success": boolean, "message": string, "data": ... }`.

Authenticated routes need `Authorization: Bearer <accessToken>`. Access tokens
last 15 minutes; the refresh token is an httpOnly cookie lasting 7 days.

### Auth

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/auth/register` | public | Create an account |
| POST | `/auth/login` | public | Sign in, sets the refresh cookie |
| POST | `/auth/refresh-token` | cookie | Mint a new access token |
| POST | `/auth/logout` | authenticated | Revoke the current token |

### Users

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/users/me` | authenticated | Own profile |
| PATCH | `/users/me` | authenticated | Update own profile |

### Vehicles

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/vehicle` | DRIVER | Register the Tesla |
| GET | `/vehicle/me` | DRIVER | Own Tesla |
| PATCH | `/vehicle/status` | DRIVER | Go online or offline |
| PATCH | `/vehicle/:id` | DRIVER | Update the Tesla (own only) |

### Rides

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/rides` | PASSENGER | Request a ride |
| GET | `/rides/my` | PASSENGER | Own rides |
| GET | `/rides/:id/history` | owner or serving driver | Full lifecycle trail |
| PATCH | `/rides/:id/cancel` | PASSENGER (owner) | Cancel before departure |

### Matching

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/matching/requests` | DRIVER | Open requests, with detour and fit |
| POST | `/matching/:rideId/accept` | DRIVER | Accept with your own Tesla |
| POST | `/matching/:rideId` | DRIVER | Automatic matching, best Tesla wins |

### Pools

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/pool/:poolId/add-passenger` | PASSENGER (own ride) | Join an existing Tesla |
| GET | `/pool/:poolId/passengers` | DRIVER (own pool) | Passenger manifest |

### Trips

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/trips/my-active` | DRIVER | Current trip |
| PATCH | `/trips/:poolId/arrive` | DRIVER (own pool) | Arrived at pickup |
| PATCH | `/trips/:poolId/start` | DRIVER (own pool) | Set off |
| PATCH | `/trips/:poolId/complete` | DRIVER (own pool) | Finish |

### Driver routes, history, payments, locations

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/driver-routes` | DRIVER | Plan a route |
| GET | `/driver-routes/me` | DRIVER | Current route |
| GET | `/history/passenger` | PASSENGER | Ride history |
| GET | `/history/driver` | DRIVER | Trip history |
| POST | `/payments/:rideId` | PASSENGER (own ride) | Pay for a completed ride |
| GET | `/payments/my` | PASSENGER | Payment history |
| GET | `/location` | public | All locations |
| GET | `/location/:id` | public | One location |
| GET | `/health` | public | Liveness plus a database round trip |

Drivers poll `/matching/requests` and `/trips/my-active`. There is no websocket
or push channel.

## Project layout

```
backend/src/
├── app.js                 Express app, middleware, route mounting
├── server.js              Boots the app and checks the database first
├── config/env.js          Environment config, fails fast when incomplete
├── database/
│   ├── db.js              Pooled pg client
│   ├── migrate.js         Migration runner (tracks applied files)
│   ├── migrations/up|down Numbered SQL, applied in order
│   └── seeds/             locations and roads (no accounts)
├── middleware/            auth, role, validate, asyncHandler, errors
├── modules/               One folder per feature:
│   ├── auth/              register, login, refresh, logout
│   ├── users/             profile
│   ├── vehicles/          Tesla registration and status
│   ├── location/          Dhaka locations
│   ├── graph/             road graph, Dijkstra
│   ├── rides/             requests, cancellation, state machine
│   ├── matching/          ranking, accept flow, seat claiming
│   ├── pools/             route optimiser, pooling, manifest
│   ├── trips/             arrive, start, complete
│   ├── routes/            driver route planning
│   ├── history/           passenger and driver history
│   ├── payment/           settlement
│   └── fare/              the fare model
└── utils/                 AppError, response helpers
```

Each module keeps its own `*.service.js`, `*.repository.js`, `*.routes.js` and
`*.validation.js`. Controllers handle HTTP, services hold the rules, and
repositories own the SQL.

## Configuration

Copy `.env.example` to `.env`. Every value is documented in that file; the six
below are required and the app refuses to boot without them.

| Variable | Required | Purpose |
| --- | --- | --- |
| `DB_HOST` | yes | PostgreSQL host |
| `DB_NAME` | yes | Database name, must already exist |
| `DB_USER` | yes | PostgreSQL user |
| `DB_PASSWORD` | yes | PostgreSQL password |
| `JWT_ACCESS_SECRET` | yes | Signs access tokens |
| `JWT_REFRESH_SECRET` | yes | Signs refresh tokens |
| `DB_PORT` | no | PostgreSQL port, default 5432 |
| `PORT` | no | Port to listen on, default 8000 |
| `CORS_ORIGIN` | no | Allowed frontend origin, comma-separated for several, default `http://localhost:5173` |
| `ACCESS_TOKEN_EXPIRE` | no | Access token lifetime, default `15m` |
| `REFRESH_TOKEN_EXPIRE` | no | Refresh token lifetime, default `7d` |
| `NODE_ENV` | no | `development` includes a stack trace in error responses; `production` marks the refresh cookie `secure` so it is only sent over HTTPS |

The two signing secrets must be different from each other. They sign the access
and refresh tokens independently, and a shared key would let a refresh token be
replayed as an access token.

For anything other than local development, generate real secrets:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```
