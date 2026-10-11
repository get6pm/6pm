# End-to-end encrypted backup and restore (6pm Max)

Date 2026-10-11. Product rule (docs/product-decisions.md §6): end-to-end encrypted snapshot, key in
iCloud Keychain, ciphertext on our server under an anonymous token. Max.

## Design in one paragraph

The phone keeps one secret: a random 256-bit AES key in an iCloud-synchronised Keychain item. The
anonymous backup token is derived from it (`base64url(SHA-256("6pm.backup.token.v1" || key))`), so
there is nothing else to lose or to fall out of step, and the server cannot get from the token back
to the key. A snapshot of every table the app keeps is serialised to JSON, sealed with AES-256-GCM
(fresh random 96-bit nonce, associated data `6pm.backup.v1`), and PUT as `{version, data}` under
the token. The server stores the bytes in R2 under `backups/<sha256(token)>` and can read nothing.
A new iPhone on the same Apple ID gets the key through iCloud Keychain, derives the same token,
downloads, opens and replaces its local data in one transaction.

## What Scootch had, and what I took

Scootch's backup is **not encrypted**: a plain JSON snapshot in a D1 row under an anonymous token
(`routes/backup.ts`, `backup-token.ts`, migration `backup_snapshots`), with the token in a native
Keychain item (`react-native-keychain`, `cloudSync: true`) plus iCloud key-value storage as a second
copy. So Scootch has no cipher; the cipher is mine to choose.

| Choice | Taken | Why |
| --- | --- | --- |
| Token/key store | `react-native-keychain` with `cloudSync: true`, `AFTER_FIRST_UNLOCK` (Scootch's exact options) | `expo-secure-store` has no synchronisable option. **New native dependency: needs `pnpm install` and a native rebuild.** Already in the catalog; I added it to `apps/mobile/package.json`. |
| Second store (iCloud KVS) | Not used | KVS is not end-to-end encrypted by default; putting the key there would weaken the guarantee. Scootch stores only a token there. |
| Cipher | `expo-crypto` 58's native AES-GCM (`aesEncryptAsync`, CryptoKit on iOS) | Task said expo-crypto has no AES; SDK 58.0.5 (installed) does. Already a dependency, so no new native module for crypto. Pure-JS (`@noble/ciphers`) would be a new uninstalled dependency and slow on Hermes; `react-native-quick-crypto` is a heavy native module. |
| Server storage | R2 (`FILES`, already declared), not D1 | D1 rows cap at 2 MB; a year of spends can exceed that. No migration needed. |
| Auth | Backup token header only, no device registration | 6pm mobile has no API client or device registration yet. The token names the backup and nothing else, so the server learns nothing about who owns it. Rate limits replace the device limit (below). |
| Compression | None | No compression API in Hermes; `fflate` would be one more uninstalled dependency. JSON of a heavy year is a few MB; the cap is 6 MiB sealed. Envelope `version` leaves room to add it. |

## Wire format (packages/domain/src/contracts/backup.ts)

- Envelope: `{ version: 1, data: base64(nonce 12 B | ciphertext | tag 16 B) }`, strict object. The server accepts versions 1..255 and checks shape and size only; the phone refuses any version it does not know.
- Header `X-Backup-Token`: 32–128 URL-safe characters (the app sends 43).
- Cap: 6 MiB sealed (`BACKUP_MAX_SEALED_BYTES`), body cap `BACKUP_MAX_BODY_BYTES` = base64 length + 64.
- Snapshot (plaintext inside the seal): `version: 1` (`BACKUP_SNAPSHOT_VERSION`), `takenAt`, `settings` (allowlist `plan`, `wallets`, `look`, `language`; stored text as-is), `categories`, `spends`, `spendSightings`, `merchantRules`, `bills`, `pots`, `potMoves`, `closedDays`. Strict: a newer snapshot with unknown fields is refused whole. Rows reuse the existing row contracts.
- Not carried: `purchases` (the store's word) and `backup.*` (this phone's own state).

## API (apps/api)

All under `/api`, access `backup` (new third access kind: `requireBackupToken` then `limitByBackup`):

| Route | Does |
| --- | --- |
| `PUT /v1/backup` | Validates envelope and size (declared Content-Length first, real byte length after), writes `backups/<hash>` in R2 (custom metadata `version`, `bytes`), answers `{updatedAt, bytes}`. A refused body leaves the earlier backup untouched. |
| `GET /v1/backup` | `{envelope, updatedAt}`, the stored text sent on without re-parsing; `Cache-Control: no-store`; 404 `not_found` when none. |
| `GET /v1/backup/meta` | `{updatedAt, bytes}` from an R2 head, no download. 404 when none. Used before a phone would replace a backup it did not make. |
| `DELETE /v1/backup` | Deletes the object; answers `{deleted: true}` also when there was none. |

Rate limit: new `BACKUP_RATE_LIMIT` (12 / 60 s) counted twice per request, once per token hash and once per sender address. Global `IP_RATE_LIMIT` still applies. `readBody` gained an optional `maxBytes`. A found bug while testing: a base64 regex built from `(?:[A-Za-z0-9+/]{4})*` overflowed the regex stack on a 8 MB string (500 error); the schema now uses a flat character class plus a length-multiple-of-4 check, covered by a test at the cap.

No Scootch-style `data-delete` route: 6pm has no device rows to delete; `DELETE /v1/backup` is the server half of "Delete all data".

## Mobile

Pure/testable (all injected): `backup-crypto.ts` (port), `backup-seal.ts` (key, token, seal/open, versioning, error classes), `backup-vault.ts` (Keychain record `v1.<key>[.deleting]`), `backup-api.ts` (fetch client with timeouts, no token in errors), `backup-service.ts` (orchestration), `backup-schedule.ts`, `backup-when.ts`, `utf8.ts` (own UTF-8: Hermes TextDecoder is not guaranteed), `base64url.ts`, `data/backup-snapshot.ts` (build/restore/fresh check), `data/backup-state.ts` (`backup.lastAt|items|settled|tooLarge` in the settings table).

Native adapters (not unit-testable): `native-crypto.ts` (expo-crypto AES-GCM, SHA-256, random), `native-secret-store.ts` (Keychain, **lazily imported** so a build made before the rebuild still launches), `native-backup-api.ts` (`extra.apiBase`).

Behaviour:
- **Turn on / Back up now**: makes the key if there is none, keeps it in the Keychain (fails with `keychain` if it will not keep it, nothing is sent), seals, uploads, records `lastAt` and the item count. A phone with nothing in it sends nothing.
- **Never overwrites a backup it has not been offered**: a key that is here but "unsettled" (no upload, restore or decline yet) first asks the server (`meta`); if a backup exists, `backUpNow` throws `exists` and the sheet offers Restore it here (tap twice) or Replace it with this iPhone. Same for the automatic path.
- **Automatic**: `BackupHost` (mount once). `backupIsDue`: first ever, or a day closed since the last backup, or 24 h since the last; never within 1 h of the last. Max only. Silent on failure; stops after a `too_large` until the person tries by hand.
- **Restore**: replaces every table in one transaction (children first, FK on), settings allowlist replaced and the phone's own settings left alone; settings are validated before anything is cleared; a failure rolls back. Then store reload, look reload, language, and the close reminder is rescheduled (`useApplyRestore`). Restore is **not behind Max** (it is the person's own data).
- **Delete**: `deleteBackup()` marks the Keychain record `deleting`, deletes on the server, clears key and state. If the server is unreachable the key is kept, marked, uploads stop, and `BackupHost` finishes the delete at the next launch or foreground.
- **Snapshot consistency**: tables read in an order that never leaves a child without its parent (spends before categories, pot moves before pots), and orphans are filtered, since expo-sqlite reads are not isolated from concurrent writes.

