# Oficio — home-services marketplace (México)

Connects people who need a trade job done with the tradespeople who do it. Two roles share one app:

- **Cliente** — describes the problem, receives quotes, accepts one, tracks the arrival window.
- **Proveedor** — sees nearby open requests in their trade, sends a quote, schedules the visit, runs their books.

Built with **Expo SDK 57 (React Native + TypeScript)**, **expo-router**, and **Supabase** (Postgres + RLS). Spanish-language UI, `es-MX`.

Trades covered: plomería, electricidad, albañilería, carpintería, limpieza, instalaciones.

## Status — Sprint 2 complete (the app has screens)

| Layer | State |
|---|---|
| Database schema (14 migrations) | ✅ complete — tables, enums, business-rule triggers, RLS on every table, private photo buckets |
| `accept_quote()` atomic RPC | ✅ complete — creating a job and closing the request happen in one transaction |
| Auth (email OTP, Google, Apple) | ✅ built, pending end-to-end verification |
| Design system | ✅ tokens + 19 primitives — see [Design system](#design-system) |
| Offline-aware data layer | ✅ complete — react-query with AsyncStorage persistence + NetInfo |
| Role-guarded navigation | ✅ stack-per-role over tabs, so detail screens push instead of replacing |
| Client screens | ✅ home, request wizard, request + quote comparison, jobs, job detail, review, profile |
| Provider screens | ✅ opportunity feed, quote builder, quote tracking + PDF, agenda, job state machine, premium ledger, zone setup |

Known blocker: the Supabase email template needs fixing in the dashboard before the auth flow can be
verified end to end. Everything downstream of sign-in is built and type-checked but has not yet run
against live data.

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
- **Self-check:** `npm run check` — asserts the quote totals match what `validate_quote()` will
  recompute in Postgres, and that the feed's distance math is sane. No test framework; Node runs the
  TypeScript directly.

## Design system

One visual source of truth in `src/theme` — no component defines a color, size or radius of its own.

- **Palette.** A deep institutional blue carries trust (the thing this category is missing); a warm
  copper accent carries the trade itself and is spent only on money, urgency and the single next
  action on a screen. Six trade hues make a feed scannable before a single label is read.
- **Elevation** is CSS `boxShadow` strings and corners are `borderCurve: 'continuous'` — the legacy
  `shadow*`/`elevation` props are deprecated on the New Architecture.
- **Type** is the platform font with negative tracking on the large steps, and money always renders
  with `fontVariant: ['tabular-nums']` so columns of pesos line up.
- **Primitives** (`src/components`): Avatar, Badge, Button, Card, Chip, DetailRow, Divider,
  EmptyState, IconTile, Input, OfflineBanner, PhotoPicker, ProgressSteps, RatingStars, Screen,
  SectionHeader, SegmentedControl, Skeleton, Stat, Text.
- Every list has a loading skeleton and an empty state that says what to do next.

## Layout

```
app/                     expo-router routes
  (auth)/                welcome → sign-in → verify
  (client)/              stack: (tabs) + new-request, request/[id], job/[id], review/[id]
  (provider)/            stack: (tabs) + new-quote, job/[id], setup
src/components           design-system primitives
src/features             auth, requests, quotes, jobs, providers, profile — api + hooks + cards
src/lib                  supabase, query client, storage, location, copy (es-MX), domain, format
src/theme                design tokens
scripts/checks.mts       assert-based self-check for the money and distance math
supabase/                14 SQL migrations — schema, triggers, RLS, hardening, storage
```

## Photos

Request and completion photos live in **private** Supabase Storage buckets and are read through
one-hour signed URLs. A photo of the inside of someone's home should not stay reachable by anyone who
once saw the link — which a public bucket cannot promise.

## License

MIT — see [LICENSE](LICENSE).
