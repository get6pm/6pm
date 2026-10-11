# Lane C: Settings, Scan, Max gates, reminders

Date 2026-10-11. Uncommitted. Paths relative to `apps/mobile/src` unless stated. Finding numbers are from `audit-261011-1604-settings-onboarding-purchases-report.md`.

## Changes per task

1. **#2 Max icons.** `features/categories/icon-packs.ts` gains `isPackLocked(pack, hasMax)`. `icon-picker.tsx` reads `useEntitlement().max`, so members get all packs. A locked icon is no longer disabled: tapping it pushes `/max?from=icons`. Test: `icon-packs.test.ts`.
2. **#4, #12 Max welcome.** `max-welcome.tsx` shows "Backup is on" only when `useBackupStatus().status.kind === 'on'`. Otherwise it shows the new `max.welcome.win.backupReady` ("Encrypted backup, ready to turn on"). Wins are keyed by index, so the line can change without remounting. `max-context.ts`: the backup welcome href is `/backup` (added to `WelcomeRoute`). Test added in `max-context.test.ts`. Keys added to `en-looks.ts` and `vi-looks.ts`.
3. **#5 close time.** `app/settings.tsx` has an inline picker under the Close time row, built from the onboarding `Wheel` over the full 15:00–23:45 range in 15-minute steps. New in `features/settings/`: `close-time-options.ts` (+ test, built from `CLOSE_TIME_OPTIONS`), `close-time-picker.tsx`, `use-close-time-draft.ts`. The row follows the wheels at once, and the plan is saved 450 ms after the wheels rest, or when the picker unmounts. The reminder reschedule comes from the sync below, not from Settings.
4. **#6, #15 Scan.**
   - `use-scan.ts`: the AppState listener is subscribed once per hand-off (deps are `phase.kind`). `left` lives in a ref, and the switch to `return` uses a functional `setPhase`.
   - `scan-handoff.tsx`: the "I'm back" slot is always laid out and fades in (UI-thread opacity) when the result is manual or store, or after 4 s.
   - `pay` has a `paying` ref, so a double tap on Open adds one pending spend. It rejects when the spend cannot be saved, and the screen shows the `scan.error.pay` toast.
   - `answer` has a busy ref and a catch. On failure the spend stays pending, the `scan.error.answer` toast shows, and Scan closes.
   - `categoryFor` falls back to the likely category if the rule lookup throws.
   - `scan-viewfinder.tsx`: the scan line animates `translateY`, not `top`.
   - New keys in `en-scan.ts` and `vi-scan.ts`.
5. **#7, #9 reminders.** New `features/reminders/`:
   - `reminder-permission.ts`: permission store (`granted`, `ask`, `denied`) with `refreshReminderPermission()` and `useReminderPermission()`.
   - `close-reminder-sync.tsx`: on launch, on AppState `active`, and when `closeAt`, language or permission changes, it schedules the reminder if a plan exists and permission is granted.
   - `reminder-tap.tsx`: listens with `addNotificationResponseReceivedListener`, and reads the cold-start tap with the non-deprecated `getLastNotificationResponse()` followed by `clearLastNotificationResponse()`. It waits for `useRootNavigationState().key`, ignores the same tap twice, and does nothing if already on `/close`.
   - `reminder-route.ts` (+ test): `/close` only for `CLOSE_REMINDER_ID`, with a plan, and today not in `closedDays`.
   - Mounted in `app/_layout.tsx` next to `CloseNudge`.
   - `features/backup/use-apply-restore.ts` now asks for permission after a restore, then schedules. It does not block the restore on the system alert.
   - Settings shows a "Close reminder: Off" row (see undesigned states).
6. **#10 serious mode.** `toast-host.tsx` and `ScanReturn` do not render the companion when `serious`. Inbox is Lane A's.
7. **#14 and the Today audit's L4 (Delete all).** `settings.tsx`:
   - catch plus a busy state ("Deleting…"), with the `settings.deleteFailed` toast on error;
   - taps are ignored while deleting, and an unsaved close-time pick is discarded;
   - `setLanguage(null)` and the reminder cancel now run after the wipe succeeds, so a failed delete no longer loses the language;
   - `setLanguage(null)` resets `I18nProvider`'s in-memory state, so `i18n.tsx` needed no change. Delete all is the only caller of `deleteAll`.
8. **#17 privacy copy.** The `settings.privacyBody` text in `en-today.ts` and `vi-today.ts` now says:
   - money stays on the phone, encrypted;
   - it leaves only with backup (end-to-end encrypted);
   - crash reports go to Sentry with no amounts, names or notes;
   - RevenueCat handles purchases;
   - the receipt-email claim is gone.
9. **#18 links.** `app/+native-intent.tsx` strips the `/app` prefix from universal links, full URL or bare path. The helper is `features/links/strip-app-prefix.ts` (+ test). `app/+not-found.tsx` redirects to `/`.
10. **#19 backup.** `backup-manage-body.tsx` shows the armed "Delete backup" button in the unsettled state too. `service.deleteBackup` already works with a key present.

## Tests run

