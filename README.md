# Dhaka Tesla Pool

Dhaka Tesla Pool is a full-stack ride-pooling MVP for passengers and drivers travelling between predefined Dhaka locations. Passengers request seats, drivers accept compatible journeys, and the application calculates a shared route, tracks trip stages, explains each fare, and records a simulated payment after completion.

The project demonstrates graph-based routing, pickup/drop-off insertion, role-based access, PostgreSQL transactions, and a responsive React interface. Vehicle registration is a local application feature; there is no Tesla vehicle API integration.

![Dhaka Tesla Pool landing page](docs/screenshots/01-home.png)

## Contents

- [Problem statement](#problem-statement)
- [Features implemented](#features-implemented)
- [Screenshots](#screenshots)
- [Architecture](#architecture)
- [Database design](#database-design)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Environment variables](#environment-variables)
- [Local setup](#local-setup)
- [Docker setup](#docker-setup)
- [Migrations and seeds](#migrations-and-seeds)
- [Demo credentials and walkthrough](#demo-credentials-and-walkthrough)
- [Deployment URL and deployment notes](#deployment-url-and-deployment-notes)
- [API overview](#api-overview)
- [Key decisions and trade-offs](#key-decisions-and-trade-offs)
- [Known limitations](#known-limitations)
- [Next improvements](#next-improvements)
- [AI Usage](#ai-usage)

This README is the central guide to the application, setup, architecture, and operating workflows.

## Problem statement

A driver with spare seats and passengers travelling in a similar direction need a way to coordinate a shared journey. Assigning passengers by availability alone can produce excessive detours, overbooked vehicles, unclear fares, and inconsistent trip states.

This project models that problem using a small road graph of Dhaka. A booking must fit the vehicle's capacity and route, preserve pickup-before-drop-off ordering, and expose a clear progression from request to completion. Drivers and passengers see their own workflows, while the backend owns routing, authorization, fares, and persisted state.

## Features implemented

| Area | Implemented behavior |
| --- | --- |
| Accounts | Register as `PASSENGER` or `DRIVER`, log in/out, restore sessions, and update name/email. Passwords use bcrypt; protected endpoints use JWT and role checks. |
| Passenger requests | Choose pickup/destination from seeded locations, request a positive number of seats, list rides, inspect a ride's route/fare/timeline, and cancel before driver arrival. |
| Driver vehicle | Register one vehicle through the normal application flow, edit its details, set current location, and switch online/offline. |
| Driver route planning | Calculate and save a route from a selected current location to a destination. Planning a replacement route is blocked while a pool is active. |
| Matching | Show drivers waiting requests with seat availability and route compatibility. Drivers can accept a specific request; a separate API endpoint supports automatic candidate ranking. |
| First-passenger route change | When a request does not fit an unused plan, preview and explicitly accept a replacement route. Later passengers must fit the shared route's detour limit. |
| Pooling | Insert pickup/drop-off stops, enforce the 2 km incremental detour rule, and check seats in a database transaction. Passengers can also join an existing pool using its number. |
| Trip management | Driver actions move eligible rides through arrival, start, and completion. The active-trip screen includes a passenger manifest, occupancy, and full shared route. |
| Fares | Store and display base fare, distance charge, pool discount, and total in whole BDT. Calculation uses the passenger's own shortest-path distance. |
| Payments and history | Record `CASH` or `TESLA_WALLET` as a simulated payment for a completed ride; view payment records, passenger history, and completed driver trips. |
| Interface | Responsive role-specific navigation, shared controls, search/filtering, loading/error/empty states, password visibility, action confirmations, and manual Refresh controls. |
| Operations | Database-aware health endpoint, SQL migrations, repeatable reference-data seeds, and Docker Compose. |

The normal ride lifecycle is:

```text
REQUESTED -> MATCHED -> DRIVER_ARRIVED -> ONGOING -> COMPLETED
    |           |
    +-----------+-----> CANCELLED
```

Cancellation is available only in `REQUESTED` or `MATCHED`. Creating a request does not automatically dispatch a driver. An acceptance or explicit pool join confirms the fare and assignment.

## Screenshots

These images are supplied in [`docs/screenshots`](docs/screenshots). They show the local demo flow; ride and pool IDs depend on the database contents. Still screenshots are included; there is no GIF asset in the repository.

<details>
<summary>Driver: vehicle availability and route planning</summary>

![Driver vehicle and saved Banani-to-Gulshan route](docs/screenshots/02-driver-route.png)

</details>

<details>
<summary>Passenger: request a ride</summary>

![Passenger selects Banani, Mohakhali, and one seat](docs/screenshots/03-request-ride.png)

</details>

<details>
<summary>Driver: preview a route change before accepting the first passenger</summary>

![Explicit change-route-and-accept action with replacement route preview](docs/screenshots/04-change-route.png)

</details>

<details>
<summary>Driver: shared route, passenger manifest, and trip actions</summary>

![Active pool with two passengers and arrival, start, and completion controls](docs/screenshots/05-active-trip.png)

</details>

<details>
<summary>Passenger: ride status, fare breakdown, route, and timeline</summary>

![Passenger ride detail with 210 BDT fare and shared route](docs/screenshots/06-passenger-trip.png)

</details>

The optional `node docs/capture-screenshots.mjs` command runs from the repository root with the Docker frontend on port `5173`, its `/api` proxy, and the API on port `8000`. It requires Node 22.13+ or 24 and Chrome/Edge (`CHROME_PATH` overrides the browser executable). Use a disposable seeded local database with no active demo-driver trip: the script creates demo data, overwrites the six screenshots, completes a demo trip, and takes the driver offline. A failed capture can leave a partially advanced trip.

## Architecture

![System architecture showing the React client, Nginx, Express services, and PostgreSQL](docs/system-architecture.png)

In local development, Vite serves the frontend on port `5173`, and the browser calls Express on port `8000`. In Docker, Nginx serves the built frontend and forwards `/api/*` to `backend:8000`, stripping `/api`. For example, browser request `/api/auth/login` becomes backend request `/auth/login`.

Backend modules follow `route -> middleware -> controller -> service -> repository -> PostgreSQL`. Middleware handles authentication, roles, and request-body validation; services implement business rules; repositories contain parameterized SQL. The graph and fare modules are internal services rather than public endpoints.

The frontend uses React context for authentication, service files for endpoint calls, and one shared HTTP client for bearer tokens, cookies, response parsing, and one refresh/retry after an expired access token. Access tokens stay in memory; refresh tokens use an HttpOnly cookie. Screens load data on entry and refresh after actions or when the user selects Refresh.

## Database design

![Database ERD for users, vehicles, locations, routes, rides, pools, payments, and authentication](docs/database-design.png)

The supplied ERD shows the 12 application tables. The migration runner also creates `schema_migrations` to track applied SQL files.

| Tables | Responsibility |
| --- | --- |
| `users`, `vehicles` | Account roles and driver vehicle details. The service checks for an existing vehicle before registration. |
| `locations`, `road_edges` | Named locations and weighted road links used to build an undirected graph. |
| `driver_routes` | Saved driver plans, including JSONB path and distance. |
| `rides` | Passenger requests, seats, status timestamps, integer fare, and JSONB fare breakdown. |
| `pools`, `pool_rides` | Vehicle/driver journeys and passenger assignments; route snapshots and allocated seats. |
| `ride_history` | Lifecycle events and the user responsible for each event. |
| `payments` | Recorded payment amount, method, and status for a passenger's ride. |
| `refresh_tokens`, `token_blacklist` | Stored refresh sessions and revoked token records. |

Relationships are enforced with foreign keys. `pool_rides` is the pool-to-ride association; `(pool_id, ride_id)` is unique. This does **not** enforce that a ride can belong to only one pool across concurrent requests. Additional integrity gaps are documented under [known limitations](#known-limitations).

## Tech stack

Versions below describe the repository's package declarations and Docker images.

| Layer | Technologies |
| --- | --- |
| Frontend | JavaScript ES modules, React 19.2, React Router 7, Vite 8.3, Tailwind CSS 4.3 |
| Backend | Node.js, CommonJS JavaScript, Express 5.2, `pg` 8.23 |
| Validation and auth | Zod 4.6, bcrypt 6, jsonwebtoken 9, cookie-parser, CORS |
| Persistence | PostgreSQL 16, handwritten SQL migrations, JSONB route/fare snapshots |
| Linting | ESLint 10 |
| Containers | Docker Compose, Node 20 Alpine images, PostgreSQL 16 Alpine, Nginx Alpine |

The application uses browser `fetch` and local UI components. There is no ORM, external mapping service, payment gateway, or Tesla SDK in the dependency list.

## Project structure

```text
dhaka-tesla-pool/
|-- README.md                       Project overview and operating guide
|-- docker-compose.yml              PostgreSQL, backend, frontend services
|-- backend/
|   |-- .env.example                Safe configuration template
|   |-- Dockerfile                  Migrate, seed, then start the API
|   |-- package.json                Backend commands and dependencies
|   |-- scripts/
|   |   `-- create-demo-accounts.js  Local demo account registration
|   `-- src/
|       |-- app.js                  Express routes and middleware
|       |-- server.js               DB check and HTTP listener
|       |-- config/env.js           Environment loading and required checks
|       |-- database/               Connection, migrations, and seeds
|       |-- middleware/             Auth, roles, validation, error handling
|       |-- modules/                auth, users, vehicles, location, graph,
|       |                           routes, rides, matching, pools, trips,
|       |                           fare, payment, history
|       `-- utils/                  Error and response helpers
|-- frontend/
|   |-- .env.example                Public API base URL template
|   |-- Dockerfile                  Vite build and Nginx runtime
|   |-- nginx.conf                  SPA fallback and /api proxy
|   `-- src/
|       |-- api/                    Shared fetch client and response parser
|       |-- context/                Auth provider and context
|       |-- routes/                 Route table and access guards
|       |-- pages/                  Public, auth, passenger, driver, account
|       |-- components/             UI, layout, ride, and driver components
|       |-- hooks/                  Data loading and auth hooks
|       |-- services/               Backend endpoint adapters
|       `-- lib/                    Formatting and enum constants
`-- docs/
    |-- system-architecture.png
    |-- database-design.png
    |-- screenshots/                Six application screenshots
    `-- capture-screenshots.mjs      Local screenshot automation
```

## Prerequisites

- For local development: Node.js and npm, PostgreSQL 16, and Git. Node 24 is the version used for the checks below. The locked frontend tools require Node `20.19+`, `22.13+`, or `24+` on their respective supported major lines; the backend alone declares `>=20`.
- For the full container setup: Docker with the Compose plugin and a running engine. Host Node/PostgreSQL installations are unnecessary unless running host-side utility scripts.
- Available ports: `5173` for the frontend, `8000` for the API, and `5432` for PostgreSQL. Vite fails if `5173` is occupied.
- For optional screenshot capture: Node 22.13+ or Node 24, Chrome/Edge, and the Docker-style `/api` proxy described in the Docker setup below.

## Environment variables

Use [`backend/.env.example`](backend/.env.example) and [`frontend/.env.example`](frontend/.env.example). Commit the examples only. Real `.env` and `.env.local` files are ignored by Git. No real secrets are included in this documentation.

### Backend: `backend/.env`

| Variable | Example/default | Purpose |
| --- | --- | --- |
| `NODE_ENV` | `development` | `production` enables the Secure refresh cookie and suppresses error stacks in responses. |
| `PORT` | `8000` | Local backend listening port. Compose fixes the internal port at `8000`. |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed browser origin; comma-separate multiple origins. |
| `DB_HOST` | `localhost` | Host-run backend database host; Compose overrides it to `postgres`. Required. |
| `DB_PORT` | `5432` | Database port. Set explicitly as in the template. |
| `DB_NAME` | `tesla_pool` | Existing database name. Required. |
| `DB_USER` | `postgres` | Database user. Required. |
| `DB_PASSWORD` | `postgres` | Local demonstration password only; replace for deployment. Required. |
| `JWT_ACCESS_SECRET` | `change-me-to-a-long-random-string` | Access-token signing key. Required; replace the placeholder. |
| `JWT_REFRESH_SECRET` | `change-me-to-a-different-long-random-string` | Separate refresh-token signing key. Required; replace the placeholder. |
| `ACCESS_TOKEN_EXPIRE` | `15m` | Access JWT lifetime; defaults to `15m` if omitted. |
| `REFRESH_TOKEN_EXPIRE` | `7d` | Refresh JWT lifetime; defaults to `7d` if omitted. |

Generate each signing key separately and paste the values into your uncommitted environment file:

```sh
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

The boot-time check validates the presence of required values, not their strength or whether the two signing keys differ. Cookie and token-record expiry durations contain fixed 7-day/15-minute values; changing JWT lifetimes alone does not update those durations.

### Frontend: `frontend/.env.local`

| Variable | Local value | Docker build value |
| --- | --- | --- |
| `VITE_API_URL` | `http://localhost:8000` | `/api` |

Vite embeds this value in the browser bundle at build time. Never place secrets in `VITE_*` variables. The Dockerfile sets `/api` explicitly and does not copy `.env.local`; changing a runtime container variable will not change the built frontend.

`DEMO_API_URL` optionally overrides the demo script's default `http://localhost:8000`, but the script accepts only localhost/loopback hosts. `CHROME_PATH` optionally selects the screenshot script's browser executable. Neither is required by the application.

## Local setup

Run from a checked-out copy of this repository. The steps below use a locally installed PostgreSQL server.

### 1. Create configuration files

PowerShell, from the repository root (existing local files are preserved):

```powershell
if (!(Test-Path backend/.env)) { Copy-Item backend/.env.example backend/.env }
if (!(Test-Path frontend/.env.local)) { Copy-Item frontend/.env.example frontend/.env.local }
```

Bash alternative:

```bash
test -f backend/.env || cp backend/.env.example backend/.env
test -f frontend/.env.local || cp frontend/.env.example frontend/.env.local
```

Set `DB_HOST=localhost`, use your PostgreSQL credentials, and replace both JWT placeholders in `backend/.env`. Keep the frontend API URL at `http://localhost:8000` for this setup.

### 2. Create the database

With PostgreSQL running, create the database if it does not already exist:

```sh
createdb -h localhost -p 5432 -U postgres tesla_pool
```

Use the user/database names from your environment file if different. If `createdb` is not on PATH, use PostgreSQL's command-line tools or create `tesla_pool` through your database client. Migrations create tables inside the database; they do not create the database itself.

### 3. Install and run the backend

In terminal 1, from the repository root:

```sh
cd backend
npm ci
npm run migrate
npm run seed
npm run dev
```

The API is available at [localhost:8000](http://localhost:8000). [GET /health](http://localhost:8000/health) performs a real database query. Use `npm start` instead of `npm run dev` to run without Nodemon; neither command automatically migrates or seeds outside Docker.

### 4. Install and run the frontend

In terminal 2, from the repository root:

```sh
cd frontend
npm ci
npm run dev
```

Open [localhost:5173](http://localhost:5173). On Windows, use `npm.cmd` if PowerShell blocks the `npm.ps1` launcher.

For a local production-build check, run `npm run build`, then `npm run preview -- --port 5173` from `frontend/` after stopping Vite. Reusing port `5173` keeps the default backend CORS origin valid. Vite preview does not provide the Docker Nginx `/api` proxy, so use the direct backend URL for this build.

## Docker setup

Create `backend/.env` from its example as above and set the JWT keys. Then, from the repository root:

```sh
docker compose up --build -d
docker compose ps
docker compose logs --tail=100 backend
```

| Service | Local access | Container behavior |
| --- | --- | --- |
| Frontend | [http://localhost:5173](http://localhost:5173) | Nginx serves the Vite build on port 80. |
| API via frontend | [http://localhost:5173/api/health](http://localhost:5173/api/health) | Nginx strips `/api` and forwards to Express. |
| API directly | [http://localhost:8000/health](http://localhost:8000/health) | Express listens on container port 8000. |
| Database | `localhost:5432` | PostgreSQL 16 with the named `postgres_data` volume. |

PostgreSQL must pass its health check before the backend starts. The backend startup command runs pending migrations, seeds the reference graph, then starts Express. The frontend waits for the backend health check. Source code is copied into images, so code changes require rebuilding.

**Compose environment distinction:** `env_file: ./backend/.env` supplies backend auth/CORS values, but Compose explicitly overrides database values with `${DB_*}` substitutions and defaults. Plain `docker compose up` therefore uses the default database name/user/password unless those variables are supplied to Compose through the shell or a root `.env`. To use the database values from `backend/.env` for interpolation too, use:

```sh
docker compose --env-file backend/.env up --build -d
```

Use the same `--env-file backend/.env` option consistently for subsequent Compose commands when choosing this form. Compose still uses `DB_HOST=postgres` internally. An existing database volume retains its original PostgreSQL user/password; changing environment variables does not reset that database.

Useful commands:

```sh
docker compose logs --tail=100 frontend backend postgres
docker compose exec backend npm run migrate
docker compose exec backend npm run seed
docker compose down
```

`docker compose down` retains the database volume. Adding `--volumes` deletes the stored database and should be used only for an intentional disposable-data reset.

## Migrations and seeds

Run these commands from `backend/` for local development:

| Command | Effect |
| --- | --- |
| `npm run migrate` | Applies unapplied `src/database/migrations/up/*.sql` files in filename order, in individual transactions. |
| `npm run migrate:down` | Rolls back one most recently applied migration using its matching down file. This can drop a table and its data. |
| `npm run seed` | Inserts reference locations and road edges; creates no users, vehicles, bookings, or payments. |
| `npm run demo:accounts` | Registers the three local demo accounts through the running API. |

`schema_migrations` records filenames, so rerunning migration-up skips applied files. Editing an already-applied file will not update an existing database; add a new migration for schema changes. The numbering gap at `007` is harmless because the runner discovers files rather than requiring consecutive numbers.

The seed contains **8 locations** (Banani, Gulshan, Mohakhali, Dhanmondi, Mirpur, Uttara, Farmgate, Bashundhara) and **10 road-edge rows**. Each edge is traversable in both directions in the in-memory graph. Distances are demonstration weights, not measured traffic-aware distances. Sequential reruns skip existing records; there is no database uniqueness constraint protecting road edges against concurrent seed runs.

## Demo credentials and walkthrough

These are deliberately public, local-only accounts defined in [`create-demo-accounts.js`](backend/scripts/create-demo-accounts.js), not production credentials. They exist only after running the script or registering them manually. With the API running on port `8000`, run from the repository root:

```sh
node backend/scripts/create-demo-accounts.js
```

Or run `npm run demo:accounts` from `backend/`. Existing accounts remain unchanged, including their passwords.

| Role | Email | Password |
| --- | --- | --- |
| Driver | `jashim.demo@example.test` | `DemoRide2026!` |
| Passenger | `nusrat.demo@example.test` | `DemoRide2026!` |
| Passenger | `rafiq.demo@example.test` | `DemoRide2026!` |

For a Docker-only machine without host Node, the image does not include `scripts/`. Copy and run the standalone registration script in the running backend container:

```sh
docker compose cp backend/scripts/create-demo-accounts.js backend:/tmp/create-demo-accounts.js
docker compose exec backend node /tmp/create-demo-accounts.js
```

Use separate browser profiles or a normal/private window for the driver and passenger; tabs in the same profile share the refresh cookie. Sign out between the two passenger accounts if using one passenger window.

1. Sign in as Jashim. In **My Tesla**, register a vehicle such as `Bullet`, capacity `4`, current location **Banani**, and go online.
2. Plan **Banani -> Gulshan**. The seeded graph gives a 3 km route.
3. Sign in as Nusrat and request **Banani -> Mohakhali**, one seat.
4. As Jashim, open **Ride requests** and select **Refresh**. The request exceeds the original route's 2 km detour limit. Choose **Change route and accept** to explicitly replace the unused plan with **Banani -> Gulshan -> Mohakhali**, 8 km.
5. As Rafiq, request **Gulshan -> Mohakhali**, one seat. Jashim can accept it into the same pool. Alternatively, Rafiq can use **Join a pool** with the pool number shown in the driver's active trip.
6. Refresh both trip screens. The driver sees two occupied seats and two remaining. Nusrat's 8 km first-passenger fare is **210 BDT**; Rafiq's 5 km pooled fare is **125 BDT**. The first fare is not retrospectively discounted.
7. As the driver, select **Mark as arrived**, then start and complete the trip in order. Refresh the passenger screen after each change.
8. As each passenger, record a payment for the completed ride using `CASH` or `TESLA_WALLET`. Review payments and history; the driver can review the completed trip and plan another route.

For a separate cancellation demonstration, cancel a waiting or matched ride before driver arrival. See the cancellation limitations below before cancelling every passenger in an active pool.

## Deployment URL and deployment notes

**Public deployment URL: not yet provided by the project owner.** No public deployment address was found in the application configuration inspected for this documentation. The addresses below are local development/demo URLs, not a hosted deployment.

| Entry | URL |
| --- | --- |
| Local frontend | [http://localhost:5173](http://localhost:5173) |
| Local API | [http://localhost:8000](http://localhost:8000) |
| Local API health | [http://localhost:8000/health](http://localhost:8000/health) |

The included Compose file runs the complete application on one machine. Hosting it requires configuring the actual domain, HTTPS termination, secrets, and persistent storage. Use `NODE_ENV=production`, set `CORS_ORIGIN` to the public frontend origin, replace demonstration credentials, and protect database access. The refresh cookie becomes Secure in production, so the browser-facing deployment needs HTTPS.

A single public origin with `/api` forwarding matches the supplied Nginx configuration and the `SameSite=Lax` cookie. A frontend and API on different sites require revisiting cookie/CORS settings. Separately hosting the frontend also requires setting `VITE_API_URL` **before** the production build. The repository does not include TLS certificates, a managed-database SSL configuration, or an automated deployment pipeline.

## API overview

Direct local API base: `http://localhost:8000`. Through Docker Nginx: `http://localhost:5173/api`.

Protected requests use `Authorization: Bearer <access-token>`. Login sets the HttpOnly `refreshToken` cookie; browser calls include credentials. Successful resource responses normally use `{ "success": true, "message": "...", "data": ... }`; errors use `{ "success": false, "message": "..." }`. The root and health endpoints have their own response shapes.

| Module | Main operations |
| --- | --- |
| `/auth` | Register, login, refresh access token, logout |
| `/users/me` | Read and update the signed-in user's profile |
| `/location` | Public location list and detail |
| `/vehicle` | Driver vehicle creation, editing, and availability |
| `/driver-routes` | Save and retrieve the driver's route |
| `/rides` | Passenger requests, own rides, cancellation, authorized event timeline |
| `/matching` | Driver request board, specific acceptance, automatic matching |
| `/pool` | Passenger joins by pool number; owning driver reads manifest |
| `/trips` | Driver active-trip view and arrival/start/completion actions |
| `/history` | Passenger ride history and driver completed-trip history |
| `/payments` | Passenger payment recording and payment history |

Paths such as `/api/rides` apply only through Nginx; Express itself exposes `/rides`. Endpoint definitions live in each backend module's route file.

## Key decisions and trade-offs

| Decision | Benefit | Trade-off |
| --- | --- | --- |
| Small seeded graph and Dijkstra | Routes are deterministic and can be explained without an external API. | Demonstration distances exclude traffic, one-way roads, GPS, and real ETAs. |
| Stop insertion with a 2 km incremental limit | Preserves existing stop order and a saved driver destination while allowing sharing. | Optimizes a new insertion, not the globally best ordering of every passenger; cumulative detours can exceed 2 km. |
| Modular Express service/repository layout | Business rules and SQL remain easy to locate in one deployable API. | Transaction boundaries and repeated queries must be managed explicitly. |
| PostgreSQL transactions and row locks | Matching rechecks seats and rebuilds the route against the locked pool. | Locks cover a vehicle/pool, but additional cross-vehicle ride-claim guarantees are still needed. |
| JSONB route/fare snapshots | Reads can return the accepted route and fare breakdown directly. | JSON structure is maintained by application code and must be kept consistent with relational changes. |
| Whole-BDT fare model | Totals can be verified by hand. | No fractional-currency accounting; seats requested do not multiply the fare. |
| In-memory access token plus HttpOnly refresh cookie | The browser client can restore sessions without persisting access tokens in localStorage. | Cookie lifetime, origin policy, revocation storage, and refresh failures need explicit handling. |
| Manual Refresh and a small React stack | Simple client state and no persistent connection service. | Updates from another user's session are not pushed automatically. |
| Migrate/seed at container startup | A fresh local demo starts with the expected schema and locations. | Multiple production replicas need coordinated migrations rather than simultaneous startup changes. |

## Known limitations

- **Demo scope:** only eight predefined locations; no address search, live GPS, traffic-aware routing, per-stop navigation, real payment processing, wallet balance, driver verification, or admin console.
- **Trip granularity:** arrival/start/completion act on eligible rides in a pool together. The model does not track each vehicle's progress through individual pickup/drop-off stops. An `ACTIVE` pool can still receive requests after some rides have started.
- **Fare policy:** the first passenger pays the solo fare; later joiners receive a discount on their distance charge only. Existing fares are not repriced, and a request for several seats still receives one distance-based fare. Matching writes the fare after the assignment transaction, leaving a consistency gap if that final write fails.
- **Concurrency/integrity:** there is no unique ride-only pool membership constraint or atomic cross-vehicle claim. Payment deduplication is a check followed by an insert, without a unique ride constraint. Matching uses the pool's capacity snapshot, while direct pool joining checks the live vehicle capacity. These paths need stronger shared invariants before production use.
- **Cancellation:** seats are removed, but the pool route is not recomputed and an empty active pool is not closed automatically. Cancelling all its rides can leave the driver unable to complete or replace that pool through the normal UI.
- **History:** direct passenger pool-join updates the ride but does not add an `ACCEPTED` history event. The standard driver-accept path does record it.
- **Auth/operations:** refresh tokens are stored as token text, expiry cleanup and refresh rotation are absent, some expiry metadata is hardcoded, and rate limiting/password reset/email verification are not implemented. Startup checks do not validate signing-key strength.
- **Scale:** no pagination, graph cache, WebSocket updates, or committed CI workflow. The graph is rebuilt from database rows for each shortest-path lookup, including repeated lookups during insertion search.

## Next improvements

1. Make ride claiming, fare persistence, and lifecycle checks atomic across all booking paths; add database constraints to protect against duplicate claims, capacity changes, and duplicate payments.
2. Recalculate routes after cancellation, close empty pools, record join events, and gate new bookings according to trip progress.
3. Define a consistent pricing policy for multiple seats and first-passenger discounts; add idempotent payment handling before integrating a real provider.
4. Automate frontend lint and production builds in CI.
5. Add configurable production secrets/expiry handling, refresh rotation/cleanup, rate limits, database SSL support, backups, and a controlled migration step.
6. Add pagination and graph/path caching, then evaluate live updates and real mapping data against the needs of a larger deployment.

## AI Usage

AI assistance was used as an engineering aid during implementation and documentation. The project owner reports the following tools and purposes:

| Tool | Use |
| --- | --- |
| OpenAI Codex | Frontend polishing. For this documentation update, repository inspection, documentation drafting, and linking the existing screenshots/diagrams. |
| ChatGPT | Implementation questions, help investigating/fixing bugs, and project documentation. |

The documentation was checked against routes, services, SQL migrations, package scripts, Docker configuration, and the supplied images. That review distinguishes implemented behavior from future improvements.

**Accepted suggestion — awaiting the project owner's specific example.** Record the actual AI suggestion, where it was incorporated, and why it was useful. The confirmed use of Codex for frontend polish does not establish which individual suggestion was accepted.

**Rejected or changed suggestion — awaiting the project owner's specific example.** Record what the AI proposed, what was rejected or changed, and the engineering reason. This history cannot be inferred reliably from the final source code.

These two entries are intentionally marked pending rather than inventing an AI decision history. They should be completed with the owner's answers before submission. A useful account explains the behavior or trade-off that was evaluated, the final decision, and how it was checked; the amount of AI assistance alone does not demonstrate engineering understanding.
