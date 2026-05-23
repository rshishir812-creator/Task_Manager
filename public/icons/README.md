# Visual asset provenance

This folder holds the PWA / app icons shipped with ChoreQuest. We track
where each file came from so there's no copyright ambiguity later.

## Files

| File | Size | Purpose | Source |
|---|---|---|---|
| `icon-192.png` | 192×192 | PWA standard icon | _TBD — please update with actual origin_ |
| `icon-512.png` | 512×512 | PWA high-res icon | _TBD — please update with actual origin_ |
| `icon-maskable-192.png` | 192×192 | PWA adaptive icon (Android) | _TBD — please update with actual origin_ |
| `icon-maskable-512.png` | 512×512 | PWA adaptive icon (Android) | _TBD — please update with actual origin_ |
| `../apple-touch-icon.png` | 180×180 | iOS / iPadOS home-screen icon | _TBD — please update with actual origin_ |
| `../../app/favicon.ico` | 16/32 px | Browser tab favicon | _TBD — please update with actual origin_ |

## How to fill in "Source"

For each file, record **one** of:

- `Generated via <tool URL> on YYYY-MM-DD from <source image>` (e.g.
  RealFaviconGenerator, PWA Asset Generator, pwabuilder.com)
- `Hand-drawn by <name> in Figma / Canva / etc. on YYYY-MM-DD`
- `Generated via <AI tool> (e.g. DALL·E, Midjourney) on YYYY-MM-DD —
  commercial-use rights confirmed at <link to TOS>`

The goal is one sentence per file proving we have the right to use it.

## Regenerating from scratch

If origin can't be confirmed, regenerate via any of:

- [RealFaviconGenerator](https://realfavicongenerator.net) — Apache 2.0
- [PWA Asset Generator](https://github.com/onderceylan/pwa-asset-generator) — MIT
- Figma / Canva (output is owned by you)

Feed in the existing 🎮 emoji or a hand-drawn ChoreQuest wordmark as the
source image, output 192 / 512 / maskable / apple-touch sizes, drop into
this folder, then update the table above.
