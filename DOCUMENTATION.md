# Dhaka Tesla Pool — Complete Project Documentation

---

## 1. Summary & Problem Statement

### 1.1 Project Overview
**Dhaka Tesla Pool** is a ride-pooling service specifically designed for Dhaka, Bangladesh. The platform connects passengers heading in similar directions with Tesla-driving partners, allowing them to share rides and split fares — reducing both cost per passenger and the number of vehicles on Dhaka's congested roads.

### 1.2 Problem Statement
- Dhaka is one of the world's most densely populated cities with severe traffic congestion
- Traditional ride-hailing is expensive for daily commuters
- Empty seats in private vehicles represent wasted capacity
- No existing service combines EV (Tesla) fleet with algorithmic ride-pooling for Dhaka's specific geography

### 1.3 Solution
A full-stack web application with:
- **Passenger app**: Request rides, track status, view history, make payments
- **Driver app**: Register Tesla, go online/offline, view/accept requests, manage active trips
- **Intelligent matching**: Dijkstra-based routing on predefined Dhaka zones with detour constraints
- **Concurrency-safe pooling**: Row-level locking ensures capacity is never exceeded
- **Fair fare model**: Base fare + distance charge – pool discount

---

## 2. Features Implemented

### 2.1 Passenger Features (Nusrat, Rafiq, Shirin)
| Feature | Endpoint | Status |
|---------|----------|--------|
| Sign up / Sign in | `POST /auth/register`, `POST /auth/login` | ✅ Implemented |
| Request ride (pickup, destination, seats) | `POST /rides` | ✅ Implemented |
| View estimated fare (computed at match time) | Via ride response | ✅ Implemented |
| Track ride status | `GET /rides/my`, `GET /rides/:id/history` | ✅ Implemented |
| Ride lifecycle: REQUESTED → MATCHED → DRIVER_ARRIVED → STARTED → COMPLETED | State machine | ✅ Implemented |
| Cancel ride (only while REQUESTED/MATCHED) | `PATCH /rides/:id/cancel` | ✅ Implemented |
| View ride history with timeline | `GET /history/passenger` | ✅ Implemented |
| Pay for completed rides (Cash / TeslaPay wallet) | `POST /payments/:rideId` | ✅ Implemented |
| Payment history | `GET /payments/my` | ✅ Implemented |
| Join existing pool | `POST /pool/:poolId/add-passenger` | ✅ Implemented |

### 2.2 Driver Features (Jashim)
| Feature | Endpoint | Status |
|---------|----------|--------|
| Sign in | `POST /auth/login` | ✅ Implemented |
| Register Tesla (model, capacity, location) | `POST /vehicle` | ✅ Implemented |
| View own Tesla | `GET /vehicle/me` | ✅ Implemented |
| Go online / offline | `PATCH /vehicle/status` | ✅ Implemented |
| Browse open requests with detour/fit info | `GET /matching/requests` | ✅ Implemented |
| Accept specific ride request | `POST /matching/:rideId/accept` | ✅ Implemented |
| Auto-match (best Tesla wins) | `POST /matching/:rideId` | ✅ Implemented |
| Trip control: Arrive / Start / Complete | `PATCH /trips/:poolId/arrive\|start\|complete` | ✅ Implemented |
| View passenger manifest with fares | `GET /pool/:poolId/passengers` | ✅ Implemented |
| Driver trip history with fares | `GET /history/driver` | ✅ Implemented |

### 2.3 Pool & Ride Management
- Multiple passenger requests share one Tesla
- Occupied seats never exceed vehicle capacity (enforced via `SELECT ... FOR UPDATE`)
- Individual fare per passenger (solo 210 BDT vs pooled 170 BDT for 8km)
- Clear pool membership and lifecycle (CREATED → ACTIVE → COMPLETED/CANCELLED)
- Route optimization for multi-stop pickup/drop-off ordering

### 2.4 Fare Model
```
passengerFare = baseFare + distanceCharge - poolDiscount
```

