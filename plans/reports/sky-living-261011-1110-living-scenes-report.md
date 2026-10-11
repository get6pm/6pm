# Living scenes: Long Exposure, Paper Diorama, Lantern River

Date: 2026-10-11. Scope: new files only, `apps/mobile/src/ui/sky/scenes/living/`. Nothing edited outside it, nothing committed.

## Built

All three looks draw in Skia on the UI thread from the hour's `atm` (colours, opacities and geometry are parsed from the prototype's atmosphere strings, never re-derived). Hour-driven numbers tween over 1 s through `useSceneTween`. Motion runs off `time` (held at 0 under Reduce Motion) and `scrollY`.

- **Long Exposure**: 3 star-trail rings rotating about the pole star (`spin 160s`), pole star with its glow, 4 lane glints, 12 cars on `carR`/`carL` with their negative delays, traffic box rotated -7 deg and screened, parallax 0.3x along the tilted axis. No sun. The sky's warm horizon band is drawn by `LivingBackdrop`.
- **Paper Diorama**: 5 layers per variant (terrace rings, karst towers with striped ground, plain hills), each with its own parallax factor, union drop shadow, paper clouds drifting +/-12% of their width with outer shadow and underside lip, sun on a thread with cast shadow and crescent, night tint (all from `atm`).
- **Lantern River**: 2 catenary wires of 25 twinkling bulbs, 5 silk lanterns each (ribs, glow, cord, caps, tassel, optional sway), river (5 reflections over a wash, 2 pt lines, ripple, top/bottom fade) and 6 floating lanterns behind the river toggle. Glow ramp is whatever `atm` carries for the hour. Whole layer parallaxes at 0.2x.

## Exported API

```ts
// scenes/living/living-middle.tsx
export function LivingMiddle(props: SceneProps): JSX.Element | null   // expo | paper | lantern, else null
// scenes/living/living-backdrop.tsx
export function LivingBackdrop(props: SceneProps): JSX.Element | null // expo only: sky horizon band
// scenes/living/living-sun.tsx
export interface LivingSunProps extends SceneProps { readonly showSun: boolean }
export function LivingSun(props: LivingSunProps): JSX.Element | null  // paper only
```

Everything else in the folder is internal (models are pure and unit-tested; components are Skia nodes only).

## Required outside change (sky.tsx, controller)

1. Build the scene props once: `palette = paletteFor(input)`, `sunOp = Number(sunFor(input, palette, baseSun(hour, palette, showSun, serious)).opacity) || 0`, `atm = atmosphereFor(input, palette, sunOp)` (same as `skyFrame` does), `config = configFor(look, config)`; plus `width, height, time, scrollY`.
2. `<LivingBackdrop {...scene} />` straight after `<SkyGradient>` (before blooms). Needed because `SkyGradient` draws only the 3-stop linear part of `palette.sky`; Long Exposure's sky also has `radial-gradient(90% 22% at 50% 48%, ...)`. Without it the horizon band is missing.
3. Inside the `sunLift` group, after the shared sun: `<LivingSun {...scene} showSun={showSun} />`, and **do not draw `SkySun` for `look === 'paper'`** (`{shown.sun && look !== 'paper' && <SkySun .../>}`). The shared sun cannot draw Paper's sun (offset drop shadow, inset crescent, thread). Expo needs no change: `sunFx` already sets its opacity to 0, so the shared sun is not shown. Lantern uses the shared sun as is (it matches).
4. `<LivingMiddle {...scene} />` after the light leak, before the vignette.

A working wiring is in the scratchpad copy `.../scratchpad/lane-scenes/harness/sky-living.tsx` (a diff against `sky.tsx`).

## Verification

CanvasKit harness (real components, Chromium reference at 402x874, 2x, animations paused). Mean abs diff / 255, then worst 40 pt tile:

| Look | State | Mean | Worst tile |
|---|---|---|---|
| Paper | terraces 18:07 / Ha Long / Persimmon | 0.08 / 0.10 / 0.08 | 0.5 / 0.9 / 0.6 |
| Paper | terraces 08:30 / 14:00 / 21:30 | 0.13 / 0.08 / 0.15 | 2.2 / 0.8 / 2.0 |
| Paper | t=7.55 s, scroll 120, parallax off, clouds off | 0.08 / 0.19 / 0.08 / 0.08 | <= 1.3 |
| Lantern | Pho Hoi 18:07 / Trung Thu / Hoa Sen | 0.65 / 0.66 / 0.73 | 4.1 / 3.4 / 4.3 |
| Lantern | Pho Hoi 08:30 / 14:00 / 21:30 | 0.44 / 0.42 / 0.70 | 5.9 / 5.4 / 4.8 |
| Lantern | t=7.55 s (18:07, 21:30), scroll 120, sway off, river off | 0.76 / 0.87 / 0.65 / 0.64 / 0.63 | <= 5.1 |
| Expo | Saigon 18:07 / Blue hour / Neon wash | 1.77 / 1.75 / 1.90 | 6.3 / 6.1 / 7.4 |
| Expo | Saigon 08:30 / 14:00 / 21:30 | 1.70 / 1.67 / 1.84 | 6.0 / 6.0 / 6.5 |
| Expo | t=7.55 s, scroll 120, stars off (traffic only), traffic off (stars only) | 1.88 / 1.78 / 0.60 / 1.72 | 8.0 / 6.3 / 2.3 / 6.3 |

