# Research: old 6pm app + reference stacks (scootch, critterpass)

Date: 2026-10-10 · Scope: inform scaffolding of the 6pm v2 monorepo · Read-only except this file.
Sources: `gh api repos/get6pm/6pm` (main, last commit 2024-10-07, last push 2025-04-02, GPL-3.0, 29 stars), `/Users/quocs/Projects/scootch`, `/Users/quocs/Projects/critterpass`. No secret values read or copied.

---

## Part A — the original app (github.com/get6pm/6pm)

### A1. Repo shape (v1.0.2, 2024-09-21)

| Part | Stack |
|---|---|
| Root | pnpm workspace, Biome, lefthook, Lingui config at root, release-please style CHANGELOG |
| `apps/api` (`@6pm/api`) | Hono 4 inside Next 14 pages router (`pages/api/[...route].ts`) on **Vercel**; Prisma 5.19 + Postgres (pooled `DATABASE_PRISMA_URL` + direct url); Clerk; OpenAI Assistants; Vercel Blob; pino; Vercel cron hourly |
| `apps/mobile` (`@6pm/mobile`) | Expo SDK 51, RN 0.74.2, expo-router 3.5, NativeWind 4 + rn-primitives (shadcn-style), TanStack Query 5 (persisted to AsyncStorage, `offlineFirst`), zustand 4 (persist → AsyncStorage), Clerk Expo 2, RevenueCat 8, PostHog, Sentry 5.26, Skia + victory-native charts, Lingui 4, `hono/client` RPC (`hc<AppType>`) |
| `packages/currency` | `currencies.json` + formatter |
| `packages/utilities` | dayjs, budget period math, `PLAN_CONFIG`, transaction helpers |
| `packages/validation` | zod schemas + Prisma-generated zod (`zod-prisma-types`) |
| CI | `.github/workflows/checks.yaml`, `eas-build.yaml`, `eas-update.yaml` |

### A2. Features (from routes + screens)

| Area | What exists |
|---|---|
| Auth | Clerk: Sign in with Apple, Google (`useOAuth` `oauth_apple`/`oauth_google`), email code. Clerk `user.deleted` webhook deletes DB user |
| Onboarding | 3 steps (`app/onboarding/step-one..three`), seeds default categories + 3 wallets server-side on `POST /users` using `x-device-language` / `x-device-currency` headers |
| Transactions | CRUD, list w/ filters, AI scan (`POST /transactions/ai`), draft review screen (`review-transactions.tsx`), attachments (BlobObject), numeric pad entry |
| Wallets ("accounts") | CRUD, balance (`GET /wallets/:id/balance`, sums `amountInVnd`), icon, last digits, preferred currency |
| Categories | Per-user, INCOME/EXPENSE, parent/child, icon (lucide name), color; create gated by plan |
| Budgets | CRUD, type SPENDING/SAVING/INVESTING/DEBT, period configs WEEKLY/MONTHLY/QUARTERLY/YEARLY/CUSTOM, burndown chart, period control |
| Budget sharing | `BudgetUser` OWNER/MEMBER; invite by email (7-day expiry, **no email sent — TODO in code**), shareable link token (5-year expiry, `Math.random` token), `POST /budgets/response-invitation` accept/decline. No invite UI found in mobile file tree → API-only |
| Exchange rates | `GET /exchange-rates?date=`, `GET /exchange-rates/:from/:to` |
| Paywall | `app/(app)/paywall.tsx`, restore purchases, plan tabs growth/wealth × monthly/annually |
| Settings | profile, language, appearance/palette (PostHog flag `dynamic-color-palette`), alternate app icon (dark/light/digital/original via `expo-dynamic-app-icon`), default currency, Face ID app lock (`expo-local-authentication`), daily reminder push at **18:00 local** (`use-schedule-notification`, local notification), feedback, privacy policy, terms |
| Tabs | Home (`index`), Budgets, Settings |
| OTA | `expo-updates`, `checkAutomatically: ON_ERROR_RECOVERY`, `update-loader` |

API surface (`apps/api/v1/index.ts`, chained Hono for RPC typing): `/health`, `/webhooks/clerk`, `/webhooks/revenuecat`, then auth: `/auth/me`, `/users` (POST create+bootstrap, PUT `/:userId/metadata` timezone), `/budgets` (+ invitations), `/categories`, `/transactions` (+ `/ai`), `/wallets` (+ balance), `/exchange-rates`. Cron: `/api/cron/users/sync-subscriptions` hourly (Bearer `CRON_SECRET`).

### A3. Data model (`apps/api/prisma/schema.prisma`, Postgres, cuid ids, all have createdAt/updatedAt)

