# Audit: Home shell, Today, Quick add, the 6pm Close (v2, read-only)

Audited code: `v2` checkout at `/Users/quocs/Projects/6pm`. Paths below are relative to `apps/mobile/src` unless shown otherwise.
Scope: home/today/inbox/details/companion/quick-add/close, `ui/undo`, `ui/toast`, `ui/keypad`, `data/money-*`, `data/table.ts`, `db/**`, `data/settings-actions.ts`, `packages/domain/src/close/**`.
Checks run: `tsc --noEmit` on apps/mobile, clean. `pnpm --filter @6pm/domain test -- close`: 152 passed. Every `router.push`/`href` in scope resolves to a file in `src/app`, so there are no dead routes. Dynamic i18n keys (`companion.<event>.<persona>`, `source.<source>`) exist in en and vi. Migrations cover every column the code writes.
Not checked: running on a device, prototype pixel parity, other areas (Scan, Plan, Diary, Settings beyond the stale-doc check).

## Broken

### High

**H1. Closing after midnight files the wrong day and locks out the next evening's close (M6).**
- `features/close/use-close.ts:35-38` builds the queue from `s.day === snap.today`. `app/close.tsx:99-102` writes `closeDay({ day: snap.today, late: false })`. `filingDay` is never used by the close; it is only called in `data/money-actions.ts:42`.
- What the user sees: they close at 00:30 on 12 Oct. Yesterday's caught items are not in the queue (sweep only). The receipt is dated 12 Oct. `closed_days` gets `2026-10-12`. At 18:00 on 12 Oct, Today shows "Day closed" with no Close button (`today-view.ts:81`, `tonight-card.tsx:100`), so the real 12 Oct is never reviewed. 11 Oct shows as missed in the Diary.
- Likely fix: compute `closeDay = filingDay(today, hour)` once when the close mounts. Use it for the queue filter, `closeDay.day`, receipt date and `late`. Today's "late" moment should also cover 00:00–04:00 against the previous day.

**H2. Spends added between 00:00 and 04:00 disappear from Today.**
- `data/money-actions.ts:42`: `day = filingDay(today, hourOf(at))`, so a capture at 01:00 is filed under yesterday. Today lists only `s.day === today` (`today-view.ts:83`).
- What the user sees: Quick add (or a scan) at 01:00. The sheet closes, the row is nowhere on Today, and the number still drops through `spentBefore`. It looks like the add failed. If yesterday is already closed, its `closed_days` totals are now stale. On the first day of a pay cycle the spend lands in the previous cycle and drops out of the number entirely (`money-store.ts:124`).
- Likely fix: the 04:00 rule is about the close (M6), not the capture. File captures under `localDateOf(at)`, or show filed-under-yesterday rows on Today until the late close. This has to be decided together with H1.

**H3. Waiting items from earlier days get stranded but still count (M1).**
- Today's Inbox row counts only today's waiting items (`today-view.ts:98`, passed as `waiting` at `today-page.tsx:104`, shown only if `> 0` at `today-list.tsx:62`). The close queue is today-only (`use-close.ts:37`). `/inbox` is pushed only from that row (`today-page.tsx:106`).
- What the user sees: a QR "Not yet" (pending) at 23:00, or anything caught after the close, is unreachable the next day. Under M1 it keeps lowering the number, and the user cannot keep or skip it. The Inbox's "earlier" section (`app/inbox.tsx:28-31`) is only seen by chance, when something else waits today.
- Likely fix: count every waiting item in the cycle for the Inbox row (`snap.cycleSpends.filter(needsReview)`), or put earlier waiting items in the close queue.

### Medium

**M1. The compact top bar's "+" (Quick add) does nothing.** `features/home/home-top-nav.tsx:66-79` is a `PressScale` with no `onPress`. In the prototype this is `navAdd → openQuick`. Fix: pass an `onQuickAdd` prop from `home-shell.tsx`.

**M2. A row half-swiped to "Delete" cannot be tapped.** `features/today/spend-row.tsx:90-91` snaps the row open at −96 and shows the red Delete panel (`:137-151`). That panel is a plain `Animated.View` with no handler, and tapping the front only closes the row (`:97-99`). Only a full swipe past −150 deletes. The prototype's panel is a button (`r.del`). Fix: make the panel pressable and call `onDelete(row.id)`.

