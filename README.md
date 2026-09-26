# Dhaka Tesla Pool

**Share a seat. Split the fare. Survive Dhaka traffic.**

A ride-pooling service for Dhaka. Passengers request a ride, drivers run Teslas, and people heading roughly the same way share one car — so everyone pays less than they would alone, and fewer cars are on the road.

---

## The Pitch

8:41 AM, Banani Road 11. Jashim is leaning against **Bullet**, his 4-seat Tesla. Nusrat books a ride to Mohakhali. Two minutes later Rafiq books almost the same route to Gulshan 1. The app figures out in under a second whether they can share a seat, split the fare fairly, and survive the ride. Then Shirin tries to grab the last seat thirty seconds later.

- **Nusrat** (solo) pays **210 BDT** — 50 base + 160 distance
- **Rafiq** (pooled) pays **170 BDT** — 50 base + 160 distance − 40 pool discount
- **Shirin** gets the last seat or is told how many seats remain

Jashim just wants to know who's riding and when he can go. Everyone else just wants to get where they're going, pay a fair price, and not accidentally make a new friend.

---

## Cast (Seed Data / Demo)

| Role | Name | Details |
|------|------|---------|
| Driver | **Jashim** | Owns **Bullet** (4 seats) |
| Passenger | **Nusrat** | Banani → Mohakhali |
| Passenger | **Rafiq** | Banani → Gulshan 1 |
| Passenger | **Shirin** | Late arrival, fights for last seat |

Use this cast for demo, or bring your own — just be consistent. Avoid generic names like `user1`/`driver1`.

---

## Repository Layout

```
dhaka-tesla-pool/
├── backend/          # Express + PostgreSQL API
├── frontend/         # React + Vite SPA, talks to API over CORS
├── docker-compose.yml
├── .gitignore
└── README.md         # This file
```

---

## Quick Start (Docker)

```bash
# 1. Clone and configure
cp backend/.env.example backend/.env   # Edit DB credentials if needed

# 2. Start everything
docker compose up --build

# 3. Verify
curl http://localhost:8000/health
# Frontend at http://localhost:5173
```

**What `docker compose up` does:**
- Starts PostgreSQL 14+ container
- Runs migrations automatically
- Seeds 8 Dhaka locations + road graph (Banani, Gulshan, Mohakhali, Dhanmondi, Mirpur, Uttara, Farmgate, Bashundhara)
- Starts backend on `:8000`
- Starts frontend dev server on `:5173`

---

## Manual Start (Without Docker)

### Backend
```bash
cd backend
cp .env.example .env        # Edit DB credentials
npm install
npm run migrate             # Applies migrations
npm run seed                # Seeds locations + roads
npm run dev                 # :8000 with nodemon
```

### Frontend
```bash
cd frontend
npm install
npm run dev                 # http://localhost:5173
```

**Environment variables** (copy `.env.example` → `.env`):

| Variable | Required | Purpose |
|----------|----------|---------|
| `DB_HOST` | yes | PostgreSQL host |
| `DB_NAME` | yes | Database name (must exist) |
| `DB_USER` | yes | PostgreSQL user |
| `DB_PASSWORD` | yes | PostgreSQL password |
| `JWT_ACCESS_SECRET` | yes | Signs access tokens |
| `JWT_REFRESH_SECRET` | yes | Signs refresh tokens |
| `DB_PORT` | no | Default 5432 |
| `PORT` | no | Default 8000 |
| `CORS_ORIGIN` | no | Default `http://localhost:5173` |
| `ACCESS_TOKEN_EXPIRE` | no | Default `15m` |
| `REFRESH_TOKEN_EXPIRE` | no | Default `7d` |
| `NODE_ENV` | no | `development` \| `production` |

> The two signing secrets **must be different**. They sign access/refresh tokens independently; a shared key would let a refresh token be replayed as an access token.

---

## Features

### Passenger (Nusrat, Rafiq, Shirin)
- **Sign up / in** — `POST /auth/register`, `POST /auth/login`
- **Request ride** — Pickup, Destination, Seats (`POST /rides`)
- **See estimated fare** — `NULL` on REQUESTED; computed at match
- **Track status** — Waiting → Matched → In Progress → Completed/Cancelled
- **View history** — All rides with timeline (`GET /history/passenger`)
- **Cancel when valid** — Only while REQUESTED or MATCHED (`PATCH /rides/:id/cancel`)

