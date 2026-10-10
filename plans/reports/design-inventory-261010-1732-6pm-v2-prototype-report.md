# 6pm v2 prototype: design inventory (for the Expo RN build)

Source: `/Users/quocs/Projects/6pm/design/prototype/` (read-only). Citations look like `App:2042`, meaning `6pm App.dc.html` line 2042. Other prefixes: `OB1` = `6pm Onboarding.dc.html`, `OB2` = `6pm Onboarding v2.dc.html`, `SS` = `6pm Surfaces and States.dc.html`, `CS` = `6pm 2.0 Coming Soon.dc.html`, `WH` = `Wheel.dc.html`, `CJ` = `companion.js`.
App file layout: template markup runs 9–1985, the logic class 1986–3373. The logic splits into `seed` 1992, `calc` 2042, `palette` 2058, `themes` 2097, `atm` 2253, `maxVals`/`looksVals` 2394/2426, `line` 2486, `pd` 2697 (Plan, Diary, Settings values), `capture` 2847, `gest` 2989, `extra` 3031 (mostly stale, see §12), and `renderVals` 3124.
Prototype "now" is fixed at **Fri 9 Oct 2026**, payday **31 Oct**, so 22 days are left after today (`App:1989`, `App:264`).

---

## 1. Product concept

- 6pm is a daily money ritual. Spending gets **caught** in the background all day: shared bank receipts, VietQR scans, forwarded emails, voice, manual entry and Apple Pay taps.
- At the user's **close time (default 18:00)** a "Close your day" ritual (≈60 s) runs. You swipe through what was caught (keep / edit / not mine), add cash, answer at most one question, get a printed **daily receipt**, then see the **reveal**: "Safe to spend tomorrow".
- The plan is "pay yourself first". Income minus bills, Future you (savings), Occasions (sinking funds) and spend so far gives **Free money**, split evenly across the days left to payday. That yields **one number** each day.
- Closed days build a **Diary**: a calendar of receipts, weekly recaps and monthly "Money diary" zines.
- A companion (a little sun, "dusk-buddy") comments in 3 personalities. **Serious mode** strips the jokes and the colour.
- Monetisation: cosmetic **Looks** (animated time-of-day themes) sold one by one, plus a **6pm Max** subscription. The close, capture and privacy stay free (`App:1042`).

Core loop: capture (passive) → Inbox (review queue) → 6pm Close → receipt and reveal → Diary. Plan feeds the daily number.

---

## 2. Navigation map

### 2.1 Shell
| Element | Detail | Cite |
|---|---|---|
| Tabs | `today` (icon wb_twilight), `plan` (donut_large), `diary` (auto_stories). Switch by tap, horizontal page swipe (±70 px) or by scrubbing along the tab bar. Tapping the active tab scrolls to top | `App:543-555`, `App:2911`, `App:2929-2985`, `App:2998` |
| FAB | `qr_code_scanner`. Tap opens Scan. **Long-press 480 ms opens Quick add** | `App:554`, `App:2986-2988` |
| Condensing bars | After scrolling past 80 px, a downward scroll minimises the tab bar (64→52 px). A sticky top nav appears after y > 250 (Today) or > 40 (others). On Today it shows a mini hero, the Close day/Resume CTA and +. On Plan it shows section chips Overview/Bills/Future you/Occasions | `App:2915-2925`, `App:3000-3005`, `App:521-541` |
| Dynamic Island | 3 states. Idle 126×37. Compact Live Activity 206×37 ("55k"). Expanded Live Activity or companion toast 374×80. Toasts last 3 s | `App:1904-1928`, `App:3216`, `App:2524` |
| Sheets | Bottom sheets with drag-to-dismiss (>120 px or a fast flick). The `data-dismiss` kind is sheet, quick, pot, cat or edit | `App:2966-2978` |
| Undo toast | "Deleted X · Undo", 5 s | `App:557-563`, `App:3020-3026` |
| Dev side panel (not product) | Time-of-day slider 6–23.95, presets, "Jump to" list, "In-between states" list, gesture cheat sheet | `App:1945-1983`, `App:3248-3276` |

### 2.2 Screens (full-screen `screen` state)
| id | Purpose | Entry | Key elements / actions | States | Cite |
|---|---|---|---|---|---|
| `home` + tab `today` | Today dashboard | default | Header (weekday, date, MAX badge, Travel pill "Bangkok · ฿ with ₫ underneath", buttons `tune`→Settings and `add`→Quick add). **Hero** "Safe to spend today|tomorrow" odometer; tap goes to Plan. Meter bar (left/right labels). Companion bubble; tap opens Ask. **Tonight card** (icon, title, sub, CTA Start the close / Close early / Resume the close). CLOSED stamp row once closed. **Week strip** M–S (5–11 Oct), tapping a day opens the diary day, the close (today) or the Missed sheet. "Today" list: Inbox row "N waiting in Inbox" first, then rows (latest 4; Show all N). October pace card (title, used-vs-time bars, 3 pots Bills/Future you/Free) | before close / at six / paused / late (≥ max(close+2h, 20:30)) / closed / overspend (safe<0) / zero (empty list "Nothing caught yet…") / serious | `App:122-261`, `App:3135-3300` |
| `home` + tab `plan` | Monthly plan | tab | Header "October · payday 31 Oct" + lede. **Overview**: "money river" stacked bar Bills/Future you/Occasions/Spent/Free; tap a segment to select it. **Daily** number + 22 day bars + **What-if slider** (Future you 0–4tr, step 250k). **Bills** timeline + list with paid toggles. **Future you**: auto-save card, goals with ring, +100k. **Occasions**: jar cards with +100k, "New pot" (Max-gated after 1), "Budget together" (Max) | Bill paid/unpaid; goal On track/Behind/Paused/Reached; pot Full | `App:262-381`, `App:2697-2799` |
| `home` + tab `diary` | History | tab | Header "N closed in October · M in all". **Week recap** 3-page card (swipe or tap): P0 "You skipped 3 Grab rides home, so 150k went to Future you.", P1 total + bars vs daily line, P2 "Where it went". **Calendar** (Oct, Monday start, 35 cells): closed cell = paper tile + total + green/orange dot (≤ / > daily line); today dashed "6pm" opens the close; past unclosed = "missed". **Day receipt** for the selected day. **Ask 6pm** entry with 3 preview chips. **Spotted** card ("Looks monthly: Spotify 59k", Track/No). **Money diaries** (Oct in progress "Binds 1 Nov"; Sep, Aug clickable). **Year book** (Max) | | `App:382-519`, `App:2735-2836` |
| `close` | The 6pm Close ritual | Tonight CTA, nav CTA, week strip today, calendar today | 5-step flow (§5.6). X = pause (leaveClose) | cards / sorted / cash (or "sweep" when nothing caught) / question / receipt / reveal | `App:1678-1902`, `App:2550-2589` |
| `quick` | Manual / voice add | header +, nav +, FAB long-press, "Type it instead" | Ticket ("6pm · Nº 007 · Fri 9 Oct · hh:mm"), amount, hint, category tiles (time-predicted first), wallet Cash/MB Bank/MoMo, note, Keypad\|Voice segment, keypad, Save | keys / voice listening / parsed / USD mode | `App:1508-1589`, `App:2380-2391`, `App:2591-2630` |
| `scan` | VietQR scan-to-pay | FAB tap, guide "Scan now" | phases camera → preview → handoff → return; plus `unreadable` | camera, preview, handoff, return, unreadable | `App:1590-1677`, `App:2632-2652` |
| `ask` | "Ask 6pm" chat | companion bubble, diary entry, Max welcome | Empty state with "Try" suggestions; bubbles with optional before/after bar viz + key/value rows + note; typing dots; free meter "N of 3 free questions left this week"; when locked: "That’s this week’s 3 questions… Get Max" | empty, typing, answered, locked | `App:1442-1507`, `App:2668-2696` |