## What the controller must wire

1. `pnpm install` (adds `react-native-keychain` 10.0.0 to the mobile app) and a **native rebuild** (pod install, new dev client / TestFlight build). No new entitlement: a synchronisable Keychain item needs none.
2. `apps/mobile/src/app/_layout.tsx`: add `<Stack.Screen name="backup" options={sheet} />`, and mount `<BackupHost />` (from `../features/backup/backup-host`) inside `MoneyProvider`, e.g. beside `<CloseNudge />`.
3. `apps/mobile/src/app/settings.tsx`:
   - In "Your data", before the Privacy row: `<BackupRow first />` (from `../features/backup/backup-row`), and drop `first` from the Privacy row (prototype order: Backup, Privacy, Export).
   - Delete all: `const deleteBackup = useDeleteBackup();` (from `../features/backup/use-backup`) and run it before the wipe, e.g. `void deleteBackup().then(() => actions.deleteAll()).then(() => lookStore.reload()).then(() => router.dismissTo('/'))`. It never throws and answers `deleted | none | pending`; `pending` is finished later by `BackupHost`. Keep `setLanguage(null)` and `cancelCloseReminder()` as they are.
4. `apps/mobile/src/features/onboarding/step-welcome.tsx`: under the Get started button, `<RestoreFromBackupLink color={pal.ink} />` (from `../backup/restore-link`). It renders nothing unless a key is in the Keychain and the server holds a backup.
5. Optional: move `companion.backupDone.*` / `companion.backupRestored.*` (currently in `en-backup.ts`) into the companion catalogue and add `'backupDone' | 'backupRestored'` to `CompanionEvent`; `use-backup-toast.ts` then collapses into `useCompanionToast`.
6. Typed routes: `app/backup.tsx` is new. I patched the git-ignored `apps/mobile/.expo/types/router.d.ts` locally so `tsc` passes; Metro regenerates it.