- Jest: `pnpm test -- src/ui/sky/scenes/living` 5 files, 37 tests pass (parsers, geometry, motion maths, tween lengths are fixed across hours/variants/toggles).
- `tsc --noEmit -p .`: clean (whole app). `eslint` and `prettier --check` on the folder: clean. Largest file 199 lines.
- Reduce Motion: `time` stays 0, so spin, cars, sway, twinkle, ripple, clouds and floaters hold their first frame (that is the frame compared above); `useSceneTween` jumps.
- Not checked: iOS simulator or device (no native build allowed): frame rate, Metal shader compile, saveLayer cost. Hour tween (mock `withTiming` returns the target). Serious mode (atm has no layers; components render nothing) was not rendered.

## Deviations and what could not be matched

1. **Expo ring edges (the whole 1.7-1.9 mean).** Rings are 1 pt hard-stop stripes that Chromium rasterises with its own pixel snapping (the 1700 pt disc is snapped to device pixels, rotating layers are resampled). Ring positions agree to about 1 device px; edges alias differently. Visually identical in crops. Rings stay hard-edged as in the prototype.
2. **Drop-shadow blur.** `filter: drop-shadow(0 -4px 7px)` in Chromium uses 7 as the Gaussian sigma (not half, as `box-shadow` does). Measured against the reference; the first attempt with half was visibly too tight.
3. **Sway phase.** Lantern angles at t=0 are within about 0.5 deg of Chromium (sub-pixel position of tassels).
4. **Opacity.** Back-wire lanterns (0.78) and the Paper sun use paint opacity, not an offscreen group. Differs only where parts of one element overlap (sub-1/255 effect). Traffic and river do use real layers (`mix-blend-mode: screen`, mask), bounded by clip rects.
5. **Hour changes tween every colour**, as the existing sky does; the prototype jumps gradient colours and the river's opacity.
6. **Shared sun, Lantern.** A thin ring difference at the lantern sun's edge (visible in lantern diffs) comes from the shared `SkySun`, not this lane.
7. Fixed parts of a lantern (cord, cap, tassel colours, 56% caps, 3 pt radii of floaters) are literals copied from the prototype markup, like the moon's constants in `sun-geometry.ts`.
8. Layers appear and disappear instantly on a toggle, as the prototype's `sc-if` does (no fade-out linger).

## Performance notes (unmeasured on device)

- Star trails: one full-screen SkSL pass for all three rings and masks.
- Paper: five blurred silhouette masks per frame, each path-op'd once into a union and trimmed to the band where its shadow can show (not the 1400 pt ground). The likeliest hot spot; if it drops frames, cache each layer's shadow as an image.
- Traffic: one saveLayer clipped to the tilted box (about 560 x 190 pt). River: one saveLayer clipped to 160 pt tall.
- Paths and gradients are built once (`usePath`, memoised geometry); nothing allocates per frame except derived values.

## Unresolved questions

1. Controller: confirm the `paper` special case for `SkySun` (or move the sun fully behind `LivingSun`) and the `LivingBackdrop` insertion point.
2. Phone sizes other than 402 pt wide: positions given in px (lantern wires, floats, river ripple) stay in design px; percent-based ones scale with width, as in the prototype.
3. Should the scenes pause when Today is not focused (same open question as the base sky clock)?

Status: DONE_WITH_CONCERNS
Summary: Long Exposure, Paper Diorama and Lantern River are built as Skia components (`LivingMiddle`, `LivingBackdrop`, `LivingSun`) and match the prototype at 0.1 (Paper), 0.4-0.9 (Lantern) and 1.7-1.9 (Expo, ring-edge aliasing) mean /255, including animation at t=7.55 s, scroll parallax and toggles. The controller must wire three insertion points and skip the shared sun for Paper.
Evidence: CanvasKit render vs Chromium capture for 3 variants at 18:07, 08:30/14:00/21:30, t=7.55 s, scroll 120 and toggles; jest 37 passing; tsc, eslint, prettier clean. Not checked: device or simulator, real frame rate, hour tween, serious mode.
Concerns/Blockers: Paper's blurred shadow cost on device is unmeasured; sky.tsx needs the wiring above before anything shows.