### 2.3 Sheets (`sheet` state)
| id | Purpose / entry | Key elements, actions | Cite |
|---|---|---|---|
| `inbox` | Review queue. Entry: Today inbox row | Sections "Today · Friday" (caught + pending) and "Thursday · after you closed" (yesterday caught). Each row: icon, name, meta "hh:mm · src · pending", "Seen 2 ways" expander showing the source trail, ✓ keep. Footer "Confirm all N" / "Or go through them one by one at 6pm." Empty: "All caught up." | `App:565-649`, `App:3038-3063` |
| `detail` | Transaction detail. Entry: tap a row | Icon, name, "Friday 9 Oct · hh:mm", amount, FX line (USD). Category chips + Edit (opens Categories). **Rule prompt** "Always file X as Y?" Once/Always. Fields: Pot (Free money ⇄ Claim back), Paid with (cycles Cash→MB Bank→Vietcombank→MoMo), Status. Note input, receipt photo toggle, **Source trail**, **History**, Delete ("You can undo for a few seconds.") | `App:650-713`, `App:3064-3070`, `App:2839-2842`, `App:2902-2903` |
| `settings` | Entry: header `tune` | Max card (member or "Try 6pm Max free"). **Your companion**: quote preview, Soft/Cheeky/Roast, Serious mode switch. **How spending gets caught** ("4 of 5 on" + fix banner "Catch Apple Pay taps too" → guide). **Look** (current look + variant → Looks). **Your day**: Categories, Close time (cycles 17:30/18:00/18:30/19:00/21:00), Language (English⇄Tiếng Việt), Home currency (VND ₫⇄USD $), Widgets (Max), Travel mode (Max, "Turns on by itself abroad"). **Your data**: Backup (Max), Privacy (expands copy), Export (Max). Delete all data (tap twice within 3 s). "Version 1.0" | `App:714-856`, `App:2784-2810`, `App:2843-2844` |
| `guide` | Capture-source guide (index 0–4). Entry: Settings source rows | Icon, status pill, headline, "How it works" + time, 3 numbered steps, "What lands in your Inbox" preview card, tip, CTA | `App:1094-1147`, `App:2856-2867` |
| `cats` | Categories and learned rules. Entry: Settings, Detail Edit | Category list (stats, "Not daily" badge), New category, "Learned from you" rules (merchant → cat, "Learned from n times"/"You set this", ✕) | `App:1148-1198`, `App:2895-2901` |
| (cat edit modal) | `catEdit` | Name, icon picker by **8 packs** (Essentials free, 7 Max-locked), 8 hues, "Counts toward your daily number" switch, Delete ("its spends move to X") | `App:1199-1245`, `App:2872-2874` |
| (new pot modal) | `newPot`. Entry: Plan → New pot | Name + icon/hue picker, templates, Goal ±500k, "Needed by" month stepper, summary, "Start this pot" | `App:1246-1308`, `App:2876-2889`, `App:2904-2906` |
| `missed` | Missed-day catch-up. Entry: week strip or calendar past day | "WED 07 OCT · NOT CLOSED", "This one slipped by. It happens.", 3 caught rows, "Close Wednesday · 190k" / "Not now" | `App:1309-1338`, `App:2786-2787` |
| `zine` | Monthly Money Diary (Sep/Aug) | Headline, 4 stats, Where it went, Quietest/Biggest day, grid of every closed day, handwritten note, share card with "Show amounts" (off by default), Save image / Share | `App:1339-1441`, `App:2769-2774`, `App:2836` |
| `themes` | Looks shop. Entry: Settings → Look | Max promo card, grid of look cards (live sky preview + "Safe today" + badge), Restore purchases | `App:857-912`, `App:2426-2461` |
| `look` | Try-on of a look (`tryOn`). The whole app re-renders in it | "Trying on X" banner, prev/next "n of 11", variants (palette swatches), intensity slider `kName`, 2 effect toggles, CTA Use/Keep/Buy for X, "or unlock every look with 6pm Max" | `App:914-969`, `App:2462-2474` |
| `max` | Max paywall (contextual `maxFrom`) | Headline per source, feature tiles (source tile highlighted first), yearly/monthly plan picker, "Start 7 days free", terms, Restore/Terms/Privacy. Member: "Manage subscription" | `App:992-1068`, `App:2394-2425` |
| (buy overlay) | `buy {id, phase}` | App Store–style confirm sheet: name, sub, kind, price, "Confirm with Face ID" → "Confirming…" → "It’s yours", footnote | `App:970-991`, `App:2475-2482`, `App:2207-2221` |
| (Max welcome) | `maxWelcome` | Confetti (42 pieces), "Welcome to Max.", companion evolves to Max form after 900 ms, 6 "wins", contextual CTA, "Back to my day" | `App:1069-1093`, `App:2402-2418` |
| (edit card modal) | `editing`, inside the close | Name, −5k / amount / +5k, category chips, "Save and keep" | `App:1881-1900`, `App:3355-3363` |

### 2.4 Modes
| Mode | Where | Cite |
|---|---|---|
| `keys` / `voice` | Quick add: segmented Keypad / Voice. Voice = hold mic, live transcript, parsed chips [name, amount, category] | `App:2618-2630`, `App:3306-3318` |
| cash listen | Close cash step: "Say it" mic | `App:2561-2573` |
| Travel | Settings switch (Max). Home pill. SS Live Activity "Bangkok · today ฿560 left" | `App:130`, `App:3083`, `SS:153` |
| Serious | Settings switch or the `serious` prop (§6) | `App:2910` |

---

## 3. Domain model (TypeScript-ish)

```ts
type Vnd = number;               // integer đồng, never fractional
type HHMM = string;              // 'HH:MM' local (Asia/Saigon)
type Source = 'Manual'|'Shared'|'QR'|'Email'|'Voice'|'Cash'|'ApplePay'; // ApplePay only implied by guide copy (App:2860)
type Status = 'caught'   // auto-captured, waiting for review
            | 'pending'  // QR paid-later, unknown if it went through
            | 'ok'       // confirmed / kept
            | 'skipped'  // "Not mine" (row stays visible, struck through)
            | 'deleted'; // soft delete, undo restores `prev`

interface Txn {                  // seed App:1993-2003; created App:2557, 2611, 2639
  id: string; t: HHMM; name: string; cat: string /* Category.name */; amt: Vnd;
  src: Source; status: Status;
  meta?: string;                 // "Read from your MB Bank receipt", "From name@6pm..."
  seen?: string;                 // dedupe label "Seen 2 ways · QR + email"
  ask?: boolean;                 // close asks "Was this one for work?"
  work?: boolean;                // Claim back: excluded from spend
  cash?: boolean;                // added in close cash step
  wallet?: 'Cash'|'MB Bank'|'Vietcombank'|'Techcombank'|'MoMo';  // else derived (App:3049)
  edited?: string;               // history line, e.g. "Edited in the close · 18:07"
  prev?: Status;                 // for undo
  note?: string; photo?: boolean; // detail sheet
  fx?: { cur:'USD'; amount:number; rate:number } // prototype encodes in name "X · $3.5" and a fixed 25.400 rate (App:2600, 3067)
}
interface LateTxn extends Txn {} // `yesterday[]`: caught after the previous close (App:2011); confirming counts it in `late`

interface Category { name: string; icon: string /*Material Symbol*/; h: number /*OKLCH hue*/; daily: boolean } // App:2009
// default: Food restaurant 45 · Drinks local_cafe 25 · Transport two_wheeler 245 · Groceries shopping_basket 140 · Shopping local_mall 300 · Gifts redeem 350
// daily=false ⇒ excluded from spend ("Counts toward your daily number", App:1234). No per-category limits exist.

interface MerchantRule { m: string /*merchant name*/; cat: string; n: number /*times learned, 0 = user set*/ } // App:2010

interface Bill { id; icon; name; amt: Vnd; dueDay: number; paidDefault: boolean; h: number } // BL App:2664
// rent 3.5tr d1 paid · phone Viettel 100k d3 paid · Internet FPT 220k d12 · Electricity EVN 380k d15 (sum 4.2tr = BILLS)
interface Goal { name; have: Vnd; goal: Vnd; share: number /*of save*/; by?: 'Mar'|null } // G App:2729 (Japan 3.6/6tr .6 Mar; Rainy-day 5/15tr .4)
interface Pot  { name; have: Vnd; goal: Vnd; when: string; icon; h; mLeft?: number /*months*/ } // OC0 App:2731 + extraPots
interface Plan {                 // constants App:1988-1989
  INCOME: 17_400_000; BILLS: 4_200_000; OCC: 750_000 /*monthly occasions set-aside*/;
  BEFORE: 2_365_000 /*spent 1–8 Oct*/; DAYS: 22 /*days after today to payday*/;
  planSave: Vnd /*Future you, default 2tr, slider 0–4tr*/; goalAdd: Vnd[]; occAdd: Record<potName,Vnd>;
  payday: 31; billsPaid: Record<billId,boolean>;
}
interface Settings { closeAt: HHMM /*'18:00'*/; lang:'English'|'Tiếng Việt'; cur:'VND ₫'|'USD $';
  persona: 'Soft'|'Cheeky'|'Roast' /*default Cheeky*/; serious: boolean; travel: boolean;
  backup: boolean; walletOn: boolean /*Apple Pay Shortcuts automation*/ }
interface DayRecord { day: number; closedAt: HHMM|'LATE'; note: string; rows: [HHMM,string,Vnd][] } // DD App:2735
interface MonthZine { short; no; days; closed; miss: number[]; spent; plan; fy; under; run; headline; note; places; quiet; big } // Z App:2769
interface ThemeCfg { v: number /*variant idx*/; k: number /*0–100, default 70*/; [toggleKey: string]: boolean|number } // cfgOf App:2202
interface Entitlements { owned: ThemeId[]; max: boolean; maxPlan:'year'|'month'; askUsed: number /*per week*/; extraPots: Pot[] }
interface ClosePause { step: 'cards'|'cash'|'question'|'receipt' }
```
Runtime-only state: `closed, closedAt, closeIds` (snapshot of the queue at open), `closeTotal`, `step`, `sweep`, `asked`, `live {id, expanded}` (Live Activity), `scan {phase, wallet}`, `qa {digits, cat, wallet, mode, cur, listening, transcript, parsed, note}`, `chat[]` (`App:2004-2012`).

