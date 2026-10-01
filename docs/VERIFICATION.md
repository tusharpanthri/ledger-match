# LedgerMatch verification

Verified locally on 2026-10-01.

- Frontend ESLint: passed.
- Frontend Vitest: 14 tests passed.
- Frontend TypeScript/Vite build: passed; warning for a minified JavaScript chunk above 500 kB.
- Backend Ruff (`app/`): passed. An inherited bank-service import-order issue was fixed by moving Faker initialization after imports.
- Backend pytest: 47 tests passed. One inherited LangChain Community deprecation warning.
- Docker Compose configuration: valid. Service keys, database identifiers, volumes and container names retained.
- Repaired an inherited inconsistent npm lockfile. A subsequent offline `npm ci` succeeded.
- Local FastAPI startup against an isolated PostgreSQL 16 container: successful. Seed, payment generation, all three provider simulations, orphan simulation and reconciliation endpoints succeeded. The temporary dataset contained 15 internal payments and 21 reconciliation results; these counts are verification data, not performance claims.
- Populated dashboard visually inspected at desktop and 390 × 844 mobile dimensions; the mobile dashboard had no page-level horizontal overflow. Mobile navigation uses two columns and the content stacks vertically. Transactions navigation was also exercised.
- Current screenshots: [desktop](ledgermatch-desktop.jpg) and [mobile](ledgermatch-mobile.jpg). All obsolete upstream screenshots/demo assets were removed.
- Branding search: old proper names remain only in upstream attribution in README.md and ATTRIBUTION.md. Generic descriptions of payment reconciliation remain appropriate. No tracked license or standalone copyright notice was found. Git history was unchanged during the rebranding verification; the owner subsequently requested removal of local Git metadata and initialized fresh history.

## Verification limits

Ask AI was not called with a real Anthropic key. n8n workflow execution and complete Compose image builds were not exercised; Compose configuration and local API/frontend execution were checked separately. Browser size overrides behaved inconsistently; the mobile dashboard dimensions were confirmed through the DOM, while desktop screenshot capture used the actual available desktop viewport. This was a focused visual check, not a comprehensive accessibility audit.

Initial dependency downloads and Docker access required sandbox elevation. Dependencies were installed successfully, and early checks attempted during installation were superseded by the passing results above. The temporary database and local verification servers were stopped after inspection.

## Currency follow-up

Euro sample merchant currencies, HTTP examples and AI currency-format examples were changed to US dollars. EUR was removed from new currency seeds; GBP support remains. Multi-currency mismatch tests were retained using USD/CAD/GBP. Both linters, 47 backend tests, 14 frontend tests and the web build passed again. Existing database amounts are not exchange-rate converted.


## Documentation follow-up

The designated upstream is now tusharpanthri/clear-ledger. Earlier source attribution remains in ATTRIBUTION.md. The README includes a plain-language purpose, a dollar-denominated fee example, page descriptions and explicit simulation/feature limitations. The supplied clear-ledger URL could not be retrieved during this update, so its contents and ancestry were not independently verified. Documentation only; no application behavior changed.