Deploy (Cloudflare), no secrets and no D1 migration:
- `wrangler.jsonc` adds the `BACKUP_RATE_LIMIT` ratelimit binding to `dev` (namespace 6303) and `prd` (6313); it needs no resource.
- R2 buckets `sixpm-dev` and `sixpm` are already declared as `FILES`; confirm they exist (`wrangler r2 bucket list`) and create them if not. Backups live under the `backups/` prefix.
- Deploy `dev` first, then `prd`. No secret names are added.

## Undesigned states

Appended to `docs/undesigned-states.md` (9 rows): Backup row, the sheet and its states (never backed up, another iPhone's backup found, not on Max, errors), the welcome-step restore link, Delete all data with a backup, and the Max welcome "Backup is on".

## Verification (all run on this Mac)

- `pnpm --filter @6pm/api test`: 3 files, 41 tests pass (18 are backup: round trip, replace, hash-only filing, token isolation, malformed input, size cap at and over, meta, delete, both rate limits). API `tsc` clean.
- Mobile jest (`src/features/backup`, `src/data/backup-snapshot.test.ts`): 9 suites, 66 tests pass. Snapshot build/restore round trip on `node:sqlite` with the real schema, rollback on a half-failed restore, settings validation before clearing, seal/open with wrong key, flipped byte, newer envelope and newer snapshot, damaged plaintext, the size refusal, vault, API client, schedule, UTF-8, and the whole service (fresh phone, second iPhone restore through a shared fake Keychain, never replacing an unclaimed backup, offline, delete pending then finished).
- `pnpm --filter @6pm/i18n test` pass (4); domain contract tests pass (6); domain `tsc` clean.
- Mobile `tsc --noEmit` clean for everything I touched. It was run with a scratch tsconfig that maps `react-native-keychain` to Scootch's installed copy, because 6pm has not installed it yet. One error remains, in another lane's file: `src/features/onboarding/bill-card.tsx(142,16)` (missing `flex`).
- ESLint and Prettier clean on every file I touched.

## Not verified

- **Keychain sync across two iPhones** and the Keychain adapter itself (never ran; module not installed here).
- **The native AES-GCM adapter** and SHA-256 on a device; tests run Node's AES-GCM with the identical nonce|ciphertext|tag layout and associated data. The `Crypto.AESSealedData.fromCombined(..., {ivLength: 12, tagLength: 16})` call and base64 `combined` output were read from the installed typings only.
- A real upload to Cloudflare, R2 behaviour outside miniflare, and Hermes speed on a multi-megabyte snapshot (restore does one `runAsync` per row).
- All UI: no screenshots, no comparison with renders. The sheet is built from Settings cards/buttons; the Backup row follows the prototype's markup (32 pt tile, MAX lock chip, value, chevron).
- Navigation after restore (`dismissAll` + `replace('/')` from the welcome step, `dismissTo('/')` from Settings).

## Open questions

1. **Max is enforced on the phone only.** The server is anonymous and cannot tell a Max member from anyone else. Storage abuse is bounded by the 6 MiB cap and the 12/min limits, but not prevented. If that matters: require a registered device, or a RevenueCat entitlement proof on PUT.
2. **Backup does not turn on by itself at purchase** (the prototype's `max → backup: true`). Auto-enabling could make a new key before iCloud Keychain has delivered the existing one, orphaning the old backup. Max welcome's "Backup is on" is therefore true only after the member turns it on. Decide: keep explicit, or change the welcome line.
3. **Same risk by hand**: tapping Turn on on a new iPhone before the Keychain item has synced makes a second key. Nothing detects it; the sheet note tells people to enable iCloud Keychain. A "wait for iCloud" delay on first launch would help.
4. **Two iPhones in daily use** overwrite each other (last write wins); the product assumes one active phone.
5. **iCloud Keychain off**: the key works on this iPhone only; a new iPhone cannot restore. The app cannot detect the setting.
6. Compression is omitted; add if real snapshots approach the cap.

Status: DONE_WITH_CONCERNS
Summary: Encrypted backup and restore built end to end (API on R2 with token-hash filing and rate limits, domain contract, native-AES seal, Keychain-held key, snapshot/restore, Settings row, sheet, welcome-step restore link, automation host, en/vi copy), all behind injected ports and tested.
Evidence: see Verification.
Concerns/Blockers: new native dependency react-native-keychain needs install and rebuild; Keychain sync, native AES adapter, real upload and all UI are unverified on device; controller wiring listed above.