---

## 4. Money math, formatting, time rules

### 4.1 `calc()` exactly (`App:2042-2054`)
```
nd     = categories with daily === false
spent  = Σ amt of today's items where status ∉ {skipped, deleted} AND !work AND cat ∉ nd
         // NOTE: includes 'caught' and 'pending' (unconfirmed) items
late   = Σ amt of yesterday[] with status 'ok'
gm     = Σ goalAdd     om = Σ occAdd     save = planSave ?? 2_000_000
startFree = INCOME − BILLS − save − OCC − BEFORE − gm − om − late
base   = floor(startFree / (DAYS + 1) / 1000) * 1000      // today's line, today counted
free   = startFree − spent
safe   = base − spent                                      // hero today (shown as max(0,safe))
tomorrow = max(0, floor(free / DAYS / 1000) * 1000)        // reveal / tomorrow
```
Seed check (Normal): startFree 8.085.000 → base 351k, spent 302k, safe **49.000**, tomorrow **353k**. This matches screenshot `screenshots/01-v3.jpg`.
`replan = tomorrow < base` (`App:3132`). Reveal kind: `zero` if spent=0, `replan`, else `reveal` (`App:3225`).

### 4.2 Derived numbers
| Value | Formula | Cite |
|---|---|---|
| Meter | pct = spent/base. closed → "Xk spent today / Closed hh:mm"; safe≥0 → "Xk of Yk used" or "Nothing spent yet" / "Tomorrow ≈ Z"; over → 100%, warn colour, "Xk over · still covered" | `App:3232-3235` |
| Hero sub | closed: "Closed at hh:mm. See you tomorrow at six." · ok: "Tomorrow ≈ Xk if you stop here" · over: "Today’s covered. Tomorrow’s {t} instead of {b}." | `App:3282` |
| Pace | pool = free+BEFORE+late+spent; usedF = (BEFORE+late+spent)/pool; timeF = 9/31; gap = timeF−usedF; >0.02 "ahead", >−0.03 "on pace", else warn | `App:3227-3231` |
| Home pots | Bills = BILLS (sub: next unpaid "Rent due 1 Oct" or "All paid"), Future you = save+gm, Free = free ("Xk a day") | `App:3292-3296`, `App:2665-2667` |
| River | Bills 4.2tr, Future you save+gm, Occasions OCC+om, Spent BEFORE+late+spent, Free | `App:2705-2711` |
| What-if | The slider **mutates planSave**, which moves every number live. `whatIfNote` computes `daily − c.tomorrow`, which is always 0 (bug) | `App:2720-2726`, `App:2792` |
| Goal ETA | mo = round(save·share); months = ceil(left/mo); eta month = 9+n (wraps years). ok = reached, or mo>0 and (no deadline or t ≤ 14) | `App:2797` |
| Pot need | ceil((goal−have)/mLeft/50k)·50k per month | `App:2798` |
| New pot | monthly = ceil(goal/when/50k)·50k; perDay = round(monthly/30/1k)·1k. **Not wired into calc** | `App:2882` |
| Ask | parse amount `(\d+([.,]\d+)?)\s*(tr|triệu|m|k|nghìn|000)?`: tr/triệu/m ×1e6, k/nghìn/000 ×1e3, bare ≥1000 as-is, else ×1000. after = floor((free−amt)/22/1k)·1k. amt ≤ safe → "fits today"; after ≤ 0 → "Not this month"; after < 0.6·base → "tight" + suggest 1tr from Occasions; else yes. Keyword branches: Tết, weekend, save | `App:2678-2696` |
| Calendar dot | day total ≤ base → green `oklch(0.66 0.14 150)` else orange `oklch(0.7 0.15 45)` | `App:2751-2756` |

### 4.3 Formatting (`App:2036-2039`)
- `fmt(n)`: round, dot thousands, suffix `₫`, negative prefix is **U+2212 "−"** (not hyphen). Example: `−1.250.000₫`. Deductions in rows are written as `'− ' + fmt(x)`.
- `num(n)`: same without ₫, absolute value.
- `short(n)`: ≥1e6 → one decimal with comma + `tr` (`17,4tr`, `2tr`); else `round(n/1000)+'k'` (`353k`, `0k`).
- Odometer: per-digit rolling column, duration 1000 + pos·80 ms, small `₫` at 0.4em (`App:3107-3122`).
- Date strings are English and hard-coded ("Friday 9 Oct", "FRI 09.10.2026", "SAT 10 OCT").
- USD quick add uses a fixed 25.400₫/$ rate (`App:2600`).

### 4.4 Time and hour-driven behaviour
| Rule | Cite |
|---|---|
| `closeAt` default '18:00'. `atSix = hour ≥ closeH` → accent CTA, banner "It’s six. Close your day." (or "It’s past HH:MM…") | `App:3134-3135`, `App:3237-3240` |
| hour ≥ closeH+1 → "Your day’s still open."; `late` = hour ≥ max(closeH+2, 20.5) → "Still open. Close before bed?", sub "Late closes still count for Friday", line `late` | `App:3236-3240` |
| Nudge toast when the hour crosses closeH while on home and not closed | `App:2017` |
| Before close: "Your close is at HH:MM", CTA "Close early" | `App:3239`, `App:3286` |
| Companion mood: serious→plain, toast→happy, safe<0→nod, ≥21:30→sleepy, <09:00→wave, else calm | `App:3224` |
| Predicted categories: <10 Food/Drinks/Transport; <14 Food/Transport/Drinks; <17 Drinks/Food/Shopping; else Food/Groceries/Transport | `App:2591-2597` |
| Sun: sunT = (h−6)/12.5; left 10+80·sunT %; top 400−sin(π·sunT)·270 px; size 60+max(0,h−15)·12; opacity 1−(h−18.5)/0.6 (gone by ~19:06); only on Today tab. Moon opacity (h−19)/1 | `App:3137-3146`, `App:3244` |
| Theme dark threshold per theme/variant (§7) | `App:2067` |
| Late close (SS): closing after midnight files under yesterday | `SS:312` (states array) |

---

## 5. Capture sources and flows