### Driver (Jashim)
- **Sign in**
- **Go online/offline** — `PATCH /vehicle/status`
- **Own Tesla with fixed capacity** — `POST /vehicle`, `GET /vehicle/me`
- **See relevant requests** — Board shows detour, free seats, fit (`GET /matching/requests`)
- **Accept ride/pool** — `POST /matching/:rideId/accept`
- **Mark Arrival / Start / Complete** — `PATCH /trips/:poolId/arrive|start|complete`
- **See passengers/seats** — Manifest with fares (`GET /pool/:poolId/passengers`)
- **Ride history** — Completed trips with fares (`GET /history/driver`)

### Pool / Ride
- Multiple requests share one Tesla
- Occupied seats never exceed capacity (enforced by `SELECT ... FOR UPDATE`)
- Each passenger gets individual fare (210 solo vs 170 pooled)
- Clear pool membership and lifecycle

### Fare Model
```
passengerFare = baseFare + distanceCharge - poolDiscount
```

| Term | Value | Notes |
|------|-------|-------|
| `baseFare` | 50 BDT | Fixed per trip, never discounted |
| `distanceCharge` | 20 BDT/km | Rounded to nearest Taka |
| `poolDiscount` | 25% of distance | Only when sharing a Tesla |

**Worked example** — Banani → Mohakhali (8 km):
```
Solo:    50 + round(8 × 20)           = 50 + 160        = 210 BDT
Pooled:  50 + 160 − round(160 × 0.25) = 50 + 160 − 40   = 170 BDT
```

- Money stored as **integer Taka** (no decimals)
- Payment: **Cash** or **Simulated TeslaPay wallet** (no real gateway)

### Ride Lifecycle
```
REQUESTED → MATCHED/ACCEPTED → DRIVER_ARRIVED → STARTED → COMPLETED
     \            \                         (CANCELLED)
      \            `→ CANCELLED
```
- Forward only; no backward moves, no skipped stages
- `409` on invalid transition (guarded in SQL with `WHERE status = ...`)
- Each stage timestamped and written to `ride_history`
- `GET /rides/:id/history` shows full trail with actor + timestamp

---

## Architecture

```
Browser (React + Vite)  →  Node.js API (Express)  →  PostgreSQL
```

### Architecture Diagram
```
┌─────────────┐     HTTPS/REST      ┌─────────────┐     pg       ┌─────────────┐
│  Frontend   │  ◄────────────────►  │   Backend   │  ◄────────►  │  Database   │
│  (React)    │   JSON + Cookies     │  (Express)  │   (pg pool)  │  (Postgres) │
└─────────────┘                      └─────────────┘              └─────────────┘
```

> See `docs/architecture.png` for the full diagram (Browser → React → Node API → PostgreSQL)

### ERD
> See `docs/erd.png` for the Entity-Relationship Diagram covering:
> - Users, Vehicles, Rides, Pools, PoolRides, Payments, RideHistory, Locations, RoadEdges

### Backend Structure
```
backend/src/
├── app.js                 # Express app, middleware, route mounting
├── server.js              # Boots app, checks DB first
├── config/env.js          # Env config, fails fast when incomplete
├── database/
│   ├── db.js              # Pooled pg client
│   ├── migrate.js         # Migration runner (tracks applied files)
│   ├── migrations/up|down # Numbered SQL, applied in order
│   └── seeds/             # Locations + roads (no accounts)
├── middleware/            # auth, role, validate, asyncHandler, errors
├── modules/               # One folder per feature
│   ├── auth/              # register, login, refresh, logout
│   ├── users/             # profile
│   ├── vehicles/          # Tesla registration and status
│   ├── location/          # Dhaka locations
│   ├── graph/             # road graph, Dijkstra
│   ├── rides/             # requests, cancellation, state machine
│   ├── matching/          # ranking, accept flow, seat claiming
│   ├── pools/             # route optimiser, pooling, manifest
│   ├── trips/             # arrive, start, complete
│   ├── routes/            # driver route planning
│   ├── history/           # passenger and driver history
│   ├── payment/           # settlement
│   └── fare/              # fare model
└── utils/                 # AppError, response helpers
```

Each module keeps its own `*.service.js`, `*.repository.js`, `*.routes.js`, `*.validation.js`. Controllers handle HTTP, services hold rules, repositories own SQL.

### Frontend Structure
```
frontend/src/
├── api/client.js          # Single fetch() call site; auth, refresh, envelope
├── components/
│   ├── ui/                # 9 reusable primitives (Button, Input, Select…)
│   ├── layout/            # AppShell, Navbar, PageContainer
│   ├── driver/            # RequestCard, PassengerManifest
│   └── ride/              # FareBreakdown, HistoryTable
├── context/AuthProvider.jsx
├── hooks/useApi.js, useAuth.js
├── lib/format.js, constants.js
├── pages/
│   ├── auth/              # LoginPage, RegisterPage
│   ├── passenger/         # RequestRide, MyRides, RideDetail, JoinPool, Payments, History
│   └── driver/            # MyTesla, Requests, ActiveTrip, History
├── routes/                # AppRoutes, ProtectedRoute, RoleRoute
└── services/              # One file per backend module (URL building only)
```

---

## API Reference

Base URL: `http://localhost:8000`  
Response envelope: `{ "success": boolean, "message": string, "data": ... }`  
Auth: `Authorization: Bearer <accessToken>` (access tokens 15 min; refresh token httpOnly cookie, 7 days)

