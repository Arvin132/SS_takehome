# SwishOS Stage 2 — Fleet Soiling & Cleaning Advisor

Turns per-plant solar telemetry into a daily recommendation of which plants are worth sending a
cleaning crew to, lets an asset manager act on that recommendation, and uses an LLM (Gemini, via
LangChain/LangGraph) to generate a justified day summary. See
`swishsolar_round2_take_home_assessment.pdf` for the full spec and `DECISIONS.md` for the
reasoning behind every non-obvious choice below.

## Stack

- **Backend**: Django + Django REST Framework, served by `manage.py runserver` (dev). API is
  mounted at `/api/` (`core`) and `/api/analytics/` (`analytics`); admin at `/admin/`.
- **Database**: PostgreSQL 16 (via Docker) — a deliberate deviation from the brief/CLAUDE.md's
  original SQLite-only plan; see `DECISIONS.md`.
- **Background worker**: Django-Q2 (`manage.py qcluster`), using the database itself as the task
  broker — no Redis/Celery.
- **Frontend**: Vite + React 19 + TypeScript + Tailwind 4, talking to the backend via
  `VITE_API_URL`.
- **LLM**: LangChain/LangGraph + `langchain-google-genai` (Gemini) for the AI day-summary
  feature. Optional — if `GEMINI_API_KEY` isn't set, that feature degrades to a "failed" summary
  row instead of breaking anything else.

## Prerequisites

- Docker + Docker Compose (recommended path below), **or** Python 3.12+ / Node 20+ if running
  each half natively (see "Running without Docker").
- These ports must be free on your machine before running `docker compose up`:

  | Port | Service |
  |------|---------|
  | `5432` | PostgreSQL |
  | `8000` | Django API |
  | `5173` | Vite dev server (frontend) |

## Quickstart (Docker Compose)

From a clean clone, in the repo root:

```bash
# 1. Optional: enable the AI day-summary feature.
#    Everything else works fine without this file.
echo "GEMINI_API_KEY=your-key-here" > .env

# 2. Build and start db + backend + q2_worker + frontend
docker compose up --build
```

This runs migrations, creates the cache table, bootstraps the analytics schedule, and starts the
API on `http://localhost:8000` and the frontend on `http://localhost:5173`.

The database starts empty. Seed it with the fixture fleet data (12 plants × 120 days by default)
by running the seeding command inside the running `backend` container:

```bash
docker compose exec backend python manage.py seed_fleet_data
```

This generates fresh CSVs via the root `seed_data.py` (dated relative to "today", since the
brief's `days_until_next_reset` math is date-relative) and loads them into Postgres, along with
pre-determined dev accounts:

- Admin: `admin` / `solar123`
- Scoped users: same `solar123` password, seeded across ~60% of the plant population

Once seeded, open `http://localhost:5173` and log in.

To stop everything: `docker compose down` (add `-v` to also drop the Postgres volume if you want
a totally clean slate next time).

## Running without Docker

**Backend** (from `backend/`, with a venv active — you'll need a local Postgres instance since
`settings.py` no longer defaults to SQLite):

```bash
pip install -r reqs.txt
python manage.py migrate
python manage.py createcachetable
python manage.py bootstrap_schedule
python manage.py seed_fleet_data
python manage.py runserver 0.0.0.0:8000    # API
python manage.py qcluster                   # background worker, separate process
```

Set `DB_NAME` / `DB_USER` / `DB_PASSWORD` / `DB_HOST` / `DB_PORT` env vars if your local Postgres
differs from the `solar` / `postgres` / `postgres` / `localhost` / `5432` defaults.

**Frontend** (from `frontend/`):

```bash
npm install
npm run dev        # http://localhost:5173, expects backend on http://localhost:8000
npm run build
npm run lint
npm run preview
```

Set `VITE_API_URL` if the backend isn't on `http://localhost:8000`.

## Environment variables

| Variable | Where | Required? | Purpose |
|---|---|---|---|
| `GEMINI_API_KEY` | `.env` (root, read by `q2_worker`) | No | Enables the LLM-generated day summary. Absent = feature degrades, rest of the app is unaffected. |
| `GEMINI_MODEL` | `.env` (root) | No | Defaults to `gemini-2.5-flash`. |
| `DB_NAME` / `DB_USER` / `DB_PASSWORD` / `DB_HOST` / `DB_PORT` | backend env | No (Docker sets these) | Postgres connection, only needed to override when running the backend natively. |
| `VITE_API_URL` | frontend env | No (Docker sets this) | Where the frontend expects the API; defaults to `http://localhost:8000`. |

`.env` is gitignored — never commit it.

## More context

- `DECISIONS.md` — every non-obvious implementation choice, what was rejected, its cost, and its
  falsifier. Read this before changing architecture.
- `CODING.md` — coding patterns/style for this repo.
- `swishsolar_round2_take_home_assessment.pdf` — the original spec.