### 5.1 Sources (Settings rows `App:2801-2807`; guides `App:2856-2862`)
| Source | Mechanism in the design | Banks / merchants named | Inbox meta |
|---|---|---|---|
| **Share to 6pm** | Bank-app transfer receipt → iOS Share → 6pm share extension, read on-device (OCR). SS shows the extension card: amount, To, When, Code, Category, "Not sure about the name. Tap it to check.", Edit/Confirm | MB Bank, Vietcombank, MoMo (guide); Techcombank (seed) | "Shared receipt", meta "Read from your {Bank} receipt" |
| **Receipt email** | Per-user forwarding address `{handle}@6pm.oddeggs.studio` (app shows `name@`, OB2 shows `linh@`). Forward manually or via a Gmail/Outlook filter. "Works best with Grab, Be, Shopee and bank e-receipts. Other emails are skipped." | Grab, Be, Shopee, banks | "Email" |
| **Scan to pay** | In-app VietQR (NAPAS 247) scanner → pick wallet → deep-link to bank app with amount copied → come back → "Did it go through?" | Pay-with: MB Bank, Vietcombank, MoMo | "QR · pending" |
| **Wallet automation** | iOS Shortcuts → Automation → Wallet → "Log in 6pm", run immediately. Catches Apple Pay taps (merchant + amount) | — | "Apple Pay" |
| **Widgets & controls** | Lock Screen, Control Center, Action button, Siri ("Log 45k phở in 6pm") → Scan or Quick add | — | — |
| **Voice** | Quick add hold-to-talk, close cash "Say it". "Understood on this iPhone" | — | "Voice" |
| **Manual / keypad** | Quick add | — | "Manual" |
| **Android** (SS only) | Notification access: reads bank notifications on the phone | MB Bank notification | "From your MB Bank notification" |
| Banks in onboarding | MB Bank, Vietcombank, Techcombank, VPBank, ACB, BIDV, MoMo, ZaloPay, Cash (monogram tiles) | `OB1:329`, OB2 same list | |

### 5.2 Quick add (`App:2598-2630`, keypad `App:3205`)
- Keys: `1 2 3 ⌫ / 4 5 6 k / 7 8 9 000 / ₫→$ 0 . _`. `k` and `000` append "000" (ignored when empty, "0" or a decimal is present). `.` works in USD only, 2 decimals max. Max 10 digits. The `cur` key toggles VND⇄USD and clears.
- Hint "Type 45 then k for 45.000₫"; USD shows "≈ X₫ at 25.400₫ per $".
- Save is disabled at 0. Item = `{name: note || cat, src: voice ? 'Voice' : 'Manual', status:'ok'}`, then toast `capture`.
- Voice (fake): transcript streams word by word every 200 ms; on release it parses to `['Trà sữa','45.000₫','Drinks']`.

### 5.3 Scan to pay (`App:2632-2652`, markup `App:1590-1677`)
`camera` ("Point at any VietQR code", auto-detected after **1.7 s fake**) → `preview` (merchant "Bún chả Cô Lan", "Vietcombank · •••• 4821 · Food", 55.000₫, "Note from the QR: “2 suat bun cha”", Pay with wallets) → `handoff` ("Opening MB Bank… Amount copied. I’ll ask when you’re back.", **2 s fake**) → `return` ("Did it go through?" **Paid / Not yet / Cancelled**).
- Paid → item `src QR, status ok`, toast. Not yet → `status pending` + **Live Activity** (expanded 4 s, then compact "55k"). Tapping the island expands it; tapping again marks it paid. Cancelled → nothing saved.
- `unreadable`: "Couldn’t read that QR. Try more light, or hold a little further back. Nothing was paid." Type it / Try again. "Type it instead" → Quick add.

### 5.4 Pending: "did it go through?"
Pending items sit in the queue (Inbox + close) with meta "You didn’t say if it went through". Trail: "Waiting for you to say it went through" (`App:3012`). They count in `spent` until skipped. The Live Activity (SS:61) reads "Waiting · tap when paid".

### 5.5 Dedupe ("Seen 2 ways")
Only modelled as data: `seen: 'Seen 2 ways · QR + email'` on one item. The trail shows "Receipt email from MB Bank" a minute later and "Merged: same amount, a minute apart" (`App:3010-3013`). Implied rule: **same amount, different sources, within about 1 minute → merge**. Not implemented.

### 5.6 The 6pm Close (`App:2550-2589`, `App:3168-3191`, markup `App:1678-1902`)
Steps and labels: `CAUGHT · 1/5` → `CASH · 2/5` → `CHECK · 3/5` → `RECEIPT · 4/5` → `TOMORROW · 5/5`, with progress dots.
1. **cards**: a stack of 3 cards from the queue (caught + pending). Kicker "FRI 09 OCT · n OF N · Xk KEPT"; title "N things caught today". Each card: "Nº 01/04 · SOURCE · time", icon, name, cat, "KEPT SO FAR → WITH THIS ONE" running total, amount, meta, seen.
   - Swipe right >90 px = **Keep** (ok). Left <−90 = **Edit** (modal ±5k, category, "Save and keep"). Down >90 = **Not mine** (skipped). Buttons do the same. Card tilt = dx/18 deg; overlays fade in at dx/90.
   - After a fling, commit after 300 ms. **Undo** pill "Kept X · Undo" for 4.5 s restores the card (`App:2022-2027`).
2. **sorted** (auto 260 ms after the queue empties): "N sorted." + "a kept · b edited · c not mine", then auto-advance after 1.7 s to cash.
3. **cash**: "Anything in cash today?" (or **sweep** "Nothing caught today. Quick sweep?" when the queue was empty). Chips: Parking 5k, Nước mía 10k, Xôi 20k, Market 50k. Mic "Say it" (fake transcript "veggies and eggs at the market, thirty-five k" → Veggies & eggs 35k Groceries, src Voice). "CASH TODAY" total; CTA "That’s everything" / "Nothing in cash".
4. **question**: only if some ok item has `ask` and the question was not answered. Companion line `question` + "Was this one for work? If it was, it moves to Claim back and stays out of your daily number." → "Yes, for work" / "No, that was me" (sets `work`).
5. **receipt**: thermal receipt (slotPrint animation) "6pm · DAILY RECEIPT · Nº 0282 · FRI 09.10.2026 · hh:mm", rows, "CLAIM BACK · X", TOTAL, SAFE TOMORROW, note ("quiet day. still counts." / "see you tomorrow, future you"), red **CLOSED hh:mm stamp** (multiply, grain mask, stampIn after 1.6 s), barcode, "THANK YOU, FUTURE YOU". Share / See tomorrow.
6. **reveal**: "SAFE TO SPEND · SAT 10 OCT". The odometer starts at today's max(0,safe) and rolls to `tomorrow` after 700 ms with a haptic. Companion line (reveal/replan/zero), "Xtr free money · 22 days to go", OCTOBER month dots (closed days, today pops in), "That’s N of 9 days closed this October.", "I’ll nudge you tomorrow at 18:00." → "Done for today" → `closed=true, closedAt=clock`.
- **Pause**: X during any step → `closePaused {step}` (sorted maps to cash); home shows "Close paused" + "Resume the close". X on reveal = finish (`App:2028-2033`).
- **Re-open guard**: no close once closed (`App:2551`).

### 5.7 Today-row gestures and Inbox
- Row swipe right >90 confirms (only caught/pending). Left past −48 reveals a 96 px Delete; past −150 deletes. Haptic on crossing thresholds (`App:2944-2962`).
- Inbox ✓ keeps one item. "Confirm all" turns every caught/pending item and all of `yesterday` into ok (`App:3027-3030`).
- **Missed day**: confirm the caught items of a past unclosed day → `lateClosed[day]`, diary shows "LATE", note "closed it late. still counts." (`App:2745-2746`, `App:2787`).

### 5.8 Rules and categories
- Changing a category in Detail asks "Always file {merchant} as {cat}?" → Once / Always (adds rule `n:0`) (`App:2842`, `App:2903`).
- Renaming a category migrates items and rules. Deleting moves its items to the first other category and drops its rules (`App:2898-2899`).
- Merchant → icon mapping via regex (phở|bún → ramen_dining, bánh mì → bakery_dining, cà phê|highlands → coffee, grab → two_wheeler, circle k|gs25 → local_convenience_store, …) (`App:2654-2663`).