### Auth
| Method | Path | Access | Purpose |
|--------|------|--------|---------|
| POST | `/auth/register` | public | Create account |
| POST | `/auth/login` | public | Sign in, sets refresh cookie |
| POST | `/auth/refresh-token` | cookie | Mint new access token |
| POST | `/auth/logout` | authenticated | Revoke current token |

### Users
| Method | Path | Access | Purpose |
|--------|------|--------|---------|
| GET | `/users/me` | authenticated | Own profile |
| PATCH | `/users/me` | authenticated | Update own profile |

### Vehicles (Driver)
| Method | Path | Access | Purpose |
|--------|------|--------|---------|
| POST | `/vehicle` | DRIVER | Register Tesla |
| GET | `/vehicle/me` | DRIVER | Own Tesla |
| PATCH | `/vehicle/status` | DRIVER | Go online/offline |
| PATCH | `/vehicle/:id` | DRIVER | Update Tesla (own only) |

### Rides (Passenger)
| Method | Path | Access | Purpose |
|--------|------|--------|---------|
| POST | `/rides` | PASSENGER | Request a ride |
| GET | `/rides/my` | PASSENGER | Own rides |
| GET | `/rides/:id/history` | owner or driver | Full lifecycle trail |
| PATCH | `/rides/:id/cancel` | PASSENGER (owner) | Cancel before departure |

### Matching (Driver)
| Method | Path | Access | Purpose |
|--------|------|--------|---------|
| GET | `/matching/requests` | DRIVER | Open requests with detour/fit |
| POST | `/matching/:rideId/accept` | DRIVER | Accept with own Tesla |
| POST | `/matching/:rideId` | DRIVER | Auto-match, best Tesla wins |

### Pools
| Method | Path | Access | Purpose |
|--------|------|--------|---------|
| POST | `/pool/:poolId/add-passenger` | PASSENGER (own ride) | Join existing Tesla |
| GET | `/pool/:poolId/passengers` | DRIVER (own pool) | Passenger manifest |

### Trips (Driver)
| Method | Path | Access | Purpose |
|--------|------|--------|---------|
| GET | `/trips/my-active` | DRIVER | Current trip |
| PATCH | `/trips/:poolId/arrive` | DRIVER (own pool) | Arrived at pickup |
| PATCH | `/trips/:poolId/start` | DRIVER (own pool) | Set off |
| PATCH | `/trips/:poolId/complete` | DRIVER (own pool) | Finish |

### History, Payments, Locations
| Method | Path | Access | Purpose |
|--------|------|--------|---------|
| GET | `/history/passenger` | PASSENGER | Ride history |
| GET | `/history/driver` | DRIVER | Trip history |
| POST | `/payments/:rideId` | PASSENGER (own ride) | Pay for completed ride |
| GET | `/payments/my` | PASSENGER | Payment history |
| GET | `/location` | public | All locations |
| GET | `/location/:id` | public | One location |
| GET | `/health` | public | Liveness + DB round-trip |

> Drivers poll `/matching/requests` and `/trips/my-active`. No WebSocket/push.