- `pnpm exec jest src/features`: 24 suites, 140 tests pass. New: `icon-packs`, `reminder-route`, `close-time-options`, `strip-app-prefix`, and the `max-context` backup route.
- `pnpm --filter @6pm/i18n test`: 4/4.
- `pnpm exec eslint` on all changed files: clean.
- `pnpm exec prettier --write` on changed files. I only ran `--check` on `en-today.ts` and `vi-today.ts`, so a whole-file rewrite could not race Lane A.
- `pnpm exec tsc --noEmit`: no errors in my files. The run still fails on other lanes' in-progress work:
  - `features/plan/daily-card.tsx`, `plan-colours.ts`, `plan-page.tsx`, `plan-view.test.ts`
  - `features/today/tonight-card.tsx` (`today.tonight.pausedCards` key)
  - `features/companion/use-run-action.ts`
- API: nothing changed, so no API tests. Not run on a device or simulator.

## Undesigned states to log

| Screen | State | What the app does | Why |
|---|---|---|---|
| Settings | Notifications off | A "Close reminder: Off" row appears under Close time, built from `SettingRow` with the `notifications_off` glyph. It asks once if iOS can still ask, otherwise opens iOS Settings. It disappears when permission is granted. | The prototype has no off state. |
| Settings | Close time | Tapping the row expands the onboarding wheels inline, with a `chipBg` band on the centre row. | The prototype cycles five stops. §6 requires the full range. |
| Scan | Hand-off, bank app opened but control not returned | "I'm back" fades in after 4 s. | A stuck overlay on a non-dismissible modal. |
| Scan | Save failed (on Open or on the answer) | Toast `scan.error.pay` or `scan.error.answer`. On the answer, Scan closes and the spend stays pending. | A database error must not strand the user. |
| Settings | Delete all busy or failed | Button reads "Deleting…". On failure the `settings.deleteFailed` toast shows, and the sheet stays. | |
| Categories | Locked icon | Tapping opens the Max sheet from `icons`. | The prototype lock is inert. |
| Max welcome | Backup not on | "Encrypted backup, ready to turn on". | The purchase does not turn backup on. |
| Backup | Unsettled | An armed delete button under Restore and Replace. | Users can remove the backup without restoring it. |

Stale `docs/undesigned-states.md` lines 39, 41, 42, 47, 71 and 85 are not mine to edit. Lines 47 and 85 now describe behaviour that changed.

## Skipped, and why

- **Toast size via transform (perf).** Not done. The pill's width, height and radius still animate on the UI thread. A scale transform would distort the corner radius against the hardware island, which is black on a non-black status bar, and would also scale the content. A Skia or clip approach is a bigger change than this lane's scope.
- **Settings source rows.** Kept hidden, as instructed.
- **#3 Max sells unbuilt features, and #13 Year book.** Not in this lane's task list. The welcome wins ("Unlimited Ask", "Max form", "Pots, travel, shared budgets, widgets") are unchanged.
- **#16 onboarding copy.** Lane B's.
- **`i18n.tsx`.** No change was needed, as explained under item 7.

## Webhook question (#4 unresolved)

`apps/api/src/env.ts` declares `REVENUECAT_API_V2_KEY` and `REVENUECAT_WEBHOOK_AUTH`. No file in `apps/api/src` uses either (grep over `src`: only `env.ts` matches). There is no webhook route and no entitlement ledger tied to RevenueCat. The mobile app reads entitlements from the RevenueCat SDK only. Nothing built.

## Concerns

1. **Wheel inside the sheet's `ScrollView` (needs the simulator pass).** I could not test the Settings wheel against iOS gesture arbitration. Check that dragging a wheel does not also scroll the sheet or start the sheet's dismiss gesture. The Wheel's pan activates at 3 px vertical. If it fights, the fix is in `SheetScreen` (not mine): turn scrolling off while a wheel is touched. Also check that `Gesture.Pan` runs inside the native formSheet.
2. **`close-reminder.ts`.** I did not change the file; the new code only imports from it. `scheduleCloseReminder` still runs when permission is not granted, in `use-apply-restore` and onboarding, but now only after `askForReminders()` returns true.
3. **New directory `features/links/`.** I created it for the testable link helper, because a `.ts` helper or test inside `app/` would be treated as a route. It is outside the owned directory list; tell me if it should move.
4. **Cold-start tap and `index.tsx`.** `ReminderTap` pushes `/close` over Home once the navigator is ready. If a device shows the splash flicker, the first suspect is `index.tsx`'s onboarding redirect racing with the push.
5. **Reminder row timing.** On the very first launch, the permission cache is empty until the sync's first refresh, so the row can appear a frame after the sheet opens. It animates in, so there is no jump.
6. **Closed-day check.** `ReminderTap` uses `snapshot.today`, which another lane is moving to the 04:00 money day. It follows whatever `today` becomes.

Status: DONE_WITH_CONCERNS
Summary: All Lane C tasks 1–8 and 10 are implemented with unit tests, and eslint and the i18n tests pass. The full typecheck is blocked only by other lanes' files in progress.
Concerns/Blockers: The toast size transform was skipped on purpose. The Settings wheel inside a scrolling sheet needs a simulator check.
