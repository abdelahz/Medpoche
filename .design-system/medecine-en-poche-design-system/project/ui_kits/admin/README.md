# Admin UI Kit — Medecine en Poche

The desktop back-office. **White sidebar (never dark)**, `gray-50` content area,
0.5px borders, no decorative shadows. Demonstrates the dashboard, the QCM bank
(searchable list + filter chips + detail/editor modal with MCQ answer states),
and the students table.

## Run

Open `index.html`. React + Babel + lucide load from CDN; tokens come from
`../../colors_and_type.css`.

## Files

| File | Exports | What |
|---|---|---|
| `Primitives.jsx` | `Icon, Button, Badge, Card, StatCard, Input, Avatar, ProgressBar` | Shared building blocks |
| `Sidebar.jsx` | `Sidebar` | Collapsible white sidebar (localStorage `sidebar-collapsed`), logo/monogram, active left-border, user footer |
| `Topbar.jsx` | `Topbar` | 56px page-title bar + actions + avatar |
| `Dashboard.jsx` | `Dashboard, SectionTitle` | Stat cards, recent QCMs, module coverage |
| `QcmBank.jsx` | `QcmBank` | Search + module filter chips + table + editor modal |
| `App.jsx` | mounts `AdminApp` | Shell + routing (dashboard / qcms / students; others are placeholders) |

## Interactions

- Click sidebar items to switch screens; collapse the sidebar via the chevron.
- QCM bank: type to search, click module chips to filter, click any row (or
  **Nouveau QCM**) to open the editor modal — the correct answer shows the
  `correct` MCQ state.

## Notes / omissions

Library, Dataset IA, Analytiques, and Paramètres are intentionally left as
labelled placeholders — they weren't specified in the brief, so this kit doesn't
invent them. Add them when their content is defined.
