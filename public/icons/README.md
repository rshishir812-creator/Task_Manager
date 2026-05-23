# Visual asset provenance

All visual brand assets in this folder are derived from one source SVG:
**`logo-mark.svg`** — a circle ring with a checkmark inside, designed
in-house by the ChoreQuest maintainer (via Claude Code), 2026.

## Files

| File | Size | Purpose | Source |
|---|---|---|---|
| `logo-mark.svg` | vector | Master mark | Hand-designed SVG (this repo) |
| `icon-192.png` | 192×192 | PWA standard icon | Generated from `logo-mark.svg` via `scripts/generate-icons.mjs` |
| `icon-512.png` | 512×512 | PWA high-res icon | Same |
| `icon-maskable-192.png` | 192×192 | PWA adaptive icon (Android) | Same, with 22% safe-area padding |
| `icon-maskable-512.png` | 512×512 | PWA adaptive icon (Android) | Same |
| `../apple-touch-icon.png` | 180×180 | iOS home-screen icon | Same |

The favicon and Apple touch icon are also generated dynamically by
Next.js at request time via `app/icon.tsx` and `app/apple-icon.tsx`,
which embed the same SVG geometry inline.

## Regenerating

To rebuild all PNGs from the SVG after editing `logo-mark.svg`:

```bash
node scripts/generate-icons.mjs
```

The script uses `sharp` (devDependency). Output paths are listed at
the top of the script.

## Licence

These assets are part of the ChoreQuest project. No third-party imagery
is incorporated. The SVG is original work — free to use anywhere within
this project.
