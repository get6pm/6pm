# Sky surface lane: Arcade, Holo Foil, Sơn Mài, Riso Club

Date: 2026-10-11. Scope: new files only, `apps/mobile/src/ui/sky/scenes/surface/`. Nothing else edited, nothing committed.

## Result

The four looks match the prototype (Chromium) within 0.2 to 0.65 / 255 mean. This holds at 08:30, 14:00, 18:07 and 21:30, with animations at t = 0. Reference renders came from the prototype in Chromium and Skia renders from CanvasKit, as for Golden Hour. Spin, sheen, twinkle, CRT roll and bloom drift were also checked at t = 3 s. Reduce Motion holds `time` at 0, so these layers sit at their first frame.

What the shared layers already did, and what they did not:

| Look | Shared layers already correct | Drawn by this lane |
|---|---|---|
| Arcade | Soft blooms (screen), 3 pt dot screen, CRT vignette, grain | Banded sky, sun (vertical gradient + stripe mask), scanlines + rolling bar |
| Holo Foil | Blooms (`normal` → srcOver), vignette, grain | Conic sun with rings and halo, overlay foil, sheen, 16 sparkles |
| Sơn Mài | Blooms (60 pt blur), vignette, grain | Sky glow over the gradient, sun (36% / 30% highlight), sheen, 28 gold-leaf flakes |
| Riso Club | Dot screen (6 pt, multiply), grain (multiply), the sun's flat ink disc | Hard-edged blooms, banded sky, off-register ghost sun |

Why the shared layers could not draw some of it:
- `css-values` reads one position per colour stop. Riso's sky and blooms and Arcade's sky use two (`#f00 0 34%`), so the parse fails. Riso's sky and blooms therefore drew nothing at all.
- `SkyGradient` keeps three stops and the first linear gradient. Arcade has 16 stops. Sơn Mài loses the radial glow over its gradient.
- `SkySun` hides itself when the disc is not a radial gradient or a flat colour (Holo's conic, Arcade's linear), and its radial focus is fixed at 50% across (Sơn Mài needs 36%).

## Exported API (`scenes/surface/index.ts`)

All components take `SceneProps` and return null when the look has nothing. `SurfaceSun` also takes `showSun?: boolean` (default true), the same flag `Sky` already has. I use `showSun` only to compute the sun's opacity.

| Export | Draws | Insertion point in `sky.tsx` |
|---|---|---|
| `SurfaceSky` | Opaque full-screen sky for riso, arcade and lacquer, from `palette.sky` | In place of `SkyGradient` |
| `SurfaceBlooms` | Riso's hard-edged blooms (same boxes and drifts as the soft ones) | In place of `SkyBlooms` |
| `SurfaceSun` | Whole sun for holo, lacquer and arcade; only the ghost for riso | Right after the sun/flare `<Group transform={sunLift}>`, outside it. It applies its own 0.35x scroll lift. |
| `SurfaceMiddle` | Holo foil (overlay), sheen (screen), glints (normal), in that order | After `SkyLeak`, before the vignette |
| `SurfaceTop` | CRT scanlines + rolling bar | After `SkyGrain` (see open question 1) |
| `surfaceOwnsSky(look)` | true for arcade, riso, lacquer | Skip `SkyGradient` |
| `surfaceOwnsBlooms(look)` | true for riso | Skip `SkyBlooms` |
| `surfaceOwnsSun(look)` | true for arcade, holo, lacquer | Skip `SkySun` (see below) |
| `isSurfaceLook`, `SURFACE_LOOKS` | the four ids | n/a |

### Required changes outside my folder (all in `sky.tsx`)

1. Build a `SceneProps` object per render. `Sky` has no `atm` or `palette` today. `skyFrame` computes both internally but returns only values and layout. Either return them from `skyFrame` or call `paletteFor`, `atmosphereFor(input, palette, v[SLOT.sunOp])` and `configFor(look, config)` in a `useMemo` on `[look, config, hour, serious]`. Pass `config: configFor(look, config)`, because `SceneProps.config` is the full `LookConfig`.
2. Replace `<SkyGradient>` with `surfaceOwnsSky(look) ? <SurfaceSky/> : <SkyGradient/>`. Without the swap `SurfaceSky` still covers `SkyGradient`, but it costs a wasted full-screen gradient.
3. Skip `SkyBlooms` when `surfaceOwnsBlooms(look)` and mount `<SurfaceBlooms/>` there. Riso's sky is empty without this, so it is not optional.
4. Skip `SkySun` when `surfaceOwnsSun(look)` (inside the `sunLift` group). This is required for Sơn Mài: `SkySun` would draw its own disc under mine, and the two show through each other while the sun fades after 18:30. For Holo and Arcade `SkySun` is already hidden (its opacity slot is 0), so skipping it changes nothing.
5. Mount `<SurfaceSun {...scene} showSun={showSun}/>` after that group, `<SurfaceMiddle {...scene}/>` after the leak, and `<SurfaceTop {...scene}/>` after the grain.

