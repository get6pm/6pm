# Lane D performance report: sky, companion, Home shell, theme, purchases

Date 2026-10-11. Nothing run on a simulator or device. Jest for `src/ui` and `src/features/purchases` passes (168 tests). `tsc --noEmit` shows no errors in any file this lane touched (other lanes' in-progress files fail it: bill, pot, new-pot, plan i18n keys). ESLint and Prettier clean on all changed files. All changes are uncommitted.

## Contract for other lanes

- `features/home/home-nav.tsx`: `useHomeNav()` returns `{ tabIndex, goToTab }`.
  - `tabIndex`: `SharedValue<number>` (0 Today, 1 Plan, 2 Diary). It flips on the UI thread in the frame a slide starts, before React re-renders. Gate work with `useDerivedValue` / `useAnimatedReaction` on it.
  - `goToTab(tab)`: stable. Builds the page if it is not built yet, then slides.
- `ui/sky/screen-activity.tsx`: each home page sits inside a `ScreenActivityProvider`. The flag is true while that page is the shown tab, Home is not covered by a takeover and the app is not in the background.
  - `useScreenActivity()`: the `SharedValue<boolean>`, or null outside Home (meaning always showing).
  - `useScreenActive()`: the same as plain state. Re-renders only the caller, and only on change. Use it to pause Diary queries and similar JS work.
- Hero tap to Plan: Lane A's `TodayHero` has no tap handler, and I may not edit it. It needs `const { goToTab } = useHomeNav(); … goToTab('plan')`.
- `onOpenDiary` on `TodayPage` is now wired: `goToTab('diary')`. The week-dot request is read by Diary when it mounts, so it also works if Diary was not built yet.

## Changes by task

### 1. Animation pauses when nothing shows it
- Files: `ui/sky/screen-activity.tsx` (new), `ui/sky/sky-motion.ts`, `ui/companion/companion.tsx`, `features/home/home-visible.ts` (new), `features/home/home-page.tsx` (new).
- `useGatedFrameCallback` really stops the frame callback (`setActive`) from a UI-thread reaction. The UI thread is not woken for a paused clock. Reduce Motion behaviour is unchanged (never started, clock stays 0).
- `useFrameCallback`'s `autostart` argument does not toggle after mount in Reanimated 4.7. The old `!reduceMotion` toggle was a one-shot, so this goes through `setActive`.
- Reanimated restarts `timeSinceFirstFrame` at 0 each time a callback is restarted. The sky and companion clocks therefore accumulate `timeSincePreviousFrame`, so a pause neither jumps nor rewinds them.
- Home is "visible" when the app is not in the background and the top route is not one of `scan`, `close`, `max-welcome`, `onboarding`. The route list is a constant in `home-visible.ts` and mirrors the `takeover` screens in `app/_layout.tsx`.
  - Sheets deliberately do not pause it: the sky shows through them, and freezing would be visible.
  - Pause starts 600 ms after a takeover begins (it fades in over Home). Resume is immediate.
- Companions pause per page. A Companion outside Home has no provider and always runs.
- Not done: Scan's own second `<Sky>` (`scan-handoff`, another lane) is untouched. It is not gated and still runs next to the camera. That lane can pass `active`.

### 2. Companion allocation churn
- Files: `ui/companion/draw-*.ts`, `draw-kit.ts`.
- A per-runtime kit, kept on the runtime's `globalThis` (UI runtime, and the JS runtime for the first picture) and never serialised, holds:
  - parsed colours;
  - a paint pool handed out in order and reset each frame;
  - path-builder pool;
  - one reusable rect (plain object, accepted by the Skia JSI);
  - cached shaders.
- Per frame, `Skia.Paint()`, `Skia.Color()`, shader, rect and builder allocations drop to zero. What remains is `createPicture` itself and one `build()` per path.
- The sky and sea gradients are built once per variant as 0..1 gradients. They are drawn under `translate` and `scale(1, length)` instead of rebuilding a shader whose ends move every frame. The sea path is built in that space, so geometry and colours are the same.
- The ring band gradient is cached by size. Eye and ring arcs use `drawArc` (same geometry as `addArc`).

### 3 and 4. Memo boundaries, sun as a shared value, slide on the UI thread, hidden pages
- Files: `home-shell.tsx`, `home-page.tsx` (new), `home-nav.tsx` (new), `ui/sky/sky.tsx`, `use-switched-tween.ts` (new), `scenes/scene-props.ts`, `living-sun.tsx`, `surface-sun.tsx`, `sun-visibility.test.ts` (new).
- Pages, Sky, top nav, tab bar and scan button are memoised with stable callbacks. A tab switch no longer re-renders the pages.
- The tab index is a shared value. `slideTo` is one worklet that sets the index, resets scroll and bar values, starts the enter animation and `scrollTo`, then calls `runOnJS(commitTab)`.
  - The swipe `onEnd` calls it directly, with no JS hop.
  - The tab bar and `goToTab` call it through `runOnUI`.
  - React state (`tab`) follows a frame later, for the top bar, the tab bar highlight, touches and VoiceOver.
- Hidden pages stay mounted and laid out; the shown page is chosen by an animated opacity of 0 or 1, with `pointerEvents` and accessibility flags from the committed tab. Nothing is mounted or unmounted during a slide.
- The sun is a `SunFlag { flag, initial }`. Sky builds `skyFrame` for sun shown and sun hidden. `useSwitchedTween` keeps both on the UI thread and tweens to the one the flag selects. A new hour tweens whichever is current. Reduce Motion jumps.
  - `LivingSun` and `SurfaceSun` use the same hook.
  - `sun-visibility.test.ts` proves, for every look at half-hour steps, that shown and hidden differ only in tweened numbers (same layout, same shapes, same paper geometry). That is why the switch cannot change the look.
  - Sky still mirrors the flag as state (one cheap Sky-only render a frame after the flip) so the sun and flare layers unmount after their fade, as before.
  - `showSun` still accepts a plain boolean (`scan-handoff`, dev sky).

### 5. Rain, fog and drops
- `scene-fog.tsx`, `fog-bake.ts`: each bank is blurred once into a half-resolution CPU image (padded by 3 sigma) and the image drifts. This removes two blur layers per frame. Falls back to the live blur if no surface can be made.
- `scene-drops.tsx`, `drop-bake.ts`: each drop size (shadow, bead gradient, inset highlight) is painted once at the device pixel ratio into a small image, cached by size. The 18 drops become 18 image draws with a paint alpha. Before, that was about 36 blur layers and 18 clips per frame.
- `scene-rain.tsx`: the soft layer's saveLayer and blur is now a mask blur on the strokes. The deviation is divided by the tile squeeze so it equals 0.8 pt on screen. The layer opacity and the hour's strength are folded into the stroke alpha, and the full-screen group opacity layers are gone.
- Fog, drops and rain no longer use a group-opacity layer. Overlap of two banks, or of the two rain layers, composites a hair differently where they cross. At those alphas the difference is far below visibility.

### 6. Tab bar condense
- Not changed, on purpose.
  - A transform-only version cannot keep the look. The glass pill needs circular ends and one outer shadow; a non-uniform scale makes the ends elliptical.
  - The row also couples the bar's width to the scan button shrinking (the bar widens by 12 pt as the button shrinks).
- The only exact option, slicing the pill into three views, breaks the single shadow.
- Recommendation: measure it first (Instruments hitches while scrolling down past 80 pt). It is a 350 ms event on a tiny subtree, and if it shows, replace the pill with a Skia-drawn glass.

### 7. Minute tick
- `theme.tsx` plus `same-palette.ts`: the Theme object is kept when look, serious and every palette token are unchanged. This also stops unrelated store writes, which re-render `PlanTheme`, from re-rendering the 77 consumers.
- When a colour really changes (the palette moves minute to minute at dusk and dawn), consumers still re-render once per change. A per-field subscription would need an API change across the app, so it was not done.
- Home itself no longer re-renders pages on the tick (memo).

### 8. Lazy pages
- Today is built first. Plan is built 600 ms later and Diary 1400 ms later, in `startTransition`. A tap or swipe before that builds the page in the same commit as the slide. Hidden pages are kept mounted afterwards, so there is no first-visit hitch in the normal case.

### 9. RevenueCat
- `purchases-provider.tsx`: `loadOfferings()` is no longer called at launch. The shop, look detail and Max sheet already call it when they open. The customer and entitlement still restore on launch.
- A store answer that serialises the same as the kept customer no longer sets state or writes the database (every foreground did before).
- `Purchases.configure` still runs at the first render (`appPort()`); deferring it was out of scope here.

### Shell bugs
- The compact bar's "+" opens Quick add (`onQuickAdd` on `HomeTopNav`).
- The compact bar's `pointerEvents` is a plain prop flipped at the 0.5 threshold from a UI reaction. The animated-props version is not guaranteed on Fabric. When hidden, the bar cannot swallow taps.
- `HomeTopNav` uses the clock's `dayDate` for the month name and `useMoneySelector` for days left. The shell receives the stable `useDay()`. `app/index.tsx` needed no change.

## Look and motion risks to check on the simulator

1. Companion in all moods and both forms, compared with `design/renders/`: body fill, sea, horizon line, glints and Max ring/band.
2. Tab slide: the incoming page appears at the start of the slide (opacity from the enter tween) and the outgoing one disappears at once, as before. Check swipe, tab tap and scrub, and edge rubber-banding.
3. Sun fades in and out when switching to and from Today, in Golden Hour, Paper, Holo, Riso and Arcade. Sun and flare layers must still unmount after about 1.1 s.
4. Hidden pages: no stray touches on Plan or Diary while on Today, and VoiceOver reads only the shown page.
5. First open of Plan and Diary right after launch (before 0.6 s and 1.4 s) shows no blank frame.
6. Monsoon: the rain's soft layer, fog banks (soft edges, no seams) and drops (crisp bead and highlight at 3x), against the old build.
7. Pause and resume under a takeover (Close, Scan, Max welcome): the sky resumes without a jump when the takeover is dismissed. Sheets must not freeze the sky.
8. Reduce Motion: sky, companion and scenes stay frozen as before.
9. Compact top bar: tapping the top 100 pt of Today when hidden hits the page, not the bar.

## Measure on device (iPhone 12, Release)

- Instruments, Animation Hitches and Metal System Trace: idle Today, list scroll, tab swipe, and Monsoon rain on. Compare GPU ms per frame and passes per frame. Expect fewer render passes on Monsoon, and none beyond the base pass on non-weather looks.
- Time Profiler on the UI runtime during idle on the Plan tab: companion `createPicture` samples should disappear; the frame callbacks should be off.
- Allocation tracking for host objects while Today idles: should be flat after the first frames.
- Tab switch: time from touch-up to first slide frame, and React commit count (React DevTools Profiler). Expect one small commit for the `tab` state and none for the three pages.
- Minute boundary during a swipe: renders of consumers should be zero while the palette is unchanged.
- Cold start: first Home frame without Plan and Diary, and the time to build them at 600 ms and 1400 ms.
- Memory: three mounted pages instead of display-none pages.
- Tab bar condense: hitch count while scrolling down past 80 pt, to decide whether the glass pill is worth redrawing.

## Concerns

- Reanimated 4.7 details I could not run: first-picture JS-thread run of `useDerivedValue`; `globalThis` kit on the UI runtime; `useAnimatedReaction` initial `previous === null` skips. All follow the library source I read, but none were run.
- The fog and drops are baked on the JS thread at render, on CPU surfaces, in a few ms. A drop whose surface cannot be made is skipped (no fallback; extremely unlikely on a CPU surface).
- `scan-handoff` (another lane) still mounts a second ungated Sky; `looks-shop.tsx` has a stale comment saying offerings load at launch.
- Not done from the audit's list: the sky `opaque` canvas flag (needs a check that every look's sky is opaque); bokeh textures; `paper-edge` canvas per card (not in the task list).
- Controller note 2 (top nav on `closeHour`): the top nav does not decide anything by the hour, so it uses `dayDate` for the date text only.

Status: DONE_WITH_CONCERNS