---

## 6. Companion

- **Visual**: `companion.js` holds no copy. It defines `<dusk-buddy size mood form>`, a canvas-drawn sun dipping into the sea. Moods: `calm|happy|wave|nod|think|sleepy|plain`; `form="max"` adds a ring, moons, 5 star rays and sparkles, with a burst on change (`CJ:1-244`). `plain` is greyscale with no rays (serious mode). Port it as a Skia/Reanimated component.
- **Copy** lives in `line(ev, v)` (`App:2486-2523`). Persona = state.persona ?? prop ?? 'Cheeky'. 26 events × 3 personas, plus a plain table `P` for serious mode. `{t}`/`{b}` = short(tomorrow)/short(base).
- **Where lines appear**: home bubble (`idle`, `closedIdle`, `paused`, `late`, `replan`), close question, reveal (`reveal|replan|zero`), Dynamic Island toasts (all others), Settings preview (`idle`). Other personality copy: OB1/OB2 step lines, CS `buddyCopy` (`CS:465`).
- Persona notes: Soft "Gentle and warm." · Cheeky "A little playful." · Roast "Teases you. Only if you asked for it." (`App:3081`).

| event | Soft | Cheeky | Roast | Serious (P) |
|---|---|---|---|---|
| idle | Calm day so far. I’ve got the receipts. | Suspiciously well-behaved today. | Wallet’s still breathing. Impressive. | Here’s where today stands. |
| reveal | Tomorrow’s a little roomier. Nice close. | Under a minute. Show-off. | Adulting on a Friday. Look at you. | Day closed. Here’s tomorrow. |
| replan | Tomorrow’s {t} instead of {b}. Month still lands. | Big day. Tomorrow’s {t}, not {b}. Month still lands. | …Month still lands. We move. | Tomorrow is {t} instead of {b}. The month still works. |
| zero | A quiet day. That counts too. | Zero. I’m nodding very calmly. | Nothing spent. Suspicious, but fine. | Day closed. |
| nudge | It’s six. Your day’s ready when you are. | Six o’clock. Let’s close the books. | It’s six. Time to face the receipts. | It’s time to close your day. |
| late | No rush. Two minutes before bed? | Still open. I’ll wait. Patiently-ish. | Day’s still open. So is your wallet. | Today isn’t closed yet. |
| capture | Got it. Tucked away. | Caught it. Back to your day. | Logged. I won’t tell anyone. | Saved. |

Other events: closedIdle, question, save, export, copied, paused, potFull, lateClose, potMade, maxOff, shareInvite, widgets, yearBook, maxOn, lookNew, lookSet, restored, catSaved, ruleSaved, pinned, walletOn, share.

**Serious mode** (`isSerious()` `App:2910`; palette `App:2061`, `App:2091`; atm `App:2268`):
- Fixed slate palette `['#2b2f37','#353a44','#40454f','#5a6070','#4a5468']`, always dark, accent #ff8552, display font Bricolage, theme overrides ignored.
- Suppressed: atmosphere effects (grain stays at 0.16), sun/moon/flare, **companion hidden** (`showBuddy=false`), mood `plain`, jokes replaced by `P` lines, accent CTA glow, reveal glow. Sheet top padding 92→20 px.
- SS shows the product intent: "muted colours, no companion, no jokes. Turned on by you, or offered when debt or stress shows up". It offers "Pause Future you for October" (frees 2tr, 120k→210k/day), "Talk to someone · Free, confidential debt advice" and "See what’s due before payday" (`SS:218-238`).

---

## 7. Themes ("Looks")

Definitions are in `themes()` at `App:2097-2196`. Each theme: `{id, name, tag, price, tier?, dark, font, kName, accent?, ctl[2], variants[3], feats?, over()}`. Each variant: `{name, accent?, dark?, K, sw?, …extra}`.

| id | Name | Price ₫ | Tier | Display font | Dark ≥ | Variants | Intensity `kName` | Toggles (default) | K lines |
|---|---|---|---|---|---|---|---|---|---|
| basic | Basic | 0 | free | Be Vietnam Pro | 18 (Light 99, Dark 0) | Auto, Light, Dark | Tint | sun Sun & moon (on), mono Monochrome (off) | 2106-2108 |
| golden | Golden Hour (default) | 0 | free | Bricolage Grotesque | 17.2 | Saigon, Hội An, Đà Lạt | Atmosphere | flare (on), grain (on) | 2114-2116 |
| expo | Long Exposure | 99.000 | premium | Barlow Condensed | 0 | Saigon traffic, Blue hour, Neon wash | Exposure | stars (on), traffic (on) | 2121-2123 |
| paper | Paper Diorama | 99.000 | premium | Baloo 2 | 18.8 | Rice terraces (terrace), Hạ Long (karst), Persimmon (hills) + 5-layer colours `L` | Shadow | par Parallax (on), clouds (on) | 2129-2131 |
| lantern | Lantern River | 99.000 | premium | Lora | 17.6 | Phố Hội, Trung Thu, Hoa Sen + lantern colours `lc` | Glow | sway (on), river (on) | 2137-2139 |
| neon | Neon Noir | 49.000 | paid | Playfair Display | 0 | Jade & Red, Cyan & Pink, Acid & Violet | Haze | rain (on), lights City lights (on) | 2145-2147 |
| riso | Riso Club | 49.000 | paid | Bricolage | 99 (never) | Pink+Blue, Orange+Teal, Yellow+Purple (`paper,i1,i2`, K generated by `riso()` `App:2101`) | Ink | dots Halftone (on), mis Misprint (on) | 2153-2155 |
| lacquer | Sơn Mài | 49.000 | paid | Cormorant Garamond | 0 | Cinnabar, Ebony, Jade (`metal`) | Depth | leaf Gold leaf (on), sheen (on) | 2161-2163 |
| monsoon | Monsoon | 49.000 | paid | Bricolage | 17 | Storm, Typhoon, Drizzle | Weather | rain on glass (on), thunder at night (on) | 2169-2171 |
| holo | Holo Foil | 49.000 | paid | Unbounded | 18.5 (Oil slick 0) | Opal, Oil slick, Pearl | Shimmer | sparkle (on), fast shimmer (off) | 2177-2179 |
| arcade | Arcade | 49.000 | paid | IBM Plex Mono | 0 | Phosphor, Amber, Vapor | Signal | scan Scanlines (on), glow Phosphor glow (on) | 2185-2187 |

Tag lines are at the same lines, e.g. Golden "The original. Film grain, lens flare and a sunset that means it." Premium `feats` are listed on the cards. CS repeats the catalogue with 49k / "✦ Premium" / Free tiers (`CS:447-463`).

### 7.1 Palette algorithm (`palette()` `App:2058-2095`)
1. `K = [[hour, c1..c5], …]` sorted by hour (6→24). Find the segment `K[i] ≤ hour < K[i+1]` (clamped to the last segment). Then `t = (h−a)/(b−a)` and `st[k] = mix(a[k], b[k], t)`, a **linear RGB hex lerp** (`mix` `App:2057`).
2. Roles: `st[0..2]` = sky gradient top/52%/bottom; `st[3]`=`b1`, `st[4]`=`b2` (bloom, accents, flare).
3. `dark = serious || hour ≥ (variant.dark ?? theme.dark)`.
4. Derived tokens: `ink, inkSoft, glass, glassShadow, sheet, sheetSolid, cell, cardShadow, hair, chipBg, tabActive, btnBg/Fg, bubbleBg/Fg, accent, dispFont, textGlow, sky, skyDeep (mix .28 with #0a0614), pageBg (mix .62 with #09070f)`. Light ink #1b1e2e, dark ink #fbf4ec.
5. `theme.over(p, st, V, dark, cfg)` overrides tokens (glass and riso hard shadows, lacquer metal borders, arcade 8-band sky, etc.).
6. Theme config: `cfg = {v:0, k:70, …ctl defaults}` merged with `tcfg[id]`. Atmosphere scale `k = cfg.k/70` (can exceed 1), `k1 = min(1,k)`. Basic uses k as tint toward neutral.
- Category tile style (all themes): `linear-gradient(155deg, oklch(0.9 0.07 h), oklch(0.78 0.12 h))`, glyph `oklch(0.34 0.09 h)`.

