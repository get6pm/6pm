# Performance audit: 6pm v2 iPhone app

Date 2026-10-11. Scope `apps/mobile/src` (branch v2, read from `/Users/quocs/Projects/6pm`), read-only. Target 60 fps on iPhone 12, fast cold start.
Everything below was checked in code. Nothing was profiled on a device; the device checks are listed at the end.

Grep results: no RN `Animated`, no `LayoutAnimation`, no `setInterval`. The only `withRepeat` that ignores Reduce Motion is the scan spinner, which is a progress indicator. Reduce Motion freezes the sky clock (`sky-motion.ts:24`), the companion (`companion.tsx:57,79`) and the scene tweens (`use-scene-tween.ts:24`).

## Findings, by how much the user would notice

### 1. HIGH: animation keeps running when nothing on screen shows it
- The sky clock runs `useFrameCallback(tick, !reduceMotion)` (`ui/sky/sky-motion.ts:24`). Each Companion runs its own callback (`ui/companion/companion.tsx:57-59`). Both are gated only on Reduce Motion.
- Home hides inactive tabs with `display: 'none'` (`features/home/home-shell.tsx:128-145`). That removes their native views but keeps the React trees mounted. So Today's companion (`today/companion-greeting.tsx:62`) and Diary's Ask companion (`diary/ask-entry.tsx:31`) build a new picture every frame on every tab, including tabs where they are hidden.
- Close, Scan and Max welcome are `fullScreenModal` takeovers (`ui/navigation/presentations.ts:24-28`). Under them, the home sky and both companions keep doing per-frame UI-thread work.
- Scan's return screen mounts a second full `<Sky>` (`features/scan/scan-handoff.tsx:146`). With Home still underneath, that is two skies running next to the camera session.
- Fix:
  - Pass an `active` flag into `useSkyClock` and `Companion`, and use it as `useFrameCallback(cb, active && !reduceMotion)`.
  - Compute `active` from `useIsFocused()` (expo-router) and from the Shell's `tab` (Shell already knows which page is showing).
  - Sheets (`transparentModal`) cover 93% of the sky. Freezing it under a sheet is a product decision; log it if adopted.

### 2. HIGH: the companion allocates dozens of Skia objects every frame on the UI runtime
- `companion.tsx:75-90` calls `createPicture(...)` on every clock tick.
- The draw helpers make a new `SkPaint` for every `fill()` and `stroke()`, and a new shader for every `linear()`. Each one also parses a colour string with `Skia.Color(...)` (`ui/companion/draw-kit.ts:102-138`).
- Counting helper calls: draw-body 14, draw-face 8, draw-max 8, draw-extras 5, draw-rays 1. That is about 40-60 JSI host objects plus one SkPicture per frame, per companion. Home has two companions mounted (finding 1).
- The cost is GC pressure on the worklet runtime. That runtime also runs the scroll handlers, gesture callbacks and sky derived values, so a GC pause there drops frames during scroll and swipes.
- Fix:
  - Build paints, colours and static gradients once per (size, mood, form): create them in a worklet, keep them in a shared value, and mutate them per frame (stroke width, alpha, matrix) instead of allocating.
  - Stop allocating the per-frame `oval` rect in `ellipse()`.
  - Optionally redraw at 30 fps. The wobble only re-rolls 6 times per second (`draw-kit.ts:86`).

### 3. HIGH: every store write re-renders all of Home and re-runs Diary's SQL
- The chain:
  - `app/index.tsx:8` calls `useDay()`, which runs `dayOf(...)` on every render and returns a new object (`data/money-store.ts:63-96`).
  - That object goes to `HomeShell`, then `Shell`, which re-renders `TodayPage`, `PlanPage`, `DiaryPage` and `Sky`.
  - None of these are memoised (the app has only two `memo()` calls, both in categories), and they get inline arrows (`home-shell.tsx:132-133,153,162-165`).
- Diary's `useStoreQuery` depends on the whole snapshot (`data/diary-queries.ts:182-195`). Every confirm, delete or close-card decision anywhere therefore re-runs:
  - `readDiary`: 5 queries, including `GROUP BY` over all of `closed_days` and `MIN(day)` over `spends`.
  - `readDayReceipt`: 2 queries.
  - zod parsing of every returned row.
  - A second Diary render when the results land (`features/diary/use-diary.ts:50-75`).
- During the close this happens once per card, under the takeover.
- Plan also recomputes `dayOf`, `riverOf`, `billViews`, `goalViews` and `occasionViews` on every render without memoising (`features/plan/plan-page.tsx:43,111-114`). Today rebuilds `todayView` the same way (`today/today-page.tsx:44`).
- Fix:
  - Wrap the three pages and `Sky` in `memo`, and give them stable callbacks.
  - Add `useMoneySelector(select, isEqual)` and use it instead of whole-snapshot `useMoney()`.
  - Memoise `dayOf` per snapshot.
  - Run Diary queries only while the Diary tab is active, or only when `closedDays` or this week's spends change. Wrap the refresh in `startTransition`.