| Component | Value | Notes |
|-----------|-------|-------|
| `baseFare` | 50 BDT | Fixed per trip, never discounted |
| `distanceCharge` | 20 BDT/km | Rounded to nearest Taka |
| `poolDiscount` | 25% of distance | Only when sharing a Tesla |

**Worked Example** — Banani → Mohakhali (8 km):
```
Solo:    50 + round(8 × 20)           = 50 + 160        = 210 BDT
Pooled:  50 + 160 − round(160 × 0.25) = 50 + 160 − 40   = 170 BDT
```

- Money stored as **integer Taka** (no decimals)
- Payment methods: **Cash** or **Simulated TeslaPay wallet** (no real gateway)

### 2.5 Ride Lifecycle (State Machine)
```
REQUESTED → MATCHED/ACCEPTED → DRIVER_ARRIVED → STARTED → COMPLETED
     \            \                         (CANCELLED)
      \            `→ CANCELLED
```
- Forward only; no backward moves, no skipped stages
- `409` on invalid transition (guarded in SQL with `WHERE status = ...`)
- Each stage timestamped and written to `ride_history`
- `GET /rides/:id/history` shows full trail with actor + timestamp

### 2.6 Authentication & Security
- **Access token**: JWT, 15 min, stored in **memory only** (never localStorage)
- **Refresh token**: httpOnly cookie, 7 days, `SameSite=lax`, `Secure` in production
- **Auto-refresh**: On 401, client calls `/auth/refresh-token` once, retries original request
- **Logout**: Clears memory + revokes refresh token + blacklists access token until expiry
- Role-based access control (PASSENGER / DRIVER) via middleware

---

## 3. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            DHAKA TESLA POOL ARCHITECTURE                    │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────┐     HTTPS/REST (JSON)      ┌──────────────┐     pg      ┌──────────────┐
│   FRONTEND   │  ◄───────────────────────►  │   BACKEND    │  ◄───────►  │  DATABASE    │
│  (React 19)  │   Cookies + Bearer Token    │  (Express 5) │   (pool)    │  (PostgreSQL)│
│  + Vite 8    │                             │  + Node 20+  │             │    14+       │
│  + Tailwind 4│                             │              │             │              │
└──────────────┘                             └──────────────┘             └──────────────┘
       │                                            │                        │
       │                                            │                        │
       ▼                                            ▼                        ▼
┌──────────────┐                             ┌──────────────┐       ┌──────────────┐
│  COMPONENTS  │                             │   MODULES    │       │   TABLES     │
│              │                             │              │       │              │
│ • Pages      │                             │ • auth       │       │ • users      │
│ • Components │                             │ • users      │       │ • vehicles   │
│   - ui       │                             │ • vehicles   │       │ • rides      │
│   - layout   │                             │ • location   │       │ • pools      │
│   - driver   │                             │ • graph      │       │ • pool_rides │
│   - ride     │                             │ • rides      │       │ • payments   │
│ • Hooks      │                             │ • matching   │       │ • ride_hist  │
│ • Context    │                             │ • pools      │       │ • locations  │
│ • Services   │                             │ • trips      │       │ • road_edges │
│ • Routes     │                             │ • routes     │       │ • refresh_tk │
│              │                             │ • history    │       │ • bl_tokens  │
│              │                             │ • payment    │       │ • drv_routes │
│              │                             │ • fare       │       │              │
└──────────────┘                             └──────────────┘       └──────────────┘

DATA FLOW:
1. User interacts with React SPA (port 5173)
2. API calls → Express backend (port 8000) via fetch() with credentials:include
3. Backend validates JWT (memory) / refresh cookie (httpOnly)
4. Business logic in services, SQL in repositories
5. PostgreSQL executes queries, returns data
6. Response envelope: { success, message, data } → Frontend updates UI
```

### 3.1 Backend Module Architecture
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

