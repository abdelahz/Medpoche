# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # start dev server (defaults to :3000, falls back to :3001)
npm run build    # production build
npm run lint     # ESLint via next lint
npx tsc --noEmit # type-check without emitting (no test suite yet)
```

## Project overview

MedenPoche is a French-language AI study platform for Moroccan bac students preparing the *concours de médecine*. The stack is **Next.js 14 App Router + TypeScript + Tailwind CSS v3 + shadcn/ui + Supabase**.

## Architecture

### Two user roles, two route trees
- `/admin/*` — admin-only (MCQ management, library, dataset, analytics)
- `/student/*` — authenticated students (training, library, AI chat, progress)
- `/auth/*` — login / register / OAuth callback

Role is stored in `profiles.is_admin` (Postgres). The middleware reads this on every request to enforce access control and redirect after login.

### Supabase client split — critical rule
There are **two separate clients** that must never be swapped:

| File | Use when |
|---|---|
| `lib/supabase/client.ts` | Inside `'use client'` components (browser) |
| `lib/supabase/server.ts` | Server Components, Route Handlers, Server Actions |

`lib/supabase/middleware.ts` exports `updateSession()`, used only by `middleware.ts` to refresh the auth session on every edge request. `SUPABASE_SERVICE_ROLE_KEY` must never be imported in any client-side file.

### Middleware (`middleware.ts`)
Runs on every non-static request. Guards:
- `/` → redirect to `/auth/login`
- `/auth/*` → redirect already-authenticated users to their dashboard
- `/admin/*` → require `is_admin = true`, else redirect to `/auth/login`
- `/student/*` → require authenticated session, else redirect to `/auth/login`

When `NEXT_PUBLIC_SUPABASE_URL` is a placeholder (doesn't start with `http`), the middleware skips all Supabase checks so the app renders locally before Supabase is wired up.

### Database
All tables are in `lib/supabase/schema.sql` — **run this manually in the Supabase SQL editor, never auto-execute it**. Key tables: `profiles`, `mcqs`, `library`, `dataset`, `student_files`, `chat_history`, `mcq_attempts`, `bookmarks`. All have RLS enabled. A Postgres trigger `on_auth_user_created` auto-inserts into `profiles` on every new signup.

`mcqs.status` controls student visibility: only `status = 'ready'` rows are readable by non-admins. `mcqs.flags` is a `jsonb` array of `FlagValue` strings (`'missing_correction' | 'image_required' | 'ambiguous_answer' | 'low_confidence_module' | 'duplicate'`).

### Storage
`lib/supabase/storage.sql` (run manually, like `schema.sql`) creates a **private** `library` bucket + RLS (admins write, authenticated read). Library/course files live there; `library.file_url` stores the storage **path**, not a public URL. Mint short-lived **signed URLs** server-side (`getLibrarySignedUrl` in `app/actions/library.ts`) to view/download. Files upload **directly from the browser** to Storage (admin-gated by RLS), then a server action records the row — this avoids Next's server-action body-size limit. MCQ images are the exception: they're small and embedded as base64 markdown in the MCQ text, not in Storage.

### Shared types
All database row types live in `types/index.ts`. Import from there — do not redeclare inline.

### MCQ rendering
`components/shared/mcq-renderer.tsx` renders question text, options, and explanations. It is a `'use client'` component using `react-markdown` + `remark-math` + `rehype-katex`. Use it everywhere MCQ content is displayed — it handles `$...$` inline math, `$$...$$` display math, markdown lists, Greek letters, and chemical formulas. KaTeX CSS is imported globally in `app/layout.tsx`.

### Design system — "Medecine en Poche"
The visual identity comes from the design handoff bundle extracted at `.design-system/` (reference only; READMEs + HTML/JSX prototypes). All tokens live as CSS variables in `app/globals.css` and are mapped into Tailwind in `tailwind.config.ts`. **Use the tokens, never hardcode hex outside `globals.css`.**
- **Font**: **Plus Jakarta Sans** (400/500/600/700) via `next/font/google`, exposed as `--font-sans`. Never Inter/Roboto/system-ui. Weights 800/900 are forbidden. Default UI text is 13px; topbar/page titles 17px; stat numbers 28px/700. Max 3 font sizes per screen.
- **Primary**: `--primary-500 #3B6BE8` (one confident blue carries every accent). Hover → `--primary-600`. Light tint `--primary-50`.
- **Surfaces**: admin pages on `--gray-50 #F7F8FC`; student screens pure white. **All chrome (sidebar, topbar, bottom nav, cards) is white.**
- **TWO VISUAL MODES (important):** the rules below that say "no gradients / no bounce / restrained" describe the **ADMIN** look (clean, professional). The **STUDENT app is intentionally PLAYFUL** (Duolingo-energy for 17yo): gradients on hero/reward surfaces, soft per-matière tinted cards, **pill buttons (radius 9999)**, larger radii (16–22), bold display numbers, colorful icon chips, and a touch of motion. Playful tokens in `globals.css`: `--accent-500/600 #7C5CFF` (violet, XP), `--reward-500/600 #FFB020/#F59E0B` (amber, streak/wins), gradients `--grad-primary | --grad-accent | --grad-reward`, and the `mp-pop` reward animation. Keep it **playful but focused** — color guides attention/rewards, never noise. Admin stays restrained.
- **Admin sidebar is WHITE** (240px / 60px collapsed, `0.5px gray-200` right border). Active nav item: `--primary-50` bg, `--primary-600` text, **2px `--primary-500` left border with squared left corners**. Collapse state persists in `localStorage['sidebar-collapsed']` (`'1'`/`'0'`).
- **Module colors** (badges/small accents ONLY, never large fills): maths `#3B6BE8`, chimie `#0EA5E9`, physique `#8B5CF6`, svt `#10B981`.
- **Radii**: 8 (buttons/badges/icons), 12 (cards/panels), 16 (large cards), 9999 (pills/avatars). **Borders 0.5px** by default; 1.5px only for selected states.
- **Motion**: 150ms ease interactive, 200ms layout, 400ms progress fills. No bounce/scale/spring.
- **Icons**: lucide-react, outline only, 1.5px stroke (default), inheriting `currentColor` — never hardcode icon color. Sizes 16 inline / 20 nav / 24 feature.
- **Logo** assets in `public/brand/`: `logo.png` (transparent, light surfaces), `logo-white.png` (knockout for dark/primary surfaces), `logo-full.png`. Collapsed sidebar uses an "M" monogram; expanded uses the "MedenPoche" wordmark (15px/600).
- Shared primitives: admin → `components/admin/primitives.tsx` (Card, Badge, StatCard, Avatar, SectionTitle); auth → `components/auth/auth-parts.tsx` (AuthShell split layout, AuthField, GoogleButton, AuthDivider, StrengthBar).
- Tailwind v3; shadcn components live in `components/ui/`. Toasts via `sonner` (`<Toaster />` in root layout).

### State management
Zustand is reserved for MCQ session state only — not for global app state. Prefer Server Components and Supabase queries for everything else.

### Conventions
- Default to Server Components; add `'use client'` only when strictly needed (event handlers, browser APIs, Zustand).
- All user-facing strings are in **French only**.
- No `any` types.