### 4. HIGH: a tab switch does all its work in the frame the slide starts
- `go()` sets the enter animation and then `setTab` (`home-shell.tsx:62-81`). That one render:
  - Re-renders all three pages (finding 3).
  - Changes `showSun`, so Sky recomputes `skyFrame` (`ui/sky/sky.tsx:91-97`). `skyFrame` runs `paletteFor`/`atmosphereFor`, re-parses the CSS gradients and runs `JSON.stringify` on the layout.
  - Flips the incoming page from `display:none` to visible. In Fabric that mounts its whole native subtree and unmounts the outgoing one on the UI thread, during the 420 ms enter animation.
- The swipe path also goes through JS before anything animates: `runOnJS(swipeTo)` (`home-shell.tsx:104`). The slide therefore waits for the JS thread.
- Fix:
  - Start `enterX`/`enterOpacity` in the gesture's `onEnd` worklet, then tell JS.
  - Hide inactive pages with opacity 0 + `pointerEvents="none"` (kept mounted) instead of `display:none`. Measure memory.
  - Make the sun's visibility a shared value so `showSun` stops changing Sky's props.

### 5. MED-HIGH (Monsoon and other rain looks): offscreen blur layers every frame
- Rain: `scene-rain.tsx:39-43`. The second layer uses `layer={<Paint><Blur blur=0.8/></Paint>}` over an oversized, tilted, full-screen group. That is a full-screen saveLayer plus a Gaussian blur on every frame.
- Fog: `scene-fog.tsx:37-48`. Two image-filter blurs (sigma 18 and 24) over rects twice the screen width, every frame. The content is a radial gradient that only translates, which `blur-profile.ts` already solves analytically for the blooms.
- Drops: `scene-drops.tsx:61-85`. There are 18 drops (generated looks line 222), each with 2 `<Blur>` image filters and 3 clips: about 36 saveLayers per frame.
- Fix:
  - Fog: bake the blur into gradient stops with `blurredRadialProfile`, or render it once with `useTexture` and translate the texture.
  - Rain: put a `BlurMask` on the stroke paint and the opacity in the colour (no layer), or render one tile with `useTexture` and draw it as a repeating `ImageShader`.
  - Drops: render one texture per drop size with `useTexture`, or switch to `BlurMask`.

### 6. MED: layout props animated on per-frame paths
These force a shadow-tree commit plus a Yoga layout on every frame, instead of transform/opacity-only updates.
- `features/home/tab-bar.tsx:87-92`: `height` on the bar and its 3 buttons, plus `maxHeight` on the labels, for 350 ms every time the bar condenses mid-scroll. The bar also carries `boxShadow`, which is redrawn when its bounds change.
- `features/today/spend-row.tsx:105-112`: `width: '100%'|'50%'` is returned on every drag frame for both backgrounds.
- `ui/toast/toast-host.tsx:83-90`: `width`, `height` and `borderRadius` morph on a view whose sibling copies the same size and carries a 40 px `boxShadow`.
- `features/scan/scan-viewfinder.tsx:54-57`: an endless `top` loop on top of the live camera.
- Fix: use `translateY`/`scaleY`/`scaleX` on fixed-size views. Switch the row width in a derived value that changes only when a threshold is crossed. Draw shadows on a fixed-size layer and fade them.

### 7. MED: each minute tick re-renders the whole app
- `ui/theme/clock.tsx:41` sets the clock every minute. The decimal hour changes, so `ThemeProvider` builds a new palette (`ui/theme/theme.tsx:33-39`).
- Every `useTheme` consumer then re-renders: 77 files, including hidden tabs and open sheets. There are no memo boundaries to stop it, and Sky recomputes `skyFrame`.
- One JS spike per minute; it hurts when it lands during a tab switch or a card commit.
- Fix:
  - Memo boundaries (as in finding 3).
  - Split the clock context, so `today` and `hour` consumers do not share one.
  - Hand Sky the hour as a shared value, or only recompute when the target values actually differ.

### 8. MED (cold start): first frame builds all three tabs, and the splash hides before Home is drawn
- Home's first render builds Today, Plan and Diary, the Sky and two companions (`home-shell.tsx:128-145`).
- Diary fires 7 SQL queries from mount effects (`use-diary.ts:54,75`), competing with the first frame.
- `SplashScreen.hide()` runs as soon as `store.load` resolves (`data/money-provider.tsx:36-39`), not after Home commits. With a 280 ms fade (`app/_layout.tsx:38`), a slow first render shows the bare background.
- Fix: mount Plan and Diary on their first visit, or after the first frame via `startTransition`. Hide the splash from Home's root `onLayout`.