### 3.2 Frontend Module Architecture
```
frontend/src/
├── api/client.js          # Single fetch() call site; auth, refresh, envelope
├── components/
│   ├── ui/                # 9 reusable primitives (Button, Input, Select…)
│   ├── layout/            # AppShell, Navbar, PageContainer
│   ├── driver/            # RequestCard, PassengerManifest
│   └── ride/              # FareBreakdown, HistoryTable, RouteSummary
├── context/AuthProvider.jsx
├── hooks/useApi.js, useAuth.js, usePolling.js
├── lib/format.js, constants.js
├── pages/
│   ├── auth/              # LoginPage, RegisterPage
│   ├── passenger/         # RequestRide, MyRides, RideDetail, JoinPool, Payments, History
│   └── driver/            # MyTesla, Requests, ActiveTrip, History
├── routes/                # AppRoutes, ProtectedRoute, RoleRoute, PublicOnlyRoute
└── services/              # One file per backend module (URL building only)
```

---

## 4. Tech Stack

### 4.1 Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | >=20 | Runtime |
| Express | 5.2.1 | Web framework |
| PostgreSQL | 14+ | Primary database |
| pg | 8.23.0 | PostgreSQL client (pool) |
| jsonwebtoken | 9.0.3 | JWT signing/verification |
| bcrypt | 6.0.0 | Password hashing |
| zod | 4.6.5 | Request validation |
| cors | 2.8.6 | CORS handling |
| cookie-parser | 1.4.7 | Cookie parsing |
| morgan | 1.12.1 | HTTP logging |
| dotenv | 18.0.3 | Environment config |
| nodemon | 3.1.14 | Dev hot-reload |

### 4.2 Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.2.8 | UI library |
| Vite | 8.3.0 | Build tool / dev server |
| React Router DOM | 7.18.4 | Client-side routing |
| Tailwind CSS | 4.3.3 | Utility-first styling |
| @tailwindcss/vite | 4.3.3 | Vite plugin for Tailwind v4 |
| ESLint | 10.10.0 | Linting |
| @vitejs/plugin-react | 6.1.1 | React Fast Refresh |

### 4.3 Infrastructure
| Technology | Purpose |
|------------|---------|
| Docker / docker-compose | Containerization |
| PostgreSQL 14+ (Docker image) | Database container |
| Free-tier hosting targets | Neon/Supabase/Railway (DB), Render/Railway/Fly.io (API), Vercel/Netlify/Pages (FE) |

---

## 5. Project Structure

```
dhaka-tesla-pool/
├── backend/
│   ├── package.json
│   ├── package-lock.json
│   ├── .env.example
│   ├── .env                 # gitignored
│   ├── src/
│   │   ├── server.js
│   │   ├── app.js
│   │   ├── config/env.js
│   │   ├── database/
│   │   │   ├── db.js
│   │   │   ├── migrate.js
│   │   │   ├── testConnection.js
│   │   │   ├── migrations/up/001-013_create_*.sql
│   │   │   ├── seeds/location.seed.js
│   │   │   ├── seeds/roadEdge.seed.js
│   │   │   └── seeds/runSeeds.js
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js
│   │   │   ├── role.middleware.js
│   │   │   ├── validate.middleware.js
│   │   │   ├── asyncHandler.js
│   │   │   ├── errorHandler.js
│   │   │   └── notFound.js
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   ├── vehicles/
│   │   │   ├── location/
│   │   │   ├── graph/
│   │   │   ├── rides/
│   │   │   ├── matching/
│   │   │   ├── pools/
│   │   │   ├── trips/
│   │   │   ├── routes/
│   │   │   ├── history/
│   │   │   ├── payment/
│   │   │   └── fare/
│   │   └── utils/
│   │       ├── AppError.js
│   │       └── response.js
│   └── dockerfile (if present)
├── frontend/
│   ├── package.json
│   ├── package-lock.json
│   ├── vite.config.js
│   ├── index.html
│   ├── public/favicon.svg
│   ├── src/
│   │   ├── main.jsx
│   │   ├── index.css
│   │   ├── App.jsx
│   │   ├── api/client.js
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   ├── layout/
│   │   │   ├── driver/
│   │   │   └── ride/
│   │   ├── context/
│   │   │   ├── AuthProvider.jsx
│   │   │   └── auth.context.js
│   │   ├── hooks/
│   │   │   ├── useApi.js
│   │   │   ├── useAuth.js
│   │   │   └── usePolling.js
│   │   ├── lib/
│   │   │   ├── format.js
│   │   │   └── constants.js
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   ├── passenger/
│   │   │   └── driver/
│   │   ├── routes/
│   │   │   ├── AppRoutes.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   ├── PublicOnlyRoute.jsx
│   │   │   └── RoleRoute.jsx
│   │   └── services/
│   │       ├── auth.service.js
│   │       ├── user.service.js
│   │       ├── ride.service.js
│   │       ├── matching.service.js
│   │       ├── pool.service.js
│   │       ├── payment.service.js
│   │       ├── vehicle.service.js
│   │       ├── location.service.js
│   │       └── history.service.js
│   └── dockerfile (if present)
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

## 6. Prerequisites

| Requirement | Version | Notes |
|-------------|---------|-------|
| Node.js | >=20 | Backend uses ES modules, Express 5 |
| npm | >=10 | Package manager |
| Docker & Docker Compose | Latest | For containerized deployment |
| PostgreSQL | 14+ | If running without Docker |
| Git | Latest | Version control |

---

## 7. Environment Variables

### 7.1 Backend `.env.example`
```bash
# Database (REQUIRED)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tesla_pool
DB_USER=postgres
DB_PASSWORD=your_secure_password

