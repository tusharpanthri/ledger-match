# LedgerMatch — Payment Reconciliation Platform

LedgerMatch is a local demonstration application for comparing internal payments with simulated Stripe, PayPal and bank transfer records. It exposes confidence scores, discrepancies and missing records through a React dashboard and FastAPI API. **Provider records are simulated; there are no live payment-provider integrations.** This is not a production-ready financial system.

## What LedgerMatch does

LedgerMatch demonstrates payment reconciliation: checking that a business's internal payment records agree with records reported by a payment processor or bank.

For example, an internal record may show a $100 payment while a simulated provider record shows $97 after a $3 fee. The matching engine compares the amount, fee, currency, date and available identifying fields, then assigns a confidence score and reconciliation status. It can also identify differing amounts, provider records with no internal counterpart, internal payments with no provider record, and multiple possible matches.

The dashboard summarizes those results; Transactions lists internal payments, Reconciliations lets you inspect matches and discrepancies, and Ask AI supports natural-language database questions when an Anthropic API key is configured. The intended use is a local portfolio/demo workflow for exploring reconciliation logic, not processing or moving money. All provider records are simulated, and CSV upload and manual review are not implemented.

## Existing features

- Generate sample internal payments and simulate provider records, including orphan records.
- Run confidence-based reconciliation using amount, fees, currency, card/IBAN information, VAT and date proximity. The threshold is 65%; the maximum score depends on available fields.
- Browse and filter transactions and reconciliation results; inspect record details and scoring.
- View match rate, status/provider breakdowns, mixed-currency discrepancy totals and daily trends.
- Query the database through Ask AI with an optional Anthropic API key.
- Import seven n8n workflows for seeding, simulation and reconciliation.

Statuses include matched, matched with fee, amount mismatch, missing internal, missing external and duplicate. The schema also includes disputed, but this version does not implement a manual review or dispute workflow. CSV import is not implemented.

## Architecture

`apps/api` contains async FastAPI routers, SQLAlchemy models/services, PostgreSQL access, a reconciliation engine and Pandas trend aggregation. Ask AI uses LangChain and Anthropic to generate SQL and explain query results. `apps/web` uses React, TypeScript, Vite, TanStack Query/Table, shadcn/ui, Tailwind CSS and Recharts. `n8n/workflows` contains workflow exports; `scripts/initial-seed.sh` orchestrates the demo through HTTP calls.

Amounts are integers in minor currency units. Provider data lives in separate tables. Startup uses SQLAlchemy `create_all` to create missing tables; it is not a migration system and does not drop and recreate existing tables. Dashboard discrepancy totals combine currencies without exchange-rate conversion.

## Setup and configuration

Use Node.js 22.12+ (the web Docker build uses Node 24), Python 3.12+ and PostgreSQL 16. Docker Compose can run PostgreSQL, n8n, the API and web together.

From the repository root, copy `.env.example` to `.env` and edit it:

```sh
cp .env.example .env
# PowerShell: Copy-Item .env.example .env
```

Set `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_PORT`, and optionally `POSTGRES_HOST` (defaults to localhost for local API execution). Compose supplies its internal database host. Set `ANTHROPIC_API_KEY` only if using Ask AI; remove the placeholder otherwise. `CORS_ORIGINS` is a comma-separated list of permitted web origins. Root `.env` is loaded by the local API when started from `apps/api`; Compose also reads it for interpolation.

Compose settings include `API_PORT` (8000), `WEB_PORT` (3000), `N8N_PORT` (5678), `N8N_USER`, `N8N_PASSWORD` and `TIMEZONE`. The example credentials are for a local demo. Database names, service keys, volumes and existing container names are retained for compatibility.

### Docker Compose

```sh
docker compose up -d --build
```

Open the web at http://localhost:3000, API docs at http://localhost:8000/docs and n8n at http://localhost:5678 (adjust URLs for custom ports). The API must be available before seeding. Stop with `docker compose down`; deleting volumes also deletes demo data.

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

