# Third-party assets — Agrotech da Holanda

## Fonts

- **Poppins** — Indian Type Foundry, Jonny Pinhorn.
  License: SIL Open Font License 1.1 (OFL). <https://openfontlicense.org>
  Source: <https://fonts.google.com/specimen/Poppins>
  Used weights: 400, 600, 700, 800 (Latin subset, woff2).
  Delivery: **self-hosted** from `assets/fonts/`, served same-origin from GitHub Pages.
  No Google Fonts / CDN request is made; the OFL permits self-hosting and redistribution.
  (An inline base64 `@font-face` embed was trialled and reverted 2026-07-17: for a
  multi-page site, self-hosting lets the browser cache the font once across all pages.)

The OFL requires that the font not be sold on its own and that this notice travel
with the files. It does not require attribution on the rendered page.

## Stock footage (Instagram reels)

- **Pexels** — royalty-free stock video. License: Pexels License
  <https://www.pexels.com/license/> (commercial use, no attribution required). Only the composited reels
  (`social/agrotech-*-reel.mp4`) are distributed; the raw clips are not redistributed as-is. Clips used:

  - "Srunjay Bhalekar", Pexels #10527935 (soil / earthworm)
  - "Ahmed", Pexels #37018575 (hand touching green wheat — regenerative agriculture)
  - "Dmitry Marchenkov", Pexels #12549516 and #12222644 (sun / sky)
  - "Engin Akyurt", Pexels #20176158 (water surface)
  - "Emrul Kausar Emon", Pexels #35198280 (sun over water)
  - "Abdulrahman Ahmed", Pexels #36623914 (diesel pump)
  - "Grigoriy Bunkov", Pexels #17429991 (exhaust smoke)
  - "Sema", Pexels #27999520 (sprinkler / bomba solar)

## Audio (Instagram reels)

- **Bespoke synthesis** — the music beds + composition are self-authored (`social-post/agrotech_audio.py`,
  reusing `~/Claude/focus-music/synth.py`). Fully owned by Regen Studio; no third-party licence.
- **Water-drop sound (sonic logo)** — **Pixabay** (Pixabay Content License
  <https://pixabay.com/service/license-summary/>: free for commercial use, no attribution required).
  Files: `alexzavesa` + `freesound_community` water-drop SFX. Only the composited reel is distributed;
  the raw SFX are not redistributed as-is.
