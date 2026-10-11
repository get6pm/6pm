# Lane A report: the money day, Today, the close, Quick add, Details

Audit ids (H1.. M1.. L1..) refer to `plans/reports/audit-261011-1604-today-close-quick-add-report.md`. Nothing is committed.

## What changed, per task

### 1. The 04:00 money day (H1, H2, Diary before 04:00, late moment)
Done once at the source rather than per screen.
- `packages/domain/src/time/close-time.ts`: new `moneyDayOf(instant)` (calendar day, minus one before 04:00) and `moneyHourOf(instant)` (hour + 24 before 04:00, so 01:30 is 25.5). Tests in `close-time.test.ts`.
- `apps/mobile/src/ui/theme/clock.tsx`: `Clock.today` is now the money day. New `dayDate` (noon of the money day, for printing weekday and date) and `closeHour` (money-day hour, for the close moment). `hour` stays the phone's hour for the sky and companion.
- Every consumer of `snap.today` follows with no per-screen patch: Today, the close queue/receipt/`closed_days.day`, Inbox, the Diary (`use-diary.ts` reads `snap.today`), missed-day, the MoneyProvider reload (it reloads when `today` turns over at 04:00).
- `money-actions.ts`: `addSpend` files under `snap.today` when captured now, and under `moneyDayOf(at)` when the source gives a time. The old `filingDay(snap.today, hourOf(at))` double shift is gone (that was H2). A capture at 01:00 now shows on Today.
- `today-view.ts` takes `closeHour`, so at 01:00 "tonight" is `late`, not `before`.
- Today hero date line and Inbox "Today · Mon" use `dayDate`.
- Close freezes the day it is closing at mount (`useClose().day`), so a 04:00 rollover mid-close cannot split the close across two days.

### 2. Earlier waiting items (H3, M1a)
- New domain `closeQueue(spends, closingDay)` (`close/close-queue.ts`, tested): every waiting item filed on or before the closing day, oldest first. `use-close.ts` uses it.
- `todayView().queue` is now every waiting item in the loaded cycle, so Today's Inbox row count and the Tonight card's "to confirm" count include earlier days. The list itself still shows only today's rows.
- Inbox: one section per earlier day (`inbox.afterClose` if that day was closed, new `inbox.earlier` if not). A card in the close from an earlier day shows "Mon 08:15" as its time.

### 3. M8
`money-store.ts` `load()` reads `closed_days` from the earliest of pay-cycle start, 1st of the month and Monday of the week (small query, not all history). The receipt number is `actions.closedBefore(day) + 1` (a `COUNT(*)`), shown by the new `close-receipt-step.tsx`; it falls back to the days in view until the count returns. Month dots now take the money day (`month-dots.ts`, tested), including a month end at 01:00.

### 4. M2, M7, missed-day
- `spend-row.tsx`: the red Delete panel is a Pressable that slides the row out and deletes (prototype `r.del`).
- `quick-add.tsx`: `saving` ref guard, saves through the action runner, button path cannot double-write.
- `missed-day.tsx`: filing runs in `try/finally` through the runner; failure toasts and re-enables the button.

### 5. M9, M6 pause/resume, custom cash
- M9: `close-cards.tsx` now has a `CardStack` keyed by the top card id. Each top card mounts with its own drag at 0, and nothing is reset after a fling. The card behind is already at the top position when the old one leaves, so the swap frame is identical. The reset-after-commit is gone.
- M6: new `close-session.ts` (in-memory parked close: money day, reducer state, queue ids, cash chips). `use-close.ts` parks the close on unmount by any route (X, swipe back) with the domain `pause` event and resumes it with `resume`. Today's Tonight card shows "Close paused", the cards/receipt sub line and "Resume the close" (keys already existed, two new for the sub lines), and the companion line uses `companion.paused.*`. Reopening at cash/question/receipt/reveal continues there with the same queue and the cash already added. Parked at cards, it restarts the cards over what is still waiting (decisions are already saved).
- X at the receipt: I followed the prototype (`leaveClose`): only the reveal finishes the day; leaving at the receipt parks it (Today then says "Almost there · just your receipt to go"). The brief said "closes the day the way the prototype does", which for the receipt step is parking. Say if you want the receipt to file the day instead.
- Typed cash: "Other amount" chip on the cash step opens `cash-custom.tsx` (keypad from `ui/keypad.tsx` + `pressKey`/`keypadVnd`, category chips, "Add to cash today").
- `close.tsx` is now 296 lines; the receipt, reveal, top bar, work question and rule offer moved into `close-receipt-step.tsx`, `close-reveal-step.tsx`, `close-top-bar.tsx`, `close-work-question.tsx`, `use-rule-offer.ts`.