# JWT Secrets (REQUIRED - MUST BE DIFFERENT)
JWT_ACCESS_SECRET=your_48_byte_hex_string_for_access_tokens
JWT_REFRESH_SECRET=your_48_byte_hex_string_for_refresh_tokens

# Token Expiry (optional)
ACCESS_TOKEN_EXPIRE=15m
REFRESH_TOKEN_EXPIRE=7d

# Server (optional)
PORT=8000
NODE_ENV=development

# CORS (optional)
CORS_ORIGIN=http://localhost:5173
```

### 7.2 Frontend `.env.example`
```bash
# API URL (optional, defaults to http://localhost:8000)
VITE_API_URL=http://localhost:8000
```

### 7.3 Generate Secure Secrets
```bash
# Run this to generate 48-byte (96 char) hex secrets
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

> **Important**: The two JWT secrets **must be different**. They sign access/refresh tokens independently; a shared key would let a refresh token be replayed as an access token.

---

## 8. Local Setup

### 8.1 Docker (Recommended)
```bash
# 1. Clone and configure
git clone <repo-url>
cd dhaka-tesla-pool
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

### 8.2 Manual Start (Without Docker)

#### Backend
```bash
cd backend
cp .env.example .env        # Edit DB credentials
npm install
npm run migrate             # Applies migrations
npm run seed                # Seeds locations + roads
npm run dev                 # :8000 with nodemon
```

#### Frontend
```bash
cd frontend
npm install
npm run dev                 # http://localhost:5173
```

### 8.3 Migration & Seed Commands
```bash
# Backend
npm run migrate             # Apply all up migrations in order
npm run migrate:down        # Rollback last migration
npm run seed                # Seed locations + road edges
```

---

## 9. Running the Application

### 9.1 Development Mode
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev

# Access:
# Frontend: http://localhost:5173
# Backend API: http://localhost:8000
# Health check: http://localhost:8000/health
```

### 9.2 Production Build
```bash
# Frontend
cd frontend && npm run build    # Outputs to dist/

# Backend
cd backend && npm start         # Runs node src/server.js
```

### 9.3 Demo Credentials (After Seeding)
The seed script only creates locations and road edges. **No user accounts are seeded**. Create accounts via the UI:

1. Open http://localhost:5173
2. Click "Sign Up" 
3. Create accounts with roles:
   - **Driver**: Name "Jashim", role DRIVER → then register Tesla "Bullet" (4 seats)
   - **Passengers**: "Nusrat", "Rafiq", "Shirin" with role PASSENGER

