# LedgerMatch: Payment Reconciliation Platform

## GitHub Pages demo

**[Open the interactive demo](https://tusharpanthri.github.io/ledger-match/)**

The Pages build runs entirely in the browser using 48 fictional reconciliation records in USD dated September 17–28, 2026. Explore the dashboard, daily trends, transactions, status/method filters, pagination and linked reconciliation details. These fixtures illustrate outcomes; they do not run the Python matching engine or connect to payment providers. Ask AI is available only in the full backend-connected app.

To build and preview the standalone demo:

```bash
cd apps/web
npm ci
npm run build:pages
npm run preview -- --base=/ledger-match/
```

Open `http://localhost:4173/ledger-match/`. Hash-based URLs such as `#/reconciliations` support direct links and reloads on static hosting. `.env.pages` enables sample-data mode only for the Pages build; normal `npm run dev` / `npm run build` retain the backend-connected app.

`.github/workflows/pages.yml` tests, builds and deploys changes to `main`. The repository's **Settings → Pages → Source** must be set to **GitHub Actions**.

LedgerMatch is a local demonstration application for comparing internal payments with simulated Stripe, PayPal and bank transfer records. It exposes confidence scores, discrepancies and missing records through a React dashboard and FastAPI API. **Provider records are simulated; there are no live payment-provider integrations.** This is not a production-ready financial system.

## What LedgerMatch does

LedgerMatch demonstrates payment reconciliation: checking that a business's internal payment records agree with records reported by a payment processor or bank.

For example, an internal record may show a $100 payment while a simulated provider record shows $97 after a $3 fee. The matching engine compares the amount, fee, currency, date and available identifying fields, then assigns a confidence score and reconciliation status. It can also identify differing amounts, provider records with no internal counterpart, internal payments with no provider record, and multiple possible matches.

The Dashboard summarizes those results, Transactions lists internal payments, Reconciliations lets you inspect matches and discrepancies, and Ask AI supports natural-language database questions when an Anthropic API key is configured. The intended use is a local portfolio/demo workflow for exploring reconciliation logic, not processing or moving money.

## Features

- Generate sample internal payments and simulate provider records, including orphan records.
- Run confidence-based reconciliation using amount, fees, currency, card/IBAN information, VAT and date proximity. The match threshold is 65%; the maximum score depends on available fields.
- Browse and filter transactions and reconciliation results; inspect record details and scoring.
- View match rate, status/provider breakdowns, mixed-currency discrepancy totals and daily trends.
- Query the database in plain English through Ask AI (optional Anthropic API key).
- Import seven n8n workflows for seeding, simulation and reconciliation.
- Responsive navigation, a skip link, visible keyboard focus, reduced-motion support and an on-screen simulation disclosure.
- Sample data is generated in USD by default; the UK merchant uses GBP.

Reconciliation statuses: matched, matched with fee, amount mismatch, missing internal, missing external and duplicate.

## Architecture

`apps/api` contains async FastAPI routers, SQLAlchemy models/services, PostgreSQL access, the reconciliation engine and Pandas trend aggregation. Ask AI uses LangChain and Anthropic to generate SQL and explain query results.

`apps/web` uses React, TypeScript, Vite, TanStack Query/Table, shadcn/ui, Tailwind CSS and Recharts.

`n8n/workflows` contains workflow exports, and `scripts/initial-seed.sh` orchestrates the demo through HTTP calls.

Amounts are stored as integers in minor currency units. Provider data lives in separate tables. On startup, SQLAlchemy `create_all` creates any missing tables; it is not a migration system and does not drop or recreate existing tables.

## Setup and configuration

Requirements: Node.js 22.12+ (the web Docker build uses Node 24), Python 3.12+ and PostgreSQL 16. Docker Compose can run PostgreSQL, n8n, the API and the web app together.

From the repository root, copy `.env.example` to `.env` and edit it:

```sh
cp .env.example .env
# PowerShell: Copy-Item .env.example .env
```

Set `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_PORT`, and optionally `POSTGRES_HOST` (defaults to localhost for local API execution). Compose supplies its internal database host. Set `ANTHROPIC_API_KEY` only if using Ask AI; remove the placeholder otherwise. `CORS_ORIGINS` is a comma-separated list of permitted web origins. The root `.env` is loaded by the local API when started from `apps/api`, and Compose also reads it for interpolation.

Compose settings include `API_PORT` (8000), `WEB_PORT` (3000), `N8N_PORT` (5678), `N8N_USER`, `N8N_PASSWORD` and `TIMEZONE`. The example credentials are intended for local demo use only.

### Docker Compose

```sh
docker compose up -d --build
```

Open the web app at http://localhost:3000, API docs at http://localhost:8000/docs and n8n at http://localhost:5678 (adjust URLs for custom ports). The API must be running before seeding. Stop with `docker compose down`; deleting volumes also deletes demo data.

### Local development

```sh
docker compose up -d postgres n8n
cd apps/api
python -m venv .venv
# macOS/Linux:
source .venv/bin/activate
# PowerShell instead: .venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
fastapi dev app/main.py
```

In another terminal:

```sh
cd apps/web
npm ci
npm run dev
```

Open http://localhost:5173. The frontend defaults to `http://localhost:8000`; set `VITE_API_URL` at development/build time to use another API origin. Compose passes this build argument automatically. Backend requirements specify minimum versions rather than a fully pinned dependency set.

## Demo workflow

With the API running, run `npm run initial-seed` from the root (requires Bash and curl), or call these endpoints from Swagger UI in order:

1. `POST /seed/currencies`, `/seed/providers`, `/seed/merchants`.
2. `POST /payments/generate?count=15`.
3. `POST /stripe-payments/simulate`, `/paypal-payments/simulate`, `/bank-payments/simulate`.
4. Optionally call each provider's `/simulate-orphan?count=2` endpoint to demonstrate missing internal records.
5. `POST /reconciliations/run`.

Then explore the Dashboard, Transactions, Reconciliations and a result's detail page. To demonstrate missing external records, generate more internal payments and reconcile before simulating provider records. Ask AI requires a valid key and database access; an example question is "What is the match rate?"

For n8n, import the JSON files in `n8n/workflows` and execute WF1 → WF2 → WF3/WF4/WF5 → optional WF7 → WF6. WF2 to WF6 contain schedules; activate them only if continued simulation is desired. Workflow URLs use `http://host.docker.internal:8000`; adapt them to your Docker host and API port where necessary.

The API docs list the current contracts. GET endpoints include `/health`, `/payments`, `/reconciliations`, `/reconciliations/summary`, `/reconciliations/trends`, `/reconciliations/missing-external` and `/reconciliations/{id}`. `POST /ask` accepts a JSON `question`. Request examples are in `apps/api/http`.

## Testing

With the API virtual environment activated, run from `apps/api`:

```sh
python -m ruff check app/
python -m pytest
```

From `apps/web`:

```sh
npm run lint
npm run test -- --run
npm run build
```

API tests cover scoring, service helpers and endpoints using mocked database sessions; they do not verify a live PostgreSQL deployment. Web tests cover formatting, status styles and navigation. Root convenience scripts are also available; the `api`, `api:test` and `api:lint` scripts use Unix virtual-environment paths, so use the direct commands above on Windows.

Screenshots and verification results are in [docs/VERIFICATION.md](docs/VERIFICATION.md).

## Limitations

- All provider records are simulated; there are no live Stripe, PayPal or bank integrations.
- CSV import is not implemented.
- There is no manual review or dispute workflow. The schema includes a `disputed` status, but it is not used yet.
- There are no schema migrations; startup relies on `create_all`.
- Dashboard discrepancy totals combine currencies without exchange-rate conversion.
- Ask AI runs synchronous query work inside an async endpoint.
- No deployment configuration or performance benchmarks are included.

## Project history

LedgerMatch builds on my earlier project, [tusharpanthri/clear-ledger](https://github.com/tusharpanthri/clear-ledger). It extends that codebase with new branding, a responsive and accessible UI, USD sample data and rewritten documentation.