### 9. MED: close-card commit snaps back, and each decision does too much work
- `features/close/close-cards.tsx:83-87`: `commit` calls `onDecide` (a batched dispatch) and then sets `dx=dy=0` straight away. The UI thread applies 0 before React commits the next card, so the flung card can flash back to the centre for at least one frame.
- `data/money-actions.ts:79-84` with `66-73`: `setStatus` does `get`, then `update` does another `get`, then `put`. Three round trips, then a publish, which re-renders all of Home under the takeover (finding 3).
- `ui/paper-edge.tsx:20-25`: every newly mounted back card creates a Skia Canvas (a new Metal layer) after an `onLayout` setState, so the torn edge also appears one frame late.
- Fix:
  - Key the top card by id and reset `dx`/`dy` in a layout effect when the top id changes.
  - Pass `current` into `update` instead of reading it twice.
  - Render the paper edge as a static mask or image, or as a canvas sized without `onLayout`.

### 10. LOW-MED: startup waterfall
- The chain runs in this order:
  - `SQLiteProvider onInit`: Keychain read, then `PRAGMA key`, then WAL, then migrations (`db/database.ts:21-26`). The raw-hex key skips the KDF, which is good.
  - The providers mount.
  - `MoneyProvider`'s effect awaits `readPlan` (`data/money-store.ts:120`) before its 6 queries. That order is needed, because the cycle depends on `payday`.
- Every row goes through zod on read (`data/table.ts:58-67`).
- RevenueCat starts during startup: it is configured on the first render (`purchases-provider.tsx:71` → `revenuecat-port.ts:72-75`), and customer and offerings are fetched at mount (`purchases-provider.tsx:126-127`). Offerings are only needed by the shop.
- Fix:
  - Read the plan with `getFirstSync`, like the other launch settings, so `load` becomes a single batch.
  - Skip zod on trusted reads, or validate lazily.
  - Leave `loadOfferings` to the shop, and defer `Purchases.configure` until after the first frame.

### 11. LOW: smaller items
- `sky.tsx:142`: the full-screen Canvas is not `opaque`, so the compositor blends it every frame. If the sky gradient is always opaque, set `opaque`.
- `sky.tsx:113-137`: `shown`, `props` and `scene` are rebuilt on every render. Not costly once Sky is memoised.
- `data/money-provider.tsx:53-56` and `features/looks/look-settings-provider.tsx:47-50`: the inline `subscribe` makes `useSyncExternalStore` resubscribe on every render. Bind it once.
- `ui/sky/sky-bokeh.tsx:31-58`: up to 10 lights × 2 blur-masked circles at a scale that changes every frame. A pre-blurred disc texture would be cheaper. Measure before changing.
- `features/categories/icon-picker.tsx:166-193`: about 180 un-virtualised cells, each with a `PressScale` animated style, mount when the editor opens.
- `data/money-store.ts:130-133`: `pot_moves` is read in full on every load and grows without bound. Spends queries run `ORDER BY at` with only a `day` index (`db/migrations/0002-create-money-tables.ts:38`). Add a `(day, at)` index in a new migration.
- `features/purchases/purchases-provider.tsx:89-97,130`: every foreground creates a new `customer` object and writes it to the DB, even when nothing changed. Compare before setting.

## Top 3 things to measure on device (iPhone 12, Release build)
1. **UI-thread hitches and GPU frame time on Home.**
   - Use the Instruments *Animation Hitches* and *Metal System Trace* templates.
   - Record idle, list scroll and tab swipe for Golden Hour, Monsoon (rain on) and Lantern.
   - Repeat on the Plan tab (hidden companions) and with Close open (sky under the takeover).
   - Metrics: hitch ratio (ms/s), GPU ms/frame, and UI-runtime time in `createPicture` / host allocation (Time Profiler, main thread).
2. **JS cost of one store write and of the minute tick.**
   - Use the React DevTools Profiler, or a Hermes sampling profile.
   - Swipe-confirm a Today row, and decide one close card. Count renders of TodayPage, PlanPage, DiaryPage and Sky, the commit duration, and the SQL issued.
   - Also measure the time from `runOnJS(swipeTo)` to commit.
3. **Cold start to first Home frame.**
   - Add `performance.now()` marks or os_signposts around `prepareDatabase`, `store.load`, Home's first `onLayout` and `SplashScreen.hide`.
   - Run the Instruments *App Launch* template, cold and warm.
   - Watch how long the splash fade overlaps an uncommitted Home.
