# 6pm v2: technical decisions

Decided 10 Oct 2026. Change one only with new evidence, and record the change here. The shape follows Scootch (`~/Projects/scootch/docs/tech-decisions.md`); research: `plans/reports/researcher-261010-1732-old-6pm-and-reference-stacks-report.md`.

## 1. Shape of the system

| Part | Choice | Why |
|---|---|---|
| App | Expo 58, React Native 0.88 (New Architecture, Hermes), Expo Router native stack | Same pins as Scootch; most fixes ship over the air |
| Motion | Reanimated 4 (worklets on the UI thread), Gesture Handler 3, native-stack transitions, expo-haptics | The native feel is the product. No JS-thread animation, no `Animated` from RN |
| Sheets | Expo Router `presentation: 'formSheet'` (the real UISheetPresentationController): one detent at the tallest iOS allows, 40 pt corners, the prototype's grabber drawn in the sheet, content on `palette.sheetSolid`. The missed-day card and the look detail, which iOS cannot draw (it floats lower detents inset from the edges), draw themselves over a transparent modal with Reanimated springs. Changed 12 Oct 2026 from every sheet drawing itself over a transparent modal. Ask alone is the page sheet (`presentation: 'pageSheet'`), which scales the screen behind back into a card and taps as it rises; changed 15 Oct 2026 at the founder's ask | The native sheet drags from anywhere, pulls down from the top of a scroll, carries the finger's velocity, is interruptible, honours Reduce Motion, and slides away on `router.back()`; the hand-drawn one did none of that well. Its top edge sits 4 pt below the prototype's |
| Sky and atmosphere | `@shopify/react-native-skia`: gradients, blurred blooms, grain/halftone/rain as runtime shaders | 60/120 fps full-screen effects; CSS layer stacks do not port to views |
| Colour | All colour comes from `@6pm/theme` (port of the prototype's `palette()`/`themes()`, oklch converted to sRGB hex in code). Hex in components is a lint smell | One engine, colour-exact to the prototype |
| Wide colour | The design's oklch tints render as sRGB hex (identical to the browser renders). Display P3 output (`oklch()` in `@6pm/theme`) waits on React Native parsing `color(display-p3 …)` in JS; native iOS already accepts it | Ship what matches the renders; upgrade without touching screens |
| Fonts | expo-font with static Google Fonts instances: Bricolage Grotesque, Be Vietnam Pro, IBM Plex Mono, Patrick Hand, plus per-look display fonts. UI body is SF Pro on iOS | Matches the prototype's type roles |
| Icons | Material Symbols Rounded as two static font instances (outline wght 400, filled wght 500) generated from the variable font, with a typed codepoint map | Pixel-exact glyphs incl. FILL axis; vector-icons lacks FILL |
| Data on the phone | expo-sqlite (SQLCipher on), the source of truth. Migrations one file each; repositories validated by zod contracts | Local first; the close never needs the network |
| Money | Integer đồng (`number`, safe to 9e15). All maths in `@6pm/domain`, pure and tested | Finance correctness lives in one tested package |
| API | Hono on Cloudflare Workers, D1, R2; Email Workers for receipt email | No servers to run; inbound email is native to the platform |
| Auth | Anonymous device token (Keychain, hash on server). Sign in with Apple only for Budget together | No account for the core app |
| Budget together | The phone signs in with `expo-apple-authentication` (name scope only) and sends the identity token; the Worker checks it against Apple's published keys (RS256, issuer `appleid.apple.com`, audience `ai.sixpm.app` or `ai.sixpm.app.dev`, not expired, carrying the SHA-256 of a single-use nonce the Worker handed that device within ten minutes; an unknown key id refetches the key set at most once a minute) and links the Apple `sub` to the device token. D1 holds people, device links, pairs, single-use invite hashes (7 days), shared pots and contributions; every route resolves the pair from the calling device, never from the request. Leaving deletes the pair and everything under it. Deleting the account revokes the app's Apple token (`APPLE_SIGN_IN_KEY`, `APPLE_SIGN_IN_KEY_ID`; skipped while unset) and deletes the person and pair; Apple's consent-revoked and account-delete notifications (`POST /api/v1/together/apple-events`) do the same; they carry no `exp`, so one is taken only with `iat` in the last hour, once per `jti`, and never for an account made after the event. The phone shows the last answer (kept in settings) with writes in flight laid over it, rolls a failed write back with an island line, and queues nothing; its own contributions are kept in `together_moves` and count as top-ups | Apple requires in-app account deletion for apps that offer sign-in; the core app keeps no account |
| AI | Server only: DeepSeek (Anthropic-compatible endpoint, forced tool call with zod schema) for merchant/category naming and Ask phrasing; Jev for closed-label category picks and category icon picks (`apps/api/src/ai/jev.ts` + `decide.ts`: Jev inside an 800 ms budget, then DeepSeek's fast tier in the same shape). Receipt photos the phone cannot be sure of: Anthropic `claude-haiku-5-5` through `@anthropic-ai/sdk` (`apps/api/src/ai/anthropic.ts`), effort `low`, structured output via `output_config.format` (no forced tool choice, thinking at its default); Haiku has no server-side refusal fallback, so a decline answers `receipt: null` and the phone keeps its own reading. A shop name the model gives is used only when the photo's own text shows it. The model copies the total as printed and `receiptMinorUnits` in `@6pm/domain` converts it. Every call in a cost ledger | Code decides numbers; models name things |
| Travel / FX | Frankfurter **v2** (`api.frankfurter.dev/v2/rates`, free, no key; blends ~50 central banks, so it quotes VND, which the ECB-only v1 never did). A Worker cron (`20 */6 * * *`) asks each travel currency against VND one base at a time (`base=THB&quotes=VND`; VND as the base comes back with two or three significant digits) and stores it once in D1 `fx_snapshots` (idempotent `ON CONFLICT DO NOTHING`, exact decimal text from the JSON source, a failing currency reported not fatal, stale after 48 h). `GET /v1/fx` (device token) answers the newest rate per currency with `asOf` and `stale`; the phone keeps the last good set in its settings table for offline use. Conversion is exact (BigInt) in `@6pm/domain`, rounded once to the nearest đồng, halves away from zero; what is left of a day is rounded down. Country comes from a when-in-use location fix and the system reverse geocoder, asked only after the user turns Travel mode on | Bangkok shares Vietnam's UTC+7, so the time zone cannot tell. Same shape as critterpass's FX ingest; checked live 2026-10-12: all 16 travel currencies returned VND rates (e.g. THB 770.17, USD 25853) |
| Purchases | RevenueCat (StoreKit 2): looks (non-consumable), Max (subscription, 7-day trial) | Entitlements and restore without a receipt server |
| Native surfaces | `@bacons/apple-targets` (`apps/mobile/targets`): widgets with the Live Activity and controls, the share extension, the App Intents extension. One local Expo module, `modules/surfaces`, for the inbox, widget files and the Live Activity. Vision OCR runs in the share extension itself; when its reading is not sure of the total or currency it sends the photo (JPEG, long side ≤ 1600 px, ≤ 1.5 MB) to `POST /api/v1/receipts/read` and keeps its own reading offline. Extension logic runs `@6pm/domain` in JavaScriptCore (`generate-native.ts` bundles it) | Declared once in the first native batch. Only the share extension reads receipts, so OCR in a module would be dead code in the app; one parser, tested in Vitest |
| Extensions and the store | Extensions never open the database. Each capture is one JSON file in `<group>/inbox/`, which the app imports through the normal capture and then deletes; the app writes what extensions show to `<group>/surfaces/`. Group files are written whole and renamed into place, readable after first unlock, left out of backups | SQLite in WAL holds a file lock, and iOS kills a suspended extension holding one in a group container (0xdead10cc). SQLCipher lives inside the expo-sqlite pod. One writer keeps the store's write queue true |
| Website | Astro on Cloudflare: the home page in English and Vietnamese (launch waitlist until launch, then App Store link), privacy and terms; waitlist stored in D1 | Same platform as the API |
| i18n | Typed TS catalogues in `@6pm/i18n` (en, vi) with a completeness test | Scootch pattern; no runtime catalogue loading |
| Errors | Sentry (DSN optional) | |
| Repo | pnpm 12 workspace with `catalog:` pins, TS 6 strict, ESLint flat config, Prettier, Vitest (packages, api), Jest (mobile) | Scootch tooling verbatim |

Deliberately absent: Postgres, PowerSync, Redis, Docker, Turbo, NativeWind/Tailwind, TanStack Query, Lingui, an admin dashboard.

## 2. Environments

| | dev | prd |
|---|---|---|
| App | `ai.sixpm.app.dev` "6pm Dev", scheme `sixpm-dev` | `ai.sixpm.app` "6pm", scheme `sixpm` |
| API / D1 / R2 | `sixpm-api-dev` | `sixpm-api` |
| Host | `dev.at6pm.app` | `at6pm.app` |
| Updates channel | `dev` | `prd` |
| Purchases | sandbox | real |

One host per environment on the `at6pm.app` zone (changed 15 Oct 2026 from the founder's `oddeggs.studio` zone, whose `6pm` and `6pm-dev` hosts keep their routes, email rules and universal links as legacy hosts): the Astro site serves `/`, the API Worker owns the route `<host>/api/*`, Email Routing delivers every address on `at6pm.app` (its catch-all, with `hello@` forwarded first by its own rule) and `r+*@dev.at6pm.app` to the API Worker (one address rule per subdomain host, subaddressing on; the legacy hosts keep their `receipts+*` rules), and the site serves `/.well-known/apple-app-site-association` for universal links. Hosts stay one level below the zone so Cloudflare's universal certificate covers them.

`APP_VARIANT` = `dev` (default) | `prd` | `e2e-test`. Runtime version policy: fingerprint. The v1 runtime `1.0.2` is never published to.

## 3. Workspace layout

```
apps/mobile      Expo app (src/app routes, src/features, src/ui, src/db, src/data)
apps/api         Hono Worker (routes registry, D1 migrations, email handler, cron)
apps/web         Astro website (home, privacy, terms)
packages/domain  money, time, plan maths, close state machine, VietQR, amount parser, contracts
packages/theme   looks catalogue, keyframe palettes, token derivation, oklch, motion curves
packages/i18n    en/vi catalogues, translate, completeness
tools/scripts    repo hygiene checks
```

Workspace packages are `@6pm/<dir>`, ESM, export TypeScript source (`"exports": {".": "./src/index.ts"}`). Relative imports are extensionless (Metro). Named exports only, except route files and configs. Files ≤ 300 lines.

## 4. Motion contract

- Curves from the prototype, as Reanimated springs/beziers in `@6pm/theme/motion`: house overshoot `cubic-bezier(.2,.9,.25,1.12)`, entrance `(.2,.9,.2,1)`, wheel snap `(.2,.9,.25,1)` 380 ms.
- Gestures drive shared values directly; release uses velocity-aware springs. Thresholds from the prototype (card fling 90 px, row confirm 90, delete reveal −48 / commit −150, sheet dismiss 120 or flick). Native sheets bring their own physics; a drawn sheet decides by where the flick was heading (position plus projected velocity), springs home `{300 ms, damping ratio 0.8}` or out `{300 ms, ratio 1, clamped}` with the finger's velocity, and continues from where it is when grabbed mid-flight.
- Haptics: selection for ticks/thresholds, light impact for actions, success notification for close, reveal and purchases.
- Reduce Motion: springs become 200 ms fades; atmosphere freezes; nothing loops.

## 5. Native surface, declared once

First native batch declares: App Group, push + time-sensitive notifications, Live Activities, Sign in with Apple, In-App Purchase, camera, microphone + speech, location while in use, add-only Photos, App Intents, and the widget (with Live Activity and controls), share-extension and App Intents targets. After that, feature work is JavaScript and ships over the air; only Swift needs a new build.

Not declared (changed 12 Oct 2026): Keychain sharing (the database key and the backup key stay in expo-secure-store's default group, because no extension opens the store; adding an access group would also move new items written without one), iCloud KVS (backup uses a synchronizable Keychain item), Face ID, the Siri entitlement (App Intents need none).

## 6. Verification on this Mac

- Unit tests per package (Vitest) and Jest for app logic; run only the file you changed locally.
- `pnpm --filter @6pm/mobile exec expo export --platform ios` proves the bundle builds.
- Native code (plugins, targets, local modules) is proven by a local simulator build before a CI one. Changed 12 Oct 2026: a new Mac (M5 Pro, 376 GB free, Xcode 27) replaced the one that sent every native build to CI. CI builds with Xcode 26.6, so a signed build is still proven there.
- The simulator build, from `apps/mobile` (Xcode is selected with `DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer` until `xcode-select` points at it):

  ```
  npx expo prebuild -p ios --clean      # after any change to app.config.ts, plugins, targets or modules
  npx expo run:ios --no-bundler --device "iPhone 18 Pro"
  EXPO_LOCAL_RUNTIME=1 npx expo start --dev-client
  ```

  `tools/design/sim-shot.sh` then drives the dev build to a fixture and screenshots it for design-beside-device checks.
