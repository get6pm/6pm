# Batch 8b: native feature lanes, then one TestFlight build

Status: merged to `v2` 12 Oct; signed builds green (6pm 2.0.0 build 65 on TestFlight, 6pm Dev build 4). Apple setup done 12 Oct: App Groups, six extension App IDs, capabilities, EAS profiles (EAS cannot patch capabilities through Apple's API: set them in the portal and run `eas credentials` with `EXPO_NO_CAPABILITY_SYNC=1`). Next: the device verification below.
Was: todo · Target: all lanes merged by 22 Oct, `testflight/*` tag 23 Oct, two weeks of device testing before 6 Nov
Rules: CLAUDE.md applies (an owns list, real behaviour only, copy from `@6pm/i18n`, colour from `@6pm/theme`, prototype motion). A lane that needs a file it does not own stops with `NEEDS_CONTEXT`. Swift lanes (L2, L3, L5) must merge before the tag. JS-only lanes may follow over the air.

## Lanes and ownership (no file appears in two lanes)

| Lane | Feature (phase-08 #) | Owns | Blocks / blocked by |
|---|---|---|---|
| D | Domain parsers + native bundle | `packages/domain/src/capture/{bank-receipt,spoken-spend,wallet-amount}.ts` (+tests, `fixtures/receipts/*.json`), `packages/domain/src/money/spoken-number.ts` (+test), `packages/domain/src/native/**`, `packages/domain/src/index.ts`, `apps/mobile/targets/_shared/domain-native.js` (generated) | Blocks the merges of L2, L3 and L4; their Swift/UI work starts in parallel against the 8a contracts |
| L1 | Share the close receipt and the money diary as images (1) | `apps/mobile/src/features/sharing/**`, `features/close/close-receipt-step.tsx`, `features/close/close-receipt.tsx` (ref only), `features/diary/zine/zine-share.tsx`, `src/app/money-diary.tsx`, i18n `sharing` | none |
| L2 | Share extension: bank receipt OCR (3) | `apps/mobile/targets/share/**`, `features/capture/enrich-shared.ts`, `apps/api/src/routes/name-merchant.ts` (+test), `apps/api/src/ai/name-merchant.ts`, `apps/api/src/routes/index.generated.ts` (regenerated), i18n `share-ext` | D |
| L3 | App Intent "Log in 6pm", controls, capture guide (4) | `apps/mobile/targets/intents/**`, `targets/widgets/Controls.swift`, `src/app/capture-guide.tsx`, `features/capture-guide/**`, `src/app/settings.tsx` (capture and widget rows only), i18n `intents` | D |
| L4 | Voice (5) | `features/voice/**`, `src/app/quick-add.tsx`, `features/close/close-steps.tsx` (cash step only), i18n `voice` | D |
| L5 | Widgets + Live Activity (6) | `apps/mobile/targets/widgets/**` except `Controls.swift`, `modules/surfaces/ios/{SurfaceFiles,LiveActivities,SurfaceAttributes}.swift`, `features/surfaces/**` except `surfaces-sync.tsx`, i18n `surfaces` | none (the Bundle.swift line that registers controls is L5's, pointing at L3's `Controls.swift`: agree the type names first) |

Generated files (`targets/_shared/*.strings`, `ThemeTokens.swift`, the attributes copy): each lane runs `pnpm exec tsx tools/scripts/generate-native.ts` and commits only the tables its sources changed. The output is deterministic, so lanes do not collide.

## D: domain parsers (Vitest; money and parsers are where tests protect behaviour)

- `bank-receipt.ts`: `parseBankReceipt(lines: {text, box}[]) → {amount, payee, payeeSure, at, code, bank} | null`. Group lines into rows by box y, then match labels in VI/EN: Số tiền/Amount (also `-120,000 VND`, `120.000 đ`), Tới/Người nhận/Beneficiary/Đơn vị thụ hưởng, Thời gian/dd/MM/yyyy HH:mm, Mã giao dịch/Số tham chiếu/Transaction ID/FT…, and the bank from header words against the VietQR bank catalogue. `payeeSure = false` when the payee is a bare account name or the OCR confidence for it is low.
- Fixtures: OCR the founder's redacted receipts **on this Mac** with a scratchpad `swift` script (macOS Vision, the same recogniser) and commit the line JSON only, never the images. At least one per bank in 8a's list, plus a PDF and a text share.
- `spoken-number.ts` and `spoken-spend.ts`: number words to digits (EN "forty-five k", "one point two million"; VI "bốn mươi lăm nghìn", "bốn lăm k", "một triệu hai", "hai trăm rưỡi"), then `parseSpokenSpend(text) → {name, amount, categoryHint}` built on `parseAmount` (`money/parse-amount.ts:12`). Cases from the prototype: "trà sữa with pearls, forty-five k" → Trà sữa · 45.000 · Drinks (`App:2618-2630`); "veggies and eggs at the market, thirty-five k" → 35.000 · Groceries (`App:2561-2573`).
- `wallet-amount.ts`: `₫45,000`, `45.000 ₫`, `VND 45,000.00`, `45000`, `0.0`, `""`, `$3.50` → `{currency, amount} | null`.
- `native/entry.ts` exposes JSON-in/JSON-out functions with the 8a contract types: `shareCard(lines, context, nowIso)` and `logSpend(amountText, merchant, context, nowIso)` (category from rules → `predictCategory`, status/source rules, `safeAfterText` = today's number minus the amount when the category counts daily, formatted with `money/format.ts`). Test the facade too: it is the only thing Swift calls.

## L1: share images (`App:1850` receipt Share, `App:1429-1434` zine Show amounts / Save image / Share)

- `features/sharing/capture-view.ts`: Skia `makeImageFromView(ref)` → `encodeToBase64(PNG)` → a file in `Paths.cache` → `Sharing.shareAsync(uri, {mimeType: 'image/png', UTI: 'public.png'})`. Delete the file after the sheet closes. `save-image.ts`: `MediaLibrary.requestPermissionsAsync(true)` (write only) → `saveToLibraryAsync`.
- Receipt: capture only the paper (not the buttons), after the stamp has settled (`stampIn` finished). Zine: capture `ZineShare`'s card; amounts appear only when "Show amounts" is on (it is off by default, `money-diary.tsx:37`). Add Save image + Share buttons to match the prototype markup; light impact haptic on press, success haptic after saving.
- Acceptance: the shared PNG is 3× and matches what is on screen, the CLOSED stamp and the grain are visible, the Skia sky is not blank. Compare with `design/renders/app/02-the-6pm-close.png` and the zine sheet.
- Undesigned (log in `docs/undesigned-states.md`): Photos access denied (toast plus Open Settings), share cancelled (nothing). Remove the "Close · Receipt Share · does nothing yet" row.

## L2: share extension (`SS:188-215`, guide `App:2856` row 0, edge state OCR FAILED `SS:320`)

- Input: plain text → lines. PDF → PDFKit page 1 text, or render page 1 at 2× and OCR. Image → downscale to ≤ 2000 px (the extension memory cap is about 120 MB), `VNRecognizeTextRequest` `.accurate`, languages = the entry of `supportedRecognitionLanguages()` that starts with `vi` (Apple has listed it as `vi-VT`) plus `en-US`. When there is no `vi`, use `en-US` with language correction off.
- `DomainBridge.shareCard` → SwiftUI card exactly as `SS:188-215`: kicker "Add to 6pm", "Read on this iPhone from your {Bank} receipt", 64 pt Bricolage amount, rows To/When/Code/Category, a dashed "help" chip and the "Not sure about the name. Tap it to check." line when `payeeSure` is false, then Edit and Confirm. Companion PNG from the group (bundled fallback). Colours from `ThemeTokens.swift`.
- Confirm writes `InboxItem{source: 'shared', status: 'caught', receipt: {bank, code, namingLines: numbersFree(lines)}}`, plays the success haptic and dismisses.
- App side: `enrich-shared.ts` calls `POST /api/name-merchant` only when no rule matched and `payeeSure` is false, with one 3 s attempt. Offline it keeps the read name.
- Worker route: device auth, rate limit, zod rejects any digit in the input, DeepSeek forced tool call `{merchant, category}` limited to the user's category names, a cost ledger row (`apps/api/src/ledger.ts`). Tests in `@cloudflare/vitest-pool-workers`: digits rejected, the schema enforced, the ledger written.
- Acceptance: a Vietcombank image shows its card in under 1.5 s; after Confirm and opening the app, the Inbox row reads "Shared receipt · Read from your Vietcombank receipt"; a pending QR payment of the same amount within 3 min merges ("Seen 2 ways"); sharing the same receipt twice keeps one spend (`isSameReceipt`); the spend lands on the right money day even if it is imported after 04:00.
- Undesigned: the Edit state (inline fields for amount, name, category picker), nothing readable (empty amount, Confirm disabled until typed), more than one page (page 1 only), the app never opened yet (no context file: categories come from the bundled defaults list in the domain).

## L3: intents, controls, capture guide (`SS:159-176`, `App:2856-2862`, guide markup `App:1094-1147`, render `app/24-capture-guide.png`)

- `LogSpendIntent` (intents extension): `amount: String` (required; a Wallet "Amount" or speech), `merchant: String?`. With a merchant it is source `applePay`, status `caught`; without one it is `voice`, `kept`. An unreadable amount from Wallet (`0.0` or blank are known) still logs a caught 0 ₫ item for the close to fix; from Siri it asks again via `needsValueError`. It returns quickly (Wallet triggers time out) and shows a snippet as `SS:169-176`: "Logged. Phở · Food" / "Safe today is now 200k" / 45.000₫.
- `AppShortcutsProvider`: "Log in ${applicationName}", "Scan QR in ${applicationName}", "Quick add in ${applicationName}". Siri has no Vietnamese, so spoken phrases are English. Titles are localized (en, vi) for the Shortcuts app.
- Controls (iOS 18): Scan QR and Quick add as `ControlWidgetButton`s using SF Symbols `qrcode.viewfinder` and `plus` (Control Center accepts only SF Symbols: log this), action → `OpenURLIntent(https://<host>/app/scan|quick-add)`. The Action button takes either the control or the App Shortcut.
- Capture guide sheet (5 sources, index from the Settings rows). The Wallet row shows "On · every tap" once an `applePay` spend exists, because iOS has no API to read automations (log this). "Open Shortcuts" opens `shortcuts://`. Settings "How spending gets caught" rows and the Widgets row open it.
- Tests: none in Swift; `logSpend` facade cases live in D. Jest: guide status derivation (`features/capture-guide/source-status.ts`).
- Acceptance: a real Apple Pay tap with the automation set to run immediately puts a caught item from "Apple Pay" in the Inbox on the next open; a repeated or declined double-fire keeps one (`isRepeatTap`); the Control Center and Action button open Scan in under 1 s.

## L4: voice (`App:1564-1589`, `2618-2630`, `3306-3318` Quick add; `App:1763-1765`, `2561-2573` close cash)

- `features/voice/use-dictation.ts` over expo-speech-recognition: locale `vi-VN`/`en-US` from the app language, `requiresOnDeviceRecognition: true`, `interimResults`, `contextualStrings` = category names + "k", "nghìn", "triệu". Hold to talk: press starts, release stops and runs `parseSpokenSpend`. The transcript streams live. Parsed chips [name, amount, category] spring in (prototype curve); selection haptic on start, light on parse.
- Before offering voice: `supportsOnDeviceRecognition()` and `getSupportedLocales()` for the language. **Founder default:** if Vietnamese is not available on the device, the Voice segment shows the undesigned line "Voice needs Vietnamese dictation on this iPhone" and the keypad stays; audio never goes to a server, so the copy "Understood on this iPhone" stays true.
- Close cash "Say it" adds the parsed item with source `voice` to the cash step.
- Tests: `features/voice/dictation-state.ts` reducer (idle → listening → parsed | nothing heard | no amount) in Jest. Parser cases are in D.
- Undesigned: microphone or speech permission denied, nothing heard, no amount found (Save stays disabled), language unavailable. Remove the two "hidden" voice rows from `docs/undesigned-states.md`.

## L5: widgets and Live Activity (`SS:39-58` lock, `SS:96-128` home, `SS:141-156` Dynamic Island, render `boards/6pm-surfaces-and-states.png`)

- `features/surfaces/surface-snapshot.ts` (pure, Jest): MoneySnapshot + look tokens + i18n → `SurfaceSnapshot`, with an entry now and one from the next 04:00 (domain `moneyDayOf`), and palettes per hour from `@6pm/theme`. Free: Golden Hour tokens; Max: the user's look; serious mode: serious tokens and no companion.
- `live-activity-plan.ts` (pure, Jest): running activities + pending `qr` spends of the money day → `{start, update, end}`. One activity, for the newest pending spend. It ends when the spend is kept, skipped, deleted or cancelled, or the day is closed. Starts happen only in the foreground.
- `use-surface-writers.ts`: debounced 1 s write of snapshot and context when they change, and on going to the background; companion PNGs (calm, happy at 24/40/44/46 pt @3×) rendered offscreen with Skia when the look, the Max form or serious mode changes.
- Swift widgets: `SafeToday` (small, medium with Scan QR / Quick add `Link`s, accessoryCircular ring "245k left", accessoryRectangular "6pm · Safe today · 2 pending") and `TodayList` (large, 3 rows + "+N more"). Timeline from `entries` plus hourly palettes; policy `.after` the next boundary.
- Live Activity `PendingPay`: lock banner (companion, "Waiting · tap when paid", "45.000₫ to Phở Hòa", Paid), compact (companion + "55k"), expanded as `SS:147-151`, minimal = companion. Paid = `MarkPaidIntent`; tapping elsewhere opens `/app/spend/<id>`. `Travel` (`SS:152-156`): the view and attributes ship now; the Travel lane starts it over the air.
- Acceptance: Scan → Not yet shows the lock banner and the island within 1 s; Paid ends it, and on the next open the spend is kept; the widget number equals Today's hero after any change and after 04:00 without opening the app; a look change redraws Max widgets only.
- Undesigned: set-up not finished ("Open 6pm to set up"), snapshot older than its last entry (last number + "Open 6pm"), Live Activities turned off (nothing), more than one pending payment (newest only), Travel on the lock screen (same layout as expanded), control glyphs.

## Merge order and the build

1. D merges first (bundle regenerated), then L1–L5 in any order, each green in CI (typecheck, lint, Vitest, Jest, `generate-native --check`).
2. Integration branch: simulator build `gh workflow run native-build.yml -f ref=v2 -f profile=e2e-test` must be green.
3. Rehearsal: signed `dev` build to 6pm Dev (`-f profile=dev -f submit=true`). This proves 3 extension profiles, the App Group, Sign in with Apple and Time Sensitive.
4. `git tag testflight/2.0.0-native && git push origin --tags` → prd TestFlight.

## TestFlight verification order (each step depends on the one above)

1. Install over the previous TestFlight build: every day, pot and backup is still there (the key and the database did not move).
2. Share the receipt and the money diary (Messages, Photos save), with amounts off and on.
3. Voice in en and vi on a device with on-device dictation; one without it shows the fallback.
4. Share extension: MB, Vietcombank, MoMo images, one PDF, one text share; OCR FAILED path; airplane mode.
5. Inbox import and merge: QR Not yet + the same receipt shared → "Seen 2 ways"; the same receipt again → no duplicate.
6. Live Activity: Scan → Not yet → lock + island → Paid → open the app → kept.
7. Widgets: small, medium, large, both lock-screen sizes; Golden Hour as free, a paid look as Max, serious mode; tomorrow after 04:00.
8. Controls in Control Center and the Action button; App Shortcut from Spotlight.
9. Wallet automation with a real Apple Pay tap (run immediately); Siri "Log in 6pm" in English.
10. Sign in with Apple sheet opens from the dev entry (Budget together ships over the air).

## After the build, over the air (native already declared)

Export CSV (`expo-sharing`), Year book PDF (`expo-print`, `App:382-519`), Travel (`expo-location` + the Travel activity; **FX provider open**), Receipt email (API; push optional), Max companion form, Budget together (`expo-apple-authentication`, D1 shared ledger; **account model and revocation key open**, `App:377`). Each gets its own lane plan when its gate clears.
