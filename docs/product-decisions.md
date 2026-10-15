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
| Domain | No dedicated domain. Everything lives on `6pm.oddeggs.studio`: website at `/`, API at `/api/*`, receipt email `receipts+{handle}@6pm.oddeggs.studio`. Dev: `6pm-dev.oddeggs.studio` |
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
| M8a | **Starter categories.** A new install starts with ten: Food, Drinks, Transport, Groceries, Shopping, Fun, Health, Home, Family, Gifts (vi: Ăn uống, Đồ uống, Đi lại, Đi chợ, Mua sắm, Giải trí, Sức khỏe, Nhà cửa, Gia đình, Quà tặng). Bills and rent stay in the plan's Bills, not a category, so they are not counted twice. They are seeded only when an install has no categories, so an install that already has its own keeps them as they are and gains none. Founder request 2026-10-14 |
| M8b | **Category icon follows its name.** While a category is named in the editor, its icon is chosen for it: the phone's own word match first (English and Vietnamese, accents optional, works offline), then, after a pause in the typing and only when the phone found nothing, `POST /v1/category-icon`, where Jev (DeepSeek's fast tier when Jev does not answer) picks one icon from the icons the person may use. Only the name and the icon list are sent. An icon the person picks by hand is never replaced, and renaming an existing category changes its icon only while it still wears the icon its old name pointed to. Founder request 2026-10-14 |
| M9 | **Duplicates.** Same amount, different capture sources (QR, shared receipt, email, Apple Pay), within 3 minutes → merged into one item with a source trail ("Seen 2 ways"). Something the user typed (Quick add, voice, cash) is never merged with anything. Cancelling a scanned payment takes back only the scan's own sighting |
| M10 | **Work spends.** The close asks once a day, about the largest waiting spend of 100.000₫ or more read from a bank receipt or email *(default)*. Marked "for work" in the close → Claim back, excluded from the daily number |
| M11 | Rounding: daily lines floor to 1.000₫; pot set-asides ceil to 50.000₫; formatting per design (dot thousands, `₫`, U+2212 minus, `tr`/`k` short forms) |

## 4. Capture