| Entity | Fields | Relations / notes |
|---|---|---|
| User | id (= **Clerk user id**), email (unique), name?, entitlement?, entitlementExpiresAt?, entitlementProductIdentifier? | cascades to wallets, budgetUsers, transactions, invitations, categories, blobs, metadata |
| UserMetadata | userId (unique), timezone | 1:1 |
| UserWalletAccount | name, icon?, description?, lastDigits?, preferredCurrency | userId; transactions cascade on wallet delete |
| Budget | name, description?, preferredCurrency, type (SPENDING default) | periodConfigs, budgetUsers, transactions, invitations |
| BudgetPeriodConfig | type (WEEKLY..CUSTOM), amount Decimal, startDate?, endDate? | many per budget (unique removed) |
| BudgetUser | permission OWNER/MEMBER | unique(userId, budgetId) |
| BudgetUserInvitation | email?, token, expiresAt, permission? , createdByUserId | unique(token,budgetId), unique(email,budgetId) |
| BudgetUserInvitationResponse | acceptedAt?, declinedAt?, invitationId, createdUserId? (unique) | |
| Transaction | amount Decimal (signed: expense negative), **amountInVnd** Decimal, currency, date, note? | categoryId? (SetNull), budgetId? (SetNull), walletAccountId (Cascade), createdByUserId, blobAttachments |
| Category | type INCOME/EXPENSE, name, description?, icon?, color?, userId, parentId? | self-relation |
| CachedGptResponse | query, response | AI cache keyed by file hash + instructions |
| CurrencyExchangeRate | fromCurrency, toCurrency, rate Decimal, date `YYYY-MM-DD` string | unique(from,to,date) |
| BlobObject | pathname, contentType?, contentDisposition, url, downloadUrl, uploadedByUserId?, transactionId? | Vercel Blob, `access: 'public'` |

Migrations: 22 Prisma migrations 2024-06-05 → 2024-09-23.

### A4. Auth (Clerk)

| Item | Detail |
|---|---|
| Server | `@hono/clerk-auth` `clerkMiddleware` + `getAuth`; user row loaded per request; 401 if no Clerk session |
| Mobile | `getClerkInstance({publishableKey, tokenCache})` (secure store), Bearer = `clerk.session.getToken()`; extra headers `x-device-language`, `x-device-currency` |
| Webhooks | Clerk via svix (`CLERK_WEBHOOK_SECRET_KEY`), only `user.deleted` |
| Failure path | if bootstrap fails in `POST /users`, server deletes the Clerk user |

### A5. Payments (RevenueCat)

| Item | Value |
|---|---|
| SDK | `react-native-purchases` 8; **iOS only** configured (`EXPO_PUBLIC_REVENUECAT_PROJECT_IOS_API_KEY`); no Android key → Android had no purchases |
| app_user_id | not explicitly logged-in in hook; server uses Clerk user id as RC customer id (`getOrCreateCustomer(userId)`), webhook reads `original_app_user_id` |
| Entitlements | `growth`, `wealth` (free = `free` on mobile, `saver` on server) |
| Packages | offering package ids `rc_${plan}_${duration}` → `rc_growth_monthly`, `rc_growth_annually`, `rc_wealth_monthly`, `rc_wealth_annually` (store product ids not in repo) |
| Server sync | RC REST v1 (`REVENUECAT_API_V1_KEY`), webhook Bearer `REVENUECAT_WEBHOOK_SECRET`, hourly cron re-syncs all users; sandbox header when not `VERCEL_ENV=production` |

Plan limits (`packages/utilities/src/config.ts`, server-enforced):

| Plan | maxWallets | maxBudgets | maxOwnedBudgets | createCategories | AI tx/day | retention days |
|---|---|---|---|---|---|---|
| saver (free) | 3 | 3 | 1 | no | 2 | 60 |
| growth | 6 | 6 | 5 | yes | 10 | 180 |
| wealth | ∞ | ∞ | ∞ | yes | 25 | ∞ |

Mobile copy (`lib/constaints.ts`) slightly differs (free budgets 3, ai 2). ascAppId (App Store Connect) = `6504689878`.

### A6. AI receipt flow (`v1/services/ai.service.ts`, `prompts/image2transaction.txt`)

1. Mobile: `expo-camera` / `expo-image-picker` → `expo-image-manipulator` → multipart `file` to `POST /transactions/ai`.
2. Server: loads user categories; `hashFile` → cache lookup in `CachedGptResponse` (key = hash + instructions JSON).
3. Parallel: upload to OpenAI Files (`purpose: vision`) and **Vercel Blob public** (`transaction_files/<hash>`).
4. OpenAI **Assistants API** thread + `runs.createAndPoll(OPENAI_ASSISTANT_ID)` with `additional_instructions` = `<categories>` JSON, current datetime, user lang (hard-coded `English`), currency `<unknown>`. System prompt lives in the OpenAI assistant config; repo file `image2transaction.txt` is the reference copy.
5. Output JSON `{amount, currency, type EXPENSE|INCOME, categoryId|null, note (~20 chars), date ISO|null}` or `{error}`; cleanup deletes file + thread; cache write; returns `{...data, blobObject}`.
6. Mobile shows drafts (`stores/transaction/store.ts`, persisted `transaction-storage`) → `review-transactions.tsx` → user confirms.

Issues to not carry over: photo leaves device + public blob URL; Assistants API (OpenAI announced its sunset for Aug 2026 — **likely broken now, unverified**); no amount verification; language hard-coded.

### A7. Exchange rates

