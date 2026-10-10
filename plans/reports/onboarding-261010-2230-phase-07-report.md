# Onboarding v2: build report

Date: 10 Oct 2026. Scope: the onboarding owns list from the phase 07 task. Nothing was committed.

## Built

| File | What |
|---|---|
| `apps/mobile/src/app/onboarding.tsx` | Full-screen route (default export) that renders `OnboardingFlow` |
| `features/onboarding/onboarding-flow.tsx` | The 8 steps, the step slide-ins (`inR`/`inL`), the companion's line per step, the footer button label and icon |
| `features/onboarding/use-onboarding.ts` | Answers state, values derived through the domain engine, moves (go/back/skip/next), the notification ask, and `finish` (writes data, schedules the reminder, then `router.replace('/')`) |
| `features/onboarding/onboarding-sky.tsx` | Skia sky: the prototype's 3-stop gradient tweens from morning to dusk on the UI thread (1.2 s), and the sun crosses, sinks and warms (`.3,.8,.3,1`) |
| `features/onboarding/onboarding-palette.ts` | Onboarding's own sky keyframes and inks, as in `OB2:518-529`, plus fixed demo colours |
| `features/onboarding/onboarding-chrome.tsx` | Back button, 8-dash progress (`.5 s` fill), Skip (steps 2–5), companion bubble (`bubbleIn`), footer button |
| `features/onboarding/onboarding-motion.ts` | Keyframes `rise`, `pop`, `fade`, `inR/inL`, a mount-progress hook (cardIn/fly/growX) and a loop hook (demos). All fall back to Reduce Motion |
| `step-welcome`, `step-money-in`, `step-bills`, `step-future-you`, `step-pay-with`, `step-catching`, `step-close-time`, `step-first-number` | One file per step |
| `bill-deck.ts`, `bill-copy.ts`, `bill-card.tsx`, `bill-card-parts.tsx`, `bill-deck-view.tsx` | Yes/no deck. Each yes or pick deals an amount card with M / 100k / 10k wheels that start at 0. Add later saves the bill at 0. A tapped tray chip reopens its card. Peeks behind the top card; `cardIn` in, `flyR`/`flyL` out with a 10° tilt |
| `catch-demo-kit.tsx`, `catch-demos.tsx`, `catch-demos-mail-lock.tsx` | Four live mini demos: Skia stripes/checker/ring, scan line, tap ring, mail sliding |
| `close-reminder.ts` | Real `requestPermissionsAsync` and a daily `scheduleNotificationAsync` (`DAILY` trigger, id `close-reminder`, so scheduling again replaces it). `expo-notifications` loads lazily through `import()`, so a binary without the module still runs |
| `onboarding-maths.ts` (+ test) | Wheel digit to amount conversion, Future you % (rounded to 100k), close-time wheels taken from `CLOSE_TIME_OPTIONS`, and `firstDay()` = `payCycleOn` + `dailyNumber` (the same path `dayOf` uses) |
| `ui/wheel/wheel.tsx`, `wheel-maths.ts` (+ test) | Reusable iOS-style wheel built on Gesture Handler and Reanimated. Rows are size·1.4; rubber band 0.3; momentum target `pos − v·220/H`; 380 ms `(.2,.9,.25,1)` snap; rows use rotateX(−22°·d), opacity 1−.36d and scale 1−.07d; the top/bottom mask is applied to each row; tap a row to jump to it; `haptics.tick` fires for each row that crosses the centre. Reduce Motion removes the 3D tilt. VoiceOver treats it as adjustable |
| `data/onboarding.ts` (+ test, node:sqlite) | `completeOnboarding(store, answers, { today, language })` runs as one transaction. It writes the plan (keeping persona/serious if a plan already exists), seeds the 6 categories in the user's language only if none exist, inserts the bills (due day 1), and stores the `wallets` JSON setting; then it calls `store.load(today)`. `readWallets(store)` is also exported |
| `packages/i18n/src/en-onboarding.ts`, `vi-onboarding.ts` | 136 keys each. Includes `reminder.close.six` / `reminder.close.at` for the notification text |

Checks run: `tsc --noEmit -p .` (mobile) is clean. ESLint on every file listed is clean. Prettier has been applied. Jest: `wheel-maths`, `onboarding-maths`, `data/onboarding` give 15/15 passing. The i18n completeness test passes.

**Not checked:** no screen was compared on a device or simulator, because I was told not to run Metro, the simulator or a native build. Every layout value comes from the markup (`OB2:39-418`), but none has been compared with `design/renders/onboarding/*`.

## Prototype refs

Markup `OB2:39-418`, logic `OB2:438-641`, wheel `WH:1-100`. Renders 01–09 were read for reference.

## Decisions