### 7.2 Atmosphere per theme (`atm()` `App:2253-2304`, `premiumAtm()` `App:2309-2361`, sun `sunFx()` `App:2222-2236`, card "signature" `sig()` `App:2237-2252`)
Layer stack in markup `App:62-121`, `1929-1941`: sky → 3 drifting blooms → sun thread → sun → riso ghost sun → flare streak → moon → bokeh → halftone dots → light leak → rain → fog → lightning flash → holo → sheen → glints → star trails → traffic → paper hills → lanterns → vignette → grain → (top) raindrops, CRT. Parallax uses `--sy` scroll.
| Theme | Effects |
|---|---|
| basic | grain .04, optional sun, mono accent |
| golden | blooms, lens-flare streak through the sun (dusk-weighted), halftone, light leak, vignette, film grain, bokeh after 18:36 |
| neon | screen blooms, leaks, heavy vignette, city-light bokeh, rain streaks, neon sun, text glow |
| riso | hard-edged blooms, halftone dots, multiply grain, off-register ghost sun, banded sky, offset text shadow |
| lacquer | metal bloom, sheen sweep, 28 gold-leaf glints, metallic sun |
| monsoon | fog drift, rain tile, 18 sliding drops on the glass, lightning flash (dark only), dimmed sun |
| holo | rotating conic holo overlay (22 s, fast 7 s), sheen, 16 sparkles, conic sun |
| arcade | 3 px dot screen, CRT vignette, rolling CRT bar + scanlines, phosphor text glow, striped sun mask |
| expo | 3 star-trail rings rotating around a pole star, 12 car light-trails on 4 lanes (carR/carL), no sun |
| paper | 5 parallax hill layers (terrace/karst/hills), paper clouds, sun on a thread, stacked-paper card shadows, night tint after 18:30 |
| lantern | 2 catenary wires with bulbs + 5 silk lanterns each (sway), river reflections + 6 floating lanterns; glow ramps 16:18→18:18 |

### 7.3 Icon packs (`App:2363-2375`)
Essentials (free, 36) plus 7 Max packs of 18 each: Street food & drinks, On the move, Home & bills, Shop & style, Body & mind, Going out, People & pets, Money gifts & Tết. That is 180 in total; the copy says "36 free · 144 with Max".

---

## 8. Monetisation

| Product | Price | What | Cite |
|---|---|---|---|
| Basic, Golden Hour | Free | — | `App:2103`, `App:2111` |
| Classic looks ×6 | 49.000₫ each, one-time | Neon, Riso, Sơn Mài, Monsoon, Holo, Arcade | `App:2142-2182` |
| Premium "living scenes" ×3 | 99.000₫ each, one-time | Long Exposure, Paper Diorama, Lantern River | `App:2118-2134` |
| "All looks" bundle | **undefined price** | `bundleGo` = buy `{id:'all'}` unlocks the 6 non-premium looks, but **no markup renders it** and the buy sheet would crash (`TH['all']` undefined). Treat as cut and superseded by Max | `App:2455-2456`, `App:2476-2478`, `App:2215` |
| **6pm Max** | **78.000₫/month** or **598.000₫/year** (= 49.800₫/mo, "save 36%"), **7-day free trial** | Every look (paid + premium, future ones too), unlimited Ask (free: 3/week), unlimited pots + auto-rules (free: 1 own pot), Budget together (shared pot or month, close as two), Travel mode (every currency, live rates, auto-on abroad), Year book (12 diaries bound 31 Dec, printable), Backup & export (encrypted iCloud, full history, CSV + Sheets), Home/Lock widgets in your look, 180 icons, Max companion form | `App:2394-2425`, `App:2445-2452` |

Free forever: "The 6pm Close, capture and privacy stay free." (`App:1042`).

Purchase flow states (`confirmBuy` `App:2207-2221`):
- `buy.phase: confirm → paying (1.3 s) → done (1.0 s) → apply`. Sheet copy: "Confirm with Face ID" / "Confirming…" / "It’s yours". Footnote: one-time "Yours on every device with the same Apple ID. Restore any time from Looks."; Max: "Nothing is charged today. Cancel any time in your Apple ID subscriptions."
- Look purchase: added to `owned`, applied, toast `lookNew`.
- Max: `max=true, backup=true`; a look being tried on gets applied; Max welcome; companion evolves after 900 ms.
- "Manage subscription" (prototype) turns Max off at once with toast `maxOff`. Restore → toast `restored`.
- Badges on look cards: In use / Free / Max / Owned / price. Try-on is free: "Nothing’s charged until you buy."

Max gates (each opens the paywall with context `maxFrom`): looks, ask (4th question), pots (2nd pot), shared, travel, backup/export, diary (year book), widgets (Settings row), icons (locked pack), buddy.

---

## 9. Onboarding, Surfaces, Coming Soon, Wheel

