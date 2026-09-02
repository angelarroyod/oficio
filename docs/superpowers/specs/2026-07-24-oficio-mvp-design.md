# Oficio MVP — Design Decisions (Sprint 1 baseline)

Deltas and clarifications against the original brief. The brief remains the
source of truth for everything not listed here.

## Locked decisions (design review, 2026-07-24)

| Area | Decision | Rationale |
|---|---|---|
| Expo SDK | **57** (not 56) | Store Expo Go only runs the latest SDK; npm `latest` = 57.0.8. Brief's "o el estable más reciente" clause resolves here. |
| AI estimation | **Dropped entirely** | `ai_estimated_scope`, `ai_price_low`, `ai_price_high` removed from schema. Not part of the MVP hypothesis. |
| Auth | **Email OTP + Google + Apple** | Phone OTP dropped (paid SMS, untestable in Expo Go). Google works in Expo Go via web OAuth. Apple (guideline 4.8, mandatory once Google exists) is architected in but only activates on EAS builds — `isAvailableAsync()` hides the button in Expo Go. |
| Diagnostic visits | **`visit_type` flag now, chaining later** | `requests.visit_type: 'diagnostic' \| 'full_service'`. Client creates follow-up request manually in MVP. |
| Offline | **Cached reads + paused mutations** | TanStack Query persister (AsyncStorage) + `onlineManager` (NetInfo). No custom sync engine. |
| Quote export | **PDF via `expo-print` + `expo-sharing`** | Brief's allowed-module list omitted these, but the WhatsApp-shareable quote is the adoption hook. Both ship inside Expo Go. Image export dropped (PDF covers it). |
| IVA | 16% flat, computed in DB trigger and client mirror | Shown as separate line always. |
| Provider zone | `base_lat`/`base_lng` added to `provider_details` | A service radius needs a center; brief specified radius only. |
| date-fns locale | `es` | date-fns ships no `es-MX` variant; `es` formats match MX usage. |
| Trades | Postgres enum, English identifiers | `plumbing, electrical, masonry, carpentry, cleaning, installations`. Spanish labels client-side. |

## Architecture snapshot

- **Routing:** expo-router v57, declarative `Stack.Protected` guards on session + role. Groups: `(auth)`, `(client)`, `(provider)` — only one mounted at a time.
- **State:** Zustand (session), TanStack Query (server, persisted 24h), react-hook-form + zod (forms).
- **DB:** business rules live in Postgres — atomic `accept_quote()` RPC, job state-machine trigger, review guard, metric recalc (punctuality/completion) via `SECURITY DEFINER` + `oficio.system_update` GUC so clients can never write computed metrics. RLS on all 9 tables; block-list aware via `is_blocked_with(other)` (caller-anchored to avoid third-party probing).
- **Supabase project:** `lpnjrbvrxlfjborkjvje` (us-east-1, free tier). 13 migrations applied; security advisors clean except 4 intentionally-exposed definer functions.

## Known manual steps (Supabase dashboard — no API available)

1. **Email templates** (Auth → Templates → *Confirm signup* and *Magic Link*): replace the link-only body with the 6-digit code. Minimum viable body:
   ```html
   <h2>Tu código de Oficio</h2>
   <p>Ingresa este código en la app:</p>
   <h1>{{ .Token }}</h1>
   <p>Vence en 1 hora. Si no fuiste tú, ignora este correo.</p>
   ```
   Without this the in-app OTP flow cannot complete (default template only carries a localhost link — dead on a phone).
2. **Google provider** (Auth → Providers): add OAuth client ID/secret when Google sign-in testing starts.
3. **Apple provider**: at EAS-build stage.

## Sprint 1 status

Done: project scaffold (SDK 57, strict TS, expo-router, typed routes), design tokens + 8 base components, lib layer (supabase/secure-store, query persistence, es-MX copy, MXN/IVA/window formatting, zod schemas), full schema + triggers + RLS applied to live project, auth screens (role select → email OTP → verify; Google; Apple gated), role-guarded tab navigation (4 client tabs, 5 provider tabs), sign-out.

Verified: `tsc --noEmit` clean; web boot; welcome → sign-in navigation; OTP request hits live Supabase (email delivered); signed-out guard branch. Role-tab branches pending the email-template fix above (then verifiable end-to-end in Expo Go).

## Sprint 2 — screens + design system (2026-09-02)

Placeholders replaced with the real product. Deltas against the Sprint 1 baseline:

| Area | Decision | Rationale |
|---|---|---|
| Navigation | **Stack per role, tabs inside it** (`(client)/_layout` → `(tabs)` + detail routes) | Detail screens must push over the tab bar with a back button. A flat `Tabs` layout can only replace tab content. |
| Accent color | **Copper added** beside the trust blue | Blue alone reads institutional and cold. Copper carries the trade and marks exactly one hero action per screen. |
| Trade identity | **One hue per oficio**, used in icon tiles and chips | A feed of six trades becomes scannable before any label is read — the single highest-leverage visual decision in the app. |
| Elevation | **`boxShadow` strings**, `borderCurve: 'continuous'` | Legacy `shadow*` / `elevation` props are deprecated on the New Architecture. |
| Photos | **Private buckets + 1-hour signed URLs** (migration `0014`) | Request photos show the inside of a home; a public bucket URL outlives the request, the job and the block list. |
| Scheduling UI | **Day chips + 2-hour window chips**, no date picker | Matches the `jobs_window_length` constraint and the product promise. A datetime picker would invite exact times, which is the thing the product refuses to sell. |
| Provider feed | **No client-side filtering** beyond the trade toggle | `requests_select_provider_feed` already restricts rows by trade and radius. Filtering twice invites the two rules to drift apart. |
| Quote totals | **One implementation in `lib/format`**, asserted against the trigger's rounding | `validate_quote()` rejects a mismatch over one centavo, so the client formula is a contract, not a convenience. |
| Tests | **`scripts/checks.mts`, run by `npm run check`** | Node runs TypeScript directly; the money and distance math get a real check without a test framework to maintain. `quoteTotals` lives in `lib/format` and `distanceKm` in `lib/geo` precisely so they stay importable without React Native. |
| Provider onboarding | **`(provider)/setup` reachable from an empty feed** | The feed policy needs trades *and* a base point. Without them the correct feed is empty, so the empty state has to be the fix, not a dead end. |

Still open: the Supabase email-template fix (Sprint 1 blocker) gates end-to-end verification of every
screen below sign-in. Migration `0014_storage_buckets.sql` has not been applied to the live project yet.
