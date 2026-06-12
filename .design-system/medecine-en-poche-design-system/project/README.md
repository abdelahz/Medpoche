# Medecine en Poche — Design System

**Medecine en Poche** ("Médecine en Poche" / *medicine in your pocket*) is a French
medical-school **entrance-exam prep platform** — the logo tagline reads
**"CONCOURS DE MÉDECINE"** (medical-school competitive entrance exams). It helps
students drill **QCMs** (questionnaires à choix multiples / multiple-choice
questions) across science modules, study from a library, track progress, and get
AI-assisted help. It has two faces:

- **Admin** — a desktop web back-office for the team: a dashboard, a QCM bank,
  a library, an AI dataset, student management, analytics, and settings.
- **Student** — a mobile-first app: home, practice ("S'entraîner"), library
  ("Bibliothèque"), an AI tutor ("IA"), and progress ("Progrès").

Content is organized into four science **modules**, each with its own accent color:

| Module | Color | Token |
|---|---|---|
| Mathématiques | blue `#3B6BE8` | `--module-maths` |
| Chimie | sky `#0EA5E9` | `--module-chimie` |
| Physique | violet `#8B5CF6` | `--module-physique` |
| SVT (sciences de la vie et de la Terre) | emerald `#10B981` | `--module-svt` |

## Sources

This system was built from a single **authoritative written design spec** supplied by
the client (the "MEDENPOCHE — DESIGN SYSTEM & VISUAL IDENTITY" brief) plus the brand
**logo SVG**. There was **no codebase or Figma file** to import — the brief is the
source of truth, and everything here translates it 1:1. The brief targets a
**Next.js + Tailwind + lucide-react** stack; this folder mirrors those tokens in
plain CSS + HTML/JSX so they can be previewed and reused immediately.

- Logo: `uploads/meden poche logo.svg` → copied to `assets/medenpoche-logo.svg`
- Design brief: pasted into the project kickoff message (reproduce-able on request)

## Design philosophy

This is **not** a generic vibe-coded app. The UI must feel:

- **Light and breathable** — white surfaces, generous whitespace.
- **Trustworthy** — clean, precise, nothing flashy or decorative.
- **Native** — components feel like they belong together.
- **Smooth** — consistent radius, spacing, and color usage everywhere.

> One rule above all: **if it looks like a template, redesign it.**
> When in doubt: **subtract, don't add** — more whitespace, lighter color,
> smaller text, thinner border.

---

## CONTENT FUNDAMENTALS

**Language.** All UI copy is in **French**. Labels are short, concrete nouns and
verbs — `Tableau de bord`, `QCMs`, `Bibliothèque`, `Dataset IA`, `Étudiants`,
`Analytiques`, `Paramètres` (admin); `Accueil`, `S'entraîner`, `Bibliothèque`,
`IA`, `Progrès` (student). Note the student verb `S'entraîner` ("to practice/train")
— actions, not nouns, in the student tab bar.

**Tone.** Calm, professional, supportive — a study tool, not a hype product.
No exclamation marks in chrome, no marketing superlatives, no emoji. Microcopy is
plain and instructive. Address the student informally where it appears (French
*tu*-register is natural for a student audience), but most surfaces are
label-driven and impersonal.

**Casing.** Sentence case for everything readable. **ALL CAPS only** for
micro-labels (10px, `letter-spacing: 0.08em`) — e.g. a small section eyebrow.
Never set body, buttons, or badges in caps. Badges are **never bold** (≤500) and
**never uppercase**.

**Numbers & symbols.** Math/chemistry content is rendered with **KaTeX** (the
brief calls for a `mcq-renderer` using KaTeX). French number formatting and
accents must be preserved (é, è, ê, à, ç). The euro/percent and stat numbers are
the only places large type appears.

**What not to write:** filler stats, decorative captions, placeholder lorem,
empty-state clipart copy. If a section feels empty, fix it with layout — not
invented content.

---

## VISUAL FOUNDATIONS

**Color vibe.** Cool, clean, optimistic. A single confident **blue** (`#3B6BE8`)
carries every interactive accent; everything else is near-white and soft gray.
Semantic colors (green/amber/red) appear only to signal state. Module colors
(blue/sky/violet/emerald) appear **only** in badges and small accents — never as
fills for large surfaces. No gradients anywhere.

**Backgrounds.** Flat color only. Admin pages sit on **`gray-50` (`#F7F8FC`)**;
student screens are **pure white**. Cards and chrome (sidebar, topbar, bottom nav)
are white. **No** colored page backgrounds, **no** gradients, **no** background
images, **no** textures or patterns.

**Type.** **Plus Jakarta Sans** at 400/500/600/700 — never Inter, Roboto, or
system-ui. Headings 600–700, body 400–500. Weights **800/900 are forbidden**.
A maximum of **3 font sizes per screen**. Default UI text is 13px; topbar/page
titles 17px; stat numbers 28px/700.

**Spacing.** An 8px-ish scale: `4 / 8 / 12 / 16 / 24 / 32 / 48`. No arbitrary
pixel values. Whitespace is the primary layout tool — lean generous.

**Corner radii.** `4` (focus ring) · `8` (buttons, badges, icon containers) ·
`12` (cards, panels, modals) · `16` (large cards, sheets) · `9999` (pills,
avatars). **Nothing rounder than 16px** except full pills. The vocabulary is
gently rounded, not pill-soft.

**Borders.** **0.5px** everywhere by default (`gray-200 #EAECF0`) — never 1px/2px
except active/selected states (e.g. selected MCQ option is `1.5px primary-500`).
On primary-tinted surfaces, borders are `primary-100 #C8D8F8`.