---

## Matching & Routing

**Predefined Dhaka zones** (8 locations, seeded):
- Banani, Gulshan, Mohakhali, Dhanmondi, Mirpur, Uttara, Farmgate, Bashundhara

**Matching rules** (applied consistently for Nusrat + Rafiq):
- Same pickup zone → detour = 0, fits = true
- Compatible routes → detour ≤ 5 km (Dijkstra on road graph)
- Same destination zone prioritized

**Road graph** — seeded with edges; Dijkstra computes shortest paths. Banani → Mohakhali = 8 km (matches PRD).

---

## Capacity Enforcement (Concurrency-Safe)

The one rule that must never break:

1. **Service transaction** — `assignRideToPool` locks the Tesla row with `SELECT ... FOR UPDATE`, then re-checks seats allocated. Every booking for a given Tesla queues behind that one row lock.
2. **Race example** — Bullet has 1 seat left. Nusrat and Shirin request it simultaneously. They serialize behind the lock; second reads committed total and is refused with `409 NO_SEAT_AVAILABLE`.
3. **API** — Refused seat surfaces as `409` with seats-left message, not a crash.

The vehicle row is locked *before* the capacity read (not after), and it's the vehicle (not pool) because the pool row doesn't exist yet for the first booking.

---

## Authentication

- **Access token** — JWT, 15 min, stored in **memory only** (never localStorage)
- **Refresh token** — httpOnly cookie, 7 days, `SameSite=lax`, `Secure` in production
- **Auto-refresh** — On 401, client calls `/auth/refresh-token` once, retries original request
- **Logout** — Clears memory + revokes refresh token + blacklists access token until expiry

> No localStorage for access tokens. On page refresh, a fresh access token is acquired via the httpOnly refresh cookie.

---

## Database Schema (Key Tables)

| Table | Purpose |
|-------|---------|
| `users` | id, name, email, password_hash, role |
| `vehicles` | id, driver_id, model, capacity, current_location_id, status |
| `rides` | id, passenger_id, pickup/destination_location_id, seats, status, fare, fare_breakdown, timestamps |
| `pools` | id, vehicle_id, driver_id, status, capacity, current_route (JSONB) |
| `pool_rides` | pool_id, ride_id, seats_allocated |
| `payments` | id, ride_id, passenger_id, amount, method, status |
| `ride_history` | ride_id, actor_id, action, created_at |
| `locations` | id, name (8 Dhaka zones) |
| `road_edges` | from_location_id, to_location_id, distance_km |

---

## Git Workflow

**Required branches:**
- `master` — production-ready
- `pre-release` — staging
- `release/<version>` — tagged releases
- `feature/*` — feature branches (e.g., `feature/passenger-auth`, `feature/tesla-pooling`, `feature/driver-flow`)

**Flow:**
```
feature/* → merge → master → pre-release → release/v1.0.0
```

**Commit format:**
```
type(scope): short description
```

| Type | Example |
|------|---------|
| `feat(auth)` | add passenger login endpoint |
| `feat(pool)` | enforce Bullet's seat capacity |
| `fix(pool)` | prevent overbooking available seats |
| `build(docker)` | add compose setup for api and postgres |
| `chore(frontend)` | final polish and documentation pass |

**Avoid:** meaningless commits, committing secrets, pushing finished app as one commit, developing on master.

---

## Testing & Concurrency

### What to verify
- ✅ Capacity never exceeded (SELECT FOR UPDATE + 409)
- ✅ Invalid state transitions rejected (409 on wrong order)
- ✅ Correct pooled fares (210 solo, 170 pooled)
- ✅ User cannot modify others' rides (403 on foreign resources)
- ✅ Cancellation rules (REQUESTED/MATCHED only)
- ✅ **Concurrent seat booking** — Bullet has 1 seat; Nusrat and Shirin request simultaneously → serialization via row lock prevents corruption

### Running tests
```bash
# Backend
cd backend && npm test

# Frontend
cd frontend && npm run test
```

### Manual concurrency test
```bash
# Two terminals, same time:
curl -X POST http://localhost:8000/matching/1/accept -H "Authorization: Bearer $TOKEN_NUSRAT" &
curl -X POST http://localhost:8000/matching/1/accept -H "Authorization: Bearer $TOKEN_SHIRIN" &
# Exactly one succeeds; other gets 409 "The last seat was just taken"
```

