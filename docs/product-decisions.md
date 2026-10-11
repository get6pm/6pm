# 6pm v2: product decisions

Decided 10 Oct 2026 unless marked **open**. Change one only with the founder's say-so, and record the change here.
Source of truth for screens, copy and motion is the prototype in `design/prototype/` (inventory: `plans/reports/design-inventory-261010-1732-6pm-v2-prototype-report.md`). Where the prototype contradicts itself or fakes behaviour, this file decides. Defaults below marked *(default)* were chosen by engineering and await founder review.

## 1. What 6pm is

A daily money ritual. Spending is caught all day (shared bank receipts, VietQR scans, forwarded emails, Apple Pay taps, voice, keypad). At the close time (default 18:00) the user swipes through the day in about a minute and wakes up to **one number: safe to spend today**. Pay future you first; everything else is free money split across the days to payday.

Rules that never bend:
- The close, capture and privacy are free forever. Money is never moved by 6pm; it only counts.
- One number. Every screen serves the daily number or the close.
- The companion never shames. Serious mode removes jokes, colour and the companion.
- Native feel first: every transition, gesture and colour matches the prototype; nothing janky ships.

## 2. Identity and scope

| Decision | Value |
|---|---|
| Store listing | Update to the existing App Store app `ai.sixpm.app` (dev build `ai.sixpm.app.dev`) |
| v1 users | Fresh start. v1 is retired; no import, no migration code |
| Code | `get6pm/6pm`, orphan branch `v2`, replaces `main` at launch |
| Launch | Fri 6 Nov 2026, 18:00 ICT (Coming Soon page countdown) |
| Domain | No dedicated domain. Everything lives on `6pm.oddeggs.studio`: website at `/`, API at `/api/*`, receipt email `{handle}@6pm.oddeggs.studio`. Dev: `6pm-dev.oddeggs.studio` |
| Platforms | iPhone at launch. Android is built and kept green in CI, not released *(default)* |
| Languages | English and Vietnamese from the first screen; device language, switchable in Settings |
| Currency | VND home currency (integers, no decimals). USD entry in Quick add; Travel mode for other currencies |

## 3. Money rules (the domain package implements these, with tests)

| # | Decision |
|---|---|
| M1 | **Unconfirmed spends count.** Caught and pending items reduce today's number until skipped (the number stays honest). The capture-guide line "Nothing counts until you say so" becomes "Nothing is final until you say so" *(default)* |
| M2 | **Days divisor.** `daysLeft` = calendar days from tomorrow through payday (prototype: 9 Oct → 31 Oct = 22). Today's line = startFree ÷ (daysLeft + 1); tomorrow = free ÷ daysLeft. Onboarding uses the same engine, not ÷30/÷31 |
| M2a | **Joining mid-cycle.** In the pay cycle the user set 6pm up in, only the days left of it count: the cycle's free money (income − bills − Future you − occasions) is scaled by days from the set-up day through payday ÷ days in the cycle, as if the rest went at the average rate. Bills and Future you stay whole. Every later cycle is whole. Decided 2026-10-11 |
| M3 | **Payday.** Same day each month (clamped to month length), last day of month, or "it varies" (user confirms each payday; until then the cycle is calendar month) |
| M4 | **Occasions (pots).** Each pot has a monthly set-aside = ceil((goal − have) ÷ monthsLeft ÷ 50k) × 50k. OCC = Σ pot set-asides, so a new pot does change the daily number, as the copy promises |
| M5 | **What-if slider** commits Future you on release and the note shows the real change in the daily number (prototype note bug fixed) |
| M6 | **Late items** (caught after the close) reduce the next day's start. **The money day ends at 04:00 everywhere**: before 04:00, Today, the close, the Diary and every capture still belong to the previous day. Decided 2026-10-11 |
| M1a | **Earlier waiting items** (caught or pending from a day already past) join tonight's close and Today's Inbox count, so nothing that counts is ever out of reach. Such an item already counted in the pay cycle it was caught in (M1), so it is listed but never lowers the new cycle's number a second time. Decided 2026-10-11 |
| M7 | **Missed day.** Closing a missed day confirms its items; they were already counted under M1 |
| M8 | **Merchant rules** apply to every new capture (merchant → category). Categories have no limits; `daily: false` excludes a category from the daily number |
| M9 | **Duplicates.** Same amount, different capture sources (QR, shared receipt, email, Apple Pay), within 3 minutes → merged into one item with a source trail ("Seen 2 ways"). Something the user typed (Quick add, voice, cash) is never merged with anything. Cancelling a scanned payment takes back only the scan's own sighting |
| M10 | **Work spends.** The close asks once a day, about the largest waiting spend of 100.000₫ or more read from a bank receipt or email *(default)*. Marked "for work" in the close → Claim back, excluded from the daily number |
| M11 | Rounding: daily lines floor to 1.000₫; pot set-asides ceil to 50.000₫; formatting per design (dot thousands, `₫`, U+2212 minus, `tr`/`k` short forms) |

