# MedenPoche — Session Handoff

French-language AI study platform for Moroccan bac students preparing the
*concours de médecine*. **Next.js 14 App Router + TypeScript + Tailwind v3 +
shadcn/ui + Supabase.** Two roles: `/admin/*` and `/student/*`. Architecture and
conventions are in **`CLAUDE.md`** — read it.

## Latest session — free→paid conversion + UX (on `develop`, NOT yet committed/deployed)
Pricing is now **shown in-app**: Basic **70 DH/mois**, Premium **250 DH/mois** (manual
billing: WhatsApp → we send RIB → virement → preuve → admin activates). Concours date
**2026-07-19** (override `NEXT_PUBLIC_CONCOURS_DATE`). Free users get **3 lifetime AI
questions** (`FREE_TEASER_AI`) before the lock. Single source of truth = `lib/plans.ts`
(`PLAN_PRICE`, `PLAN_DISPLAY`, `FREE_TEASER_AI`), `lib/upgrade.ts` (RIB message +
`UPGRADE_STEPS`), `lib/exam.ts`, `lib/explain.ts`.
- **Prices + anchoring** on profile cards (Premium first, "Le plus populaire", ≈DH/jour) +
  `HowItWorks` 4-step explainer.
- **Accueil** upsell now mentor-led ("Ne révise pas seul"), Premium-hero with Basic on-ramp,
  J-XX countdown pill + time-scarcity line; lock badge on the IA quick action.
- **Limit walls** (20-QCM, AI/photo) reworked to celebration + Premium price.
- **Explique avec l'IA** button on QCM corrections → prefills the tutor (sessionStorage handoff).
- **Library tease**: free users see a blurred real catalogue + counts behind the lock (no
  signed URLs minted) instead of a blank wall.
- **AI tease**: free plan gets 3 lifetime questions (text only) before the lock.
- **Onboarding** modal captures prénom/nom/filière when the profile is incomplete.
- Verified end-to-end on localhost as a **free** account; `tsc` + `lint` clean. No schema changes.

## Repo / deploy state
- Work on **`develop`**, fast-forward merge to **`main`**, deploy from `main` (Vercel).
  Currently in sync (HEAD `a58ac29`).
- **SQL schema is run MANUALLY in Supabase** — never auto-executed. All migrations are
  re-runnable and live at the end of `lib/supabase/schema.sql` and `lib/supabase/storage.sql`.
- Verify: `npx tsc --noEmit` + `npm run lint`. Dev: `npm run dev` (NEVER `npm run build`
  while dev runs — it corrupts the shared `.next`).

## ⚠️ DO THESE FIRST (prod readiness)

1. **Run every SQL migration on the PRODUCTION Supabase DB.** Simplest: run all of
   `lib/supabase/schema.sql` then `lib/supabase/storage.sql` top-to-bottom (re-runnable).
   They cumulatively cover, this session:
   - `extraction_jobs` table + `extractions` storage bucket (chunked MCQ import)
   - `library.playlist` + `library.position` columns (video playlists)
   - `reports` table (student "Signaler")
   - usage hardening: `mcq_attempts` / `ai_usage` → SELECT + INSERT only, + index
     `mcq_attempts(user_id, created_at)`
   - **drop** policy `"Students read ready mcqs"` on `mcqs` (content protection)
   - `profiles.session_token` column (single active session)

2. **Vercel environment variables:**
   - `GEMINI_API_KEY` — a key whose Google project has **billing/credits** (the old one ran
     out → 403/429). The working key's project must stay funded.
   - `SUPABASE_SERVICE_ROLE_KEY` — **now required** for student practice/accueil/entraînement
     and the AI MCQ-reference (MCQ content is served via the service role). If missing → 500s.
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL` = the real domain (sitemap / robots / OG).

3. **Supabase Auth:** email confirmation is currently **OFF**. If you re-enable it, set
   Auth → **Site URL + Redirect URLs** to the prod domain, or confirmation links go to localhost.

## What shipped this session (all on `main`)
- **MCQ extraction:** durable chunked job pipeline (fixes the Vercel 60s → 504): admin
  uploads to Storage, browser polls page-batch extraction. Smarter prompt — reads inline
  answers / answer-grids inside the questions PDF and ignores answer-only lists. pdfjs worker
  bundled for Vercel.
- **Library videos + playlists:** "Vidéo" (YouTube) type with embedded player; playlists
  (lightweight `playlist` + `position` tags) with a playlist player; admins can edit items
  and reorganise playlists. Multi-file dataset upload.
- **Reports / Signalements:** students flag errors on QCM / AI / library; **admin-only**
  notification (sidebar item + top-bar bell badge) and `/admin/signalements` showing the
  reported item's details + a deep link. RLS has **no student SELECT**.
- **AI tutor:** answers a *referenced* QCM ("explique la question 3 de SVT 2022") via a
  structured lookup; quota charged **only when an answer streams** (failed answer is free);
  network resilience (IPv4 + retrying fetch + Gemini stream/embed retries).
- **Security:** RLS hardening (no quota-reset / XP-flip via direct DB writes); MCQ content
  served only through quota-enforcing server code (service role); **single active session**
  (newest login wins — `mp_session` cookie vs `profiles.session_token`, enforced in middleware).
- **UX:** colorful matière-tinted library cards; bigger/clickable logos; post-login redirect
  fix (hard navigation); contact CTAs on the official **WhatsApp `+212784155974`**.

## Known limitations / deferred
- Chunked extraction can't match an answer-key at the **end** of a long (>~4 page) PDF to
  early-page questions (inline answers work fine).
- Dependency-chain questions: chapter drills keep same-exam order, but Mes erreurs / Favoris /
  Série rapide still shuffle individually.
- Single-session adds one `profiles` read per protected navigation (prefetches skipped) —
  fine; can be throttled later if latency matters.
- AI daily-quota check-then-record race (bounded by the 250-msg safety ceiling).
- No "rename a whole playlist" bulk action (edit per video for now).
- Google login is removed ("temporary").

## Testing notes
- The local Claude-in-Chrome test account (**"abdel"**) is a **free-plan student** — it can't
  reach `/admin/*` or the AI tutor (Basic+). Use a real admin / Basic+ account to verify the
  admin library editor and the MCQ-reference AI.
