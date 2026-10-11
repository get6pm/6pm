# Audit: Settings, onboarding, purchases, backup, scan, API

Date 2026-10-11. Read-only audit of the v2 checkout at `/Users/quocs/Projects/6pm`. Paths are relative to `apps/mobile/src` unless they say otherwise.

Checks run: `@6pm/mobile` typecheck passes. `@6pm/i18n` completeness passes (4/4). Live probes: `GET /api/v1/health` returns 200 on dev and prd (commit `d5a1874`). `GET /api/v1/backup/meta` returns 401 with no token and 404 JSON with a well-formed token. `/terms`, `/privacy` and the AASA file all return 200.

Not checked: anything on a device. That covers StoreKit, the Keychain and notifications. I also could not see App Store Connect or RevenueCat product state.

## Broken

| # | Sev | Where | What the user sees | Likely fix |
|---|---|---|---|---|
| 1 | high | `db/database-key.ts:13`, `db/database.ts:23`, `app/_layout.tsx:93` (no `onError`) | **Launch crash on a new or restored iPhone.** The SQLCipher key is kept `AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY`, so it never moves to another device. The database file does move: expo-sqlite keeps it in `Documents/SQLite` (`SQLiteModule.swift:28`), which is in iCloud and Quick Start backups. On the new phone a fresh key is made, `PRAGMA key` no longer matches, and the migrations throw. `SQLiteProvider` re-throws the error (expo-sqlite `hooks.tsx:233`), so the app crashes every time it opens. This hits exactly the users the backup restore is built for. | When the key is missing but the file exists, delete the database and start fresh. Or exclude `SQLite/` from device backup. Add `onError` to `SQLiteProvider`. |
| 2 | high | `features/categories/icon-picker.tsx:170` | `const locked = !pack.free;` ignores the entitlement. A paying Max member never gets the 144 Max icons, even though Max sells "180 icons" and its sheet says "Everything below is unlocked". The locked icons are also inert: tapping them does not open the Max sheet. | Pass `useEntitlement().max` in and use `locked = !pack.free && !max`. When locked, push `/max?from=icons`. |
| 3 | high | `packages/i18n/src/en-looks.ts:51-82`, `features/purchases/max-tiles.tsx`, `max-welcome.tsx:157-167` | **Max sells features that do not exist:** unlimited Ask, Budget together, Travel mode, Year book, widgets in your look, CSV/Sheets export, and the Max companion form (`today/companion-greeting.tsx:62` never passes `form="max"`). This risks App Review rejection and refunds. | Hide tiles and welcome lines for unbuilt features, or build them. This is a founder call. |
| 4 | med | `features/purchases/max-welcome.tsx:163` | The welcome after buying always says **"Backup is on"**. Backup never turns itself on (`backup-manage-body.tsx:79-84` needs "Turn on backup"). This contradicts `docs/undesigned-states.md:85`. | Show the line only when backup status is `on`, or change the copy to "Backup is ready". |
| 5 | med | `app/settings.tsx:28,48-49,96-101` | **Close time in Settings is limited to 5 values** (`17:30, 18:00, 18:30, 19:00, 21:00`). product-decisions §6 says 15:00–23:45 in 15-minute steps, and onboarding's wheel offers all 36 (`CLOSE_TIME_OPTIONS`). If onboarding set anything off the list (e.g. 19:15), `indexOf` returns −1 and one tap jumps to 17:30. | Reuse `CLOSE_TIME_OPTIONS` with the onboarding wheel (`step-close-time.tsx`) in a picker. |
| 6 | med | `features/scan/use-scan.ts:64-72`, `scan-handoff.tsx:77-104` | **Scan can get stuck on "Opening MB Bank…".** The return-from-bank listener is re-created whenever `phase` changes. `pay()` changes `phase` twice: once with `result: null`, then again with `result` after `openURL` resolves (line 133). If `background` reaches the first listener and the second one then replaces it, `left` is lost. On return nothing happens. For `opened` the overlay shows only a spinner, with no "I'm back" button. Scan is a `fullScreenModal`, so it cannot be swiped away either. The user must force-quit (the pending spend survives). | Keep `left` in a `useRef` and subscribe once per hand-off (depend on `phase.kind`). Always show "I'm back" after a short delay. |
| 7 | med | `features/backup/use-apply-restore.ts:27-29`, `features/onboarding/use-onboarding.ts:104-110` | **A restored user never gets the close reminder.** Restoring from the welcome step skips the close step, so `askForReminders()` is never called. `scheduleCloseReminder` then runs without permission. No Settings row asks for notifications either. The same gap leaves users who denied in onboarding, then allowed in iOS Settings, with no reminder until they change close time or language. | Call `askForReminders()` in `useApplyRestore`. On launch, reschedule when permission is granted and a plan exists. |
| 8 | med | `data/onboarding.ts:92` with `packages/domain/src/plan/plan-river.ts:137-143` | Every bill from onboarding is due on the 1st. With the default payday (25th), the cycle starts on the 26th, so on any day after the 1st every bill shows **"Was due 1 Oct"** in the warn colour right after setup (`plan/bills-section.tsx:245`). | Ask for the due day, or default it to the next payday. Or mark onboarding bills as paid for the current cycle. |
| 9 | med | `features/onboarding/close-reminder.ts:36-47`; no `addNotificationResponseReceivedListener` anywhere in `src` | Tapping the "Time to close your day" notification only opens the app. It does not open `/close`. | Add a response listener that routes to `/close` when the plan exists and today is due. |
| 10 | med | `app/inbox.tsx:73`; `ui/toast/toast-host.tsx:131`; `features/scan/scan-handoff.tsx:161` | **Serious mode still shows the companion.** It appears in Inbox's empty state (happy mood, no serious guard), in every island toast and on Scan's return card (plain mood). §1 says serious mode removes the companion. | Guard with `!serious` the way `missed-day.tsx:98` does. |
| 11 | med | `data/money-provider.tsx:36-39`; `data/plan-settings.ts:45` | If `store.load` rejects, the splash never hides and the app hangs on launch. For example, `readPlan` calls `JSON.parse` with no guard, so a damaged `plan` row is enough. | Catch the error, hide the splash and show a fallback. Use `safeParse` around `JSON.parse`. |
| 12 | low | `features/purchases/max-context.ts:75` | The Max welcome for `from=backup` says "Go to backup" but opens `/settings`, not `/backup`. | Use `href: '/backup'` and add it to `WelcomeRoute`. |
| 13 | low | `features/diary/money-diaries.tsx:146-200` | The Year book is a plain `View`. It shows the MAX lock even for Max members, and tapping it does nothing (it does not open `/max?from=diary`). | Open the Max sheet when locked and hide the lock for members. |
| 14 | low | `app/settings.tsx:61-64` | The Delete-all chain `deleteBackup().then(deleteAll).then(reload).then(dismissTo)` has no `catch`. A database error becomes an unhandled rejection and the sheet stays open with no message. There is also no busy state while it waits up to 45 s behind a running backup upload. | Add a `catch` and a busy state. |
| 15 | low | `app/scan.tsx:100,110-113`; `use-scan.ts:94,120` | Several promise chains have no `catch`: `scan.pay`, `scan.answer(...).then(router.back)` and `categoryFor().then`. A database error leaves Scan stuck on preview or return. Double-tapping "Open" also adds two pending spends, because there is no guard before `addSpend` (`scan-preview.tsx:200-204`). | Add a busy ref and `catch` handlers. |
| 16 | low | `packages/i18n/src/en-onboarding.ts:100,118` | Onboarding says "Set it up later in Settings" for share, email and Lock Screen, but Settings has no such rows. | Change the copy until those rows exist. |
| 17 | low | `packages/i18n/src/en-today.ts:116-117` | The privacy text says "Nothing goes to a server unless you turn on backup or forward a receipt email". In fact Sentry crash reports and RevenueCat also send data, and receipt email is not built. | Make the copy accurate. |
| 18 | low | AASA serves `/app/*`; no `+native-intent` or `+not-found` in `app/` | Any universal link `https://6pm.oddeggs.studio/app/...` opens expo-router's "Unmatched route" page. | Add `app/+native-intent.tsx` to strip `/app`, and add a `+not-found`. |
| 19 | low | `features/backup/backup-manage-body.tsx:46-71` | A non-Max user with an unclaimed backup (after a reinstall) is offered only "Restore". They cannot delete the backup without restoring it first. | Show "Delete backup" in the unsettled state as well. |