---

## 10. API Overview

### 10.1 Base Configuration
- **Base URL**: `http://localhost:8000`
- **Response Envelope**: `{ "success": boolean, "message": string, "data": ... }`
- **Auth**: `Authorization: Bearer <accessToken>` (access tokens 15 min; refresh token httpOnly cookie, 7 days)

### 10.2 Auth Endpoints
| Method | Path | Access | Purpose |
|--------|------|--------|---------|
| POST | `/auth/register` | public | Create account (PASSENGER/DRIVER) |
| POST | `/auth/login` | public | Sign in, sets refresh cookie |
| POST | `/auth/refresh-token` | cookie | Mint new access token |
| POST | `/auth/logout` | authenticated | Revoke current token |

### 10.3 User Endpoints
| Method | Path | Access | Purpose |
|--------|------|--------|---------|
| GET | `/users/me` | authenticated | Own profile |
| PATCH | `/users/me` | authenticated | Update own profile |

### 10.4 Vehicle Endpoints (Driver)
| Method | Path | Access | Purpose |
|--------|------|--------|---------|
| POST | `/vehicle` | DRIVER | Register Tesla |
| GET | `/vehicle/me` | DRIVER | Own Tesla |
| PATCH | `/vehicle/status` | DRIVER | Go online/offline |
| PATCH | `/vehicle/:id` | DRIVER | Update Tesla (own only) |

### 10.5 Ride Endpoints (Passenger)
| Method | Path | Access | Purpose |
|--------|------|--------|---------|
| POST | `/rides` | PASSENGER | Request a ride |
| GET | `/rides/my` | PASSENGER | Own rides |
| GET | `/rides/:id/history` | owner or driver | Full lifecycle trail |
| PATCH | `/rides/:id/cancel` | PASSENGER (owner) | Cancel before departure |

### 10.6 Matching Endpoints (Driver)
| Method | Path | Access | Purpose |
|--------|------|--------|---------|
| GET | `/matching/requests` | DRIVER | Open requests with detour/fit |
| POST | `/matching/:rideId/accept` | DRIVER | Accept with own Tesla |
| POST | `/matching/:rideId` | DRIVER | Auto-match, best Tesla wins |

### 10.7 Pool Endpoints
| Method | Path | Access | Purpose |
|--------|------|--------|---------|
| POST | `/pool/:poolId/add-passenger` | PASSENGER (own ride) | Join existing Tesla |
| GET | `/pool/:poolId/passengers` | DRIVER (own pool) | Passenger manifest |

### 10.8 Trip Endpoints (Driver)
| Method | Path | Access | Purpose |
|--------|------|--------|---------|
| GET | `/trips/my-active` | DRIVER | Current trip |
| PATCH | `/trips/:poolId/arrive` | DRIVER (own pool) | Arrived at pickup |
| PATCH | `/trips/:poolId/start` | DRIVER (own pool) | Set off |
| PATCH | `/trips/:poolId/complete` | DRIVER (own pool) | Finish |

### 10.9 History, Payments, Locations
| Method | Path | Access | Purpose |
|--------|------|--------|---------|
| GET | `/history/passenger` | PASSENGER | Ride history |
| GET | `/history/driver` | DRIVER | Trip history |
| POST | `/payments/:rideId` | PASSENGER (own ride) | Pay for completed ride |
| GET | `/payments/my` | PASSENGER | Payment history |
| GET | `/location` | public | All locations |
| GET | `/location/:id` | public | One location |
| GET | `/health` | public | Liveness + DB round-trip |

> **Note**: Drivers poll `/matching/requests` and `/trips/my-active` every 10s. No WebSocket/push.

---

## 11. Key Decisions & Trade-offs

