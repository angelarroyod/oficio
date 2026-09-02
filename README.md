# Oficio — home-services marketplace (México)

Connects people who need a trade job done with the tradespeople who do it. Two roles share one app:

- **Cliente** — describes the problem, receives quotes, accepts one, tracks the arrival window.
- **Proveedor** — sees nearby open requests in their trade, sends a quote, schedules the visit, runs their books.

Built with **Expo SDK 57 (React Native + TypeScript)**, **expo-router**, and **Supabase** (Postgres + RLS). Spanish-language UI, `es-MX`.

Trades covered: plomería, electricidad, albañilería, carpintería, limpieza, instalaciones.

## Status — Sprint 1 complete (foundation)

Honest summary: **the backend is finished, the screens are not.**

| Layer | State |
|---|---|
| Database schema (13 migrations) | ✅ complete — tables, enums, business-rule triggers, RLS on every table |
| `accept_quote()` atomic RPC | ✅ complete — creating a job and closing the request happen in one transaction |
| Auth (email OTP, Google, Apple) | ✅ built, pending end-to-end verification |
| Design tokens + base components | ✅ complete |
| Offline-aware data layer | ✅ complete — react-query with AsyncStorage persistence + NetInfo |
| Role-guarded tab navigation | ✅ complete — `(auth)` / `(client)` / `(provider)` route groups |
| Feature screens | ⛔ **placeholders** — tabs render and route, but requests/quotes/jobs UIs are not built yet |

Known blocker: the Supabase email template needs fixing in the dashboard before the auth flow can be verified end to end.

## The transactional spine

```
request  →  quote  →  job  →  review
(cliente)  (proveedor) (accepted) (cliente)
```

Design decisions worth knowing, all enforced in SQL rather than app code:

- **Arrival windows, never exact times.** `jobs` stores `window_start`/`window_end` with a constraint capping the window at 4 hours. A tradesperson who promises "2pm" is promising something traffic will break; a 2-hour window is honest.
- **Radius search without PostGIS.** `cube` + `earthdistance` extensions power the provider opportunity feed via a GiST index on `ll_to_earth(lat, lng)` — enough for zone matching, far less operational weight than PostGIS.
- **Jobs have no direct insert path.** Only `accept_quote()` creates one, so a job can never exist without the quote that justifies its price.
- **Diagnostic vs full-service visits are distinct.** A diagnosis is a short predictable block; pricing and scheduling treat it differently.
- **Trade identifiers in English, labels in Spanish.** Enum values stay stable across the codebase; every user-facing string lives in `src/lib/copy.ts`.

## Run it

```bash
npm install
cp .env.example .env   # fill with your Supabase project URL + anon key
npm start              # Expo dev server (Metro)
```

- **Supabase:** create a free project, run `supabase/migrations/*.sql` in order (SQL Editor), then paste the Project URL and anon key into `.env`. The anon key is safe to ship — RLS is what protects the data.
- **Phone (Expo Go):** scan the QR from `npm start`. Phone and computer must share a Wi-Fi network; use `npx expo start --tunnel` if your network blocks LAN discovery.
- **Type check:** `npm run typecheck`.

## Layout

```
app/            expo-router routes — (auth), (client), (provider) groups
src/components  design-system primitives
src/features    auth, profile
src/lib         supabase client, react-query setup, network state, copy, formatters
src/theme       design tokens
supabase/       13 SQL migrations — schema, triggers, RLS, hardening
```

## License

MIT — see [LICENSE](LICENSE).
