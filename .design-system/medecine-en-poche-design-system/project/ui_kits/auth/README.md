# Auth UI Kit — Medecine en Poche

Login + register, built to the auth-pages brief. **Split layout** on desktop
(45% `#F7F8FC` panel with logo + tagline + an abstract geometric mark echoing the
brand rings; 55% white form, max-width 380, borderless/shadowless). Collapses to a
single white column with a centered logo under 768px.

## Run

Open `index.html`. React + Babel + lucide load from CDN; tokens from
`../../colors_and_type.css`.

## Files

| File | Exports | What |
|---|---|---|
| `AuthParts.jsx` | `Icon, Field, SubmitButton, GoogleButton, Divider, StrengthBar` | Reusable auth controls |
| `App.jsx` | mounts `AuthApp` | Split layout, ambient art, login/register forms + toggle |

## Interactions

- **Login** ("Bon retour"): email + password with show/hide (Eye) toggle,
  "Mot de passe oublié ?", full-width "Se connecter" (loading spinner →
  "Connexion..."), "ou continuer avec" divider, Google button, switch link.
- **Register** ("Créer un compte"): nom + email + password with an animated
  4-segment **strength bar** (red → amber → green) and live label.
- Empty-submit shows an inline danger message and marks the missing fields.
- The bottom link **smoothly crossfades** between login and register.

## Notes / omissions

Field height 42, radius 10 (the brief's auth-specific input spec — slightly
taller/rounder than the global 38/8 form input). This is a **visual prototype**:
the brief's Supabase calls (`signInWithPassword`, `signUp`,
`signInWithOAuth` Google) and middleware redirect are represented by mocked
loading/error states — wire in the real client for production.