| Area | Decision | Trade-off |
|------|----------|-----------|
| **Routing** | Predefined zones (8) + Dijkstra on seeded graph | No real-time traffic, no Google Maps API costs |
| **Real-time** | Polling (10s interval) | No WebSocket; slight delay on board updates |
| **Payments** | Simulated (Cash / TeslaPay wallet) | No Stripe/PayPal integration; no real money |
| **Scale** | Single Postgres, no read replicas | Good for MVP; needs read replicas at 100k+ users |
| **Auth** | JWT (memory) + httpOnly refresh cookie | No MFA, no OAuth providers (Google/Apple) |
| **Matching** | Same pickup zone + detour ≤ 2km | No ML ranking, no dynamic pricing |
| **Capacity** | `SELECT ... FOR UPDATE` on vehicle row | Serializes concurrent bookings; slight latency |
| **State Machine** | SQL CHECK constraints + application logic | Forward-only transitions enforced at DB level |

### 11.1 When to Switch Later
| Trigger | Switch to |
|---------|-----------|
| >100k active users | Read replicas, Redis caching, horizontal API scaling |
| Real-time needed | WebSocket / Server-Sent Events |
| Multi-city | Geospatial index (PostGIS), H3 hexagons |
| Real payments | Stripe Connect, webhook reconciliation |
| Complex matching | Dedicated matching service, message queue |

---

## 12. Known Limitations

1. **No real-time push** — Drivers must wait up to 10s for new requests to appear
2. **Fixed zones only** — Cannot request arbitrary lat/lng; only 8 predefined Dhaka areas
3. **Simulated payments** — No actual payment gateway integration
4. **No driver earnings dashboard** — Only trip history with fares
5. **No passenger ratings / driver ratings** — Trust system not implemented
6. **No ride scheduling** — Only immediate ride requests
7. **Single city** — Hardcoded to Dhaka locations and road graph
8. **No admin panel** — No operational tooling for platform operators
9. **No automated testing suite** — Manual testing only (see Testing section)
10. **No observability stack** — No metrics, tracing, or structured logging beyond morgan

---

## 13. Next Improvements (Roadmap)

### 13.1 High Priority
- [ ] Add automated test suite (unit + integration + concurrency)
- [ ] Implement WebSocket for real-time request updates
- [ ] Add Stripe test mode for real payment flow
- [ ] Build admin dashboard (user management, ride oversight, analytics)

### 13.2 Medium Priority
- [ ] Passenger/driver rating system
- [ ] Ride scheduling (future pickup time)
- [ ] PostGIS migration for geospatial queries
- [ ] Multi-city support with dynamic zone configuration
- [ ] Driver earnings breakdown and payout tracking

### 13.3 Low Priority / Nice to Have
- [ ] Push notifications (FCM/APNs)
- [ ] ML-based demand prediction and dynamic pricing
- [ ] Carbon footprint tracking per ride
- [ ] Corporate accounts / B2B billing
- [ ] Accessibility audit (WCAG 2.1 AA)

---

## 14. Testing & Concurrency

### 14.1 What to Verify
- ✅ Capacity never exceeded (`SELECT FOR UPDATE` + 409)
- ✅ Invalid state transitions rejected (409 on wrong order)
- ✅ Correct pooled fares (210 solo, 170 pooled for 8km)
- ✅ User cannot modify others' rides (403 on foreign resources)
- ✅ Cancellation rules (REQUESTED/MATCHED only)
- ✅ **Concurrent seat booking** — Bullet has 1 seat; Nusrat and Shirin request simultaneously → serialization via row lock prevents corruption

### 14.2 Running Tests
```bash
# Backend
cd backend && npm test

# Frontend
cd frontend && npm run test
```

> **Note**: As of this documentation, `npm test` scripts are not configured in package.json. This is a known gap.

### 14.3 Manual Concurrency Test
```bash
# Two terminals, same time:
curl -X POST http://localhost:8000/matching/1/accept -H "Authorization: Bearer $TOKEN_NUSRAT" &
curl -X POST http://localhost:8000/matching/1/accept -H "Authorization: Bearer $TOKEN_SHIRIN" &
# Exactly one succeeds; other gets 409 "The last seat was just taken"
```