## 4. Capture

| Source | Decision |
|---|---|
| Share to 6pm | iOS share extension. Bank receipt image/PDF read **on the phone** (Apple Vision OCR). A small model call (server, numbers-free line ids) only names the merchant and category when the rule table cannot |
| VietQR | Parsed on the phone (EMVCo TLV, NAPAS 247). Pay hands off to the chosen bank app by its URL scheme, with the amount on the clipboard; on return, "Did it go through?" Pending items show a Live Activity |
| Receipt email | `{handle}@6pm.oddeggs.studio` via Cloudflare Email Routing → Worker. Parsed server-side, held encrypted until the phone fetches it, then deleted. Disclosed in Privacy |
| VietQR edge cases | A clearly foreign QR (PromptPay, PayNow, DuitNow, KHQR) reads as "abroad" even with a non-standard format byte; a NAPAS merchant QR (no account a person can type) offers "Pay in your bank app" with the amount copied instead of the wallet picker; a QR with no service code is read as a transfer to an account *(defaults)* |
| Bank hand-off | Opens the bank app by its published VietQR link (16 banks); none can pre-fill the amount, so the amount is on the clipboard. Sacombank, MSB, MoMo, ZaloPay and ViettelMoney have no published link: 6pm says "open it yourself", amount copied |
| Apple Pay | App Intent "Log in 6pm" for a Wallet Shortcuts automation |
| Voice | On-device speech (Apple) first; VI/EN amount parser in the domain package (k, nghìn, tr, triệu, rưỡi) |
| Android bank notifications | Kept in design, built after iPhone launch |

## 5. Money and features behind 6pm Max

| Decision | Value |
|---|---|
| Free | Basic and Golden Hour looks, the close, all capture, Today/Plan/Diary, 3 Ask questions a week, 1 own pot, 36 icons, functional widgets and controls |
| Looks | 6 classic looks 49.000₫ each; 3 living scenes 99.000₫ each; one-time, via StoreKit (RevenueCat). The "all looks" bundle is dropped (Max replaces it) |
| 6pm Max | 78.000₫/month or 598.000₫/year, 7-day trial. Every look, unlimited Ask and pots, Budget together, Travel mode, Year book, encrypted backup and export, widgets in your look, 180 icons, Max companion form |
| Widgets | Functional widgets and controls are free; widgets drawn in your look are Max *(default)* |
| Prices | Read from the store at runtime; the design's prices are the App Store tiers to configure |
| Max promises | Every Max feature on the sheet and welcome is built before launch (Ask, Budget together, Travel, Year book, widgets in your look, export, Max companion form). Decided 2026-10-11 |

## 6. Ask 6pm, backup, travel, together

| Feature | Decision |
|---|---|
| Ask 6pm | Code decides, words come from a model. The phone computes every number (domain `ask` engine, as in the prototype); the server model only reads the question into an intent + amount and words the answer. Offline: rules-only answers *(default)* |
| Backup | End-to-end encrypted snapshot: key in iCloud Keychain, ciphertext on our server under an anonymous token (Scootch pattern). Max |
| Travel | FX rates from a free daily source cached on the server (must include VND; ECB/Frankfurter does not) *(provider **open**)* |
| Budget together | Sign in with Apple, one shared ledger per pair on the server. Built after launch scope is green *(default)* |
| Serious mode | User switch. Offered (once a week at most) when free money goes negative or 3 of the last 7 days overspent *(default)*. Debt-advice link target **open** |
| Year book | Digital (PDF/image) first; print vendor **open** |
| Close time | 15:00–23:45 in 15-minute steps everywhere (onboarding wheel and Settings) |

## Open (founder)

1. FX provider for Travel (needs VND).
2. Debt-advice partner/link for serious mode.
3. Year book print vendor.
4. Apple team and RevenueCat project that own `ai.sixpm.app` (needed before the first signed build).