Verified OK: the backup contract between app and Worker matches. Paths `/api/v1/backup` and `/meta`, methods GET/PUT/DELETE, the `X-Backup-Token` header, body schemas and the 404 handling are shared through `@6pm/domain`. The base URL comes from `extra.apiBase` per variant. The Worker is deployed on both hosts.

The purchase and restore paths update the entitlement straight away (`purchases-provider.tsx:145,163`), plus the customer-change listener and a refresh when the app comes to the foreground. Every `router.push` target exists as a route.

Persona, serious mode and language survive a relaunch (they are written to the `settings` table). Delete all data wipes every table, cancels the reminder and deletes the server backup first.

Sentry starts only when a DSN is set and is disabled in `__DEV__`. RevenueCat gets `EXPO_PUBLIC_REVENUECAT_IOS_KEY` in the eas `prd` profile only. The `dev` and `development` profiles leave it unset, so purchases are unavailable there by design (`undesigned-states.md:74`).

## Unbuilt but drawn

- Max tiles and Max sheet headlines for Ask, Budget together, Travel, Year book, widgets, export and the Max companion. None has a feature behind it (see #3).
- The Max gate on pots: §5 says free users get one pot of their own. New pot is always open, and nothing pushes `/max?from=pots`.
- Max gates for `ask`, `shared`, `travel`, `widgets`, `icons`, `buddy`, `diary`: only `looks` and `backup` ever push `/max` (grep of `from:` across `src`).
- Offering serious mode (§6: once a week when free money goes negative or overspent 3 of 7 days): no code.
- Export (CSV/Sheets): promised in `max.sub.backup`; no code.
- No notification permission row or "reminder off" row in Settings.
- Category and bill names from onboarding keep the onboarding language after a language switch. This may be intended.

## Stale `docs/undesigned-states.md` entries

| Line | Entry | Reality |
|---|---|---|
| 8 | Home, "before onboarding exists" | `app/index.tsx:11` redirects to onboarding. |
| 19 | Plan · Occasions: "Max state does not exist yet" | Max exists. The pot gate is still unbuilt; the reason given is stale. |
| 27 | Diary Year book: "Max and the paywall land in phase 10" | Max is built. Still inert (#13). The line also contains a phase id. |
| 39 | Settings Max card hidden | Shown: `app/settings.tsx:69`. |
| 41 | Settings Look card hidden | Shown: `app/settings.tsx:79`. |
| 42 | Settings "...Backup, Export hidden" | The Backup row is shown (`settings.tsx:118`). Export is still absent. |
| 47 | Categories Max icon packs: "Max cannot be bought yet" | It can now. The lock ignores Max (#2). |
| 49 | Onboarding Catching: "Set it up later in Settings" | Settings has nothing to set up (#16). |
| 71 | Max welcome: "Kept as designed… Backup is not built" | Backup is built. Line 85 contradicts it, and both are wrong against the code (#4). |
| 72 | Max sheet Terms = Apple EULA; "No such page exists yet" | Code links `6pm.oddeggs.studio/terms` (`purchases/products.ts:61`). Both pages return 200. |
| 85 | Max welcome "Backup is on" only once turned on | Not implemented: the line is unconditional (#4). |

## Unresolved questions

1. Which TestFlight build did the founder test, `dev` (`ai.sixpm.app.dev`, no RevenueCat key, so nothing can be bought) or `prd`? If it was `dev`, every Max and look purchase, Backup and the Max icons will look broken.
2. Do `ai.sixpm.app.max.monthly`/`.yearly` and `ai.sixpm.app.look.*` exist and show as "Ready to Submit" in App Store Connect, with the `max` and `look_*` entitlements attached in RevenueCat? This cannot be checked from code. If they don't, `offerings()` throws "The store listed none of the 6pm products" and every buy button stays disabled.
3. Should serious mode hide the companion in island toasts too, or only on screens?
4. The `REVENUECAT_WEBHOOK_AUTH` secret is declared in `apps/api/src/env.ts`, but the v2 Worker has no webhook route. Is the reused v1 RevenueCat project still sending webhooks somewhere?