---

## Deployment

**Free-tier only** (per PRD):

| Component | Platform | Notes |
|-----------|----------|-------|
| Database | Neon / Supabase / Railway | Free PostgreSQL tier |
| Backend | Render / Railway / Fly.io | Free tier, auto-sleep OK |
| Frontend | Vercel / Netlify / Cloudflare Pages | Static SPA, Vite build |

**Production env changes:**
- `NODE_ENV=production`
- `secure: true` on refresh cookie
- `CORS_ORIGIN=https://your-frontend.domain`
- Generate real secrets: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

**Health check:** `GET /health` returns `{ success: true, status: "ok", database: "up", uptime }`

---

## Trade-offs & Limitations

| Area | Decision | Trade-off |
|------|----------|-----------|
| Routing | Predefined zones + Dijkstra | No real-time traffic, no Google Maps |
| Real-time | Polling (10s) | No WebSocket; slight delay on board updates |
| Payments | Simulated (Cash/TeslaPay) | No Stripe/PayPal integration |
| Scale | Single Postgres, no read replicas | Good for MVP; needs read replicas at 100k+ |
| Auth | JWT + httpOnly cookie | No MFA, no OAuth providers |
| Matching | Same pickup zone + detour ≤ 5km | No ML ranking, no dynamic pricing |

### When to switch later
| Trigger | Switch to |
|---------|-----------|
| >100k active users | Read replicas, Redis caching, horizontal API scaling |
| Real-time needed | WebSocket / Server-Sent Events |
| Multi-city | Geospatial index (PostGIS), H3 hexagons |
| Real payments | Stripe Connect, webhook reconciliation |
| Complex matching | Dedicated matching service, message queue |

---

## AI Usage

**Tools used:**
- **ChatGPT** — Bug fixes, implementation queries, architecture decisions
- **Codex** — Frontend polish, component refinement, linting fixes

**What they helped with:**
- Debugging token refresh race conditions
- Designing the `SELECT ... FOR UPDATE` capacity enforcement
- Refactoring frontend auth to keep access token in memory (not localStorage)
- Polishing React components, fixing lint errors, Tailwind class organization

**One accepted suggestion:**
> Using a single `client.js` as the only `fetch()` call site, with centralized 401→refresh→retry logic. This eliminated duplicate auth code across 12 service files.

**One rejected/modified suggestion:**
> **Suggestion:** Store access token in localStorage for persistence across refreshes.  
> **Rejected:** Violates security requirement — access tokens must stay in memory only. Modified to store *nothing* on client; on load, app calls `/auth/refresh-token` via httpOnly cookie to get a fresh token.

---

## Demo Video (Max 6 min)

| Time | Content |
|------|---------|
| 0:00–1:00 | Problem, users (Jashim, Nusrat, Rafiq, Shirin), core idea |
| 1:00–3:00 | Architecture, backend modules, frontend data flow, DB schema, ride lifecycle, key decisions (capacity lock, token storage) |
| 3:00–6:00 | Live demo: Passenger flow → Driver flow → Pooling → Fare breakdown → Edge case (concurrent seat grab) → Deploy |

---

## Evaluation Focus (What's Graded)

- Product understanding — does the app solve the stated problem?
- Engineering process — commits, branches, PRs, no secrets, no master commits
- Backend/database design — schema, constraints, capacity enforcement, state machine
- Frontend quality — correct flows, loading/error/empty states, no hardcoded data
- Docker/deployment — `docker compose up` works, free-tier deployable
- Testing/documentation — concurrency test, concurrency docs, README completeness
- Ownership — can explain every line, debug, change confidently

---

## Important Rules (Enforced)

- ❌ Pay for infrastructure
- ❌ Commit secrets (`.env` in `.gitignore`)
- ❌ Push finished app as one commit
- ❌ Develop everything directly on `master`
- ❌ Add unnecessary technologies (no Kafka, K8s, Redis unless justified)
- ❌ Polish UI while data integrity is broken

---

## Final Note

This project demonstrates the engineering loop:

**Understand → Design → Build → Commit → Test → Ship → Explain → Debug → Change**

The goal is not just a working app, but a production-minded engineering process.

---

## License

MIT — use freely for learning or as a starter for your own ride-pooling service.