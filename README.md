# Buildbase Frontend

The frontend is a Next.js application. Its existing pages and sidebar flow are
kept intact. Finance entry pages share `TransactionPage`, while list screens
share configurable table components.

## Run locally

1. Start the Go backend on port `8081`.
2. Install packages with `npm install` (or `npm ci`).
3. Run `npm run dev`.
4. Open the URL printed by Next.js (normally `http://localhost:3000`).

The default API URL is `http://localhost:8081`. To use a Dev Tunnel, copy
`.env.local.example` to `.env.local`, set `NEXT_PUBLIC_API_BASE_URL` to the
current tunnel URL, then restart Next.js.

## Verification

```bash
npm run build
```

The build performs the production compile and TypeScript validation.