I ran exactly this wiring in a local copy of `sky.tsx` for all comparisons below.

## Layer to prototype mapping

| Layer | Prototype | Skia |
|---|---|---|
| Sky bands (riso 34/62%, arcade 8 bands) | `linear-gradient(180deg, c 0 34% …)` hard stops | `parseFill` expands two-position stops into duplicate stops, then one dithered `LinearGradient` with the palette's own colours, tweened over 1 s |
| Sơn Mài sky | radial glow (120% 70% at 50% 100%) over linear | Two stacked rects (linear, then elliptical radial via `scaleY`) |
| Riso blooms | `radial-gradient(circle, ink 0 60%, ink00 60.5%)`, no blur, drift 19/23/27 s, multiply | Three gradients (positions 0, .6, .605; radius = box farthest corner), composed with `Blend srcOver` into one rect (multiply + opacity), same drift worklets as the soft blooms |
| Riso ghost | Same disc, offset (+8, -6), `multiply`, 0.85 x sun opacity (Misprint) | `Circle` with `blendMode="multiply"` after the sun |
| Holo sun | `conic-gradient(from 210deg, …)` disc + rings 10/24 + halo 110/40 | `SweepGradient` rotated by (210 - 90) deg, rings and halo as clipped-outside circles (`BlurMask` σ = blur / 2) |
| Sơn Mài sun | `radial-gradient(circle at 36% 30%, …)` + ring 1 + halo 70/24 | `RadialGradient` with focus at 36% / 30% and farthest-corner radius |
| Arcade sun | vertical gradient + `mask-image` (solid top half, then 7 px on / 3 px off) | The mask is baked into the gradient: hard-edged clear gaps between stops (`maskedStops`). No mask layer, no `saveLayer`. |
| Holo foil | 1100 pt `conic-gradient`, `blur(24px)`, centred at 50% / 45%, `spin 22 s` (7 s fast), overlay | The blurred square is drawn once into a texture (Skia `useTexture`, 1244 pt incl. 3σ margin) and then only rotated each frame. Overlay blend, tweened opacity |
| Sheen | 220% wide band, `left: -60%`, `sheen 9 s ease-in-out`: -35% to +35% by 55% of the cycle, then still, then snaps back | One gradient rect translated by `sheenShift` (the same keyframes), screen blend |
| Glints | 28 or 16 rotated flakes, `twinkle` with per-flake period and negative delay, glow box-shadows clipped outside the flake, 0.15x scroll lift | One group per flake (translate, rotate, twinkle scale) with paint opacity (no layers). Glow colours tween with the hour (Holo's follow `st[4]`) |
| CRT | 1 px on / 3 px scanlines at .42 black + a 120 pt bar, `crtRoll 7 s linear`, container opacity `crtOp` | Repeating gradient (hard stops) + decal gradient bar, composed with `Blend srcOver`, drawn as one rect at the container opacity |

All animation is worklet maths on `time` (`surface-motion.ts`), never a JS timer. Hour-driven numbers go through `useSceneTween`. Each component's structure (shapes, stop positions) is its React `key`, so a different look or variant remounts instead of tweening arrays of different lengths.

## Diffs against the prototype

Mean / worst 40 pt tile, in /255. Grain is off in both (see deviation 4); the CRT is on.

| Look (variant 0) | 08:30 | 14:00 | 18:07 | 21:30 | t = 3 s, 14:00 |
|---|---|---|---|---|---|
| Arcade | 0.56 / 8.8 | 0.54 / 5.4 | 0.50 / 1.8 | 0.46 / 2.2 | 0.60 / 5.4 |
| Holo Foil | 0.33 / 0.7 | 0.32 / 0.5 | 0.56 / 1.4 | 0.77 / 1.9 | 0.30 / 0.6; fast shimmer 0.30 / 0.5 |
| Sơn Mài | 0.61 / 1.9 | 0.58 / 1.5 | 0.61 / 1.5 | 0.58 / 2.4 | 0.65 / 2.2 |
| Riso Club | 0.21 / 2.2 | 0.21 / 1.2 | 0.19 / 1.4 | 0.30 / 1.5 | 0.21 / 1.2 (and 21:30: 0.30 / 1.5) |

Other variants and switches (t = 0):
- Arcade Amber 18:07: 0.45 / 1.5. Vapor 21:30 with k = 100 and Scanlines off: 0.53 / 2.2.
- Holo Oil slick 18:07: 0.97 / 3.8. Pearl 14:00 with Sparkles off: 0.30 / 0.6.
- Sơn Mài Ebony 14:00: 0.63 / 1.9. Jade 18:07 with Gold leaf and Sheen off: 0.53 / 1.4.
- Riso Orange + Teal 14:00: 0.26 / 1.8. Yellow + Purple 18:07 with Misprint and Halftone off, k = 100: 0.26 / 0.7.

The prototype's sheen band sits just off-screen at t = 0, so the sheen (Holo and Sơn Mài) is only verified in the t = 3 s frames.

## Deviations and what could not be matched

1. **Arcade sun edge (worst tile 5 to 9).** Chromium snaps the sun's box to device pixels, so its stripes sit about 1 device pixel higher than Skia's exact position. Only the edge differs. Everything else in that tile is within 1.
2. **CRT bar is about 0.5 / 255 brighter than Chromium** at its peak (8.8 vs 8.3 levels). I found no cause. The shape, position and timing match.
3. **Chromium artefact on Holo's halo.** At 18:07 in Oil slick the prototype's 110 pt box-shadow shows a faint rectangle around the sun (a raster edge, about 3 levels). I did not reproduce it; Skia's halo is smooth.
4. **Grain.** The prototype's grain never renders (broken CSS URL; see the earlier sky report). All comparisons ran without grain. The shared grain is unchanged and still applies to these looks (Riso's is 0.38 multiply: strong, and untested against any reference).
5. **Literal colours not in the theme.** The prototype's markup (not the theme) fixes the foil's six conic colours (`#ff8fd0 … #b49aff`), the CRT scanline `rgba(0,0,0,.42)` and bar `rgba(255,255,255,.07)`. They are named constants in `surface-holo.tsx` and `surface-top.tsx`. If "colour only from the theme" must hold here, they need a home in `@6pm/theme` (for example extra atmosphere fields).
6. **Tweens where CSS snaps.** The hour tweens glow colours and the sky bands over 1 s, which CSS would not (gradients and box-shadow colours do not transition). This follows the shared sky's choice.
7. **Duplicated bloom boxes.** `surface-blooms.tsx` repeats the three bloom boxes and drift specs from `sky-blooms.tsx` (not exported). Exporting that spec table would remove the copy.

