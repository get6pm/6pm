# Lane B: Plan, Diary, onboarding bills (fixes from the Plan/Diary audit)

Date: 11 Oct 2026. Nothing committed. No simulator run.

## Changes per task

**1. Pot set-aside (#1, #7, #15)**
- `packages/domain/src/plan/pots.ts` (new, exported from `index.ts`): `potSetAside`, `dueSetAsides`, `potTotals`, `occasionsOf`, `savedBefore`, `rebalanceShares`. `pay-cycle.ts`: `cycleMonth` (the month most of the cycle lies in, so months-left is fixed within a cycle). `plan-river.ts`: `monthsBetween`; `potMonthlyNeed` never exceeds what is left.
- `apps/mobile/src/data/pot-moves.ts` (new): reads moves, writes due set-asides with a deterministic id (`INSERT OR IGNORE`, so a cycle never records twice, even if two loads race), clears one cycle's record, re-keys the running cycle when payday changes.
- `money-store.ts` (small edits only): `load()` catches up due set-asides before counting; new snapshot field `setAsideThisCycle`; `potMonthly`/`monthsBetween` removed; `dayOf` now `dailyInputOf` + `dailyNumber` (OCC = this cycle's recorded occasion set-asides).
- Rules: each cycle writes one row per pot (a zero row when paused, full, undated or past its month, so a later edit cannot reach into the past); catch-up runs from the pot's last recorded cycle (or its creation cycle); a new pot records the running cycle at once; editing a pot or changing Future you re-derives the running cycle only. A deleted pot's moves stop counting (money back to free); undo restores it.
- Tests: `pots.test.ts`, `plan-actions.test.ts` (real in-memory SQLite: create, idempotence, 1st-of-month stability, payday roll, catch-up, top-up, edit/pause, delete/restore, goals, payday change).

**2. Joined-cycle what-if (#5)**: `whatIfDaily(input, candidate)` runs the same engine as the committed number, so release never jumps. `aboutPerDay(amount, daysLeft, share)` takes the joined share (New pot, edit sheet). Domain tests incl. joined cycle, equal to the committed number for several candidates.

**3. River (#6, #18)**: new `before` segment ("Before 6pm"), only drawn in the cycle the user joined; en + vi copy. River note starts at `cycle.start`.

**4. Edit/delete pots (#2, #9)**: tap or long-press a jar (or a goal row) opens `app/pot/[id].tsx` (name, icon, colour, goal, month, share for goals, pause, delete with Undo). `planActions.updatePot`, `archivePot`, `restorePot`. New pot: busy guard plus the shared action runner (toast on failure; sheet stays open).

**5. 1 own pot free (#3)**: `newPotLocked`; the "New pot" tile shows the MAX lock and opens `/max?from=pots`; `new-pot.tsx` re-checks and replaces itself with the Max sheet (skipped right after a successful create).

**6. Future you goals (#4)**: "New goal" row in Future you opens `/new-pot?kind=goal` (share row when other goals exist; shares rebalance to 100%). Goals take their share of Future you each cycle (a count, daily number unchanged).

**7. Bills/income/payday (#8)**: due-day wheel on the onboarding amount card; bills whose day this cycle is before the join day are saved as paid (not overdue). Plan: tap a bill row to edit/delete (`app/bill/[id].tsx`, `/bill/new` from "Add a bill"), edit icon beside the Plan title opens `app/month.tsx` (income wheels + payday picker, `planActions.updateMonth`, re-keys the running cycle and paid bills). Shared controls extracted to `features/onboarding/money-in-controls.tsx`. Onboarding copy no longer promises Settings rows (en + vi: "Coming to Settings").

**8. Diary**: #10 empty month = current month; #12 calendar pages back (chevrons; earlier months show their own line); #14 Future you filed by calendar month (set-asides by cycle month, top-ups by the day made; `futureYouOfMonth` tested); shelf's current month opens as a draft; Year book opens `/max?from=diary` when not Max, lock hidden for Max (inert). Day receipt lines now exclude not-daily categories and Claim back (same rule as the close).

**9. Perf (#16)**: Plan's section tracking and reveals read the page's own `useScrollOffset(scrollRef)`, not the shared `y`, so scrolling Today/Diary no longer fires the hidden Plan's `runOnJS` into the shell. Diary: month and week closed days come from the snapshot; remaining queries (week spends, first day, month totals, receipt, paged month) re-run only when closed days / cycle spends / categories change; `useStoreQuery(read, watch)` no longer subscribes to the whole snapshot when `watch` is given. `useDiary` uses `useMoneySelector`.

**10. #17/#19/#20**: all Plan/Diary writes go through `features/companion/use-run-action.ts` (Lane A's); `useStoreQuery` and `useCycleTopUps` report failures to Sentry. What-if baseline resets when `PlanPage` goes from hidden to `active` (see Concerns). Hex colours moved to `packages/theme/src/paper-inks.ts` (`paperInk`, `zineInk`, `yearBookInk`, `planInk`); `plan-colours.ts`, `diary-colours.ts`, `money-diaries.tsx`, `zine-share.tsx` use them.

## Verification
- `pnpm --filter @6pm/domain test`: 206 pass. `pnpm --filter @6pm/i18n test`: pass.
- jest (data, plan, onboarding, diary): all mine pass (plan-actions 12, onboarding 3, plan-view 8, onboarding-maths, diary-queries 3).
- `apps/mobile tsc --noEmit`, `packages/domain` and `packages/theme` tsc: clean. eslint on all changed files: clean. prettier: clean.
- Not checked: any screen on a device/simulator; gesture priority; `useScrollOffset` on the hidden page; renders vs `design/renders/`.

## Undesigned states to log (screen | state | what the app does | why)
- Plan · header | edit income and payday | edit icon beside "Plan" opens the Money-in sheet (wheels from onboarding) | the design has no way to change them.
- Plan · Bills | edit, add and delete a bill | row tap opens a sheet (name, amount wheels, due-day wheel, delete + Undo); new bills get a receipt icon, no icon picker | nothing drawn.
- Plan · Occasions | edit/pause/delete a pot | jar tap or long-press opens the pot sheet; edit month steps one month at a time, "No date" before the cycle month | nothing drawn.
- Plan · Occasions | second pot without Max | "New pot" tile shows MAX lock and "More pots come with Max." and opens the Max sheet | prototype opens the sheet; the tile's locked look is not drawn.
- Plan · Occasions | paused pot | pill reads "Paused" | nothing drawn.
- Plan · Future you | create/edit/delete a goal, share between goals | dashed "New goal" row; goal sheet reuses the pot sheet with a Share row | nothing drawn.
- Plan · Money river | joined cycle | extra "Before 6pm" segment and chip | the design counts it as Spent.
- Onboarding · Bills | due day | small day wheel beside the amount wheels, caption "Due day" | the deck asks only the amount.
- Diary · Calendar | earlier months | round chevrons beside the month title | single month only in the design.
- Diary · Shelf | this month's cover | opens the Money diary as it stands (headline reads "finished ... with X to spare" even when partial) | prototype leaves it inert.
- Diary · Year book | member state | lock badge hidden, tap does nothing | Year book is built later.

Stale entries in `docs/undesigned-states.md` (not mine to edit): Plan Occasions "Max state does not exist", Diary Year book "lands in phase 10", the Settings Max/Look/Backup "Hidden" entries, Categories icon packs "cannot be bought", Home "No month set up yet", and phase-number references.

## Decisions to confirm
- `potMonthlyNeed` caps at what is left (a 520k pot due next month sets aside 520k, not 550k); M4's ceil to 50k otherwise unchanged.
- Cycle month = month holding most of the cycle's days (30 Sep to 31 Oct is October; 25 Sep to 25 Oct is October). Months-left counts from it, the last chance being the pot's own month.
- Goals keep filling after their date (the Future you amount is deducted either way); only occasions stop at their date. A "No date" occasion still sets aside 0 (audit question 1 unresolved).
- Onboarding bills due before the join day this cycle are saved as paid.

## Skipped
- Onboarding palette hex (`onboarding-palette.ts`, `step-pay-with.tsx`): outside the audit's list; onboarding has its own sky palette.
- Ask entry, zine Save/Share, Budget together, "Spotted", "it varies" payday confirmation: unbuilt features, not in this lane.
- Gesture-priority question (pager vs jar strip/slider): needs a device.

## Concerns / needs from others
- **Lane D (`features/home/home-shell.tsx`)**: pass `active={tab === 'plan'}` to `<PlanPage>`. Without it the what-if baseline resets only at launch (default `active = true`); the perf fix does not depend on it.
- `action.failed` (used by Lane A's runner and now by Plan sheets) must exist in the en/vi catalogues; I did not add it (tsc passes, so it is present).
- `apps/mobile/src/data/category-actions.test.ts` fails to load (`@sentry/react-native` ESM via `money-provider`); not touched by this lane.
- New routes (`/pot/[id]`, `/bill/[id]`, `/month`) are cast with `as Href` until the typed-routes file is regenerated.
- Existing installs: first launch writes set-aside rows for each pot from its creation cycle (zero or more), so jars jump to their true held amount once.

Status: DONE_WITH_CONCERNS
