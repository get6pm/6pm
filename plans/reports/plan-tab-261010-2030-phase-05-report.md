# Plan tab — build report

Date: 10 Oct 2026 · Scope: the Plan tab, the New pot sheet, the Plan maths and the Plan writes.

## What was built

| File | What |
|---|---|
| `packages/domain/src/plan/plan-river.ts` (+ test, one export line in `index.ts`) | `moneyRiver`, `whatIfDaily`, `aboutPerDay`, `dayBarScale`/`dayBarFraction`, `potMonthlyNeed`, `monthsUntil`, `addMonthsTo`, `goalMonthly`, `goalPlan` (reached / paused / onTrack / behind / steady + ETA month), `billDueIn`, `cyclePosition` |
| `apps/mobile/src/data/plan-actions.ts` | `planActions(store)` + `usePlanActions()`: `setBillPaid`, `addBill`, `updateBill`, `createPot`, `topUp` (`pot_moves` kind `topUp`, cycle = `snapshot.cycle.start`), `archivePot`, `setFutureYou` (`writePlan`). Each writes the DB first, then `store.publish`. Also `readCycleTopUps(store)` (goal vs occasion split of this cycle's top-ups) |
| `apps/mobile/src/features/plan/plan-page.tsx` | `PlanPage({ scrollRef, sectionsRef?, onSectionChange? })`: header, river card, daily card, Bills, Future you, Occasions; `useHomePageScroll('plan')` stays on the page ScrollView. Renders an empty page while `plan === null` |
| `features/plan/money-river-card.tsx` | Stacked river + chip legend; tap a colour or chip to select (others dim to .3, selected scaleY 1.14, 250 ms CSS `ease`); widths animate `flexGrow` 450 ms `curves.enter`; header crossfades |
| `features/plan/daily-card.tsx`, `what-if-slider.tsx` | Big daily number, a bar per day (today accent, weekends warm), mono labels, what-if slider: RNGH pan + tap on the UI thread, `haptics.tick` per 250k step, JS only on step change, commits on release (M5), bars animate 450 ms |
| `features/plan/bills-section.tsx` | Cycle timeline (unpaid bills, "N PAID", TODAY, PAYDAY, progress to today) + rows with an animated paid toggle |
| `features/plan/future-you-section.tsx` | Auto-save row, goals with a Skia progress ring (animated trim), pace pill, +100k, the "each extra 100k" note |
| `features/plan/occasions-section.tsx` | Horizontal jar cards (fill animates 600 ms), +100k / Full, "New pot" dashed card → `/new-pot` |
| `features/plan/use-plan-sections.ts`, `reveal.tsx` | Section tracking + `scrollToSection` (UI-thread reaction, JS only on change); scroll-linked `reveal` |
| `features/plan/plan-view.ts` (+ Jest test), `plan-format.ts`, `plan-colours.ts`, `plan-parts.tsx`, `use-cycle-top-ups.ts`, `new-pot-picker.tsx` | Pure view model, date/month formatting, prototype colours, shared bits, icon/colour picker + templates + round buttons |
| `apps/mobile/src/app/new-pot.tsx` | New pot sheet on `SheetFrame`: tile + icon/colour picker, name, templates, goal ±500k, needed by (Nov…Mar, Jun, No date), live monthly + per-day, "Start this pot" |
| `packages/i18n/src/en-plan.ts`, `vi-plan.ts` | 80 keys, en + vi (mình/bạn, hũ, bạn của tương lai) |

## Prototype line refs (`design/prototype/6pm App.dc.html`)

- Header: 264 · river card: 266–281, logic 2703–2718, 2780 · daily + what-if: 283–301, logic 2720–2726, 2789–2792
- Bills: 303–327, logic 2664–2667, 2727–2728, 2793–2795 · Future you: 329–349, logic 2781–2782, 2797
- Occasions: 351–373, logic 2733–2735, 2798–2799, New pot card copy 2420 · New pot modal: 1246–1308, logic 2876–2906
- Section tracking and jump: 2923, 2928; top-bar chips 3003 · `reveal` keyframe: 35

## Checks

- `plan-river.test.ts` (Vitest): reproduces the seed — free 7.783.000 ("7,8tr"), river 4,2tr / 2tr / 750k / 2,667tr / 7,783tr, 353k a day at 2tr, 376k at 1,5tr (+23k), 331k at 2,5tr, 444k at 0, bars at 59%, Tết 450k a month, new 2tr pot for January 700k, Japan on track (ready Dec), cushion 800k a month (ready Nov 2027), "about 5k a day" per 100k, today at 8/30 on the line. Full domain suite passed (13 files, 142 tests).
- `plan-view.test.ts` (Jest): 6 passing. i18n `catalogues.test.ts`: passing (completeness incl. vi).
- `tsc --noEmit` for `@6pm/mobile`: clean. ESLint and Prettier: clean on every owned file. All files ≤ 300 lines.
- **Not checked:** no simulator or device run (as instructed), so there is no side-by-side comparison with `07-plan.png` / `22-make-your-own-pot.png` and no 60 fps check. Sizes and colours come from the markup, and the river widths, bar heights and slider colours were measured from the render.

## Decisions taken

1. **Day bars run from today to payday inclusive** (`daysLeft + 1` = 23 bars, today first in the accent, weekends warm), so both labels ("FRI 9", "PAYDAY 31") are true. The prototype draws 22 bars starting today, which ends on the 30th. Every bar has the what-if daily height, as in the prototype. Bar scale = max(600k, the daily number with Future you at 0): the seed is exact (59%), and bigger incomes still move. "Past days by spent vs line" was **not** built, because the designed bars start at today (see questions).
2. **What-if (M5):** the number and bars show the real daily number at each step while dragging. Releasing commits through `setFutureYou`, and the river and the lede update then. The note compares against Future you **as it was when the Plan page mounted**, so "Saving 500k less adds 23k to every day" still reads after the commit. The prototype compared against a fixed 2tr.
3. **Reveal is scroll-linked**, exactly the prototype's `animation-timeline: view()` (entry 0→85%: 28 pt rise, .97 scale, fade), on the UI thread. I did not use FadeInDown on mount, which would fire for off-screen cards. The Overview card does not reveal, as in the prototype. With Reduce Motion it is static. All `withTiming` animations go to 0 ms with Reduce Motion; crossfades stay.
4. **New pot "About X less a day"** = `aboutPerDay(monthly, daysLeft)`, which is the real effect this cycle (the store counts a new pot's full monthly at once). The seed shows **32k**, where the render shows 23k (the prototype divides by 30).
5. **Top-up split:** the snapshot carries only `topUpsThisCycle`, so `readCycleTopUps` queries the goal/occasion split. Until it lands, every top-up shows under Occasions, so the total is always right.
6. **Pot monthly need** is in the domain (`potMonthlyNeed` + `monthsUntil`) with the same formula as `money-store.ts potMonthly`, so the river and the daily number agree.
7. **Slider look** follows the render (Chrome's range): 8 pt track with a 1 pt edge (dark `#3b3b3b`/`#858585`, measured), accent fill and a 16 pt accent thumb. The light-mode track colours are Chrome defaults (`#efefef`/`#767676`) and have not been measured.
8. **New pot name field:** RN `TextInput` takes no font axes, so it uses Bricolage at `fontWeight: '500'`.
9. **New pot uses `SheetFrame`** as briefed: a full-height sheet 58 pt from the top. The prototype draws a content-height card floating 8 pt from the sides and bottom with 44 pt corners (render 22). A bottom-card variant of `SheetFrame` would close the gap.
10. Occasion cards show the needed-by month ("January 2027") or "No date yet", because pots store only `YYYY-MM`. The prototype's "Tết · 6 Feb" and "Sat 24 Oct · in 15 days" need a day-level date.

## Undesigned states (please log in `docs/undesigned-states.md`; not in my Owns)

| Screen | State | What the app does |
|---|---|---|
| Plan · Bills | Unpaid bill past due / due today | "Was due 1 Oct" / "Due today" in the warn colour |
| Plan · Bills | No bills | Timeline only (today, payday); river note "No bills yet." |
| Plan · lede | Future you is 0 | "Bills are set aside. The X left is yours: …" |
| Plan · Future you | One goal or none | Sub "Before you can spend it." (no split) |
| Plan · Occasions | "New pot" Max lock after one pot, "Budget together" card | Not built: Max state does not exist yet. New pot is always open; Budget together is omitted |
| Plan | Toasts `potMade` / `potFull` / `save` | Haptics only: no island toast system yet |

## What the controller must wire

1. **Route:** in `app/_layout.tsx`, add `<Stack.Screen name="new-pot" options={sheet} />`.
2. **Top-bar chips** (prototype 3003), in `home-shell.tsx` / `home-top-nav.tsx`:
   ```tsx
   const planSections = useRef<PlanSectionsHandle>(null);
   const [planSection, setPlanSection] = useState(0);
   <PlanPage scrollRef={refs.plan} sectionsRef={planSections} onSectionChange={setPlanSection} />
   // chip k: onPress={() => planSections.current?.scrollToSection(k)}
   // labels: t('plan.section.overview'), t('plan.bills.title'), t('plan.future.title'), t('plan.occasions.title')
   // active chip btnBg/btnFg, others chipBg/ink
   ```
   `PlanSectionsHandle` and `PLAN_SECTIONS` are exported from `features/plan/plan-page.tsx`. A jump lands the section `top(150)` below the top; the current section changes at `top(170)`; the last section wins at the bottom. Chips do not follow the scroll for 700 ms after a jump.
3. **Stale scroll offset on tab switch:** `go()` sets `y = 0` but does not scroll the page. If Plan is re-entered while scrolled, the header, reveals and section index stay wrong until the next scroll event. Either scroll the incoming page to the top in `go()` (the comment says it starts at its top) or seed `y` from the page's offset.
4. **Gesture priority (verify on device):** the pager's horizontal pan (activates at 14 pt) sits over the what-if slider (activates at 4 pt) and the horizontal Occasions strip (RNGH `ScrollView`). If the pager steals either, give the pager `requireExternalGestureToFail` or `simultaneousWithExternalGesture` for those (the prototype's `data-noswipe`).
5. `home-top-nav.tsx` computes "N days to payday" with a hard-coded `sameDay 31`. It should read `snap.cycle.daysLeft`.
6. Optional cleanup: make `money-store.ts potMonthly` delegate to `potMonthlyNeed`/`monthsUntil`, and add the goal/occasion top-up split to the snapshot so `readCycleTopUps` can go.

## Unresolved questions

1. Should the day bars include past days of the cycle (spent vs line, as the brief says), or start at today as the design does (built)?
2. New pot per-day cost: is the real cost this cycle (32k in the seed) right, or the render's monthly ÷ 30 (23k)?
3. Is the what-if baseline right as "the amount when the page opened", or should the note reset to "That's your plan" after each commit?
4. Bills and pots have add/edit/archive actions but no UI on the Plan tab (none designed). Should they come from onboarding or Settings?

Status: DONE_WITH_CONCERNS
Summary: The Plan tab (river, daily + what-if, bills, Future you, occasions), the New pot sheet, the Plan domain maths and the Plan writes are built. The domain/Jest/i18n tests, typecheck and lint all pass, and the tests reproduce the prototype seed.
Concerns/Blockers: Not run on simulator/device, so there is no render comparison and no gesture-priority check. The controller must register `new-pot` and wire the top-bar chips. Day bars, the new-pot per-day figure and the bottom-card vs SheetFrame layout differ slightly from the prototype by decision (see above).
