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