### 6. M4 duplicate merge, M5 merchant rules
- Domain `capture/duplicate.ts` (`findDuplicate`, `mergedStatus`, tested): same amount, different source, within 3 minutes, nearest wins; skipped/deleted never absorb; two user-typed sources (Quick add, voice) never merge; cash never merges (nothing else can have seen it). At least one side must be observed (qr, shared, email, applePay).
- `addSpend` runs it against the cycle's spends. On a hit it keeps the existing row (confirmed if either side was), fills the note/wallet gaps, and writes both sightings to `spend_sightings` in one transaction. Returns the surviving row, so Scan's `row.id` keeps working. Details shows "Seen 2 ways · QR + Email" then one line per sighting.
- Domain `capture/merchant-rule.ts` (`merchantKeyOf`, `ruleCategoryFor`, `learnedRule`, tested). `rememberMerchant` now increments `learnedTimes` (it kept the old count before).
- Quick add: typing a name 6pm knows picks that category live, unless the user picked one. Close cash chips and the typed cash use `actions.ruleCategory(name)`. Editing a card's category in the close offers "Always file X as Y?" (the Details `RulePrompt`) unless the rule already exists; "Always" saves and says `ruleSaved`.

### 7. L1, L2, L3, L5, L6
- L1: `features/quick-add/wallet-options.ts` (tested) builds cash first (stored as `Cash`, shown translated from `onboarding.wallets.cash`) then the banks from `readWallets`; `use-wallet-options.ts`, `wallet-row.tsx` (up to 3 share the row, more scroll). Used by Quick add and Details (Details keeps a wallet the spend already has).
- L2: `close/receipt-lines.ts` (tested): receipt lines are kept, counted, not-work, so they add up to the total.
- L3: `details/autosave.ts` (tested) + `use-autosaved-note.ts`: save 600 ms after typing, on end-editing, and on unmount.
- L5: `setStatus(id, status, edit)` writes the edit and the status in one write; `undo(id, restore)` puts the original amount and category back (`use-close.ts` passes the queue's originals).
- L6: Quick add says `companion.capture.*` ("Saved." in plain) after a save.

### 8. Drawn-but-inert on Today
- Week dots: closed -> that day in the Diary, today -> close, missed (past, unclosed, since `plan.startedOn`) -> `/missed-day?day=`. Future dots disabled. `WeekDay.missed` added.
- Closed Tonight card: CLOSED stamp (prototype `stampIn`), "Today's receipt is filed in your {month} diary", chevron, opens today's receipt.
- Diary hand-off: new `features/today/diary-request.ts` (`requestDiaryDay`); `use-diary.ts` takes up each request once (resets paging to this month). `TodayPage` has an optional `onOpenDiary` prop that switches the tab (see Concerns).
- Inbox empty-state companion hidden in serious mode.
- Skipped: companion tap -> Ask (not built yet); hero tap -> Plan and top-bar "+" (Lane D); the month pace card (below).

### 9. Performance
- `money-provider.tsx`: `useMoneySelector(selector, isEqual?)` (memoised on snapshot + selector, keeps the previous value when equal). `useDay()` is built on it with a shallow compare, so it returns the same object until the number changes.
- `spend-row.tsx`: confirm/delete fills are `scaleX` transforms (origin left/right) and label fades are opacity; no width animation.
- `money-actions.ts`: `setStatus`/`undo` read the row from the snapshot (DB only as fallback) and write once: the close decision went from get + get + put to one put. Writes also run in a single queue (`inTurn`), so concurrent edits of one spend cannot overwrite each other.

### 10. Action runner
`features/companion/use-run-action.ts` (`useRunAction`): runs a write, on failure reports to Sentry (`captureException`, same as `money-provider.tsx`) and toasts `action.failed` through the existing island toast; resolves to whether it worked. Used by Today (confirm, delete + undo), Inbox, Quick add, Details, the close (decide, undo, cash, finish, work answer), missed-day. Nothing existed to reuse (scan has its own `.catch` toast with scan keys).

## A bug found on the way (table.ts), please tell Lane B
`createTable().put` used `INSERT OR REPLACE`. With `PRAGMA foreign_keys = ON` (database.ts) the REPLACE deletes the row first, which cascades to child rows: every edit of a pot (`plan-actions.ts` calls `pots.put` on each change) deleted that pot's `pot_moves`, and every spend update deleted its `spend_sightings`. `put` is now an upsert (`ON CONFLICT (key) DO UPDATE`), so rows are updated in place. `table.test.ts` covers it with a real in-memory SQLite. If Lane B saw pot savings vanish, this is why.

## Tests run
- `pnpm --filter @6pm/domain` vitest (whole package earlier: 170 passed incl. new `capture/duplicate`, `capture/merchant-rule`, `close/close-queue`, `time/close-time`); `eslint`, `tsc --noEmit`, `prettier --check` clean on the domain files.
- `apps/mobile` jest, files I added: `data/money-actions.test.ts` (9: money-day filing, merge + sightings survive an edit, no merge cases, undo restores an edit, double-tap delete keeps undo, write ordering, learnedTimes, receipt numbering, closed-day window across payday), `data/table.test.ts`, `features/today/today-view.test.ts`, `features/close/month-dots.test.ts`, `features/close/receipt-lines.test.ts`, `features/details/autosave.test.ts`, `features/quick-add/wallet-options.test.ts`. Also ran `data/backup-snapshot.test.ts` and `data/plan-actions.test.ts` against the table.ts change: pass.
- `pnpm --filter @6pm/i18n test`: 4 passed (en/vi complete).
- eslint clean on every file I changed; prettier applied.
- `tsc --noEmit` (apps/mobile), run last after all my edits: no errors in any file I own. The remaining errors are in other lanes' files in flux (`app/new-pot.tsx`, `data/plan-actions.ts`, `features/plan/*`, `features/onboarding/*`, `features/diary/month-calendar.tsx`, `features/api/api-client.test.ts`).

## Undesigned states to log (screen | state | what the app does | why)
- Close | cash step, amount not covered by the chips | an "Other amount" dashed chip opens a sheet with the Quick add keypad, category chips and "Add to cash today"; saved as a kept cash spend named after the category | prototype has only the four chips and a hidden mic
- Close | a card's category was edited | floating "Always file X as Y? Once / Always" over the card buttons for 7 s, gone when the cards step ends | Details' rule prompt is drawn, the close's is not
- Close | waiting item from an earlier day in the queue | the card's time reads "Mon 08:15" | cards were drawn for today only
- Inbox | waiting items from several earlier days | one section per day, "Mon · after you closed" if that day was closed, else "Mon · not confirmed yet" | drawn with a single "after you closed" section
- Details | spend seen two ways | source trail headed "Seen 2 ways · QR + Email", then a line per sighting ("12:10 · QR · MB · ••4821") instead of "Added" | the prototype has the "Seen 2 ways" label only on the Inbox/close card
- Quick add / Details | more than three wallets | the wallet row scrolls sideways; Details' wallet cell cycles through the same list | design shows three
- Any | a write fails | island toast "That didn't save. Try again." and the sheet stays open | no failure state drawn
- Today | close parked at the receipt | "Close paused", "Almost there · just your receipt to go", "Resume the close" | drawn for the cards case; same wording used for the later steps as the prototype does

## Skipped, and why
- Month pace card on Today: the markup is clear but its content is not: the title/sub copy rules (ahead of pace / right on pace / a little ahead) and the three-pot grid values live in prototype code that belongs with the Plan numbers (Lane D's data). It should be built where the Plan pace maths is, not duplicated here.
- Hero tap -> Plan, compact top bar "+" and "Close day/Resume" CTA, companion tap -> Ask: not mine / not built yet.
- Receipt Share, work-question coverage of QR spends (audit unresolved question 4): not in my task list; unchanged.

## Concerns / hand-offs
1. `features/home/home-shell.tsx` (Lane D): pass `onOpenDiary={() => go('diary')}` to `TodayPage`; until then the week dots and the closed card request the day but do not switch tabs. Its top nav should read `closeHour` (not `hour`) for any close-moment CTA, and `dayDate` (not `now`) for any date it prints.
2. `Clock.today` is the money day for every consumer (onboarding's `startedOn`, dev tools, Plan). Intended; nothing else needed unless a screen wants the calendar day (then use `now`).
3. The Diary's own receipt (`diary-queries.ts` `readDayReceipt`) filters kept and not-work but still lists not-counted categories, so it has the L2 mismatch. I did not touch it (Diary lane).
4. Waiting items filed in a previous pay cycle are not in `cycleSpends` (they do not count in this cycle's number), so they stay out of the Inbox and the close. M1a is met for everything inside the loaded cycle.
5. The close parks in memory only: after a relaunch the close starts fresh over whatever is still waiting (every decision and cash entry is already saved).
6. Not checked on a device: the card-stack swap feel (M9) and the Delete-panel tap on the real row, the rule-offer overlay position over the buttons, the stamp animation on the Tonight card, `useMoneySelector` re-render behaviour. No simulator run.