## Tests and checks

- `node_modules/.bin/jest src/ui/sky/scenes/surface`: 4 suites, 27 tests, passing. They cover the CSS expansion on the real engine output for all four looks, the sun parse (conic, highlight focus, mask, ghost, structure stable through the day), the stripe-mask maths, glint parsing, and the keyframe maths (sheen, CRT roll, spin, twinkle).
- `tsc --noEmit -p apps/mobile`: no errors in `scenes/surface`. Two errors remain in other lanes' files (`features/looks/look-preview.tsx` and `look-signature-art.tsx`: `StyleSheet.absoluteFillObject` does not exist).
- `eslint` on the folder: clean. `prettier --write` applied. All files are ≤ 229 lines.
- Harness (scratchpad `lane-surface/`, not in the repo): `harness/` holds a copy of `sky.tsx` with the wiring above, CanvasKit render, and the Playwright capture. Prototype refs are in `ref/`, renders in `out*/`, side-by-side diffs in `diff/`.
- Not checked: iOS Simulator or a device (no native build allowed). So UI-thread smoothness, the frame cost of 44 glints and the foil texture's creation on Metal are unverified.

## Open questions

1. **CRT over content.** The prototype draws the CRT above all content (z-index 61, "Over the whole screen"), but the sky canvas sits behind the Today content. `SurfaceTop` needs only `atm`, `width`, `height` and `time`, so it can live in a second pass-through `Canvas` mounted above the screens. Is that wanted? If so the clock (`time`) must be shared with that canvas, or that canvas runs its own `useSkyClock`.
2. **Grain on Riso.** With grain on, Riso's 0.38 multiply grain is a lot. It follows the prototype's code, but no render ever showed it. Same product call as before.
3. **Phone size.** Pt offsets (sun arc, glints, blooms, foil centre at 45% of the height) are measured from the 402 x 874 design, like the rest of the sky.

Status: DONE_WITH_CONCERNS
Summary: The Arcade, Holo Foil, Sơn Mài and Riso sky layers are built in `scenes/surface/` and match the Chromium prototype within 0.2 to 0.65 / 255 mean (worst tile ≤ 9 at the Arcade sun edge). The controller must wire them into `sky.tsx` (steps above): Riso's sky and blooms and Sơn Mài's sun are wrong or empty without the swaps.
Evidence: jest 27 passing; eslint and prettier clean; tsc clean for my files (two errors in other lanes' `features/looks/*`); CanvasKit vs Chromium comparisons for 4 looks x 4 hours at t = 0, 6 frames at t = 3 s, and 8 variant/switch frames. Not checked: simulator, device, real frame rate, Metal texture creation, grain on these looks.
Concerns/Blockers: CRT sits behind content in the current canvas (open question 1); five literal colours live in my files (deviation 5); `sky.tsx` must be edited by the controller.
