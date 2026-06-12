# Student UI Kit — Medecine en Poche

The mobile app, shown in an iPhone frame. **Full-white** surfaces, a 5-tab
bottom bar, and the core **practice (QCM) flow** with all four MCQ answer states.

## Run

Open `index.html`. React + Babel + lucide load from CDN; the device bezel comes
from `ios-frame.jsx` (starter component); tokens from `../../colors_and_type.css`.

## Files

| File | Exports | What |
|---|---|---|
| `Primitives.jsx` | `Icon, Badge, ProgressBar, Avatar, ModuleIcon, MODULE_THEME` | Building blocks + the 4 module themes (color/bg/icon) |
| `BottomNav.jsx` | `BottomNav` | 60px tab bar — Accueil / S'entraîner / Bibliothèque / IA / Progrès |
| `HomeScreen.jsx` | `HomeScreen, ScreenHeader` | Daily goal, resume card, module grid |
| `PracticeScreen.jsx` | `PracticeScreen` | MCQ flow: select → Valider → correct/wrong + explanation → next |
| `ExtraScreens.jsx` | `AiScreen, ProgressScreen, LibraryScreen` | AI tutor chat, mastery progress, library list |
| `App.jsx` | mounts `StudentApp` | Phone frame + bottom-nav routing; practice is a full-screen flow |
| `ios-frame.jsx` | `IOSDevice` … | Device bezel + status bar (starter component) |

## Interactions

- Tap the bottom tabs to move between Accueil / Bibliothèque / IA / Progrès.
- **S'entraîner** (or the home resume card / a module) launches the full-screen
  QCM flow: pick an answer, **Valider**, see the correct answer + explanation,
  then **Question suivante**. The close (✕) returns home.
- AI tab: type a question and send — a canned tutor reply appears.

## Notes / omissions

The four science modules each carry their own accent (`MODULE_THEME`): Maths blue,
Chimie sky, Physique violet, SVT emerald — used on icons, badges, and mastery bars
only. KaTeX math rendering (per the brief's `mcq-renderer`) is represented as plain
text here; wire in KaTeX for real formula content.
