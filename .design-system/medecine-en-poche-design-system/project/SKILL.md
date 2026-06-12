---
name: medenpoche-design
description: Use this skill to generate well-branded interfaces and assets for Medecine en Poche (Médecine en Poche — a French medical-school entrance-exam / "concours de médecine" QCM prep platform), either for production or throwaway prototypes/mocks. Contains essential design guidelines, color & type tokens, fonts, the brand logo, and admin + student UI kit components for prototyping.
user-invocable: true
---

Read the `README.md` file within this skill first — it holds the product context,
content + visual foundations, iconography, and an index of everything available.
Then explore the other files:

- `colors_and_type.css` — all color, spacing, radius, shadow, motion + type tokens
  as CSS variables. Link it and build with the vars; never invent new colors.
- `assets/medenpoche-logo.svg` — the brand logo (note: baked white background).
- `preview/` — small specimen cards for every foundation (colors, type, spacing,
  components) — good reference for exact values in use.
- `ui_kits/admin/` and `ui_kits/student/` — high-fidelity, click-through React
  recreations. Each has its own README, an `index.html` demo, and reusable `.jsx`
  components (buttons, badges, cards, inputs, MCQ options, sidebar, bottom nav,
  the QCM practice flow, etc).

Core rules to honor (see README for the full list): Plus Jakarta Sans only;
single blue primary (`#3B6BE8`); white surfaces, `gray-50` admin backgrounds;
0.5px borders; radii ≤16px (or full pills); shadows only for floating elements;
lucide outline icons at 1.5px stroke; **no** gradients, dark surfaces, emoji, or
weights above 700. French UI copy. When in doubt: subtract, don't add.

If creating visual artifacts (slides, mocks, throwaway prototypes), copy the
needed assets out and produce static/standalone HTML files for the user to view.
If working on production code, copy assets and apply the rules here to design
natively with the brand.

If the user invokes this skill without other guidance, ask them what they want to
build or design, ask a few focused questions, then act as an expert designer who
outputs HTML artifacts **or** production code, depending on the need.