### 9.1 Onboarding: v2 is the intended one
OB2 links "Compare with v1" (`OB2:432`). Its `NOTES` explain the changes from v1 (`OB2:441-450`). Both run the sky from morning to dusk as you progress, and both show the companion with step lines.
| | v1 (`OB1:279-399`), 9 steps | v2 (`OB2:437-646`), 8 steps |
|---|---|---|
| Welcome | "Close your day in 60 seconds." "No account. Everything stays on this iPhone." 3 promises | "Close your day at six." Get started |
| Lang/currency | Step: English/Tiếng Việt; VND/USD/EUR | **Removed**, taken from the device, lives in Settings |
| Money in | ± 500k, chips 8/12/15/20/30tr; payday 1–31 grid; "It varies" = rolling 3-month average | **Wheels**: millions 1–99 + hundred-thousands; payday Same day (day wheel) / Last day / It varies |
| Fixed bills | Toggle tiles with typical amounts (Rent 5tr, Phone 150k, Internet 220k, Electricity 400k, Spotify 59k, YouTube 79k, iCloud 45k, Gym 500k) | **Yes/no card deck**: Rent, Power & water, Phone & net, Subscriptions (multi: Spotify, YouTube, Netflix, iCloud+, ChatGPT, Apple One), Anything else (Gym, Insurance, Instalment, Family, Tuition, Parking). Amount card with digit wheels (M / 100k / 10k) starting at 0, "Add later", chip tray to revisit. No suggested amounts |
| Savings | "Pay future you first" ± 500k, 10/15/20% chips | Percent wheel 0–40%, default 12%; "Xtr by next October"; copy no longer implies 6pm moves money |
| Banks | 9 monogram tiles | same, titled "What do you pay with?" |
| Capture | Expandable list (Share, Email, Widgets, Android notification access disabled) | Swipeable demo cards: Scan to pay (ready), Share, Forward emails (copy `linh@6pm.oddeggs.studio`), Lock Screen & Action button |
| Close time | Chips 17:00–21:00 | Hour wheel 15–23 + minute wheel 00/15/30/45. **iOS notification permission alert**; CTA "Remind me at HH:MM" |
| Reveal | safe = (income − bills − sav)/**31** | safe = (income − bills − sav)/**30**; "Open 6pm" fades into the app home number |

### 9.2 Surfaces and States (`SS`)
1. **Lock + Home** (`SS:33-180`):
   - Lock widgets: "245k left", "6pm · Safe today 245k · 2 pending".
   - Live Activity "Waiting · tap when paid · 45.000₫ to Phở Hòa · Paid".
   - Notifications: close nudge "It’s six. Close your day: 4 caught, about a minute."; capture "Caught 45.000₫ · Phở Hòa" with **Confirm / Edit** actions.
   - Lock controls (flashlight, scan).
   - Home widgets: medium "Safe to spend today 245k / Tomorrow ≈ 250k · 2 pending" + Scan QR / Quick add; small "245k safe today"; large Today list "+2 more".
   - Dynamic Island compact/expanded; Travel Live Activity "Bangkok · today ฿560 left · ฿640 of ฿1.200 ≈ 469.000₫".
   - Control Center + Action button "Scan QR in 6pm"; Siri "Log 45k phở in 6pm" → "Logged. Phở · Food · Safe today is now 200k".
2. **Share extension + serious mode** (`SS:182-243`).
3. **12 edge-state cards** (`SS:310-323`): Welcome back (14 caught while away; "No catching up on days you missed"), Overspend, Late close 00:40 (files under yesterday), First day, Zero-spend, Offline ("Everything works on this iPhone. Backup catches up"), Camera off, QR unreadable, Abroad (Thai PromptPay, not payable, log ฿ by hand with ₫ underneath), OCR failed (kept 120.000₫), Backup ("iCloud · 284 items · encrypted"), Notifications off.
4. **Android** (`SS:267-300`): home widget, bank-notification capture with Confirm/Edit, Quick Settings tile "Scan QR".

### 9.3 Coming Soon / waitlist (`CS`, 637 lines)
- Scroll-driven single page with bilingual EN/VI headlines.
- Launch prop `2026-11-06T18:00:00+07:00` (Fri 6 Nov 2026, 18:00 ICT) with a DAYS/HOURS/MINUTES/SECONDS countdown (`CS:405`, `CS:584`). Sky mode: "Sets as you scroll" or "Always 6pm".
- Scenes:
  - hero "It’s six. / Sáu giờ rồi."
  - title lines "Every day, money leaves quietly…"
  - **leak** (84 flying spend chips, counter to 4.217.000₫, "Stop. 6pm catches all of it. / Không sót một đồng nào.")
  - **your-leak calculator** (6 habits × frequency → monthly/yearly leak + equivalence: "a year of rent in Saigon", "a week in Japan", "a trip to Phú Quốc for two", "a new phone", "a mountain of bánh mì")
  - **dial** "Sixty seconds was too long." → "The close is one swipe." (swipe-to-close demo + undo)
  - **odo** "What’s safe today." (18.500.000 − 6.836.000 bills − 2.800.000 pots − 2.000.000 Future you ÷ 22 = 312.000)
  - **diary** "A diary that keeps receipts." (30 tiles stamp in, +2.000.000₫ to Future you)
  - companion "It talks back." (persona picker + "Midnight form · with 6pm Max")
  - credits "6PM PRESENTS 2.0… ON iPHONE"
  - **list** "Be there at six. / Hẹn bạn lúc sáu giờ."
- Waitlist: ticket-style email field, **hold-to-stamp 900 ms** or submit; validation messages; success "You’re on the list. See you at six." with a random ticket Nº (400–899); "Use a different email". Copy "One email, at six, on launch day. That’s it."
- Sticky dock "Join the list" / "Your leak: Xtr a month". Footer: Press kit / Privacy / Contact / © 2026. **No backend**.

### 9.4 Wheel (`WH:1-100`)
iOS-style picker used by OB2.
- Props: `items[], index, onChange(i), size=28, rows 3|5, align, ink, padX`. Row height = size·1.4.
- Drag has rubber-band 0.3 past the ends. Momentum snap = pos − v·220/H. Mouse wheel works too.
- Snap transition .38 s `cubic-bezier(.2,.9,.25,1)`. Rows use 3D `rotateX(−22°·d)`, opacity 1−0.36·d, scale 1−0.07·d. Top/bottom fade mask. **Haptic 4 ms per index change**.
- In RN, use a native picker or a Reanimated wheel.

---

## 10. Typography, iconography, motion, haptics

**Fonts** (Google Fonts, `App:13-15`):
| Role | Font |
|---|---|
| UI/body | `-apple-system, 'SF Pro Text', 'Be Vietnam Pro'` (`App:62`); on Android use Be Vietnam Pro |
| Display (hero numbers, headings, 56 uses `{{ dispFont }}`) | per theme (§7); Bricolage Grotesque (opsz/wdth/wght variable) in serious mode and Golden Hour |
| Receipts, kickers, labels, stamps, step labels | IBM Plex Mono (≈55 uses) |
| Handwritten diary notes | Patrick Hand (`App:462`, `1383-1412`, `1836`) |
| Keypad digits | SF Pro Display / Be Vietnam Pro |
| Companion "z" | Newsreader italic (canvas, `CJ:222`) |
| Coming Soon extras | Playfair Display italic for accent words |

**Icons**: Material Symbols Rounded, variable axes `opsz 20–48, wght 300–600, FILL 0–1`. Active tab uses `'FILL' 1, 'wght' 500`. About 124 inline glyph uses plus the logic-supplied ones.
- Core set: wb_twilight, donut_large, auto_stories, qr_code_scanner, add, tune, info, inbox, check, check_circle, delete, undo, edit, south, close, chevron_left/right, arrow_forward/back/upward, north_east, mic, keyboard, receipt_long, add_a_photo, ios_share, alternate_email, contactless, widgets, lock, cloud/cloud_done, download, schedule, translate, payments, flight, category, auto_awesome, visibility, face, lightbulb, autorenew, task_alt, pause_circle, bedtime, event_repeat, done_all, unfold_more, expand_more/less, qr_code_2.
- Category, pack and merchant icons are listed at `App:2009`, `2365-2373`, `2656`.
- In RN use `@expo/vector-icons` MaterialSymbols, or a subset font with the FILL axis. Note that vector-icons ships no FILL axis, so choose the approach early.

**Motion** (keyframes `App:21-56`; usage lines):
| Keyframe | Use |
|---|---|
| stampIn | CLOSED stamps (167, 1076, 1538, 3198) |
| rise / fade / sheetUp / screenIn | list items, overlays, sheets, screens |
| slideInR / slideInL | tab change direction (2997) |
| bubbleIn | chat, month dot pop |
| slotPrint | receipt printing (1810) |
| reveal | home and plan card entrances |
| pop | MAX badge, "It’s yours" |
| dot | typing indicator |
| scanline / ring / spin | scanner, mic pulse, spinners |
| growX | Ask before/after bars |
| floaty | Max cards |
| confetti | Max welcome |

Atmosphere keyframes: drift1/2, grain (.8 s steps), leak, twinkle, rainfall/rainfall2, dropSlide, fogDrift, flash, sheen, crtRoll, carR/carL, sway, ripple, floatX.

Springs: the house curve is `cubic-bezier(.2,.9,.25,1.12)` with overshoot (cards, sheets) and `.2,.9,.2,1` for entrances. The odometer rolls per digit. OB2 adds inR/inL, cardIn, flyR/flyL, tapRing, slideMail, alertIn. CS adds shake, nudge, tw, drop.

**Haptics**: `buzz()` = `vibrate(12)` (`App:2040`). It fires on:
- swipe fling, edit open, sort complete, reveal settle, receipt (1.7 s after)
- tab swipe/scrub, row threshold crossing, sheet dismiss, FAB long-press, undo
- purchase phases, scan detection, voice parse, goal/pot add, bill toggle, rule save, category save

Onboarding uses 10 ms, Wheel 4 ms per tick. Map these to expo-haptics: selection for ticks, light impact for actions, success notification for close/reveal/purchase.

---

## 11. Copy inventory (where, roughly how much)

| Location | Approx. count | Headings / CTAs |
|---|---|---|
| App template static text | ~200 strings (530 text nodes incl. bindings) | "It’s six. Close your day.", "Start the close", "Close early", "Resume the close", "Right to keep · left to edit · down if not yours", "Anything in cash today?", "That’s everything", "Was this one for work?", "THANK YOU, FUTURE YOU", "See tomorrow", "Done for today", "A sky for every six o’clock.", "Start 7 days free", "Welcome to Max.", "Start this pot", "Close Wednesday · 190k", "Did it go through?" |
| App logic: companion `line()` | 26 events × 3 + 21 plain ≈ 100 | `App:2486-2523` |
| App logic: other UI strings | ~250 (Max copy, guides, Ask answers, pace, tonight, plan notes, zines, states) | `App:2394-2484`, `2678-2696`, `2697-2908`, `3224-3300` |
| Onboarding v1 / v2 | ~60 / ~90 | v2 "Close your day at six.", "Get started", "Pay future you first", "How 6pm catches spending", "When should your day close?", "Remind me at 18:00", "Open 6pm" |
| Surfaces & States | ~110 | 12 state cards `SS:310-323` |
| Coming Soon | ~120 (EN + VI pairs) | "Join the list", "Plug it at six", "HOLD TO STAMP" |

Vietnamese UI copy exists **only** in CS headlines and in data (merchant and pot names). The app has a Language toggle but **no VI strings**, so the whole i18n catalogue still needs writing.

---

## 12. Open questions, ambiguities and prototype fakes

**Product and math decisions**
1. **Do unconfirmed items count?** `calc.spent` includes `caught` and `pending`, but the guide says "Nothing counts until you say so" (`App:1135`). Pick one.
2. **Day divisor**: the app uses base ÷ (DAYS+1) and tomorrow ÷ DAYS; OB1 uses ÷31 and OB2 ÷30. Define payday-cycle math (fixed day, last day, "varies" rolling average) and how today is counted.
3. **New pots and goals**: copy says "Your daily number adjusts on its own", but `extraPots` monthly is not in `calc` (only `occAdd` top-ups are). Where does pot money come from (OCC constant vs a per-pot monthly)?
4. **What-if slider** mutates the real `planSave`, and its note is always "+0k" (`App:2792`). Should it be a preview or a commit?
5. **Late items** (after close) reduce the *next* day's startFree via `late`. Confirm this policy and the "after midnight files under yesterday" rule (SS).
6. **Missed day**: closing late does not add its items to spend (fake MISSED list). Define the real backfill.
7. **Merchant rules** are stored but never applied to new captures. **Categories** have no budgets or limits.
8. **Dedupe** is only a label. Need a real matcher (amount + time window + source pairs) and a merge UI.
9. **Widgets gating conflict**: Settings locks Widgets behind Max, yet the capture source "Widgets & controls" is On for free, OB2 sets up the Lock Screen free, and the Max tile says "Home and Lock Screen widgets, in your look". Suggest free functional controls and Max themed widgets. Needs a decision.
10. **"All looks" bundle** is computed but unrendered and broken. Confirm it is dropped in favour of Max.
11. **Max dates** are hard-coded ("Trial ends 17 Oct", "Renews 10 November"). Store pricing and regional tiers via StoreKit / Play Billing. The prototype only says Apple ID, so the Android purchase path is undefined.
12. **Ask 6pm** answers come from regex and canned templates, with a 1 s fake delay. Is it LLM-backed (privacy: "read on this iPhone") or on-device rules? Free quota 3/week resets "Monday".
13. **Backup**: "end-to-end encrypted iCloud" (`App:845`). The RN implementation (CloudKit? encrypted file in iCloud Drive?) and Android equivalent are undecided. Privacy claim: "Nothing goes to a server unless you turn on backup", yet the **email forwarding** source implies a server (`6pm.oddeggs.studio` inbox). This needs a server and a privacy story.
14. **Platform scope**: CS says "ON iPHONE". Android appears only in SS (notification listener). The Expo target implies both platforms, so decide v2.0 platforms. Note that "Bank alerts" in CS marketing are only readable on Android.
15. **Share extension OCR** of bank receipts (image/PDF from MB Bank, VCB, Techcombank), VietQR parsing (EMVCo/NAPAS payload → merchant, account, amount, note), **bank deep-links** ("It opens with the amount ready"; most VN banks only support opening the app, and "Amount copied" suggests clipboard fallback), and the Apple Pay Shortcuts intent ("Log in 6pm") all need native modules or App Intents in Expo.
16. **Travel mode**: "live rates", "turns on by itself abroad" (location?), PromptPay QR unsupported. The prototype uses a fixed 25.400₫/$ and the Home currency toggle does nothing.
17. **Budget together / shared** needs accounts and sync, which contradicts "No account" (OB1). Decide.
18. **Serious mode** auto-offer "when debt or stress shows up": the detection criteria are undefined. The debt-advice link target is undefined.
19. **Year book / zines** printing ("you can print"): format and vendor unknown. The zine share image is "Show amounts" off by default.
20. Close-time options differ: Settings has 5 presets, OB1 6 chips, OB2 15:00–23:45 in 15-min steps.

**Things the prototype fakes (replace with real behaviour)**
- **Fixed clock and data**: today = Fri 9 Oct 2026, timeF 9/31, INCOME/BILLS/OCC/BEFORE constants (`App:1988`). Diary history `DD`, zines `Z`, week recap bars, `places`, category stats `ST`, "Seen 2 ways", Spotify "spotted", recap "skipped 3 Grab rides" and receipt "Nº 0282" are all canned (`App:2735-2775`, `2869`, `3052-3104`). Seed transactions are at `App:1993-2011`. The "closed in all" count is 51+N.
- **Timers**: QR auto-detect 1.7 s, bank handoff 2 s, Live Activity collapse 4 s, purchase 1.3 s + 1 s, Ask reply 1 s, reveal 700 ms, sorted→cash 1.7 s, Max evolve 0.9 s, toasts 3 s, undo 4.5 s / 5 s.
- **Voice**: scripted transcripts ("trà sữa with pearls, forty-five k", "veggies and eggs at the market, thirty-five k"). Real speech-to-text plus a VI/EN amount parser are needed (k, nghìn, tr, triệu, "rưỡi"…).
- **Scan**: merchant "Bún chả Cô Lan 55.000₫" is hard-coded, and so is the Live Activity text.
- **Delete all data** re-seeds the zero-spend scenario. **Manage subscription** flips Max off. **Restore** is a toast. **Export** is a toast. **Language and currency toggles** are cosmetic.
- **Coming Soon**: no waitlist backend, random ticket number.

**Prototype bugs to not port**
- `extra()` (`App:3031-3105`) returns stale Settings/Plan values (e.g. `planMath` with 18.000.000). `pd()` overrides them because it is spread later (`App:3244`). Use `pd()`/`capture()` as the source of truth.
- Serious-mode `P` table lacks maxOff, shareInvite, widgets, yearBook, maxOn, lookNew, lookSet and restored, so the toast reads `undefined` (`App:2518`).
- `screenshots/` (55 jpgs, names like `01-v3`, `01-st4`, `01-np`, `b0`) are review captures of **older iterations**. For example `b0.jpg` shows "PAYDAY 25 OCT" while the code says 31 Oct. Use the code as the spec. `uploads/` holds 2 CS screenshots.

---

## 13. Suggested build order (derived)
1. **Foundations**: money utils (fmt/num/short, VND ints, U+2212), time engine (closeAt, hour → atSix/late), the `calc` domain module with tests (§4.1 seed: 49.000 / 351k / 353k), and local store (SQLite) for Txn/Category/Rule/Bill/Pot/Goal/DayRecord.
2. **Theme engine**: keyframe lerp → tokens (port `palette`, `themes` K tables programmatically from `App:2106-2187`), Basic + Golden Hour first, serious palette, fonts, Material Symbols.
3. **Shell**: tabs + FAB (tap / long-press), sheets with drag-dismiss, a Dynamic-Island-like toast (in-app), companion component (Skia port of `CJ`) + `line()` copy table.
4. **Today** (hero odometer, meter, tonight card, week strip, list with swipe rows, Inbox, Detail, undo).
5. **Quick add** (keypad, categories, wallets), then **the 6pm Close** (cards → sorted → cash → question → receipt → reveal, pause/resume, undo), then the close notification.
6. **Plan** (river, bills, Future you goals, occasions/pots, new pot) and **Diary** (calendar, day receipt, recaps, missed day).
7. **Capture**: VietQR scan + wallet handoff + pending/Live Activity; Share extension OCR; email inbox service; Shortcuts/App Intents; widgets and controls; voice.
8. **Settings**, Categories/Rules, Capture guides, then **Onboarding v2** (Wheel component).
9. **Monetisation**: Looks shop + try-on + IAP, Max paywall/welcome + gates, then the paid themes and the 3 premium living scenes.
10. **Max features**: backup/export, travel, Ask, shared, year book. Coming Soon page as a separate web deliverable.
