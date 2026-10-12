# Batch 8a: the one native declaration

Status: todo · Starts once batches 2–4 are merged (the inbox import uses capture rules and duplicate merge) · Effort ~2 d, one owner, one commit
Goal: every package, plugin, entitlement, target and contract that the batch 8 features need is declared once, so lanes ([8b](phase-08b-feature-lanes.md)) fill in code in parallel and one `testflight/*` build ships them. After that build, everything except Swift ships over the air.

## Decisions (with why)

| # | Decision | Why / evidence |
|---|---|---|
| D1 | Targets with `@bacons/apple-targets` 5.0.0: `widgets` (widget type: widgets, Live Activities, controls), `share` (share), `intents` (app-intent) | Already chosen in tech-decisions §1. 5.0.0 (Jul 2026, peer `expo >=52`) adds EAS `appExtensions` for signing by itself (`build/with-eas-credentials.js`); `targets/<t>/_shared/*` is linked into the app **and** that target (README `_shared`) |
| D2 | **Extensions never open the database.** They write one JSON file per capture into `<group>/inbox/`; the app imports and deletes them. The app writes what extensions show (`<group>/surfaces/*.json`, companion PNGs) | SQLite in WAL keeps a lock on the file; iOS kills a suspended process that holds a lock in an App Group container (0xdead10cc). SQLCipher is vendored inside the expo-sqlite pod and cannot be linked into an extension without a second copy. One writer keeps the money store's single-writer queue (`money-actions.ts:65` `store.exclusive`) true |
| D3 | **No Keychain sharing, no key or database move.** `sixpm.database-key` stays in expo-secure-store's default group (`db/database-key.ts:5-12`); `sixpm.db` stays in expo-sqlite's default directory | Follows from D2. Adding `keychain-access-groups` would also change the default group for new items written without one (the backup key, `features/backup/native-secret-store.ts:34`). No migration means no data-loss path. Changes tech-decisions §5 and phase-08 line 24: founder to accept |
| D4 | Group files: `FileProtectionType.completeUntilFirstUserAuthentication` + `isExcludedFromBackup = true`, written atomically (temp + rename), inbox deleted after commit | Same protection as the key (`AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY`) and same device-only reach: nothing readable lands in an iCloud/Finder backup |
| D5 | Live Activity through a **local Expo module** `apps/mobile/modules/surfaces`, not `expo-live-activity` (0.4.2) | expo-live-activity draws a fixed title/subtitle/progress layout; the design needs the companion, the Paid button (`SS:55-64`, `SS:141-151`) and the Travel layout (`SS:152-156`). tech-decisions §1 already names local modules |
| D6 | Swift never does money maths or copy. Parsing and card logic run in the extension through **JavaScriptCore** on a generated bundle of `@6pm/domain` (`targets/_shared/domain-native.js`); widget/activity text arrives preformatted in the user's app language | One parser, tested in Vitest where tests already run; no Swift test infra on CI. "All money maths lives in @6pm/domain" holds |
| D7 | Vision OCR runs inside the share extension (Swift), not in a module | Only the extension reads receipts; a module would be dead code in the app |
| D8 | View capture with Skia `makeImageFromView` (already installed, 2.13.1), share with `expo-sharing`, save with `expo-media-library` (add-only) | Skia's iOS capture is `drawViewHierarchyInRect afterScreenUpdates:YES` (`apple/ViewScreenshotService.mm:47`), the same call as react-native-view-shot: no extra native dependency |
| D9 | Speech with `expo-speech-recognition` (SFSpeechRecognizer, `requiresOnDeviceRecognition`) | Only maintained Expo wrapper; on-device flag per locale. No SDK 58 line yet (57.1.1, 8 Oct, peer `expo: *`): proven by the simulator build first, fallback below |
| D10 | Intents live in the **App Intents extension** (`LogSpendIntent`, `AppShortcutsProvider`); controls open the app with `OpenURLIntent` on the universal link `https://<host>/app/scan` · `/app/quick-add` | The Wallet automation runs without starting React Native; universal links `/app/*` already work (`features/links/strip-app-prefix.ts`, `apps/web/public/.well-known/apple-app-site-association`). Only `MarkPaidIntent` (a `LiveActivityIntent`) sits in `targets/widgets/_shared/` because it must exist in app + widget |
| D11 | Declared now even though their lanes ship over the air later: `expo-print` (Year book), `expo-location` (Travel "turns on abroad"; Bangkok shares Vietnam's UTC+7, so the time zone cannot tell), Travel Live Activity view, Sign in with Apple, time-sensitive notifications | A native addition after this build means another build |
| D12 | Not declared: Keychain sharing, iCloud KVS, Face ID, the Siri entitlement | Nothing uses them (backup uses a synchronizable Keychain item, no KVS); App Intents need no Siri entitlement. Recorded in tech-decisions §5 |

## Packages (exact pins; SDK 58 from `expo@58.0.5/bundledNativeModules.json`)

| Package | Pin | Where | Plugin |
|---|---|---|---|
| `@bacons/apple-targets` | 5.0.0 | mobile dev dep | `['@bacons/apple-targets', { appleTeamId: 'YFND2EEW8S' }]` |
| `expo-sharing` | 58.0.15 | mobile | none |
| `expo-media-library` | 58.0.7 | mobile | `savePhotosPermission` only; `photosPermission: false` (check the plugin accepts `false`, otherwise leave its default) |
| `expo-print` | 58.0.5 | mobile | none |
| `expo-apple-authentication` | 58.0.2 | mobile | plugin + `ios.usesAppleSignIn: true` |
| `expo-location` | 58.0.12 | mobile | `locationWhenInUsePermission` only; background off |
| `expo-speech-recognition` | 57.1.1 | mobile | `microphonePermission`, `speechRecognitionPermission` |
| `esbuild` | 0.28.2 (already in the lockfile) | `@6pm/scripts` dev dep | for the generator |

All go in the `catalog:`; check `pnpm install` for blocked install scripts and add only what is needed to `allowBuilds`. Run `npx expo install --check` with no changes expected.

## app.config.ts changes (the 08a owner only)

- Pass `variant.appGroup` to `ios.entitlements['com.apple.security.application-groups']` (the targets copy it by themselves) and add `'com.apple.developer.usernotifications.time-sensitive': true`. Keep `aps-environment` from expo-notifications as it is.
- `ios.infoPlist.NSSupportsLiveActivities: true`.
- expo-camera: `microphonePermission` takes the voice text (not `false`) so the two plugins cannot fight over `NSMicrophoneUsageDescription`. Update the comment at `app.config.ts:156`.
- Delete the comment at `app.config.ts:138-139` ("App Group … arrive in that native batch").
- `locales/vi.json`: add Vietnamese `NSMicrophoneUsageDescription`, `NSSpeechRecognitionUsageDescription`, `NSPhotoLibraryAddUsageDescription`, `NSLocationWhenInUseUsageDescription`. English comes from the plugin options. Copy goes in i18n `en-native`/`vi-native` too, so wording is reviewed in one place.

## Targets (`apps/mobile/targets/`, all `deploymentTarget: '17.0'`; the plugin's default is 18.0)

```
_shared/                       linked into every target
  AppGroup.swift               group id and host from the bundle id (".dev" picks group.ai.sixpm.app.dev, 6pm-dev host)
  GroupFiles.swift             atomic write with protection + no backup; inbox writer (extensions only write)
  DomainBridge.swift           JSContext loads domain-native.js and calls SixpmDomain.<fn>(json) → json
  domain-native.js             GENERATED
  ThemeTokens.swift            GENERATED: fixed surface colours from @6pm/theme (share card, free widgets)
  en.lproj/ vi.lproj/          GENERATED: Surfaces.strings, Intents.strings, Share.strings (static native titles)
widgets/   type widget,     bundle '.widgets', frameworks WidgetKit SwiftUI ActivityKit AppIntents
  Info.plist, expo-target.config.js, Bundle.swift (WidgetBundle), SurfaceAttributes.swift (COPIED from the module), fonts/ (symlinks to assets/fonts)
  _shared/MarkPaidIntent.swift   LiveActivityIntent: writes an inbox "paid" event, ends the activity
share/     type share,      bundle '.share', frameworks Vision PDFKit JavaScriptCore UniformTypeIdentifiers SwiftUI
  Info.plist: NSExtensionActivationRule = exactly one of public.image | com.adobe.pdf | public.plain-text
intents/   type app-intent, bundle '.intents', frameworks AppIntents JavaScriptCore SwiftUI
```

08a lands compiling skeletons (one placeholder widget, a share view that dismisses, an intent that returns), and each lane replaces its folder before the tag. A skeleton never ships alone. Controls are `@available(iOS 18)`.

## Local module `apps/mobile/modules/surfaces` (Expo autolinks `modules/`)

`SurfacesModule.swift` (08a) declares every function and hands each to its file: `Inbox.swift` (08a), `SurfaceFiles.swift` and `LiveActivities.swift` (08a stubs, filled by lane L5). `SurfaceAttributes.swift` is the source copy; the generator copies it into `targets/widgets/`, because ActivityKit needs the same type in app and widget, and the copy cannot drift because `--check` compares them.

```ts
writeSurface(name: 'snapshot' | 'context', json: string): Promise<void> // + WidgetCenter/ControlCenter reload
writeSurfaceImage(name: string, pngBase64: string): Promise<void>
readInbox(): Promise<{ id: string; json: string }[]>;  removeInbox(ids: string[]): Promise<void>
activitiesEnabled(): boolean;  listActivities(): Promise<{ id; kind: 'pendingPay' | 'travel'; key; stateJson }[]>
startActivity(kind, key, stateJson): Promise<string | null>  // foreground only
updateActivity(id, stateJson): Promise<void>;  endActivity(id, finalStateJson: string | null): Promise<void>
```

## Contracts (`packages/domain/src/contracts/surfaces.ts`, zod, `v: 1`; Swift Codable mirrors them)

- `InboxItem` = `{v, id: uuid, kind: 'spend', source: 'shared'|'applePay'|'voice', status: 'caught'|'kept', at: ISO, amount: int|null, merchant, categoryId|null, note?, receipt?: {bank?, code?, namingLines: string[]}}` or `{v, id, kind: 'paid', spendId, at}`.
- `SurfaceContext` (app → share/intents): `{v, language, host, categories: [{id, name, icon, tile, glyph, countsDaily}], rules: [{key, categoryId}], safeToday: int, strings: {…card labels}}`.
- `SurfaceSnapshot` (app → widgets): `{v, writtenAt, maxLook, serious, entries: [{from: ISO, safeText, safeShort, tomorrowText, pendingText, ringFraction, list: [{name, amountText, icon, hue, pending}], moreText}], palettes: [{hour, tokens}], strings}`.
- `ShareCard` / `LogSpendResult`: what the domain bundle returns to Swift (amount, payee, payeeSure, at, code, bank, categoryId, display strings, `safeAfterText`).

## Data flows

1. Share → extension: OCR/PDF text/plain text → `DomainBridge.shareCard(lines, context, now)` → card → Confirm → `inbox/<id>.json`.
2. Wallet tap / Siri → `LogSpendIntent` → `DomainBridge.logSpend(amountText, merchant, context, now)` → `inbox/<id>.json` → snippet.
3. App start and every return to the foreground → `importInbox()` → `captureSpend` (rules, duplicate merge, money day from `at`) → delete file → new snapshot → `writeSurface` (widgets reload) and Live Activity plan.
4. Live Activity Paid → `MarkPaidIntent` → `inbox/<id>.json {kind:'paid'}` + end → app import marks the spend `kept` if it is still pending.

## Foundation code (08a owns)

- `packages/domain/src/capture/inbox.ts` (+test): `inboxItemToNewSpend`, `isRepeatTap` (same source + merchant + amount within 120 s: Wallet fires twice and on declines), `isSameReceipt` (same receipt code), `numbersFree(lines)`.
- `apps/mobile/src/data/inbox-import.ts` (+test): zod-parse each file (an invalid one is removed and logged without content). Idempotent by item id: a spend with that id, or a sighting `(source, seenAt = at)`, means it was already imported. Files are removed only after the commit. Needs an additive `id?` on `NewSpend` (`data/money-actions.ts:16`).
- `apps/mobile/src/features/capture/enrich-shared.ts`: returns the item unchanged (lane L2 adds naming).
- `apps/mobile/src/features/surfaces/surfaces-sync.tsx`, mounted once in `src/app/_layout.tsx` inside the money provider: runs `useInboxImport()` (08a) and `useSurfaceWriters()` (a no-op file that L5 fills in).
- `tools/scripts/generate-native.ts` (+ `--check` step in `.github/workflows/ci.yml` next to `extract-prototype-logic --check`): esbuild IIFE of `packages/domain/src/native/entry.ts` (global `SixpmDomain`, target `es2020`); `.strings` tables from i18n keys `native.*`; `ThemeTokens.swift`; the attributes copy. The output is deterministic, so a lane that doesn't touch a source produces no diff.
- `packages/domain/src/native/entry.ts`: 08a creates it with `NATIVE_API_VERSION = 1`, then hands it to lane D.
- i18n: create empty `en-/vi-` pairs `native`, `sharing`, `share-ext`, `intents`, `voice`, `surfaces`, `together` and spread them in `en.ts`/`vi.ts` once (later lanes edit only their own pair).
- Docs: tech-decisions §1 and §5 rows (D2, D3, D7, D12); fix the stale comment at `db/database-key.ts:8-9` ("so widgets and the share extension can open the store").

## Verification of 8a

1. `pnpm typecheck`, lint, `generate-native --check`, the new Vitest/Jest files.
2. Simulator build in CI, after the local one (compiles the app and all three targets, no Apple credentials): `gh workflow run native-build.yml -f ref=<branch> -f profile=e2e-test`. This is the gate for D1/D9 on Xcode 26.6.
3. Local simulator build first (`expo prebuild -p ios --clean`, `expo run:ios`, tech-decisions §6): the app and all three targets compile on Xcode 27 and the app launches. Changed 12 Oct: the new Mac has room for local native builds.

## Risks

| Risk | L×I | Mitigation |
|---|---|---|
| expo-speech-recognition 57.x does not compile on SDK 58 / RN 0.88 | M×M | Simulator build on day 1. Fallback: `Speech.swift` in the surfaces module (SFSpeechRecognizer, on-device only, ~150 lines) with the same JS hook interface |
| EAS cannot make profiles for 3 new bundle ids or the group | M×H | Founder registers the groups first; rehearse with a signed `dev` build to 6pm Dev before the prd tag |
| apple-targets 5.0.0 on Xcode 26.6 synchronized groups | L×H | Same simulator gate; pin exact; read the generated pbxproj in the CI log |
| Fingerprint changes: older builds stop getting updates | certain×L | Expected; v2 is TestFlight-only until launch |
| Shared-container file locks | L×H | No SQLite or file locks in the container; whole-file atomic renames only |

## Rollback

One commit. Revert it: the fingerprint returns to the previous runtime and over-the-air updates reach older builds again. No schema or key change, so there is no data to roll back. Inbox files left in the group are harmless, and the importer drops unknown versions. If one target blocks signing, remove its folder (the plugin drops the target) and ship the rest.

## Founder actions (Apple + accounts) — before the first signed build

- [ ] developer.apple.com → Identifiers → App Groups: register `group.ai.sixpm.app` and `group.ai.sixpm.app.dev` (the App Store Connect API cannot create groups, `app.config.ts:138`). Check whether v1 already made one.
- [ ] Confirm the App Store Connect API key behind `EXPO_ASC_API_KEY_P8` is **Admin** (or App Manager with Certificates, Identifiers & Profiles access): EAS creates `ai.sixpm.app.{widgets,share,intents}` and the `.dev` ones, their profiles, and turns on App Groups, Sign in with Apple, Push and Time Sensitive Notifications on the App IDs.
- [ ] Keys → Sign in with Apple key (.p8) for token revocation when a Budget together account is deleted (App Review 5.1.1(v)); give its id to engineering, value as a Worker secret.
- [ ] Keys → APNs key (.p8) only if capture notifications from receipt email ship (Worker secret).
- [ ] App Store Connect → App Privacy: add Financial Info + User ID (Budget together ledger, Sign in with Apple). Speech, OCR and location stay on the phone (not collected).
- [ ] TestFlight external testing: a Beta App Review is needed for the new extensions; internal testers are not affected.
- [ ] Provide 2–3 redacted transfer receipts each from MB Bank, Vietcombank, Techcombank, VPBank, ACB, BIDV, MoMo (screenshots + any PDF) for the parser fixtures.
- [ ] Decide: D3 (no Keychain sharing), voice without on-device Vietnamese, English-only Siri phrases (see 8b).
- GitHub/EAS: no new build secrets; `native-build.yml` already passes the ASC key so EAS can create profiles.