---

## 15. Deployment

### 15.1 Free-Tier Targets (Per PRD)
| Component | Platform Options | Notes |
|-----------|------------------|-------|
| Database | Neon / Supabase / Railway | Free PostgreSQL tier |
| Backend | Render / Railway / Fly.io | Free tier, auto-sleep OK |
| Frontend | Vercel / Netlify / Cloudflare Pages | Static SPA, Vite build |

### 15.2 Production Environment Changes
```bash
NODE_ENV=production
# Cookie secure flag
# CORS_ORIGIN=https://your-frontend.domain
# Generate real secrets:
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### 15.3 Health Check
```
GET /health
Response: { success: true, status: "ok", database: "up", uptime }
```

### 15.4 Docker Production Build
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d
```

---

## 16. Git Workflow

### 16.1 Required Branches
- `master` — production-ready
- `pre-release` — staging
- `release/<version>` — tagged releases (e.g., `release/v1.0.0`)
- `feature/*` — feature branches (e.g., `feature/passenger-auth`, `feature/tesla-pooling`, `feature/driver-flow`)

### 16.2 Flow
```
feature/* → merge → master → pre-release → release/v1.0.0
```

### 16.3 Commit Format
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

### 16.4 Rules (Enforced)
- ❌ Pay for infrastructure
- ❌ Commit secrets (`.env` in `.gitignore`)
- ❌ Push finished app as one commit
- ❌ Develop everything directly on `master`
- ❌ Add unnecessary technologies (no Kafka, K8s, Redis unless justified)
- ❌ Polish UI while data integrity is broken

---

## 17. AI Usage Disclosure

### 17.1 Tools Used
- **ChatGPT** — Bug fixes, implementation queries, architecture decisions
- **Codex** — Frontend polish, component refinement, linting fixes

### 17.2 What They Helped With
- Debugging token refresh race conditions
- Designing the `SELECT ... FOR UPDATE` capacity enforcement
- Refactoring frontend auth to keep access token in memory (not localStorage)
- Polishing React components, fixing lint errors, Tailwind class organization

### 17.3 One Accepted Suggestion
> **Using a single `client.js` as the only `fetch()` call site, with centralized 401→refresh→retry logic.** This eliminated duplicate auth code across 12 service files.

### 17.4 One Rejected/Modified Suggestion
> **Suggestion:** Store access token in localStorage for persistence across refreshes.  
> **Rejected:** Violates security requirement — access tokens must stay in memory only. Modified to store *nothing* on client; on load, app calls `/auth/refresh-token` via httpOnly cookie to get a fresh token.

---

## 18. Database Schema Reference (Key Tables)

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `users` | Authentication & profiles | id, name, email, password_hash, role |
| `vehicles` | Tesla registry | id, driver_id, model, capacity, status, current_location_id |
| `rides` | Passenger ride requests | id, passenger_id, pickup/destination_location_id, seats, status, fare, fare_breakdown, timestamps |
| `pools` | Active Tesla pools | id, vehicle_id, driver_id, status, capacity, current_route (JSONB) |
| `pool_rides` | Pool ↔ Ride mapping | pool_id, ride_id, seats_allocated, pickup_order, dropOff_order |
| `payments` | Payment records | id, ride_id, passenger_id, amount, method, status |
| `ride_history` | Audit trail | ride_id, actor_id, action, created_at |
| `locations` | Dhaka zones | id, name, latitude, longitude |
| `road_edges` | Road graph edges | from_location_id, to_location_id, distance_km |
| `refresh_tokens` | Valid refresh tokens | user_id, token, expires_at |
| `token_blacklist` | Revoked tokens | token, expires_at |
| `driver_routes` | Planned driver routes | driver_id, start/dest_location_id, route (JSONB) |

---

## 19. Core Algorithms

### 19.1 Dijkstra Shortest Path (`graph.service.js`)
- Computes shortest path between any two locations on seeded road graph
- Used for: fare distance calculation, detour estimation, route optimization

