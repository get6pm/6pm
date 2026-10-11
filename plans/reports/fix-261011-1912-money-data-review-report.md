# Fix: money, data and state review findings

Source review: `plans/reports/review-261011-1833-money-data-correctness-report.md`. One commit on `v2`.

## Finding -> change -> test

| # | Finding | Change | Test |
|---|---|---|---|
| 1 HIGH | `cycleMonth` gave two cycles one month | `packages/domain/src/plan/pay-cycle.ts`: a cycle is named after the month holding the day before its payday. Every calendar month gets exactly one cycle, in order, for paydays 1-31, last day and varies. lastDay and payday 25 names are unchanged. | `pay-cycle.test.ts`: all 33 payday rules over 2023-2029 and 2099-2101 (leap years, 2100), each label is the month after the previous, and stable on every day of a cycle. `pots.test.ts`: payday-16 pot now spreads 1tr/1tr/1tr. |
| 1 (migration) | Old rows must not double-record | `pot_moves.cycle` is the cycle's start date, not the label, and the id is `set-aside:<pot>:<start>`, so no key changes. Recorded rows are kept as they are (history is not rewritten); `dueSetAsides` only writes cycles after the last recorded one. Later cycles work out from what the pot holds, so the earlier skew corrects itself. No migration needed. | `pots.test.ts` "recorded under the old cycle label": old 1tr/2tr/0 rows produce no new write for those cycles, only the next one. |
| 2 HIGH | Waiting items from before payday unreachable | `MoneySnapshot.waitingBefore` (caught/pending, `day < cycle.start`), loaded by `money-store`. `waitingOf` and `findSpend` helpers feed the close queue (`use-close`), Inbox, Today's count and Details. Not added to `cycleSpends` or the daily number: they counted in their own cycle (M1), so counting again would take the money out twice. Documented on the field and in M1a. An answered one stays in `waitingBefore` until the next load so its Details and the close total still work. | `money-capture.test.ts` "waiting items from before payday". |
| 3 HIGH | Quick-add cash merged with a QR; Cancel deleted the user's spend | `findDuplicate`: both sides must be capture sources (qr, shared, email, applePay). Typed spends (manual, voice, cash) never merge. `captureSpend` returns `{ row, merged, before, sighting }`; `withdrawCapture` deletes a row the scan made, or for a merge removes only the scan's sighting, drops a now-single trail, and restores status/note/wallet if nothing changed them since. Scan keeps the `Capture` in `Payment`. | `duplicate.test.ts` (typed never merges, all capture pairs merge); `money-capture.test.ts` (cash vs scan, merged cancel, edited-since cancel, 3-way trail). `money-actions.test.ts` updated. |
| 4 MED | Goal restore left shares above 100% | `restorePot` rebalances shares (restored goal pinned to its old share, others give way), writes moved goals, refreshes their cycle set-asides, in one transaction. | `plan-actions.test.ts`: archive + restore returns the original shares, sum 1, set-asides sum to Future you. |
| 5 MED | Close across 04:00 saved the new day's numbers | `useClosingNumber(close.day)` shows the closed day's number (reveal, receipt); `finish` files `readDayNumber(store, snapshot, close.day)`; cash added in a close takes `day: close.day` (`NewSpend.day`). Reveal's days-left now uses the closed day's cycle. | `diary-queries.test.ts` `readDayNumber`: closed day's spent/tomorrow independent of the store's current day. `money-capture.test.ts`: cash filed under explicit day. |
| 6 MED | Ask "save more" ignored joined share | `AskContext.share`; `saveMore` takes `round(amount * share)` from free money. `askContextOf` passes `joinedShare`. | `ask-engine.test.ts` (half share, and equals `whatIfDaily`); `ask-context.test.ts`; other Ask tests updated for the new field. |
| 7 MED | Loads not serialised, transactions could nest | `store-queue.ts` (`createQueue`, `inTurn`). `MoneyStore.exclusive` and `loadInTurn`. `load`, money actions, plan actions, category actions, settings actions and onboarding all run in one queue. | `store-queue.test.ts`: order and failure survival; a load gated after reading cannot overwrite a write; overlapping plan writes and loads never nest a transaction (fails with the queue removed). |
| 9 LOW | Scan used a different merchant key | `use-scan` uses `actions.ruleCategory`. | Covered by existing `merchantKeyOf` tests and `ruleCategory` test in `money-actions.test.ts`. |
| 10 LOW | Key gate deleted the database | `db/database-aside.ts`: renames `sixpm.db` (+ `-wal`, `-shm`) to `*.aside-<UTC stamp>` in the same directory via expo-file-system, keeps only the newest set. If the move throws, falls back to the old delete so the app can still start. | `database-aside.test.ts`. The real expo-file-system path (`database-key.ts` adapter) is not exercised by a test. |
| 12 LOW | Failed note save never retried | `createAutosave` takes an async save; a value counts as saved only after it resolves; failures leave it dirty so the next flush (keystroke, blur, leave) retries; writes never overlap. The hook rejects when `run` reports failure. | `autosave.test.ts` (retry, no overlap). |

Docs: `docs/product-decisions.md` M9 and M1a reworded for the behaviours above.

## Behaviour changes to be aware of
- A Quick-add / voice spend no longer merges with a later bank email, share or QR of the same amount (previous behaviour merged them). This follows the instruction that typed spends are never merged; M9 now says so. Users who type a spend and then get the email will see two rows until they delete one.
- Backup `restoreSnapshot` still runs outside the queue (it runs against a fresh database before the store loads).

## Not done (follow-ups)
- #8 Clock moved forward leaves future set-aside rows (ignore rows dated after the current cycle).
- #11 Diary past Future-you totals re-label with today's payday and drop archived goals.
- #13 Server-side weekly Ask quota (device limit of 60/min only); Privacy copy naming the model provider.
- Review questions: should a merged spend take the observed side's merchant name; should `late` be true for a close between midnight and 04:00.
- Existing set-aside rows recorded under the old label are not rewritten.

## Verification
- `pnpm --filter @6pm/domain test`: 213 pass.
- `apps/mobile` jest `src/data src/features/close src/features/ask src/features/scan src/features/quick-add src/features/details src/db src/features/today src/features/plan`.
- `pnpm exec tsc --noEmit` in apps/mobile, eslint and prettier on changed files.
- Not checked: no device or simulator run; the close-past-04:00 screens (reveal, receipt) are covered only through `readDayNumber` and the hook's logic, not rendered.
