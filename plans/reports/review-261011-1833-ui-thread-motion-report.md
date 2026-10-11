# Review: UI thread, motion, rendering and crashes (`2c97a39..HEAD`, mobile)

Date 2026-10-11. Read-only review. I checked library behaviour against the installed sources: Reanimated 4.7.0, Skia 2.13.1 and RNGH 3.2.1. Jest: `same-palette.test.ts` and `sun-visibility.test.ts` pass (6 tests). I also ran a scratch probe and then deleted it. It showed that every surface look keeps one sun shape for the whole day. Nothing was run on a simulator or device.

Severity order. CONFIRMED means the defect follows from the code and library source. PLAUSIBLE means it depends on runtime timing or platform behaviour I could not run.

## 1. HIGH, CONFIRMED: pooled companion paints carry alpha into the body gradients

- `ui/companion/draw-kit.ts:154-171` (`nextPaint`) resets the shader and style of a pooled paint. It does not reset the colour or alpha.
- `fillShader` / `strokeShader` (`draw-kit.ts:191-206`) set a shader but never set a colour.
- In Skia, a paint's alpha multiplies the shader's output. So a gradient paint inherits the alpha of whatever `fill()` last used that pool slot.
- The pool is one per runtime (`globalThis.__companionKit`), shared by every companion, and reset to slot 0 at the start of each companion's frame. Slot order depends on mood and form (`draw-companion.ts:20-45`).
  - Base calm/think/nod (arms resting before the body): sky gradient is slot 10, sea is slot 11.
  - Base happy: slot 10 is the body shine `rgba(255,255,255,0.55)`, slot 8 is the horizon at 0.45 and slot 9 is the glint at 0.75.
- Scenario A: one companion goes happy → calm. Its sky gradient now uses slot 10, which still holds alpha 0.55. Slot 10 never gets a `fill()` again in the calm order, so the upper body stays 55 % see-through until the order changes again.
- Scenario B: two companions with different arm modes draw every frame and keep re-polluting each other's slots. Examples:
  - Today greeting + toast (`happy`)
  - Diary `ask-entry` (`think`) + `recap-pages` (`happy`)
  - Ask (`chat.mood`) + Today running underneath (see 3)
  - the `(dev)/companion` grid, which is the easiest repro
- Fix: reset alpha for every handed-out paint. For example, in `nextPaint` call `paint.setAlphaf(1)` (or set opaque black) before returning, or do it in `fillShader`.

## 2. HIGH, CONFIRMED (new behaviour likely): hidden pages keep scrolling and write the shared scroll values

- Pages are now hidden by opacity only (`home-page.tsx:31`), so their native ScrollViews stay alive. Before, they were `display:none`, and Fabric does not mount those subtrees.
- Every page's handler (`home-scroll.tsx:53-72`) writes the shared `y`, `nav` and `barMin`, whichever tab is showing.
- `slideTo` (`home-shell.tsx:108-112`) resets those values once. Then the outgoing page's momentum keeps overwriting them.
- Scenario: fling Today's list, then tap the Plan tab while it is still coasting (a tab-bar tap does not stop UIScrollView deceleration). You get:
  - the compact top bar fading in over Plan's header
  - the tab bar condensing
  - the Diary header (which reads the shared `y`, `diary-page.tsx:29-34`) fading and drifting
  - the sky parallax (`sky.tsx:138-139`) shifting
- Fix: in `useHomePageScroll`, only write while the page is the one showing. Take `tabIndex` from `useHomeNav()` (pages only mount under HomeShell) and return early when `tabIndex.value !== HOME_TABS.indexOf(tab)`. Keep updating `last` so the direction logic does not jump.

## 3. MEDIUM, CONFIRMED: Ask is a takeover but does not pause Home

- `app/_layout.tsx:59` presents `ask` as a `takeover` (full-screen and opaque).
- `features/home/home-visible.ts:10-15` leaves `ask` out of `COVERING_ROUTES`.
- Effect: Home's sky, its weather scenes and the Today companion keep their UI-thread frame callbacks running for the whole Ask session, under an opaque screen. This also keeps scenario 1B active (Ask companion plus Today companion).
- Fix: add `'ask'`. Better, derive the list from the same place `_layout.tsx` assigns `takeover`, so the two cannot drift again.

## 4. MEDIUM, PLAUSIBLE: blank content when a tab is opened before it is pre-built

- `goToTab` (`home-shell.tsx:140-148`) and the swipe `onEnd` (`:176-177`) flip `tabIndex` on the UI thread at once. Today's page drops to opacity 0 in that frame.
- Plan and Diary only appear after React renders and commits them (`:240-255`, built at 600 ms / 1400 ms).
- So for the length of Plan's or Diary's first render, the content area shows sky only. The enter fade hides part of it, then the page pops in.
- The lane report says the page "builds in the same commit as the slide". It does not: the slide is not a commit.
- Fix: if the target is not built, build it and start the slide only once it is mounted (for example, a mount effect in the page calls back, or `commitTab` re-runs `slideTo`). Or keep the outgoing page visible until the incoming one is built.