**M3. The splash hangs forever if the first load fails.** `data/money-provider.tsx:35-40` uses `load(today).then(...)` with no catch. Any throw leaves `ready=false`, keeps the splash up and raises an unhandled rejection. Throws can come from: JSON.parse of the plan (`plan-settings.ts:45`), or a zod parse of any row that does not match its schema (`table.ts:67`). Fix: catch, report to Sentry, hide the splash and show an error state. The same unguarded `void actions.*` pattern is in every handler in scope.

**M4. M9 (duplicate merge) is not implemented.** Nothing writes `spend_sightings` outside backup and test seeds. `addSpend` (`money-actions.ts:39-64`) never looks for a same-amount, different-source spend within 3 minutes. Details' source trail is only `spend.detail` plus "Added" (`app/spend/[id].tsx:82-85`), so "Seen 2 ways" never appears. A scan marked paid plus the same spend typed in Quick add counts twice.

**M5. M8 (merchant rules) is applied only to Scan.** Only `features/scan/use-scan.ts:76` reads `tables.rules`. Quick add (`app/quick-add.tsx:48-57`) does not pick the learned category when the typed name matches a rule. Close cash chips (`app/close.tsx:193-199`) do not either. `learnedTimes` is never incremented, and an edit in the close (`close.tsx:300-303`) never learns or offers a rule.