| Source | Decision |
|---|---|
| Share to 6pm | iOS share extension. Bank receipt image/PDF read **on the phone** first (Apple Vision OCR + the domain parser). When the parser is not sure of the total or the currency, the phone sends the receipt photo once to `POST /api/v1/receipts/read`, where Anthropic's vision model reads the total, currency, shop and time; code turns the printed total into an amount. That photo is the only receipt image that leaves the phone: it goes to Anthropic only, is never stored or logged by 6pm, and only the token counts reach the cost ledger. Offline, or when the server has no reading, the phone keeps its own reading. A small model call (server, numbers-free line ids) still names the merchant and category when the rule table cannot. Founder, 2026-10-14; if on-phone reading proves unreliable the route can serve vision-first unchanged |
| VietQR | Parsed on the phone (EMVCo TLV, NAPAS 247). Pay hands off to the chosen bank app by its URL scheme, with the amount on the clipboard; on return, "Did it go through?" Pending items show a Live Activity |
| Receipt email | `receipts+{handle}@6pm.oddeggs.studio` via Cloudflare Email Routing (one address rule per host; subdomains have no catch-all, so the handle rides after `+`) → Worker. Parsed server-side, held encrypted until the phone fetches it, then deleted. Disclosed in Privacy |
| VietQR edge cases | A clearly foreign QR (PromptPay, PayNow, DuitNow, KHQR) reads as "abroad" even with a non-standard format byte; a NAPAS merchant QR (no account a person can type) offers "Pay in your bank app" with the amount copied instead of the wallet picker; a QR with no service code is read as a transfer to an account *(defaults)* |
| Bank hand-off | Opens the bank app by URL scheme (31 banks, from the list Zalo's "pay in a bank app" uses). A bank seen to take 6pm's transfer link (`<scheme>applink?targetPage=QRPay&qrContent=<VietQR>`; MB so far) opens with account, amount and note filled in; the others open at their home. A bank joins the filled-in list only after the link is tried on a real phone. The amount is on the clipboard either way. Vietcombank and Agribank take only a partner-issued token, so they open at their home. No bank returns to 6pm by itself; "Did it go through?" asks on return. Opening does not ask iOS first (`canOpenURL` is deprecated and capped at 25 apps); a failed open goes to the App Store. MoMo, ZaloPay and ViettelMoney have no link: 6pm says "open it yourself", amount copied |
| Apple Pay | App Intent "Log in 6pm" for a Wallet Shortcuts automation |
| Voice | On-device speech (Apple) first; VI/EN amount parser in the domain package (k, nghìn, tr, triệu, rưỡi) |
| Android bank notifications | Kept in design, built after iPhone launch |

## 5. Money and features behind 6pm Max

| Decision | Value |
|---|---|
| Free | Basic and Golden Hour looks, the close, all capture, Today/Plan/Diary, Budget together (shared pots; free since 2026-10-14), 3 Ask questions a week, 1 own pot, 36 icons, functional widgets and controls, the sun companion and three more to pick from (Nhang, Bánh Bao, Giọt) *(decided 2026-10-14)* |
| Looks | 6 classic looks 49.000₫ each; 3 living scenes 99.000₫ each; one-time, via StoreKit (RevenueCat). The "all looks" bundle is dropped (Max replaces it) |
| 6pm Max | 78.000₫/month or 598.000₫/year, 7-day trial. Every look, unlimited Ask and pots, Travel mode, Year book, encrypted backup and export, widgets in your look, 180 icons, Max companion form and the Hạc Giấy companion *(decided 2026-10-14)* |
| Widgets | Functional widgets and controls are free; widgets drawn in your look are Max *(default)* |
| Prices | Read from the store at runtime; the design's prices are the App Store tiers to configure |
| Max promises | Every Max feature on the sheet and welcome is built before launch (Ask, Travel, Year book, widgets in your look, export, Max companion form). Decided 2026-10-11 |

## 6. Ask 6pm, backup, travel, together

| Feature | Decision |
|---|---|
| Ask 6pm | Code decides, words come from a model. The phone computes every number (domain `ask` engine, as in the prototype); the server model only reads the question into an intent + amount and words the answer. Offline: rules-only answers *(default)* |
| Backup | End-to-end encrypted snapshot: key in iCloud Keychain, ciphertext on our server under an anonymous token (Scootch pattern). Max |
| Travel | FX rates from a free daily source cached on the server (must include VND). Frankfurter v2 (multi-source, quotes VND; the ECB-only v1 does not), fetched by a Worker cron *(decided 2026-10-12, see tech-decisions)* |
| Budget together | **Shared pots** at launch: Sign in with Apple, invite one partner by link, one or more pots both partners add to, synced through the API. Either partner can leave; leaving deletes the shared copy from the server, and each keeps the money they themselves put in as history on their own phone. Sharing the whole month and closing the day as two come later, over the air. Free for everyone (founder, 2026-10-14; it was a Max feature at first). The core app stays account-free: sign-in is asked only when someone starts or joins Budget together. Decided 2026-10-13. Defaults: joining from an invite needs no Max of one's own; an invite link works once, for 7 days; a pair is two people, a person is in one pair; either partner can edit or delete any shared pot and take back only their own money; what a person puts in counts like a top-up to their own pots in the daily number; only the first name is asked for, never the email *(default)* |
| Serious mode | User switch. Offered (once a week at most) when free money goes negative or 3 of the last 7 days overspent *(default)*. Debt-advice link target **open** |
| Year book | Digital (PDF/image) first; print vendor **open** |
| Close time | 15:00–23:45 in 15-minute steps everywhere (onboarding wheel and Settings) |
| Companions | Six to pick from in Settings → Companion: the sun (default), the Max form, and four more, each with its own look, personality and moves. Free: Nhang (incense sticks for hair, whose smoke curls into hearts, question marks and Zs: the friend's "incense sticks" reading of the three hair lines), Bánh Bao (a steamed bun that squashes, jiggles and steams) and Giọt (a raindrop that wobbles, ripples, splits in two when happy and melts into a puddle asleep). Max: Hạc Giấy (a red paper crane that folds between moods and unfolds from a square when chosen). A pick overrides the automatic form (members wear the Max form until they pick); a non-member cannot wear a Max-only one, and when Max ends a Max-only pick falls back to the last free pick, as looks fall back to Golden Hour. Every companion is also a Home Screen icon, switched on by "App icon follows my companion"; a Max-only icon goes back to the app's own when Max ends. Serious mode still hides the companion. Founder request 2026-10-14 |

## Open (founder)

1. Debt-advice partner/link for serious mode.
2. Year book print vendor.
3. Apple team and RevenueCat project that own `ai.sixpm.app` (needed before the first signed build).
