# Weather lane: rain, fog, lightning, drops on glass

Files (all new, `apps/mobile/src/ui/sky/scenes/weather/`): `weather-scene.tsx` (exports), `scene-rain.tsx`, `scene-fog.tsx`, `scene-flash.tsx`, `scene-drops.tsx`, `rain-geometry.ts`, `weather-atm.ts` (reads the atm strings), `weather-math.ts` (worklet keyframes), tests `weather-math.test.ts`, `weather-atm.test.ts` (16 tests). No existing file touched.

## API and where it goes in sky.tsx

```tsx
export function WeatherMiddle(props: SceneProps): JSX.Element | null  // rain, fog, flash
export function WeatherTop(props: SceneProps): JSX.Element | null     // drops on the glass
```

- `WeatherMiddle`: right after `{shown.leak && <SkyLeak/>}`, before `{shown.vignette && …}` (prototype order: leak, rain, fog, flash, vignette).
- `WeatherTop`: right after `{shown.grain && <SkyGrain/>}`, last child of `<Canvas>`.
- Both need a `SceneProps`: `{ look, config, hour, serious, atm, palette, width, height, time, scrollY }`. `atm = atmosphereFor(input, paletteFor(input), 0)` (weather keys do not depend on the sun opacity), memoised on `[look, config, hour, serious]`. Working example: `scratchpad/lane-weather/harness/lane-sky.tsx` (sky.tsx + 12 lines).
- No `useShown` wrapper: the prototype removes the rain/fog/flash/drops elements outright when their flag goes off (no fade), so they mount/unmount on `atm.rainOn/fogOn/flashOn/dropsOn`. Opacity changes while on tween 1 s via `useSceneTween` (rainOp, fogOp, dropsOp). Rain tile colour (Monsoon dark/light) switches instantly, as in the prototype.
- Each returns null when nothing is on (Golden Hour etc., serious mode: all flags false).

## What was built (prototype geometry kept as read from the engine)

- Rain: tile read back from `atm.rainTile` (svg size, stroke colour/width, strokes), two layers, both tilted 14° about the screen centre and oversized (-30%/-20%): 90x140 tile sliding 140 pt per 0.5 s; 150x230 tile, 0.55 opacity, blur 0.8, 230 pt per 0.8 s. Drawn as one vector Path per layer (only cells under the tilted screen, ~560-700 segments), moved by a transform from `time`.
- Fog: two 2x-width banks (top 250/h170/blur 18/34 s; top 470/h220/centre 40%/blur 24/46 s alternate-reverse), elliptical radial gradient `fog 0 -> transparent 70%`, drift -12%..+12% with the shared `alternating` ease-in-out.
- Flash: `#dfeeff` screen rect, keyframes 0/88/89/90/91.5/93.5/100 % = 0/0/.6/.08/.45/0/0, 11 s, 2 s delay. Mounted only when `atm.flashOn` (thunder, dark).
- Drops: 18 from `atm.drops` (egg shape 50%/58%-42% radii, premultiplied radial bead gradient at 38%/30%, inset bottom highlight, 1 pt shadow clipped outside the shape), `dropSlide` keyframes (fade in 8%, hold to 85%, fade out, 260 pt travel, negative delays honoured).
- All motion: `useDerivedValue` on `time` (UI thread). `time` is 0 under Reduce Motion: rain at tile origin, fog at -12%/+12% start, flash off, drops frozen at their delay phase (the prototype's first frame).
- Neon bokeh check: Neon's rain is `rainOn` + shared bokeh layer; the existing bokeh matches (see numbers; bokeh shows only as faint edge rings in the diff).

## Diffs vs prototype (Chromium, 2x, island masked, grain off in both, mean abs diff /255 over RGB)

Rendered through a scratch copy of sky.tsx with the two components inserted; CanvasKit (Skia) vs Playwright capture with animations paused.

| state | t=0 mean | worst 40pt tile |
|---|---|---|
| neon 08:30 | 1.64 | 3.24 |
| neon 14:00 | 1.59 | 3.12 |
| neon 18:07 | 1.72 | 3.35 |
| neon 21:30 | 1.71 | 3.54 |
| monsoon 08:30 | 0.87 | 1.43 |
| monsoon 14:00 | 0.86 | 1.52 |
| monsoon 18:07 | 1.09 | 2.81 |
| monsoon 21:30 | 1.10 | 2.43 |

Second fixed time t = 11 800 ms (animations advanced: rain offsets, drops mid-slide, fog drift, lightning at its first peak):

| state | mean | worst tile |
|---|---|---|
| neon 14:00 | 1.60 | 3.65 |
| neon 21:30 | 1.74 | 3.80 |
| monsoon 14:00 | 0.87 | 1.70 |
| monsoon 21:30 (flash on) | 1.10 | 1.73 |

Baseline with rain/drops off (everything else in the sky): neon 21:30 0.64, monsoon 14:00 0.57. So the weather layers add about 1.1 (neon) and 0.3 (monsoon) /255. Lightning: frame mean brightness at t=11 800 is +102.1 (Skia) vs +99.8 (Chromium) over the t=0 frame.

## What does not match exactly

- Rain stroke edges. Positions, lengths, colours and opacity line up pixel for pixel; the residual is Chromium rasterising the tile on the pixel grid and then rotating the layer bilinearly (slightly thinner, stair-stepped strokes), where Skia draws the 14° strokes as true anti-aliased vectors (about 0.2 pt wider-looking). Left as is: it is the native-quality rendering, and the cost of imitating the browser's resample is a per-frame offscreen layer.
- Drop outline: sub-pixel, the egg top is a touch pointier than Chromium's.
- Lightning is ~2% hotter at its peak than the capture (screen blend rounding / sampled phase).
- The island of the device frame and the prototype's broken grain tile are excluded (grain mocked off in both, as in the earlier sky work).

## Verification

- `pnpm test -- src/ui/sky/scenes/weather`: 2 suites, 16 tests pass (keyframe maths, atm parsing, tile coverage at every slide offset, Neon/Monsoon flags from the real look engine).
- `tsc --noEmit -p .` clean; eslint on the folder clean; prettier clean. All files < 300 lines.
- Not checked: on-device frame rate (Skia blur layers: 2 fog blurs, 1 rain blur layer, 18 drops with 2 tiny blurs each, all in one Canvas); Metro/simulator was off limits. If drop cost shows in Instruments, the fog banks are the first candidates to bake into a texture.

## Open questions

- None blocking. `atm` for `SceneProps` is built by the controller; passing `0` as sun opacity is safe for these layers.

Status: DONE_WITH_CONCERNS
Summary: WeatherMiddle (rain, fog, flash) and WeatherTop (drops) built in Skia on the UI thread, matching Neon and Monsoon within 0.9-1.7 mean /255 against Chromium (weather share about 0.3 monsoon, 1.1 neon); wire-in points are in the report.
Evidence: 16 Jest tests, tsc, eslint, prettier clean; CanvasKit vs Playwright at t=0 and t=11800 for neon and monsoon at 08:30/14:00/18:07/21:30; not run on device or simulator.
Concerns/Blockers: Neon rain edges differ from Chromium's bilinear-rotated raster (vector here, crisper); on-device GPU cost of blurs unmeasured; sky.tsx must be wired by the controller.
