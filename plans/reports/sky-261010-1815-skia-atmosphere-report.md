# Sky: Skia atmosphere behind Today

Date: 2026-10-10. Scope: `apps/mobile/src/ui/sky/**`, `apps/mobile/src/app/(dev)/sky.tsx`, `design/renders/sky/**`, plus one additive export (`sunFor`) in `packages/theme/src/look-engine.ts`. Nothing is committed.

## Result

`<Sky look config hour serious scrollY? showSun? />` draws the whole sky in one Skia `<Canvas>` (absolute fill, `pointerEvents: none`). Each colour, opacity, blend mode and blur comes from the look engine's own output (`paletteFor`, `atmosphereFor`, and `sunFor`, a new wrapper around the prototype's `sunFx`). The CSS strings it returns are parsed (`css-values.ts`); nothing is re-derived by hand.

I rendered the real `Sky` component headlessly with CanvasKit (Skia's own WASM build) at 2× and compared it pixel by pixel with Chromium renders of the prototype. Across 20 states (Golden Hour and Basic, all variants, k 20/70/100, effects off, serious mode, 08:30 to 21:30):

- **Mean difference:** 0.09–0.70 / 255.
- **Worst 40 pt tile:** 2.7 / 255.
- **Animation timing:** a frame at t = 7.55 s (mid drift, leak pulse, twinkle, grain step 2) also matches within 0.71 mean, against Chromium paused at the same time.

## Files (apps/mobile/src/ui/sky)

| File | Role |
|---|---|
| `sky.tsx` | Component: builds the frame for the hour and tweens it over 1 s with CSS `ease` on the UI thread. Hidden layers unmount, and stay mounted for one transition so they can fade out. |
| `sky-frame.ts` | Turns the look engine's output into a tweenable number array plus a static layout (shapes, blends, blur profiles, bokeh spots). |
| `sky-slots.ts` | The layout of that array (colours as straight RGBA 0–1). |
| `css-values.ts`, `css-geometry.ts` | Parse CSS colours, gradients, box shadows and blur. Gradient-line and ellipse geometry follow the CSS spec. Transparent stops take their neighbour's colour, so stops blend as CSS does (premultiplied). |
| `blur-profile.ts` | Bakes a Gaussian blur of a radial gradient into gradient stops (Hankel integral with Bessel I₀). |
| `css-keyframes.ts` | Worklet versions of the prototype's keyframes: cubic-bezier `ease-in-out`, `alternate`/`alternate-reverse`, drift1/drift2, stepped grain. |
| `sky-motion.ts` | `useSkyClock`: a UI-thread frame clock, held at 0 under Reduce Motion. |
| `sun-geometry.ts` | Ports the prototype's sun maths from `renderVals` (App 3137–3146) and the moon opacity. |
| `sky-gradient` / `-blooms` / `-sun` / `-flare` / `-moon` / `-bokeh` / `-halftone` / `-leak` / `-vignette` / `-grain` `.tsx` | One file per layer. All files are ≤ 246 lines. |

Tests (Jest, `@jest/globals`, 36 passing) cover:

- `sun-geometry`: arc, size, set/fade, moon.
- `css-values`: parsing, CSS stop rules, geometry.
- `blur-profile`: Bessel values, mass conservation.
- `css-keyframes`: alternate, drift, grain steps.
- `sky-frame`: exact sky stops, day/night blend, bokeh/moon thresholds, Basic, serious, sun off-tab.

## Layer → prototype mapping (markup App 62–121)

| Layer | Prototype CSS | Skia |
|---|---|---|
| Sky | `linear-gradient(180deg, st0 0%, st1 52%, st2 100%)`; Basic uses the `sky` from its `over()` (tinted by k) | Read from `palette.sky` (not raw `st`), so Basic's tint is exact. Dithered `LinearGradient` (Chromium dithers its gradients the same way: the 1-LSB pattern matches) |
| Blooms | 3 circles, `radial-gradient(circle, c 0%, c00 70%)`, `filter: blur(40/46px)`, `drift1 19s` / `drift2 23s` / `drift1 27s alternate-reverse`, 3rd at .6; container `opacity: bloomOp; mix-blend-mode: screen\|multiply` | Each blur is baked into the gradient stops (exact Gaussian, no runtime blur). The three gradients are composed with `<Blend mode="srcOver">` into one full-screen rect, drawn with the look's blend mode and opacity: exactly CSS's isolated group, with no `saveLayer` |
| Sun | Disc `radial-gradient(circle at 50% 38%…)` (40% / 2-stop before 16:30); `box-shadow` rings (spread, no blur) and one blurred halo; opacity; `translateY(-.35·sy)` | The disc is a `RadialGradient` with the farthest-corner radius. Rings are stroked annuli, widest first. The halo uses `BlurMask` σ = blur/2 (the CSS box-shadow rule), clipped outside the disc as box-shadow is. Look restyling goes through `sunFx` |
| Flare | 34 px band `blur(12px)` at `streakSoft` + 2 px line `blur(.6px)` at `streakOp`, both `screen`, 7-stop horizontal gradient | Rect with gradient plus `BlurMask` (analytic rect blur), screen blend |
| Moon | 26 px disc at 78% / 124 px; glow `0 0 50px 14px`; inset crescent `-7px -3px`; opacity (h−19) | The lit part and the crescent are disjoint paths (the crescent colour pre-composited), so fading never shows one through the other |
| Bokeh | 7 discs with `box-shadow 0 0 s c` and `blur(2px)`; `twinkle` (.35→1, .85→1.1) with per-dot period; container `screen`, `bokehOp`, `translateY(-.2·sy)` | Disc `BlurMask` 2. The glow is clipped outside the disc with σ = √((s/2)² + 2²). Scale and opacity are animated per dot |
| Halftone | `radial-gradient(circle, dot .9px, transparent 1.5px)` tile 5 px, band 220–500 px with mask 0/45/60/100%, `translateY(-.35·sy)` | Small SkSL `RuntimeEffect` (cell coverage × vertical mask) |
| Light leak | `radial-gradient(60% 38% at 0% 16%…)` over `linear-gradient(100deg…)`, `leak 9s` opacity .45→1, outer `leakOp`, `screen` | `Blend srcOver` of the two gradients (CSS layer order, angle line per the CSS spec, ellipse via scaleY), screen, opacity × pulse |
| Vignette | `radial-gradient(130% 95% at 50% 38%, transparent 48%, rgba(c,a) 100%)` | Elliptical `RadialGradient`; the transparent stop carries the shade's RGB |
| Grain | 180 px SVG `feTurbulence fractalNoise .85, 2 octaves, stitch`, `overlay` (or `multiply`), `grain .8s steps(1)` | `FractalNoise` (the algorithm Chromium uses for feTurbulence), stitched at 216 (the SVG filter region) and converted with `LinearToSRGBGamma` (feTurbulence runs in linearRGB). It is drawn once into a texture at screen density, then repeated with an `ImageShader` and jumped between the three offsets. On its own it matches Chromium to 0.15–0.19 / 255 |

## Deviations and why

1. **Grain is not a hand-written RuntimeEffect shader.** Skia's `FractalNoise` is the same Perlin implementation Chromium uses for `feTurbulence`, so with the right stitch size and colour space it reproduces the prototype's grain pixel for pixel. A custom shader would only approximate it.
2. **No live blurs.** Blooms (σ 40/46) are pre-integrated into gradient stops. The halo, flare and bokeh use analytic `BlurMask`. The result is mathematically the same, and nothing re-blurs a full-screen layer per frame.
3. **Hour changes tween every value**, including gradient colours and the sun's colour switch at 16:30. CSS can't transition gradients, so the prototype jumps there. Blend modes still switch discretely, as in CSS.
4. **Sub-pixel positions are not snapped.** Chromium snaps some boxes (for example the moon at 78% = 313.56 pt) to device pixels; Skia draws them at the exact position. Antialiased edges can differ by ≤ 1 device px.
5. **Paint opacity instead of group opacity.** The sun's rings and halo take paint opacity, not a group layer. This matches exactly at full opacity and differs by < 0.5% alpha while the sun fades (18:30–19:06), and on Basic (×0.9).
6. **Residuals in the comparisons** are under 2.7 / 255:
   - The flare's soft band is up to about 6 / 255 brighter 2–4 pt either side of its centre.
   - Bokeh and disc edges differ at the antialiasing level.

## Performance

- **No JS work per frame.** The JS thread only runs when `hour`, `look`, `config`, `serious` or `showSun` change: it builds one array (under 1 ms), which a single Reanimated `withTiming` over the array tweens on the UI thread.
- **Clock.** A `useFrameCallback` clock drives drift, leak, twinkles and grain on the UI thread. Under Reduce Motion it doesn't run and the clock stays at 0; that frame is the same one the references show.
- **Full-screen passes, Golden Hour:** sky, blooms (three gradients in one shader), leak, vignette, grain (one texture fetch). The halftone covers a 280 pt strip. There is no `saveLayer`, no image filter and no per-frame path or shader creation: the runtime effect, moon paths and blur profiles are built once and memoised.
- **Hidden layers unmount.** Basic draws only the sky, sun or moon, and grain. Grain moves only when its step changes, so on Basic and in serious mode the canvas redraws about 4 times a second rather than every frame.
- **Golden Hour redraws every frame**, because the blooms drift continuously, as in the prototype.

## Reference renders produced (`design/renders/sky/`, 402×874 at 2×, content hidden, animations paused at t = 0)

- **Golden Hour:** `golden-{0830,1400,1700,1807,1845,1930,2130}`, `golden-hoi-an-1807`, `golden-da-lat-1807`, `golden-1807-{k100,k20,flare0-grain0,serious}`.
- **Basic:** `basic-{0830,1400,1807,2130}`, `basic-light-1400`, `basic-dark-2130`, `basic-2130-sun0`.
- **`*-with-grain`** (4 files): the same frames with the prototype's grain URL repaired (see question 1). These are what the app shows.

The capture script (Playwright: drives the prototype's state, hides content and device chrome, pauses animations), the CanvasKit render harness (Jest, mocks Reanimated, renders the real `Sky`) and the diff script are in the session scratchpad (`…/scratchpad/sky/`), not in the repo.

## Verification

- `pnpm --filter @6pm/mobile typecheck`: no errors in my files. Errors remain in others' in-progress files: typed routes in `app/index.tsx`, `features/home/home-shell.tsx`, `features/today/today-page.tsx`, and `app/close.tsx` i18n params.
- `pnpm --filter @6pm/theme typecheck`: clean. Theme vitest: 18 passing.
- `pnpm exec eslint` on the sky files and `look-engine.ts`: clean. `prettier --write` applied.
- `pnpm --filter @6pm/mobile test -- sky css-keyframes`: 36 passing.
- **Not checked:** the iOS simulator or a device (I was not allowed to run a native build). That leaves UI-thread smoothness, the frame rate and the grain texture's creation on Metal unverified, and these need a look on the simulator. Open the dev screen at `/sky`; tap the sky to hide the panel.

## Unresolved questions

1. **The prototype's grain never renders.** Its `background-image: url(data:…)` is unquoted and contains spaces, so CSS rejects it: Chromium computes `background-image: none`, in the App and in Coming Soon. Every prototype render, including `design/renders/app/*`, therefore has no grain. I implemented the grain the code specifies (Golden Hour 0.30 overlay with the toggle on and 0.06 with it off, Basic 0.04, serious 0.16). It brightens Golden Hour by about 3–7 / 255 and adds visible texture.
   - **Keep the grain:** matches the intended design and keeps the "Film grain" toggle meaningful.
   - **Drop the grain:** matches what the designer actually saw, but the toggle becomes a no-op.

   This needs a product decision. Removing it is one line in `sky.tsx`.
2. **Phone size.** The sky's pt offsets (sun arc, blooms, halftone band, moon) are measured from the screen top as in the 402×874 design. On phones with another safe-area top, should they shift by the difference (`useDesignInsets`) like the Today content will? Not done yet.
3. **Pausing off-screen.** Should the clock pause when Today is not focused, for example through a `paused`/`active` prop? The spec's API has none, so the drift keeps ticking while the screen is mounted.
4. **Other looks.** Only Basic and Golden Hour are verified. The other looks' own layers (rain, fog, holo, sheen, glints, star trails, traffic, paper hills, lanterns, CRT, the riso ghost sun and the paper thread) are not drawn. A sun whose colour isn't a radial gradient or a solid colour (conic for holo, linear for arcade) is hidden.
5. **Dev tools list.** `app/(dev)/index.tsx` isn't in my owns list, so `/sky` has no link there.

Status: DONE_WITH_CONCERNS
Summary: The Skia sky and its atmosphere are built and match the prototype within 0.7/255 mean (worst 2.7/255) across 20 states, verified by rendering the real component with CanvasKit, including animation timing. Unit tests, lint and typecheck of the sky files pass.
Concerns/Blockers: the prototype's grain is broken (never visible), so grain-on needs a product call; not run on a simulator or device.
