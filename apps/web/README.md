# LedgerMatch frontend

React, TypeScript, Vite, Tailwind CSS and shadcn/ui frontend for **LedgerMatch — Payment Reconciliation Platform**.

See the [root README](../../README.md) for architecture, configuration, demo data and attribution.

From this directory:

```sh
npm ci
npm run dev
npm run lint
npm run test -- --run
npm run build
```

Set `VITE_API_URL` to the API origin if it differs from `http://localhost:8000`.
The interface uses Geist typography, navy and teal theme tokens, an original SVG mark, and responsive navigation. Provider records in the demo are simulated.