## 5. LOW, CONFIRMED (logic): a remounted sun tween starts from Home's mount-time tab

- `use-switched-tween.ts:28` seeds a new tween from `initiallyOn`. Callers pass `sun.initial`, which is `initialTab === 'today'` fixed at Home mount.
- The reaction's first run returns early on `previous === null` (`:49`), so it never corrects to the current flag.
- `SurfaceSun`'s `SunBody` is keyed by `shapeKey` (`surface-sun.tsx`). It remounts when the look or config changes. Per the probe, it never remounts on an hour change.
- Scenario: Home opens on Today, the user is on Plan or Diary, and the look changes (try-on or purchase). The surface sun (Holo, Arcade, Lacquer, Neon, Monsoon…) shows on Plan until the next tab switch. Opening Home with `?tab=plan` gives the reverse.
- Fix: when `previous === null` and the target differs from the seed, set `shared.value = target` without animating.

## 6. LOW, PLAUSIBLE: Ask scroll-to-end runs on every keyboard frame

- `ask-composer.tsx:205-210` animates `paddingBottom` (a layout prop) on every keyboard frame. Each frame resizes the `flex:1` ScrollView.
- `ask-screen.tsx:74` calls `scrollToEnd({ animated: true })` from JS in `onLayout`. That gives about 20 overlapping animated scrolls driven by the JS thread while the keyboard rises, and the same again during interactive dismiss. The likely result is jitter.
- Fix: scroll to the end only on content-size change and once when the keyboard settles, or drive it on the UI thread with `scrollTo` in a reaction on `keyboard.height`.

## 7. LOW, PLAUSIBLE: every Today row exposes a hidden "Delete" button to VoiceOver

- `spend-row.tsx` (the delete `Pressable` under the front row) stays in the accessibility tree when the row is closed. VoiceOver does not test for occlusion.
- So every row reads an extra "Delete" button, and one activation deletes the row (the undo toast is offered).
- Fix: hide the panel from accessibility while `x == 0`, and offer delete and confirm as `accessibilityActions` on the row.

## 8. LOW (dev only): the companion kit survives Fast Refresh

- `draw-kit.ts:76-91` keeps shaders cached by key on the runtime's `globalThis`. After a Fast Refresh, edited SKY/SEA/BAND colours keep their old shaders until the app restarts.
- A change to the `Kit` shape would read missing fields from the old kit.
- Fix: put a version in the global key (for example, `__companionKit_v2`).

## 9. INFO, pre-existing: a deep link to a tab is ignored while Home is mounted

`useState(initialTab)` (`home-shell.tsx:60`) ignores a later `/?tab=plan` (see `strip-app-prefix.test.ts`). The only thing that changes is `sun.initial`, which has no effect after mount.

## Checked and fine

- **`useGatedFrameCallback`**
  - `setActive` is a JS function, correctly reached through `runOnJS`.
  - Register and `setActive` effects run in order. A late `setActive` after unmount hits the `callbackId === -1` guard (`FrameCallbackRegistryUI`).
  - The reaction's `previous` lives in a shared value, so it survives re-registration.
  - A restarted callback gets `timeSincePreviousFrame: null` on its first frame, so the accumulated clocks neither jump nor rewind.
- **Reduce Motion**
  - The clocks are never started.
  - The switched tween jumps.
  - Ask and stamp Keyframes default to `ReduceMotion.System`.
- **`close-cards` keyed remount**: `useSharedValue` cancels animations on unmount, and the reducer ignores a second decide for the same id (`close-flow.ts:91`).
- **`scrollTo` on an unbuilt page's ref**: it only warns (`dispatchCommand.native.ts`).
- **`useHomeNav`**: it is used only in `TodayHero`, and `TodayPage` is mounted only under HomeShell.
- **Selectors**: the `useMoneySelector` callers return primitives, or pass an `isEqual` (`diaryInputs`). No snapshot loops.
- **`CloseTimePicker`**: all 36 hour × minute combinations are valid, so a wheel can never desync from the saved value.
- **Gesture nesting**
  - The pager uses `activeOffsetX` 14. Inner pans use 10 (row), 4 (what-if) and 10 (week recap), so the inner gesture wins.
  - In the Settings sheet, the RNGH wheel is not simultaneous with the UIScrollView pan (`RNGestureHandler.mm:771`). The wheel wins at 3 pt, so a sheet scroll that starts on the wheel does not scroll. That is acceptable.
- **Weather bakes**
  - Drops are cached by size, and the seed is deterministic (`rng(11)`).
  - Fog is re-baked only when the fog colour or width changes, not every minute.
  - Images are not disposed explicitly. Their number is bounded.
- **Theme kept object**: there is a single `ThemeProvider`, so skipping `setDisplayFont` on an equal palette is safe.
- **Compact bar**: `pointerEvents` is a plain prop, and `nav` resets to 0 on every slide.

## Not checked

Device behaviour of the items marked PLAUSIBLE. The look of the Monsoon bakes against the old build. Instruments measurements. Money and data logic (another reviewer).

Status: DONE_WITH_CONCERNS