**M6. Leaving the close loses its step, and the X at the receipt does not close the day.**
- `close.tsx:126`: X calls `router.back()` except at reveal. The domain `pause`/`resume` events are never dispatched, and no paused state is kept.
- Leaving at the work question or the receipt and reopening starts again at cash or sweep. The question can be asked again, and cash chips must be re-entered (the previous ones are already saved, so the cash step's running total is wrong).
- In the prototype, leaving parks the close at that step and the top bar shows "Resume".

**M7. Quick add can save the same spend twice.** `app/quick-add.tsx:48-60, 173-176`: `save` is async with no in-flight guard. A double tap before `router.back()` runs inserts two rows. Fix: a `saving` ref or state, and disable the button while saving.

**M8. "Closed X of Y days", the week strip, the month dots and the receipt number only see the current pay cycle.**
- `money-store.ts:134` loads `closed_days` with `day >= cycle.start`. Used by `today-view.ts:88-102` (week strip, `closedThisMonth`), `close.tsx:95-96` (month dots, streak) and `close.tsx:232,248` (receipt No. = `closedDays.length + 1`).
- What the user sees: with payday on the 5th, on 11 Oct the strip shows Mon 5 Oct as not closed and "closed 1 of 10 days". The receipt number restarts at 0001 every payday. With the default lastDay payday this only hits the week strip across a month boundary.

**M9. The flung close card likely flashes back to centre.** `features/close/close-cards.tsx:83-87`: `commit` dispatches the decision, then sets `dx.value = 0` / `dy.value = 0` at once. The UI thread applies the reset before React removes the decided card, so the card can snap back to centre for a frame or more. This breaks "no blank frames, no jumps". Fix: reset the shared values after the re-render (in an effect keyed on the top card id), or key the top card so a fresh one mounts at 0.

### Low

**L1. Wallet chips are hard-coded and partly untranslated.**
- Quick add uses `'Cash' | 'MB Bank' | 'MoMo'` (`quick-add.tsx:21-25, 37`). Details cycles through `['Cash','MB Bank','Vietcombank','MoMo']` (`app/spend/[id].tsx:24, 74-78`).
- Both ignore the wallets picked in onboarding (`readWallets`, `data/onboarding.ts:107`), which Scan does use.
- "Cash" is shown as English in vi. It is not in `sameInBothLanguages`, and onboarding has `onboarding.wallets.cash`. The wallet is also stored as a display string.

**L2. Receipt rows do not add up to the receipt total.** `close.tsx:234-242` lists every kept non-work spend, including categories set to not count daily. `total={day.spent}` excludes those categories.

**L3. A note can be lost in Details.** `app/spend/[id].tsx:217` saves only in `onEndEditing`. Drag-dismissing the sheet with the keyboard up may unmount the field without that event firing (risk, not tested on device).

**L4. Delete all data leaves the language in memory.** `settings-actions.ts:30-35` deletes the `language` setting, but `I18nProvider`'s `stored` state (`i18n/i18n.tsx:42`) is never reset. The app keeps the old language until relaunch.

**L5. Undoing an edited close card restores only the status.** `use-close.ts:99-104` → `money-actions.ts:85-92`. The amount and category edited via `CloseEdit` stay changed after "Undo".

**L6. No "Saved." toast after Quick add.** The prototype's `saveQuick` calls `toast('capture')`. `quick-add.tsx:58` only plays a haptic.

## Unbuilt but drawn (inert or missing vs the prototype)

- **Close › receipt Share**: `close.tsx:259` `onShare={() => undefined}`. The button is drawn and does nothing (logged).
- **Close › cash**: only four preset chips (`close.tsx:75-80`). The mic is hidden (logged), and there is no typed alternative, so a 35k cash spend cannot be entered in the close.
- **Close › work question (M10)**: only `source === 'shared' | 'email'` qualifies (`use-close.ts:42`). Neither source exists in this build, so the question never appears. QR spends of 100k or more are never asked.
- **Close pause / "Resume"**, and the compact top bar's **"Close day"/"Resume" CTA** (prototype `navCtaOn`, `6pm App.dc.html:527, 3004`): not built.
- **Today › companion tap → Ask**: `today-page.tsx:89` `onPress={() => undefined}` (prototype `openAsk`).
- **Today › hero number tap → Plan tab** (prototype `toPlan`, line 137): the hero is not pressable (`today-hero.tsx:81-107`).
- **Today › month pace card** ("October", days to payday, pace line, pots; taps to Plan; prototype ~line 230-260): absent from `today-page.tsx`.
- **Today › week dots**: in the prototype, a closed dot opens that Diary day, today opens the close, and a missed dot opens the missed-day sheet (`w.tap`, line 3160). App dots are plain views (`tonight-card.tsx:136-164`). The **closed Tonight card → today's receipt** (`openDay9`) is also not pressable.
- **Quick add voice segment and ₫→$ key**: hidden (logged).
- **Details receipt photo**: hidden (logged).

## Stale `docs/undesigned-states.md` entries

- **Home / "No month set up yet … Sky only; developer tools link"**: stale. `app/index.tsx:11` redirects to `/onboarding`.
- **Settings / Max card hidden**: stale. `app/settings.tsx:69` renders `SettingsMaxCard`.
- **Settings / Look card hidden**: stale. `app/settings.tsx:79` renders `SettingsLookCard`.
- **Settings / "Home currency, Widgets, Travel mode, Backup, Export: hidden … backup not built"**: partly stale. `BackupRow` is at `app/settings.tsx:118`.
- **Max welcome / "Backup is on" … "Backup is not built"**: stale. It contradicts the last row of the same file.
- **Probably stale, not verified in code**: Plan · Occasions "Max state does not exist yet", Categories "6pm Max cannot be bought yet", Diary Year book "Max lands in phase 10". Max is purchasable now.
- **Close / Work question**: accurate but misleading, because no capture source in this build ever triggers it (see above).
- **Close / Receipt Share** and other rows cite phase numbers ("phase 04", "phase 08", "phase 10/11"). This breaks the no-ids rule.
- **Missing rows** (inert or undesigned, not logged): companion → Ask, hero → Plan, week dot taps, Today month card, top bar CTA, close pause/resume, cash custom amount, earlier waiting items with no entry point.

## Unresolved questions

1. M6 intent for captures between 00:00 and 04:00: file them under yesterday (current code) or under the calendar day? H1 and H2 have to be fixed together.
2. Should earlier-day waiting items join tonight's close queue, or stay Inbox-only (with a Today entry point)?
3. Does `pointerEvents` driven through `useAnimatedProps` (`features/home/top-nav.tsx:40-42`) actually apply on Fabric with Reanimated 4? If it does not, the invisible compact bar (opacity 0) would swallow taps on the top ~100 pt of every home page, including Today's Settings and + glass buttons. Needs a device check.
4. Should the work question also cover QR spends while shared and email capture are not built? Without it, M10 never runs in this build.