**Shadows / elevation.** Used **sparingly** and only for genuinely floating things.
Flat cards get **borders, not shadows**. Card shadow:
`0 1px 3px rgba(0,0,0,.06), 0 1px 2px rgba(0,0,0,.04)`; modal shadow:
`0 8px 24px rgba(0,0,0,.10)`. No shadow as decoration. No glow, no inner shadow.

**Cards.** White, `0.5px gray-200` border, `12px` radius, padding `16px 20px`
(compact `12px 14px`). No shadow unless floating. Stat cards add a 36px colored
icon circle, a 28px/700 number, a 12px/400 label, and an optional colored delta.

**Hover states.** Always transition **background and border-color** (150ms ease).
Buttons darken (primary → `primary-600`); ghost/secondary fill with a light tint
(`gray-50` / `primary-100`); nav items get a `gray-50` wash. No opacity-dimming,
no scale on hover.

**Press / active states.** Color shift, not motion — active nav item gets a
`primary-50` background, `primary-600` text, and a **2px primary-500 left border
with squared corners**. No shrink/scale, no bounce.

**Motion.** Restrained. `150ms ease` for interactive changes, `200ms ease` for
layout (sidebar collapse), `400ms ease` for progress fills. Loading = skeleton
shimmer (`gray-100 → gray-200` pulse). **No bounce, no spring, no dramatic easing,
no page transitions** for MVP.

**Transparency & blur.** Effectively none — surfaces are opaque. No frosted glass,
no scrims beyond a plain modal backdrop.

**Imagery.** The product is largely text/data UI; there is **no stock photography
or illustration** in the system. Do not add placeholder illustrations or empty-state
clipart. The only brand image is the logo.

---

## ICONOGRAPHY

- **Library:** **lucide-react**, **outline variants only**, **1.5px stroke**
  (lucide default — do not override). Loaded from CDN here
  (`lucide@latest`); production uses `lucide-react`.
- **Sizes:** `16px` inline · `20px` nav · `24px` feature icons.
- **Color:** icons **inherit** `currentColor` from their parent — never hardcode
  an icon color. Active nav icons inherit `primary-500`; inactive inherit
  `gray-400`.
- **No emoji.** No unicode dingbats used as icons. No filled/duotone icon styles.

**Admin nav icon map:** Tableau de bord → `LayoutDashboard` · QCMs → `FileText` ·
Bibliothèque → `BookOpen` · Dataset IA → `Database` · Étudiants → `Users` ·
Analytiques → `BarChart2` · Paramètres → `Settings`.

**Student nav icon map:** Accueil → `Home` · S'entraîner → `Zap` ·
Bibliothèque → `BookOpen` · IA → `MessageSquare` · Progrès → `TrendingUp`.

**Logo / brand mark.** The current logo (`assets/medenpoche-logo.png`) is a
**graduation cap above a pocket/shield holding a stethoscope**, in line-art style,
over the wordmark **"Med En Poche"** (navy `#145281`) with **"concours de
médecine"** beneath it (green `#6FAC35`). Available versions:
`medenpoche-logo.png` (full color on white), `medenpoche-logo-transparent.png`
(tightly-cropped, **transparent** — use on light surfaces), and
`medenpoche-logo-white.png` (monochrome **white knockout** — use on the primary
blue / dark surfaces). The legacy ring mark `medenpoche-logo.svg` is kept for
reference only. In product chrome the collapsed sidebar uses an **"M" monogram**
(16px/700, `primary-500`) and the expanded sidebar uses the **"MedenPoche"**
text wordmark (15px/600) — note the app text wordmark is set solid ("MedenPoche")
while the logo lockup reads "Med En Poche".

---

## INDEX — what's in this folder

| Path | What it is |
|---|---|
| `README.md` | This file — context, content + visual foundations, iconography, index |
| `SKILL.md` | Agent-Skill front-matter so this can be used in Claude Code |
| `colors_and_type.css` | All color, spacing, radius, shadow, motion + type tokens as CSS vars |
| `assets/medenpoche-logo.png` | Brand logo — full color (cap + pocket + stethoscope, white bg) |
| `assets/medenpoche-logo-transparent.png` | Logo, cropped + transparent (light surfaces) |
| `assets/medenpoche-logo-white.png` | Logo, white knockout (dark / primary surfaces) |
| `preview/` | Design-system preview cards (the Design System tab reads these) |
| `ui_kits/admin/` | Admin back-office UI kit (sidebar, topbar, dashboard, QCM bank) |
| `ui_kits/auth/` | Auth UI kit (login + register, split layout, strength bar, states) |
| `ui_kits/student/` | Student app UI kit (home, practice/MCQ, bottom nav, AI, progress) |

Each UI kit has its own `README.md`, an `index.html` click-through demo, and
small reusable `.jsx` components.

---

## CAVEATS

- **Logo.** The current logo (`medenpoche-logo.png`) was supplied as a 1172² PNG
  on a white background. I derived a **transparent** crop and a **white knockout**
  from it programmatically (see Iconography). These are raster — if you have a
  **true vector** (clean SVG with embedded/outlined artwork) it would scale and
  recolor better. The transparent crop preserves the navy + green; for full
  flexibility a single-color vector would be ideal.
- **No codebase / Figma.** Everything is derived from the written brief, so
  component internals are my faithful interpretation of the spec rather than a copy
  of real production code. If a real repo or Figma exists, share it and I'll
  reconcile pixel-level details.
- **Fonts.** Plus Jakarta Sans is loaded from Google Fonts (exact match, no
  substitution needed).