1. **Onboarding's sky is its own, not `<Sky look hour>`.** The prototype uses a separate 5-stop pastel keyframe set (`OB2:518`), and its UI turns dark at `t > .7`, which is step 5. Driving the Golden Hour look by hour would give teal middays and stay light until step 7, so it would not match renders 03–08. The keyframes live in `onboarding-palette.ts`, following the same pattern as `plan-colours.ts` and `diary-colours.ts` (prototype literals plus `mixHex` / `oklchSrgbHex` from `@6pm/theme`). The controller may want to move them into `@6pm/theme`.
2. **The first number uses the domain engine (M2), not ÷30.** The reveal, the "About X a day" hint and the Lock Screen demo all use `firstDay()` → `dailyNumber` with `daysLeft` from `payCycleOn`. The test confirms that Home's `dayOf` gives the same number after `completeOnboarding`. The reveal note now reads "…spread over the N days to payday."
3. **No fake setup.** Share, Forward emails and Lock Screen each show a non-pressable "Set it up later in Settings" pill instead of the prototype's toggle-to-"Ready". The companion line is therefore always "1 of 4 ready." The email demo shows a placeholder address (`you@…`), not a real handle.
4. **No pre-picked banks.** The prototype pre-selects MB, MoMo and Cash. I start with none selected, and the companion says "Tap the ones you use." The design defaults are kept only where a wheel must rest somewhere: 15,5tr income, payday on the 25th, Future you 12%, close at 18:00. Bills start at 0.
5. **Bank names and tile colours come from the VietQR catalogue** (`findBank`), as instructed. Monograms (MB, VCB, VP, Mo, Zalo, ₫) and Cash's tint are from the prototype. Catalogue colours differ slightly from the prototype tints (e.g. MB `#1E3A8A` vs `#1d3f9a`).
6. **Notification text.** The preview card and the real notification use the same string: "It's six. Time to close your day." (render 08), and "It's 19:30. Time to close your day." for other times. This differs from the task's paraphrase "It's six. Close your day."; the vi text is "Sáu giờ rồi. Chốt ngày thôi."
7. **Permission flow.** "Remind me at HH:MM" calls `getPermissionsAsync`, and calls `requestPermissionsAsync` only if iOS can still ask. Then it moves to the reveal. The reminder is scheduled only on "Open 6pm", using the final close time. If scheduling fails, the finish still completes. If the data write fails, the overlay lifts and the user can tap again.
8. **"Open 6pm"** fades in the sky overlay with today's number in short form. The data write runs in parallel. After at least 1.1 s, it calls `router.replace('/')`.
9. **Companion step lines** are under `onboarding.line.*` in the onboarding catalogue rather than `en-companion.ts`, which I don't own. They are specific to onboarding.
10. **Payday ordinals:** en "25th"; vi "25" inside the sentence "Nhận lương ngày [25] hằng tháng".

## What the controller must wire

1. **Register the route** in `app/_layout.tsx`:
   `<Stack.Screen name="onboarding" options={{ animation: 'fade', gestureEnabled: false }} />`. It must not be a sheet, and swipe-back must be off.
2. **Gate Home** in `app/index.tsx`: when `useMoney().plan === null` (equivalently `useDay() === null`), return `<Redirect href="/onboarding" />` instead of the current "Developer tools" placeholder. Keep the dev tools link reachable in `__DEV__` some other way if needed. When onboarding finishes it calls `router.replace('/')`. At that point `store.load` has already published the plan, so Home renders straight away.
3. **Foreground notifications** (optional): to show the reminder while 6pm is open at close time, call `Notifications.setNotificationHandler({ handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }) })` once in the shell. Without it, iOS only delivers the reminder when the app is in the background.
4. **Settings** should reuse `scheduleCloseReminder(language, closeAt)` and `askForReminders()` from `features/onboarding/close-reminder.ts` when the close time changes, so the daily reminder moves with it. Same id, so the old one is replaced. Move the file to a shared folder if you prefer.
5. **Log these in `docs/undesigned-states.md`** (I don't own it):
   - Onboarding · Catching spending · Share / Email / Lock Screen cards show "Set it up later in Settings" with no action, because the share extension, receipt email and widgets are not built yet. The prototype faked a toggle to "Ready".
   - Onboarding · Pay with · nothing pre-selected; companion says "Tap the ones you use." (prototype pre-picks MB/MoMo/Cash).
   - Onboarding · Reveal · iOS notification permission previously denied → no alert; reveal says "No reminder set. Open 6pm around HH:MM."
   - Onboarding · Small screens (iPhone SE, 667 pt) · not designed. The bills step (340 pt deck plus tray) and close-time step have fixed heights and may crowd. They do not scroll.
   - Onboarding · Finish fails (database error) · overlay lifts, "Open 6pm" can be tapped again; no message.

## Undesigned / deviations (beyond the list above)

- **Language and currency** come from the device, as the v2 notes say. There is no step for them.
- **Status bar** is the real one, so the render's fake sky clock (07:00→18:06) is not reproduced.
- **CSS gradient changes snap in the browser;** here the sky morphs smoothly over 1.2 s.

## Open questions

1. **Founder: the mid-cycle first number (important for TestFlight).** Under M2 the engine assumes the whole month's income is unspent today. Example: on 10 Oct with payday on the 25th, 15,5tr, no bills and 12% Future you gives (15,5tr − 1,9tr) ÷ 16 days = **850k** a day. The prototype's ÷30 gives 453k. The money-in hint likewise reads "About 968k a day". Someone joining mid-cycle has usually spent part of that pay already, so the number is inflated by up to 2×. Options:
   - (a) keep M2 as decided;
   - (b) prorate the first cycle: income × days covered ÷ cycle length, which matches the prototype's note "Math uses a full pay cycle";
   - (c) add a "How much is left until payday?" wheel.

   Option (b) or (c) needs a domain change. I implemented (a), as decided.
2. Should the onboarding sky keyframes move into `@6pm/theme`?
3. Should bank tile colours follow the prototype tints or the catalogue's? The catalogue is used now.

Status: DONE_WITH_CONCERNS
Summary: All 8 onboarding steps, the reusable Wheel, `completeOnboarding` (one transaction, tested on real SQLite) and the real permission request plus daily close reminder are built, and the en/vi copy is filled in. Typecheck, lint and 15 Jest tests pass, and the i18n completeness test passes.
Evidence: tsc clean; eslint clean; jest wheel-maths/onboarding-maths/data/onboarding 15/15; i18n vitest 4/4. Nothing was compared on a device or simulator (no Metro or simulator per instructions).
Concerns/Blockers: (1) the controller must register the route and add the Home gate; (2) the founder should decide on the mid-cycle first number (M2 gives about 2× the prototype's number when joining mid-cycle); (3) nothing has been checked against the renders on a device yet.