`exchangeratesapi.io` v1 (`EXCHANGERATES_API_KEY`, **http://**), base EUR, default symbols USD JPY AUD VND SGD CNY only; lazy fetch-on-miss, stored per day in `CurrencyExchangeRate`; cross rate = to/from via EUR. Every transaction stores `amountInVnd` at write time → wallet balances and stats are VND-centric. Mobile `stores/exchange-rates` caches.

### A8. Defaults

Categories (`v1/constants/category.const.ts`, en/vi + lucide icon):

| Type | en | vi | icon |
|---|---|---|---|
| INCOME | Salary | Tiền lương | BriefcaseBusiness |
| INCOME | Gift | Quà tặng | Clover |
| INCOME | Investment | Đầu tư | ChartLine |
| INCOME | Interest | Lãi suất | BadgePercent |
| INCOME | Other Income | Thu nhập khác | HandCoins |
| EXPENSE | Groceries | Nhu yếu phẩm | ShoppingBasket |
| EXPENSE | Mortgage | Tiền nhà | House |
| EXPENSE | Bills & Utilities | Hóa đơn & Tiện ích | HousePlug |
| EXPENSE | Food & Beverage | Thức ăn & Đồ uống | UtensilsCrossed |
| EXPENSE | Transportation | Di chuyển | CarFront |
| EXPENSE | Shopping | Mua sắm | ShoppingBag |
| EXPENSE | Health | Sức khỏe | HeartPulse |
| EXPENSE | Entertainment | Giải trí | Drama |
| EXPENSE | Education | Giáo dục | BookHeart |
| EXPENSE | Investment | Đầu tư | ChartLine |
| EXPENSE | Other Expense | Chi phí khác | Coins |

Wallets (`wallet.const.ts`): Cash/Tiền mặt (WalletMinimal), Bank Account/Tài khoản ngân hàng (Landmark), Credit Card/Thẻ tín dụng (CreditCard). Investment + Other Wallet commented out ("limit to 3 for free"). Wallet currency = device currency.

### A9. App identifiers

| Key | Value |
|---|---|
| name / slug | `6pm` / `6pm` |
| iOS bundle id | `ai.sixpm.app` |
| Android package | `ai.sixpm.app` |
| scheme | `sixpm` |
| Expo owner | `sixpm` (different Expo account than scootch's `critterpass`) |
| EAS project id | `5853e031-3bfb-41fe-bfb6-c49f746c4adc` |
| updates url | `https://u.expo.dev/5853e031-…` , runtimeVersion `1.0.2` (fixed string), channels development/preview/production |
| ASC app id | `6504689878` |
| version | 1.0.2, `appVersionSource: remote`, production `autoIncrement` |
| Sentry | org `get6pm`, project `6pm-mobile` |
| Entitlements | `com.apple.developer.applesignin`; supportsTablet true |
| Android perms | CAMERA, RECORD_AUDIO, USE_BIOMETRIC, USE_FINGERPRINT |
| Native dirs | `ios/` and `android/` committed (bare-ish); `ios/6pm.xcodeproj`, Kotlin pkg `ai.sixpm.app` |

### A10. Languages

`en`, `vi`. Lingui 4 (`@lingui/macro`), PO catalogs at `apps/mobile/locales/{en,vi}/messages.po` compiled to `.ts`; root `lingui.config.js`; `@formatjs/intl-locale` + `intl-pluralrules` polyfills.

### A11. If v2 ships as an update to the same store listing — what users lose / need migrating

| Thing | Where it lives now | Risk if v2 is local-first + new backend | Migration need |
|---|---|---|---|
| Transactions, wallets, categories, budgets, period configs | Postgres (v1 API on Vercel) | **total loss** unless imported | one-time pull: v2 app (still holding Clerk session/token cache in secure store) or a server-side export by Clerk user id → snapshot into expo-sqlite |
| Receipt attachments | Vercel Blob (public URLs) | links die if Vercel project removed | decide keep/drop; download into app files on import |
| Shared budgets (members) | BudgetUser rows | sharing has no equivalent in a device-token, local-first model | decide: drop, or flatten to owner copy |
| Identity | Clerk user id (Apple/Google/email) | new auth (anon token + SIWA) has no Clerk link | keep Clerk alive read-only during migration window; Apple `sub` only matches if same Apple team signs v2 |
| Subscriptions | Apple receipts → RevenueCat project, app_user_id = Clerk id | entitlements tied to RC customer id | keep **same RC project + entitlement ids (`growth`,`wealth`)** and same App Store products/subscription group; call `Purchases.restorePurchases` or alias anon id → old Clerk id via `logIn` |
| Local settings | AsyncStorage `user-settings-storage` (preferredCurrency, enabledPushNotifications, enabledLocalAuth, preferredPalette) | ignored if v2 uses sqlite | read once on first v2 launch then delete (needs `@react-native-async-storage/async-storage` in v2 temporarily) |
| Draft scans | AsyncStorage `transaction-storage` | lost | low value; drop |
| TanStack persisted cache | AsyncStorage | stale data | clear |
| Scheduled 18:00 reminder | OS notification schedule | keeps firing with v1 copy | `cancelAllScheduledNotificationsAsync` on first launch, reschedule |
| Alternate icon | native icon names dark/light/digital/original | v2 asset names differ → icon may reset | map or reset |
| Face ID lock pref | AsyncStorage | v2 must honour or users lose app lock silently | carry flag |
| Store listing ids | bundle `ai.sixpm.app`, ASC `6504689878` | v2 must keep bundle id + Apple team to update in place | keep; new EAS project ok but Expo owner/project id change means new updates URL |
| OTA | runtime `1.0.2`, channel `production` | publishing v2 JS to `production` with runtime `1.0.2` would hit v1 binaries | use fingerprint runtime; never publish to old runtime |
| Android | package `ai.sixpm.app` | unknown if ever on Play | check Play Console |
| Analytics | PostHog distinct ids | history split | optional |

License note: v1 repo is **GPL-3.0**. Copying prompt text/constants/code into v2 is fine only if the owner holds copyright or v2 is GPL.

---

## Part B — reference stacks

### B1. Scootch stack per layer (exact pins from `pnpm-workspace.yaml` catalog, `saveExact: true`)

| Layer | Package | Version |
|---|---|---|
| Toolchain | pnpm (`packageManager`) | 12.6.0 |
| | node (`engines`, EAS profiles) | >=24 (EAS `24.21.0`) |
| | typescript | 6.0.3 |
| | tsx | 4.23.15 |
| | @types/node | 26.6.3 |
| Lint/format | eslint / @eslint/js | 10.11.0 / 10.0.1 |
| | typescript-eslint | 8.70.1 |
| | eslint-config-prettier | 10.1.8 |
| | globals | 17.12.0 |
| | prettier | 3.9.9 |
| Tests | vitest (root/packages) | 5.0.2 |
| | vitest (apps/api, direct pin) | 4.1.11 |
| | fast-check | 4.10.2 |
| | jest / @jest/globals / jest-expo | 29.7.0 / 29.7.0 / 58.0.7 |
| | @react-native/jest-preset | 0.88.0-rc.3 |
| | @playwright/test / playwright | 1.58.2 |
| Mobile core | expo | 58.0.5 |
| | react-native | 0.88.0-rc.3 |
| | react / @types/react | 19.3.0 / 19.3.0 |
| | expo-router | 58.0.15 |
| | @react-native/metro-config | 0.88.0-rc.3 |
| | babel-preset-expo / @babel/core | 58.0.10 / 7.29.7 |
| | @expo/metro-runtime / @expo/log-box | 58.0.12 / 58.0.10 |
| | expo-dev-client / expo-updates | 58.0.11 / 58.0.15 |
| | expo-doctor | 1.20.4 |
| | expo-build-properties | 58.0.10 |
| Mobile UI | react-native-reanimated / worklets | 4.7.0 / 0.13.0 |
| | react-native-gesture-handler | 3.2.1 |
| | react-native-screens / safe-area-context | 4.28.0 / 5.9.1 |
| | @shopify/react-native-skia | 2.13.1 |
| | @expo/ui / expo-glass-effect | 58.0.13 / 58.0.3 |
| | expo-haptics / expo-system-ui / expo-splash-screen / expo-font | 58.0.5 / 58.0.5 / 58.0.6 / 58.0.7 |
| Mobile data | expo-sqlite | 58.0.10 |
| | react-native-keychain | 10.0.0 |
| | @nauverse/expo-cloud-settings (iCloud KVS) | 1.3.4 |
| | expo-file-system / expo-crypto / expo-network | 58.0.6 / 58.0.5 / 58.0.3 |
| Mobile platform | expo-apple-authentication | 58.0.2 |
| | react-native-purchases | 10.11.0 |
| | @sentry/react-native (excluded from `expo install`) | 8.28.0 |
| | expo-notifications | 58.1.1 |
| | expo-localization | 58.0.3 |
| | expo-camera / expo-image-manipulator / expo-media-library | 58.0.9 / 58.0.13 / 58.0.7 |
| | expo-audio / expo-speech-recognition | 58.0.6 / 57.1.0 |
| | expo-sharing / expo-clipboard / expo-store-review / expo-web-browser / expo-linking | 58.0.15 / 58.0.3 / 58.0.2 / 58.0.6 / 58.0.11 |
| | expo-application / expo-device / expo-constants / expo-asset | 58.0.4 / 58.0.5 / 58.0.10 / 58.0.12 |
| | @bacons/apple-targets (widgets, App Clip, etc.) | 5.0.0 |
| API | hono | 4.13.13 |
| | zod | 4.6.5 |
| | wrangler | 4.141.0 |
| | @cloudflare/workers-types | 5.20260926.1 |
| | @cloudflare/vitest-pool-workers | 0.22.0 |
| | @resvg/resvg-wasm (direct) | 2.6.2 |
| Web | astro | 7.3.5 |
| | @astrojs/cloudflare / @astrojs/check | 14.3.3 / 0.9.10 |
| | @cloudflare/vite-plugin (override) | 1.60.2 |
| Node canvas (art scripts/tests) | @napi-rs/canvas | 1.0.10 |

Infra: Cloudflare Workers + D1 + R2 + Durable Objects + Rate Limit bindings; Astro static on Workers; GitHub Actions; EAS (updates only; native builds via `eas build --local` on GH macOS runners). No Docker, no Postgres, no Turbo. Styling: plain RN styles from `@scootch/tokens` (no NativeWind/Tailwind). i18n: hand-written typed TS catalogues (no Lingui).

Critterpass extras a finance app might want (scootch lacks; versions from critterpass):

| Lib | Version | Use for 6pm |
|---|---|---|
| @lingui/core, @lingui/react, @lingui/babel-plugin-lingui-macro, @lingui/cli/conf/format-po | 6.8.0 | if keeping v1's PO catalogs (v1 used Lingui 4) |
| eslint-plugin-lingui | 0.16.0 | lint untranslated strings |
| @formatjs/intl-pluralrules | 6.3.15 | Hermes Intl gaps (v1 needed polyfills) |
| @tanstack/react-query | 5.103.2 (catalog; used by admin, not mobile) | only if server-state heavy; local-first may not need |
| react-native-mmkv (+ react-native-nitro-modules) | 4.3.2 (+0.37.1) | fast KV prefs |
| expo-secure-store | 58.0.0 | Clerk token read during migration; secrets |
| @op-engineering/op-sqlite (sqlcipher, patched) | 18.2.5 | encrypted local DB (finance data at rest) — needs patch + `"op-sqlite": {"sqlcipher": true}` in root package.json |
| better-auth / @better-auth/expo | 1.7.6 | if accounts beyond SIWA (Google, email) |
| @react-native-google-signin/google-signin | 16.1.5 | Google sign-in (v1 had it) |
| @shopify/flash-list / @legendapp/list | 2.3.2 / 3.4.0 | long transaction lists |
| posthog-react-native / posthog-node | 4.78.0 / 5.54.1 | v1 used PostHog |
| expo-image-picker | 58.0.8 | pick receipt from library (v1 had it) |
| @expo/app-integrity | 58.0.0 | App Attest for AI endpoint abuse |
| @anthropic-ai/sdk | 0.128.0 | AI gateway client (DeepSeek Anthropic-compatible) |
| drizzle-orm / pg / pg-boss / pino / jose | 0.45.2 / 8.23.0 / 12.35.0 / 10.3.1 / 6.2.12 | only if Postgres server (not scootch's D1 path) |
| @powersync/react-native | 2.3.0 | only if real multi-device sync / shared budgets |
| @testing-library/react-native | 14.0.1 | component tests |

Critterpass mobile is older: expo `58.0.0-preview.7`, RN `0.88.0-rc.1` → use scootch pins.

Critterpass `@cp/cost-engine` (`packages/cost-engine/src/{money,fx,budget}`): bigint minor-unit `Money`, ISO currency exponents, largest-remainder allocate, `format`/`compact`, `fx/convert` + `FxSnapshot` (rate as decimal string, `asOf`, `source`, 48h stale threshold); worker ingests FX from **Frankfurter** (`services/worker/src/fx/frankfurter.ts`, no key). Highly relevant to replace v1's float/`amountInVnd` approach.

### B2. Files worth copying into 6pm

| Source (scootch unless noted) | Copy | Change |
|---|---|---|
| `pnpm-workspace.yaml` | near-verbatim | drop art/sound/voice-only pins (napi-rs canvas, expo-audio, speech-recognition, apple-targets if no widgets, astro if no site); keep `saveExact`, catalog, `overrides` for expo native modules, `allowBuilds` |
| `package.json` (root) | verbatim | name `6pm`; same scripts |
| `tsconfig.base.json` | verbatim | — |
| `eslint.config.js` | verbatim | update `defaultExportAllowed` paths; keep extensionless-import + named-exports + max-lines 300 rules |
| `.prettierrc`, `.prettierignore`, `.npmrc`, `.gitignore` | verbatim | `.gitignore` already ignores `/apps/mobile/ios`, `/apps/mobile/android`, `.env.*`, `certs/`, `.wrangler/` |
| `vitest.config.ts` (root projects) | verbatim | — |
| `.env.example` (root) | pattern | names for 6pm |
| `.github/workflows/ci.yml` | near-verbatim | drop `web`/`native-set` swift test line for `scootch-reading` unless OCR module copied; keep `no-session-links`, `no-ids`, `ci-passed` aggregator |
| `.github/workflows/deploy-dev.yml`, `update-dev.yml`, `native-build.yml`, `native-build-job.yml` | near-verbatim | worker names, health URL, ASC vars, bundle ids |
| `tools/scripts/generate-index.ts` (+test) | verbatim | registry folders |
| `tools/scripts/no-plan-ids.test.ts` | verbatim | — |
| `tools/scripts/check-expo-prebuilds.ts` | verbatim | — |
| `tools/scripts/lane-install.sh`, `native-build-ios.sh`, `native-submit-ios.sh`, `native-build-manifest.ts`, `resolve-device-build.ts` | near-verbatim | names |
| `tools/scripts/package.json`, `tsconfig.json` | verbatim | package name |
| `apps/api/wrangler.jsonc` | structure | names `6pm-dev`/`6pm`; drop Durable Objects unless needed; new D1 ids; cron for FX ingest + bot digest |
| `apps/api/src/{app.ts,route.ts,errors.ts,env.ts,rate-limit.ts,device-auth.ts,backup-token.ts,ledger.ts,flags.ts,index.ts}` | near-verbatim | secret names; drop `TABLE` binding |
| `apps/api/src/routes/{health,devices,backup,accounts-apple-nonce,accounts-apple,accounts-delete,data-delete,push-tokens}.ts` | near-verbatim | — |
| `apps/api/src/accounts/{apple-keys,apple-token,accounts,delete-account}.ts` | near-verbatim | audience = 6pm bundle ids |
| `apps/api/src/ai/{deepseek,jev,decide}.ts` | near-verbatim | routes: receipt read, category pick |
| `apps/api/src/bot/*` | optional | digest metrics for finance |
| `apps/api/vitest.config.ts`, `test/apply-migrations.ts`, `.dev.vars.example`, `.gitignore` | verbatim | names |
| `apps/api/migrations/2026100617450*_devices_and_ai_usage.sql`, `*_flags.sql`, `*_backup_snapshots.sql` | adapt | fresh timestamps |
| `apps/mobile/app.config.ts` | structure | variants `ai.sixpm.app.dev`/`ai.sixpm.app`, scheme `sixpm`, Apple team, EAS id, permission strings (camera, photos, Face ID), drop Live Activity/communication entitlements unless used, `supportsTablet` (v1 = true!) |
| `apps/mobile/eas.json` | structure | profiles dev/e2e-test/prd; RC public key per profile |
| `apps/mobile/metro.config.js` | near-verbatim | drop helpline check; keep `(dev)` route blockList for prd |
| `apps/mobile/tsconfig.json`, `.gitignore`, `.env.example` | verbatim | — |
| `apps/mobile/src/db/{database,migrate}.ts` + `migrate.test.ts` | verbatim | — |
| `apps/mobile/src/data/table.ts` + repositories pattern | verbatim | finance tables |
| `apps/mobile/src/api/{http-client,api-error,api-config,app-http}.ts` | near-verbatim | URLs, keychain service `ai.sixpm.device-token` |
| `apps/mobile/src/features/backup/*` | near-verbatim | snapshot shape for finance; size cap (512 KB server cap may be too small for years of tx → raise or chunk) |
| `apps/mobile/src/features/account/apple-port.ts`, `account-flow.ts` | near-verbatim | — |
| `apps/mobile/src/features/plus/{revenuecat-port,purchases-port,products,revenuecat-customer}.ts` | near-verbatim | entitlement/product ids (`growth`/`wealth` or new) |
| `apps/mobile/src/i18n/{i18n-provider,language-store}.tsx/ts` | verbatim | — |
| `packages/i18n/src/{translate,catalogue-types,completeness,pick-language}.ts` + `catalogues.test.ts` | verbatim | catalogues |
| `packages/tokens/src/{index.ts,colors.json}` | structure | 6pm palette (from `design/`) |
| `packages/domain/src/contracts/{common,local-db}.ts`, `entitlements/*` | pattern | — |
| critterpass `packages/cost-engine/src/{money,fx}` | near-verbatim | rename `@cp/*` imports; DomainError |
| critterpass `services/worker/src/fx/frankfurter.ts` | adapt | run as Worker cron writing D1 `fx_rates` |
| critterpass `packages/ai/src/routes/receipt-parse/{schema,prompt}.ts` | adapt | line-id grounded receipt parse; port to scootch `deepseek.ts` tool-call style |
| critterpass `apps/mobile/modules/cp-ocr` or scootch `modules/scootch-reading` | adapt | on-device Vision OCR → lines with ids |
| v1 `category.const.ts`, `wallet.const.ts` | data | seed defaults locally (en/vi) |

### B3. Gotchas that apply

| # | Gotcha | Source |
|---|---|---|
| 1 | pnpm 12 refuses dependency install scripts unless listed in `allowBuilds` (set each `true`/`false`); scootch: `@sentry/cli`, `esbuild`, `workerd` true; `@parcel/watcher`, `sharp` false | `pnpm-workspace.yaml`, critterpass CLAUDE.md |
| 2 | Relative imports extensionless (`./x`, never `./x.js`): Metro cannot map `.js`→`.ts`; ESLint enforces in `apps/mobile/**` + `packages/**` | `eslint.config.js` |
| 3 | Workspace packages export TS source (`"exports": {".": "./src/index.ts"}`), `type: module`, `sideEffects: false`, no build step | packages/*/package.json |
| 4 | RN `0.88.0-rc.3` + Expo `58.0.5`: RC; `@react-native/metro-config` and `jest-preset` must match rc; Expo native modules forced to one copy via `overrides`; prebuilt xcframeworks must match `expo-modules-core`/`jsi` → `check-expo-prebuilds.ts` on macOS CI | workspace overrides, ci.yml |
| 5 | `@sentry/react-native` excluded from `expo install` (`expo.install.exclude`), plugin `disableAutoUpload: true`, metro via `getSentryExpoConfig` | mobile package.json, app.config.ts |
| 6 | API vitest pinned 4.1.11 (not catalog 5.0.2) — pool-workers 0.22 pairing (inferred) | apps/api/package.json |
| 7 | `@cloudflare/vite-plugin` override pinned to pair with wrangler | workspace overrides |
| 8 | TS 6 strict extras: `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`, `module: preserve`, `types: []` (each pkg opts in) | tsconfig.base.json |
| 9 | `app.config.ts` runs under plain Node: import tokens JSON with `with { type: 'json' }`, plugins as `.js`; `metro.config.js`/`babel.config.js` are CommonJS | app.config.ts, metro.config.js |
| 10 | CNG: never commit `ios/`/`android/` (EAS treats app as bare otherwise). v1 committed them | mobile .gitignore |
| 11 | `runtimeVersion: {policy: 'fingerprint'}`; native changes batched on a native branch, never on main between batches; declare all capabilities in first native build | CLAUDE.md, tech-decisions §4 |
| 12 | Wrangler env bindings are not inherited: declare D1/R2/ratelimits per `env.dev`/`env.prd`; secrets per env | wrangler.jsonc |
| 13 | Cron Triggers are UTC (08:00 ICT = `0 1 * * *`) | wrangler.jsonc |
| 14 | Registries are folders + generated `index.generated.ts`; `test` runs `generate-index --check` | api/package.json |
| 15 | `@scootch/domain` entry does not re-export contracts; API reaches them by path in one file `src/contracts.ts` | contracts.ts |
| 16 | ESLint: named exports only (default only for route files, Astro pages, Worker entry, configs); max 300 lines/file | eslint.config.js |
| 17 | EAS profiles pin `node 24.21.0`, `pnpm 12.6.0`; Android `compileSdk 37 / targetSdk 36`; Android arm64 only except e2e | eas.json, app.config.ts |
| 18 | No full typecheck/lint/test locally; CI runs suites; device runs only on GH Actions; installs via `lane-install.sh` | CLAUDE.md |
| 19 | No session links / attribution lines in commits/PRs — CI `no-session-links` job fails them; no plan ids in code (`no-plan-ids.test.ts`) | ci.yml |
| 20 | Prd metro bundle blocks `src/app/(dev)` routes | metro.config.js |
| 21 | Sign in with Apple nonce flow: `/v1/accounts/apple/nonce` then identity token + nonce verified against Apple JWKS server-side | routes/accounts-apple*.ts |
| 22 | Lingui (if chosen): babel macro plugin needs explicit `linguiConfig` path + `descriptorFields: 'message'`; jest needs `babel-plugin-dynamic-import-node` | critterpass apps/mobile/babel.config.js |
| 23 | op-sqlite sqlcipher needs a patch file + root `"op-sqlite": {"sqlcipher": true}` | critterpass root package.json |
| 24 | Scootch commits RevenueCat **public** iOS SDK keys in `eas.json` (by design public); secret RC key never in app | eas.json, mobile .env.example |
| 25 | Zsh: split lists with arrays / `${=list}`; never `pkill -f` | CLAUDE.md |

### B4. Env var names

Scootch API secrets (`apps/api/src/env.ts`, `.dev.vars.example`) and vars:

| Name | Scootch use | 6pm needs? |
|---|---|---|
| DEEPSEEK_API_KEY | generation model (Anthropic-compatible endpoint) | yes — receipt parse, category pick fallback, insights |
| TYPESAFE_API_KEY | Jev closed-label decisions | likely — category classification of note/merchant |
| ELEVENLABS_API_KEY | online speech-to-text, single-use token route | optional — voice entry ("coffee 45k") |
| TASK_CONTINUATION_SECRET / SHARE_SIGNING_SECRET | HMAC signing | maybe one signing secret (share links) |
| TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID / TELEGRAM_WEBHOOK_SECRET | ops bot | yes if copying ops bot |
| REVENUECAT_API_V2_KEY | server entitlement checks | yes (gate AI quota server-side); add webhook auth name (critterpass: `REVENUECAT_WEBHOOK_AUTH`) |
| APNS_KEY_P8 / APNS_KEY_ID / APNS_TEAM_ID | server push | no for local reminders; yes if shared-budget pushes |
| ENVIRONMENT, COMMIT_SHA (vars) | env name, health commit | yes |

Scootch mobile (`apps/mobile/.env.example`): `APP_VARIANT`, `EXPO_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`, `EXPO_PUBLIC_REVENUECAT_IOS_KEY`. Root `.env.example`: `DEEPSEEK_API_KEY`, `TYPESAFE_API_KEY`, `ELEVENLABS_API_KEY`, `REVENUECAT_API_V2_KEY`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`.
GitHub secrets/vars: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `EXPO_TOKEN`, `EXPO_ASC_API_KEY_P8`, `EXPO_ASC_KEY_ID`, `EXPO_ASC_ISSUER_ID`; vars `ASC_APP_ID`, `SCOOTCH_API_URL`.

6pm additions to consider:

| Name | Why |
|---|---|
| EXPO_PUBLIC_REVENUECAT_ANDROID_KEY | if Android ships with purchases (v1 never did) |
| EXPO_PUBLIC_POSTHOG_KEY / EXPO_PUBLIC_POSTHOG_HOST | v1 analytics + flags (scootch uses own flags table + bot instead) |
| FX provider key | none if Frankfurter; `EXCHANGERATES_API_KEY` only if staying on exchangeratesapi.io |
| ANTHROPIC_API_KEY / ANTHROPIC_BASE_URL | critterpass names, if using a Claude model or SDK base-url swap |
| V1 migration (temporary): V1_DATABASE_URL, CLERK_SECRET_KEY, EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY | export old data per Clerk user during migration window |
| v1 names for reference | `DATABASE_PRISMA_URL`, `DATABASE_URL_NON_POOLING`, `SHADOW_DATABASE_URL`, `OPENAI_API_KEY`, `OPENAI_ASSISTANT_ID`, `EXCHANGERATES_API_KEY`, `CLERK_WEBHOOK_SECRET_KEY`, `REVENUECAT_API_V1_KEY`, `REVENUECAT_WEBHOOK_SECRET`, `CRON_SECRET`, `BLOB_*` (Vercel), mobile: `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`, `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_SENTRY_DSN`, `EXPO_PUBLIC_POSTHOG_API_KEY`, `EXPO_PUBLIC_POSTHOG_HOST`, `EXPO_PUBLIC_REVENUECAT_PROJECT_IOS_API_KEY`, `SENTRY_*`, `EXPO_USE_METRO_WORKSPACE_ROOT` |

### B5. Scootch local-first data

| Piece | Path | Pattern |
|---|---|---|
| DB open | `apps/mobile/src/app/_layout.tsx` | `<SQLiteProvider databaseName="scootch.db" onInit={prepareDatabase}>` wraps everything; no screen renders before migrations |
| Migrations | `apps/mobile/src/db/migrations/0001-create-settings.ts` … `0007-…` | one file per migration exporting `sql` string; collected with `require.context` (no list) |
| Runner | `apps/mobile/src/db/migrate.ts`, `database.ts` | `_migrations(name, applied_at)`; pending sorted by name; each in `withTransactionAsync` with its record |
| Tables | `apps/mobile/src/data/table.ts`, `data/repositories/*.ts`, `data/repositories.ts` | `createTable(db, spec)` typed CRUD; rows validated against zod contracts (`packages/domain/src/contracts/local-db.ts`) both ways; `openRepositories(db)` composes, multi-table ops in transactions |
| Settings | `settings(key,value)` table; language in `i18n/language-store.ts` | KV in sqlite, not AsyncStorage |
| Backup token | `features/backup/backup-token.ts`, `native-token-stores.ts` | anon token (32 random bytes, base64url) stored in **synchronisable Keychain item** + **iCloud KVS** (`@nauverse/expo-cloud-settings`); read whichever answers |
| Snapshot | `features/backup/snapshot.ts`, `snapshot-size.ts`, `backup.ts`, `backup-api.ts`, `restore-offer.tsx` | versioned JSON of all rows (excludes sensitive tables); upload at most hourly + on key events; restore offered on fresh DB when token found |
| Server | `apps/api/src/routes/backup.ts`, `backup-token.ts`, migration `20261007050000_backup_snapshots.sql` | `PUT/GET/DELETE /v1/backup`, header `X-Backup-Token`, stored by SHA-256 hash in D1, opaque JSON, cap 512 KB |
| Sync | none | no multi-device live sync; snapshot restore only. (Critterpass uses PowerSync + Postgres for real sync.) |

### B6. API calls, auth, AI gateway

| Topic | Scootch pattern |
|---|---|
| Client | **Not Hono RPC.** Hand-rolled `createHttpClient` (`apps/mobile/src/api/http-client.ts`): fetch + timeout (10 s) + bearer device token + error body → `ApiClientError` + one retry when server marks `retryable`; every response parsed by a zod contract from `@scootch/domain`. Singleton `appHttp()` (`app-http.ts`); base URL per `APP_VARIANT` (`api-config.ts`) |
| Server routing | one file per route in `apps/api/src/routes/` exporting `RouteDefinition {method, path '/v1/...', access 'public'|'device', handle}`; `createApp` registers with `requireDevice` + `limitByDevice`; wire error `{error:{code,message,retryable,detail?}}`; requestId; IP + device rate limits |
| Device auth | `POST /v1/devices` (public) issues/accepts anon token; server stores SHA-256 hash only; token in Keychain (`react-native-keychain`, service `app.scootch.device-token`, AFTER_FIRST_UNLOCK); sent as `Authorization: Bearer` |
| Accounts | optional Sign in with Apple linked to the device: `GET nonce` → `expo-apple-authentication` → `POST /v1/accounts/apple {identityToken, nonce}`; server verifies against Apple keys, links device hash to account by Apple `sub`; no email stored; delete + sign-out routes |
| AI gateway | Worker-side only, keys never on phone. `ai/deepseek.ts`: DeepSeek **Anthropic-compatible** `/anthropic/v1/messages`, forced single tool call whose `input_schema` = `z.toJSONSchema(schema)`, thinking disabled, tiers `writer`/`fast` with timeouts, retry only on 429/5xx/transport. `ai/jev.ts` + `ai/decide.ts`: closed-label decisions on TypeSafe "Jev" with time-budgeted retry, then DeepSeek fast fallback returning same shape. `ledger.ts`: `ai_usage` row per call (route, model, tokens, device hash, project tag) → bot `/costs`, daily cap alerts |
| Camera/AI privacy | photo never leaves phone: on-device Apple Vision (`modules/scootch-reading`) → lines with ids → model picks by line id, code does all counting (`ai/camera/read-words.ts`); critterpass `receipt-parse` does the same for receipts and re-parses amounts from cited line text, checks against printed total |
| Purchases | `features/plus/revenuecat-port.ts` behind a `PurchasesPort` (fake in tests); no key → `unavailablePurchases`; trial eligibility via RC; entitlement logic in `packages/domain/src/entitlements` |
| Ops | Telegram bot route + daily cron digest; flags table + `/flag` command |

---

## Recommendation summary (for the scaffold)

1. Scaffold from scootch skeleton (pnpm 12 catalog, TS 6, eslint/prettier, CI, Workers API + D1, Expo 58 / RN 0.88-rc.3, CNG). Skip Astro unless a site is in scope.
2. Data: expo-sqlite source of truth (scootch runner + table pattern); money as bigint minor units + FX snapshots (critterpass cost-engine); FX via Frankfurter Worker cron into D1, served to phone, cached locally.
3. Auth: anon device token + optional SIWA (scootch). Shared budgets are the one v1 feature that genuinely needs identity + server data — decide before schema.
4. AI receipts: on-device OCR → DeepSeek structured tool call by line id (critterpass receipt-parse); category pick via decide (Jev → DeepSeek fallback).
5. Payments: keep RevenueCat project + `growth`/`wealth` entitlements + existing App Store products to honour current subscribers.
6. Plan a v1→v2 import path before shipping to bundle `ai.sixpm.app`.

## Unresolved questions

1. Ship v2 to same listing (`ai.sixpm.app`, ASC `6504689878`)? If yes: who owns the Apple team that signs v1, and is v1's Expo owner `sixpm` accessible (or new EAS project under `critterpass`)?
2. Is the v1 Postgres/Clerk/Vercel stack still live and reachable for a data export? How many active users / paying subscribers?
3. Keep budget sharing (needs accounts + server data/sync) or drop it?
4. Keep plan names/limits (saver/growth/wealth) and RC entitlement ids, or re-price? Store product ids are not in the repo — need RC dashboard.
5. Was Android ever published on Play under `ai.sixpm.app`?
6. GPL-3.0 on v1: does the owner hold copyright to relicense prompt/constants/code into v2?
7. Lingui (v1 + critterpass) vs scootch's typed TS catalogues for i18n?
8. Encrypted local DB (op-sqlite + SQLCipher, critterpass) vs plain expo-sqlite (scootch) for finance data?
9. Backup snapshot cap 512 KB in scootch — enough for multi-year transaction history, or chunked/compressed backups needed?
10. Confirm OpenAI Assistants API status (believed sunset Aug 2026) — affects whether v1 scanning is already broken for current users.
11. Need a web app (Astro) at all, or landing page stays elsewhere (get6pm.com)?