Open http://localhost:5173. The frontend defaults to `http://localhost:8000`; set `VITE_API_URL` at development/build time for another API origin. Compose passes this build argument automatically. Backend requirements are minimum versions rather than a fully pinned dependency set.

## Demo workflow

With the API running, use `npm run initial-seed` from the root (requires Bash and curl), or execute these endpoints from Swagger UI in order:

1. `POST /seed/currencies`, `/seed/providers`, `/seed/merchants`.
2. `POST /payments/generate?count=15`.
3. `POST /stripe-payments/simulate`, `/paypal-payments/simulate`, `/bank-payments/simulate`.
4. Optionally call each provider's `/simulate-orphan?count=2` endpoint to demonstrate missing internal records.
5. `POST /reconciliations/run`.

Then explore Dashboard, Transactions, Reconciliations and a result's detail page. Generate more internal payments and reconcile before simulating provider records to demonstrate missing external records. Ask AI requires a valid key and database access; example question: “What is the match rate?”

For n8n, import the JSON files in `n8n/workflows` and execute WF1 → WF2 → WF3/WF4/WF5 → optional WF7 → WF6. WF2–WF6 contain schedules; activate them only if continued simulation is desired. Workflow URLs use `http://host.docker.internal:8000`; adapt them to your Docker host and API port where necessary.

API docs list the current contracts. GET endpoints include `/health`, `/payments`, `/reconciliations`, `/reconciliations/summary`, `/reconciliations/trends`, `/reconciliations/missing-external` and `/reconciliations/{id}`. `POST /ask` accepts a JSON `question`. Request examples are in `apps/api/http`.

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

## Changes in this version and limitations

This version renames the application, package metadata, API docs and seed banner to LedgerMatch. It adds an original ledger/check SVG mark and favicon, navy/teal styling with Geist typography, responsive navigation, a skip link, visible keyboard focus, reduced-motion support and a simulation disclosure. Existing routes, scoring logic, data models, service identifiers and workflows are retained. Documentation was rewritten to describe implemented behavior and correct configuration guidance. An inherited npm lockfile inconsistency and backend import-order lint issue were also corrected.

Obsolete upstream screenshots and demo media were replaced with current local dashboard screenshots. Current screenshot availability and verification results are documented in [docs/VERIFICATION.md](docs/VERIFICATION.md). No live integrations, CSV importer, manual review workflow, performance claims or deployment are included. Other inherited limitations include no schema migrations, mixed-currency aggregate amounts and synchronous AI query work inside an async endpoint.

## Attribution and AI assistance

LedgerMatch uses [tusharpanthri/clear-ledger](https://github.com/tusharpanthri/clear-ledger) as its upstream project. The reconciliation engine, API/data models, simulation services, React pages, tests, Docker configuration and n8n workflows are inherited. The branding, responsive layout, accessibility refinements and documentation changes described above were made in this version. This local repository was initialized with fresh Git history; that does not imply original authorship of inherited code. See ATTRIBUTION.md for the earlier source attribution recorded in the imported snapshot.

No LICENSE, COPYING or standalone copyright notice was present in the inspected repository snapshot. This rebranding does not add a license or grant new rights; upstream attribution is preserved here and in [ATTRIBUTION.md](ATTRIBUTION.md).

The imported project documentation disclosed Claude Code assistance with architecture, FastAPI/SQLAlchemy and React code, Docker configuration, test fixtures, debugging and documentation. That disclosure is retained; `CLAUDE.md` contains inherited development conventions. This rebranding and its verification were performed with OpenAI Codex assistance. These disclosures describe assistance, not an independent audit or guarantee.

### US dollar sample data

Euro demo records are now generated in USD with the dollar symbol. Currency seeding includes USD and GBP; the UK merchant retains GBP. HTTP examples and the AI formatting example use dollars. Existing persisted EUR records are not converted or relabeled: use a fresh demo database for the revised sample data. No exchange-rate conversion is implemented.
