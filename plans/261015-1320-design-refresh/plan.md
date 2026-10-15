# Design refresh: companions, Looks 2.0, app icons, surfaces, store listing

Source: the designer's export of 15 Oct 2026, copied verbatim into `design/prototype/`.

| File | What it carries |
| --- | --- |
| `6pm App v2.dc.html` | The app prototype with Looks 2.0. It is now the source for looks, type and screens. `6pm App.dc.html` stays the pre-revamp prototype the app is generated from until the looks phase moves the generator to v2. |
| `6pm Looks Lookbook.dc.html`, `looks-data.json` | Every look at 08:30 / 13:00 / 18:07 / 21:30 on Today, Try on and the Close; display and interface faces, palettes, contrast floors, motion. |
| `6pm Companions.dc.html`, `companion.js` | Six forms × seven moods. `companion.js` is a Canvas port of `apps/mobile/src/ui/companion`, then polished: the polish is what moves back. |
| `6pm App Icons.dc.html`, `icons.js`, `apps/mobile/assets/icon/v2/*.png` | Every companion meets the horizon: six 1024 px icons; "App icon follows my companion" in Settings. |
| `6pm Surfaces and States.dc.html` | Widget gallery, widgets across looks, the six Live Activities. |
| `6pm App Store Listing.dc.html`, `StoreShot.dc.html` | Eleven 6.9″ screenshots (330×717 frames, exported at 4× = 1320×2868), en and vi metadata, custom product pages, the launch event. |

Precedence is unchanged: product decisions > this plan > prototype.

## Phases

Each phase is its own branch from `main` and its own PR. They touch different files; the shared ones
(locale catalogues, `app.config.ts`, Settings) merge by hand.

| # | Phase | Branch | Owns |
| --- | --- | --- | --- |
| 1 | Looks 2.0 | `feat/looks-revamp` | `packages/theme`, `tools/design/extract-prototype-logic.ts`, `tools/fonts`, `apps/mobile/assets/fonts`, `apps/mobile/src/ui/type`, `apps/mobile/src/ui/sky`, `apps/mobile/src/features/looks`, the font list in `app.config.ts`, screen markup where v2 fixes contrast, overflow or cut-off text |
| 2 | Companion polish | `feat/companion-polish` | `apps/mobile/src/ui/companion`, the companion picker |
| 3 | App icons | `feat/app-icons-companions` | `apps/mobile/assets/icon`, the icon section of `app.config.ts`, `apps/mobile/src/ui/app-icon-image.tsx`, the Settings icon row and its native module or plugin |
| 4 | Surfaces | `feat/surfaces-refresh` | `apps/mobile/targets/widgets`, `apps/mobile/targets/_shared/ThemeTokens.swift`, `apps/mobile/src/features/surfaces` |
| 5 | Store listing | `chore/store-listing` | `apps/mobile/store/` (screenshots, metadata) |
| 6 | README | `docs/readme` | `README.md` |

### 1. Looks 2.0

- Point the extractor at `6pm App v2.dc.html`; regenerate `prototype-looks.generated.js`. Changed:
  `themes`, `palette`, `atm`, `sig`, `sunFx`, `premiumAtm`; new texture helpers (`svgUrl`, `leaf`,
  `brushMask`, `crackle`, `speck`, `rainTile2`) where the atmosphere needs them.
- Each look now names a display face and an interface face (`font`, `ui`). Ship the new faces through
  `tools/fonts/build_fonts.py` (Latin + Vietnamese subsets): Bodoni Moda, Literata, Newsreader,
  Epilogue, Dela Gothic One, Archivo, Darker Grotesque, Plus Jakarta Sans, Alegreya, Alegreya Sans,
  Tilt Neon, Bai Jamjuree, Barlow, Nunito, Spectral. Faces no look uses any more are removed.
- `body()` follows the look's interface face the way `display()` follows its display face; Basic and
  Golden Hour stay on SF Pro.
- Port the markup fixes v2 makes for contrast, overflow and cut-off text, screen by screen.
- Check the Lookbook's four hours × three screens for every look on the simulator.

### 2. Companion polish

- Diff `companion.js` against the Skia renderer, number by number; port every change in shape,
  colour, mood motion and timing back. The Companions page is the reference for each form × mood.
- Onboarding v2's companion step follows the same forms.

### 3. App icons

- Six icons from `assets/icon/v2` (Sunset is unchanged). Midnight Sun and Hạc Giấy are Max.
- "App icon follows my companion" in Settings: on, the home-screen icon is the chosen companion's;
  a Max icon falls back to Sunset when Max ends. iOS alternate icons, with the system's confirmation.
- In-app pictures of the icon follow the icon in use.

### 4. Surfaces

- Widget gallery, widgets across looks, the six Live Activities restyled as designed.
- Widget features that do not exist yet are skipped and listed in the PR, not built.

### 5. Store listing

- Render the eleven screenshots for International and Vietnam at 1320×2868 from `StoreShot.dc.html`.
- Write the en and vi metadata (name, subtitle, keywords, promo text, description, in-app event,
  custom product pages) beside them, ready for App Store Connect.

### 6. README

- A public README: what 6pm is, the close, looks and companions, privacy, the monorepo and how to run it.