### 19.2 Route Optimization (`pooling.route.optimizer.js`)
- **Input**: Current route (array of location IDs), new pickup, new destination
- **Algorithm**: Generate all valid insertion permutations (pickup before destination), collapse consecutive duplicates, score by total distance
- **Constraint**: Detour ≤ 2 km (`MAX_DETOUR_DISTANCE`)
- **Output**: Optimized route with minimum added distance

### 19.3 Matching Score (`matching.service.js`)
```
score = 100 - extraDistance * 5 + availableSeats * 2
```
- Prefers shorter detours, then more spare seats
- Candidates sorted descending; first successful claim wins

### 19.4 Capacity Enforcement (Concurrency-Safe)
```sql
-- In matchingRepository.assignRideToPool:
BEGIN;
SELECT * FROM vehicles WHERE id = $1 FOR UPDATE;  -- Lock vehicle row
-- Re-check seats allocated in active pool
-- Insert pool if needed
-- Insert pool_rides
-- Update ride status to MATCHED
COMMIT;
```
- Vehicle row locked **before** capacity read
- Pool row doesn't exist for first booking → vehicle is the coordination point
- Second concurrent request reads committed total, gets 409

---

## 20. Frontend State Management

### 20.1 Auth Flow
1. App loads → `AuthProvider` calls `/auth/refresh-token` via httpOnly cookie
2. On success: access token stored in **React state (memory only)**
3. On failure: user stays logged out, redirected to `/login`
4. All API calls use `client.js` which attaches `Authorization: Bearer <token>`
5. On 401: single `refreshAccessToken()` promise shared across callers, retry once
6. On logout: clear memory + call `/auth/logout` (revokes refresh cookie + blacklists access token)

### 20.2 Data Fetching
- `useApi(serviceFn, deps)` hook: loading/error/data/reload pattern
- `usePolling(reloadFn, enabled, interval)` hook: polls while enabled
- Services in `src/services/*.js` build URLs only; no fetch logic

### 20.3 Route Protection
- `ProtectedRoute`: Requires authentication
- `PublicOnlyRoute`: Redirects authenticated users away from login/register
- `RoleRoute`: Requires specific role (PASSENGER/DRIVER)

---

## 21. File Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| React Components | PascalCase | `RequestCard.jsx`, `AppShell.jsx` |
| Hooks | camelCase + `use` prefix | `useApi.js`, `useAuth.js` |
| Services | camelCase + `.service.js` | `ride.service.js`, `auth.service.js` |
| Repositories | camelCase + `.repository.js` | `ride.repository.js` |
| Controllers | camelCase + `.controller.js` | `ride.controller.js` |
| Routes | camelCase + `.routes.js` | `ride.routes.js` |
| Validations | camelCase + `.validation.js` | `ride.validation.js` |
| Utils | PascalCase | `AppError.js`, `response.js` |
| Constants | UPPER_SNAKE_CASE | `ROLES`, `RIDE_STATUS` |
| Migrations | `NNN_description.sql` | `001_create_users.sql` |
| Seeds | camelCase + `.seed.js` | `location.seed.js` |

---

## 22. Error Handling Patterns

### 22.1 Backend
- `AppError` class: `message`, `statusCode`, `code` (for programmatic handling)
- `asyncHandler` wrapper: catches async errors, passes to Express error middleware
- `errorHandler.js`: formats all errors into `{ success: false, message, data: null }`
- Validation via Zod schemas in `*.validation.js` → `validate.middleware.js`

### 22.2 Frontend
- `client.js` throws `Error` with `error.status` for HTTP errors
- `useApi` hook catches errors, sets `error` state for UI display
- Components render `Alert` component with `tone="error"`

---

## 23. License

MIT — use freely for learning or as a starter for your own ride-pooling service.

---

## 24. Final Note

This project demonstrates the engineering loop:

**Understand → Design → Build → Commit → Test → Ship → Explain → Debug → Change**

The goal is not just a working app, but a production-minded engineering process.
