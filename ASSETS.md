# Asset policy

This is a one-page checklist for anyone (including future you) adding
images, icons, fonts, sounds, or video to ChoreQuest. The goal is zero
copyright surprises.

## Before adding any visual / audio asset

1. **Prefer emojis or lucide-react icons.** They cover 95% of cases and
   carry no copyright risk.
2. **If you need a custom image,** create it yourself (Figma, Canva,
   Photoshop) or use an explicitly licensed source:
   - Public domain / CC0 (Unsplash, Pexels — read their attribution
     terms before using)
   - SIL Open Font License (for typography)
   - Tools that grant commercial-use rights
     (RealFaviconGenerator, PWA Asset Generator, etc.)
3. **Never** ship:
   - Google Image Search results without verifying the licence
   - Screenshots from other apps
   - Branded characters (Disney, Nintendo, Marvel, sports teams, etc.)
   - Stock photos used outside their licence terms
   - Music or sound effects without a clear royalty-free / CC licence
4. **Record provenance** for every binary asset you add. Drop a line
   in the nearest `README.md` (e.g. `public/icons/README.md`) saying
   where it came from and when.
5. **AI-generated images** — check the tool's TOS at the time of
   generation (commercial-use rights can change). Record the tool
   name, date, and a link to the TOS in the provenance note.

## Before shipping a new dependency

If the dependency includes any visual asset (icon font, sprite sheet,
default theme image), add it to `NOTICES.md` at the repo root.

## When in doubt

Default to creating it yourself in Figma. Anything you draw is yours.
