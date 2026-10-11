# Review: money, data and state correctness (2c97a39..HEAD, branch v2)

Scope: packages/domain/src/{time,close,capture,plan,ask}, apps/mobile/src/data, db gate/key, logic parts of features/{close,today,quick-add,details,plan,diary,ask,api,reminders,scan,backup}, apps/api ask/deepseek/ledger. UI/animation skipped.

Checks run: `pnpm --filter @6pm/domain test` (206 pass), `apps/mobile: jest src/data` (8 suites, 51 pass). `apps/api: vitest test/ask.test.ts` (5 pass). I also ran probe scripts with tsx from the scratchpad against the domain sources (output quoted below).

Severity: High = wrong money or a product rule broken in common use; Medium = wrong money or data in a narrower case; Low = edge case or hardening.

---

## 1. HIGH, CONFIRMED: `cycleMonth` gives two pay cycles in a row the same month, so pot set-asides spike and then drop

`packages/domain/src/plan/pay-cycle.ts:78-81` labels a cycle by its middle day. When payday is mid-month, the middle falls on one side of a month boundary or the other, depending on month lengths. Probe output (start -> label):

```
payday 15: 2026-01-15->2026-01  2026-02-15->2026-03  2026-03-15->2026-03   (Feb never used)
payday 16: 2026-09-16->2026-10  2026-10-16->2026-10  2026-11-16->2026-12  2026-12-16->2026-12
```

`potMonthsLeft` and `potSetAside` (`pots.ts:28-30, 47-49`) count months from this label. Scenario: payday 16, an occasion pot of 3tr needed by 2026-11, made 2026-08-20. `dueSetAsides` writes:

```
08-16: 1,000,000   09-16: 2,000,000   10-16: 0
```

The right amounts are 1tr, 1tr, 1tr. The 16 Sep to 16 Oct cycle takes 1tr extra out of free money (about 33k a day off the daily number), and the next cycle takes nothing. The same label also drives the new-pot and pot-sheet month pickers (`new-pot.tsx:75`, `pot/[id].tsx:96`) and the Diary's Future you per month (`diary-queries.ts futureYouOfMonth`), so one month is counted twice and the next shows zero. Payday 15 hits this every February. Payday 16 hits it several times a year.

Fix: use a label that gives every cycle its own month, in order. For example `monthOf(addDays(cycle.payday, -1))`: payday 1 maps to the month just ended, and payday 2 to 31 map to the payday's month. Add a test that goes through paydays 1 to 31 and `lastDay` over 3 years, checking that each cycle's label is the month after the previous cycle's label.

## 2. HIGH, CONFIRMED: waiting items from before payday can no longer be reached (breaks M1a)

`money-store.ts load`: `spends.select("WHERE day >= ? AND day <= ? ...", [cycle.start, day])`. The close queue (`use-close.ts:48`), the Inbox (`app/inbox.tsx:29`) and Today's queue (`today-view.ts:115`) are all built only from `cycleSpends`. `money-actions.ts replaceSpend` even says so: "A row outside the loaded pay cycle (a waiting item from before payday) is saved but not shown."

Scenario: payday 31 Oct. A Grab 85k is caught on 30 Oct and the user doesn't close that night. From 31 Oct it is gone from tonight's close, the Inbox and Today's count. The user can't keep it or say "not mine" (the missed-day sheet only reaches it if that day is still in this week's strip, and that sheet only confirms). M1a says such items join tonight's close.

Fix: load a separate `waitingBefore` list (`status IN ('caught','pending') AND day < cycle.start`). Use cycleSpends plus that list for `closeQueue`, the Inbox and the queue count. Leave it out of `dailyInputOf`.

## 3. HIGH, CONFIRMED: a Quick-add cash spend can merge with a QR scan, and "cancelled" in Scan then deletes the user's own spend

- Quick add saves `source: 'manual'` even when the wallet is `'Cash'` (`app/quick-add.tsx:84-91`, `wallet-options.ts CASH_WALLET`). `findDuplicate` only refuses to merge `source === 'cash'` (`capture/duplicate.ts:46`), so a Quick-add cash spend merges with any observed source.
- `use-scan.ts pay` saves the QR as pending through `addSpend`. That call can return the twin it merged into, and the scan keeps `spendId: row.id`. Answering "cancelled" (`use-scan.ts answer`) runs `update(spendId, {status:'deleted'})`, which deletes the twin. There is no undo.

Scenario: at 12:00 the user quick-adds "phở 45k", paid in cash. At 12:02 they scan a café's VietQR for 45k. The two merge into one spend, so 45k is missing from the count. The bank app fails and they answer "cancelled". The phở spend is deleted.

Fix:
- Treat wallet `Cash` as unseen in `findDuplicate` (pass the wallet in), or save Quick add as `source: 'cash'` when the cash wallet is picked.
- Don't merge a pending QR capture. Let the later email or receipt merge into it once it is confirmed.
- "Cancelled" on a merged row should drop only its own sighting, not delete the spend.

## 4. MEDIUM, CONFIRMED: undoing a deleted goal leaves Future you shares adding up to more than 100%

`plan-actions.ts archivePot` spreads the deleted goal's share over the remaining goals. `restorePot` brings the goal back with its old share and doesn't rebalance. Shares then add up to, say, 1.5. `potSetAside` for goals (`goalMonthly(futureYou, share)`) then puts 1.5× Future you into the goal jars each cycle. `potSaved`, goal progress and Ask's "when is it full" all over-count. The daily number is not affected, because it uses `plan.futureYou`.

Fix: in `restorePot` for a goal, run `rebalanceShares` again (pinned to the restored goal, or proportional), then `refreshSetAsides` for every goal whose share changed.

## 5. MEDIUM, CONFIRMED: a close still open at 04:00 saves the wrong numbers on its receipt

`app/close.tsx finish` writes `closeDay({ day: close.day, spent: day.spent, line: day.line, tomorrow: day.tomorrow })`, where `day = useDay()` follows the snapshot's today. `MoneyProvider` reloads when `today` changes at 04:00 (`money-provider.tsx` effect on `[value, today, attempt]`). `close.day` stays frozen but the number moves to the new day. Cash added during the close (`addCash` -> `addSpend`) is also filed under `snap.today`, which is now the new day.

Scenario: the close opens at 03:58 and finishes at 04:01. Yesterday's closed_days row gets the new day's spent (0), the new day's line and the day after's tomorrow. The Diary shows that receipt from then on.

Fix: work out the receipt numbers for `close.day` itself, with `readDayNumber(store, snap, close.day)` as missed-day does, or freeze them for that day. Let `addSpend` take an explicit `day` for cash added in the close.

## 6. MEDIUM, CONFIRMED: Ask's "save more" ignores the share of the cycle a mid-cycle joiner has left

`ask-engine.ts saveMore`: `lineFrom(day.free - intent.amount, daysLeft)` takes the full amount out of free money. The engine scales the cycle's free money (Future you included) by `share` in the cycle the user joined (`daily-number.ts startFree`). The what-if slider got this right in this diff (`whatIfDaily` runs the engine). Example: share 0.5, 500k more to Future you, 10 days left. Ask says about 50k a day; the slider says about 25k. The first cycle is exactly when people try Ask.

Fix: put the `DailyNumberInput` in `AskContext` and answer with `whatIfDaily(input, futureYou + amount)`.

## 7. MEDIUM, PLAUSIBLE: loads aren't serialised, so a load can overwrite newer data and transactions can collide

- `money-store.ts load` reads everything, then awaits `recordDueSetAsides`, then publishes a snapshot built from the earlier reads. Anything published in that gap is overwritten: `planActions.topUp` publishes without a reload, and `addSpend` publishes too. The new top-up or spend then disappears from screen until the next load.
- `createPot`, `updatePot` and `updateMonth` each open `withTransactionAsync`, and so does `recordDueSetAsides` inside `load`. Every `updatePot` that touches set-aside fields runs `clearCycleSetAside` and then a reload that writes. expo-sqlite's `withTransactionAsync` can't be nested ("cannot start a transaction within a transaction"), and other queries running at the same time get pulled into it.
- If this happens on the first load, the user sees the StartupError screen.

Fix: run `load`, plan actions and money actions through one queue (the `inTurn` pattern in money-actions), or add a generation counter that throws away stale load results. Use `withExclusiveTransactionAsync`.

## 8. LOW-MEDIUM, CONFIRMED: moving the clock forward once stops set-asides until real time catches up

`pots.ts dueSetAsides` writes cycles up to the current cycle as seen by the clock, and `MAX_CYCLES=240` only caps how many rows. With the clock set a year ahead, about 12 future rows per pot are written. When the clock goes back, `recorded >= current.start` skips every pot until that future date. `potTotals` finds no set-aside row for the real current cycle, so occasions drop out of the daily number and it is too high.

Fix: when working out `recorded`, ignore setAside rows dated after `current.start`, or delete them.

## 9. LOW, CONFIRMED: Scan looks up merchant rules with a different key than everywhere else (M8)

`use-scan.ts:84` uses `payee.trim().toLowerCase()`, not `merchantKeyOf`, which also collapses repeated spaces. VietQR names with double spaces never match a learned rule. Use `actions.ruleCategory(payee)`.

## 10. LOW, PLAUSIBLE: the database key gate deletes the database with no way back

`database-key.ts ensureDatabaseKey` deletes `sixpm.db` whenever the Keychain says "not found". I checked expo-secure-store: `searchKeyChain` throws on any status other than not-found, so a locked Keychain is safe, as the comment says. The remaining risk: a future change to the key name, `keychainService` or access group would silently wipe every user's database on update. Moving the file aside (for example `sixpm.db.orphan-<ts>`) instead of deleting it costs nothing and can be undone.

## 11. LOW, CONFIRMED: the Diary's Future you totals for past months change after later edits

`diary-queries.ts futureYouOfMonth` re-labels old set-asides using today's payday (and the label from #1). The query now also drops archived goals. So past months' Future you totals change after a payday change or after deleting a goal.

## 12. LOW, CONFIRMED: a failed note save is never retried

`features/details/autosave.ts flush` sets `saved = latest` before the write runs. If the write fails, the user sees a toast, but no later flush tries again (`latest === saved`). Set `saved` only after the save succeeds, which means passing in an async save.

## 13. INFO: the server

- The Ask weekly quota is only counted on the phone. `/v1/ask` has only the device limit of 60/min, and anonymous device registration is open, so the LLM cost can be abused. This is a cost risk, not a money-correctness one.
- The question text, which may contain amounts and pot names the user typed, goes to DeepSeek. That matches product-decisions §6. Make sure the Privacy copy names the model provider. `ai_usage` stores only token counts and the device hash (verified).

---

## Checked and found correct

- **Upsert change (`table.ts`)**: every money table has a single-column primary key, so `ON CONFLICT (key)` matches. `spend_sightings` (composite key) and `pot_moves` are written with raw SQL. `put` no longer triggers `ON DELETE CASCADE` for sightings or pot moves.
- **Backup and restore**: the snapshot includes `pot_moves` and `spend_sightings`, and restore clears child tables first. There are no schema changes in this range. Set-aside ids (`set-aside:<pot>:<cycle>`) restore without duplicates.
- **Set-aside idempotency**: `INSERT OR IGNORE` with a fixed id means repeated loads write once (covered by a test). A payday change moves the current cycle's records (`moveCycleRecords`), so nothing doubles. I traced 25->10 and 10->25: no id collision on a later cycle.
- **River `before` segment**: the segments add up to income. Algebraically, spent = spentBefore + spentToday whenever goal top-ups + occasion top-ups = topUps.
- **04:00 money day**: it is applied in the clock, in capture days and in a pot's created day. Probe: payday 31 clamps to Feb 28 and to Feb 29 in 2028 correctly.
- **Close queue**: earlier days are included (`day <= closingDay`) and sorted by ISO `at`.
- **Privacy in errors**: Sentry runs with `sendDefaultPii: false`. `ApiRequestError` messages carry only the method and path.

## Recommended order

1. Fix the `cycleMonth` label (#1) and add the test over all paydays.
2. Load waiting items from before payday (#2).
3. Duplicate-merge guards for Quick-add cash and pending QR scans (#3).
4. Fix the receipt across 04:00 (#5), restorePot shares (#4), and Ask "save more" (#6).
5. Serialise load and writes (#7).
6. Ignore future set-aside rows (#8).

## Unresolved questions

- Should a merged spend take the observed side's merchant name (the QR payee or email merchant) instead of keeping the twin's?
- Should the `late` flag on a close made after midnight (before 04:00) be true? It is hard-coded `false` in `close.tsx finish`.
