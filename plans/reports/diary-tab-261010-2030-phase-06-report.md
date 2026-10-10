# Diary tab: build report

Date: 10 Oct 2026. Scope: the Diary tab, the missed-day sheet, the money diary zine, the calendar and recap maths, diary copy (en + vi). Nothing committed.

## Built

| Area | Files |
|---|---|
| Domain maths (pure, tested) | `packages/domain/src/diary/calendar.ts` (Monday-first month grid, 35/42 cells; dot rule `spent ≤ line → under`; calendar cell kinds), `week-recap.ts` (bars, story, top places), `month-diary.ts` (zine stats, longest run, quietest/biggest day, diary shelf), `index.ts`; one export line in `packages/domain/src/index.ts` |
| Domain tests | `calendar.test.ts`, `week-recap.test.ts` (October 2026 grid with 1 Oct on Thursday, 42-cell August, February floor of 35; the dot rule incl. equality; the designed week's bars 39/57/5/46/15% with the line at 49%; story; rescale; places; zine; shelf numbering) |
| Queries | `apps/mobile/src/data/diary-queries.ts`: closed days and spends for any range, first day with data, totals per month, receipt number, Future you per month (goal pot moves), the daily number as it stood on a past day (`dayOf` run over that day's cycle), and `useStoreQuery` (re-reads on every store publish, keeps the last result while reloading) |
| Diary tab | `features/diary/diary-page.tsx` (export `DiaryPage({ scrollRef })` kept), `use-diary.ts`, `week-recap-card.tsx`, `recap-pages.tsx`, `month-calendar.tsx`, `day-receipt.tsx`, `ask-entry.tsx`, `money-diaries.tsx`, `scroll-reveal.tsx`, `card-sheet.tsx`, `diary-colours.ts`, `diary-dates.ts` |
| Zine | `features/diary/zine/zine-cover.tsx`, `zine-pages.tsx`, `zine-share.tsx`, `zine-grain.tsx`, `use-money-diary.ts` |
| Routes | `app/missed-day.tsx` (`/missed-day?day=YYYY-MM-DD`), `app/money-diary.tsx` (`/money-diary?month=YYYY-MM`) |
| Copy | `packages/i18n/src/en-diary.ts`, `vi-diary.ts` (completeness test passes) |

## Prototype references

- Diary tab markup `6pm App.dc.html:382-519`; logic `pd()` `2735-2836`; recap gesture `rcDown/rcMove/rcUp` `2963-2965`; render `design/renders/app/08-diary-recaps.png`.
- Missed day `1309-1338`, `closeMissed` `2787`; render `18-missed-day-catch-up.png`.
- Zine `1339-1441`, data `Z` `2769-2774`.

Ported exactly: header (13/600 kicker, 34/700 title, fade `1 − sy/70`, drift `min(sy,80)·.3`); recap card (radius 26, 20/18/16 padding, min height 318, mono kicker, page "n / 3", dots 20/6 pt × .9/.25 over 300 ms, "Tap or swipe"); pan follow `translateX(dx·.3) rotate(dx/220 deg)`, activation 10 pt horizontal before 10 pt vertical, ±40 pt turn, release over 450 ms on `cubic-bezier(.2,.9,.25,1.15)`, pages fade in 350 ms; bars chart (140 pt, 7 columns gap 10, 500k = 70% scale, dashed line at the daily line); calendar (52 pt cells, radius 12, gap 5, paper tile + 5 pt dot + short total, selected = 2.5 pt accent ring + lift 2 pt over 200 ms, today dashed accent "6pm", missed dashed hairline, ahead at .32); day receipt (306 pt, −1°, scalloped top and bottom, Patrick Hand note, −7° stamp); Ask entry (52 pt thinking companion, chips 34 pt); diaries shelf (172 pt covers, 4/14 radius, spine, dashed in-progress cover with accent progress); year book (86 pt, gold year, MAX lock badge); scroll-driven `reveal` (28 pt rise from .97, done at 85% entered) on the calendar, Ask and shelf; missed sheet (8 pt inset, 44 pt radius, 64 pt nodding companion, list card radius 22, 56/48 pt buttons); zine (68 pt title, rotated stamp, 4 paper stats, places with bars, tilted tickets, 6-column day grid with per-tile tilt, taped note, 200×356 share card, the knob switch on `cubic-bezier(.3,1.4,.5,1)`, fractal-noise grain multiplied at 30%).

## Decisions (engineering defaults, for founder review)

1. **Recap story is computed, not scripted.** The prototype's "You skipped 3 Grab rides home, so 150k went to Future you" is hard-coded. Page one now tells the truth about the week's closed days: "N days under your line so far, so {spare} rolls on to the days ahead" / "{over} over your lines this week, so the days ahead get a little smaller" / "Right on your line" / "A fresh week" (none closed). Under-spend raises later lines, so "rolls on" is accurate; it does not go to Future you.
2. **Per-day lines.** Dots, "under your line" counts and the bars' colours compare each closed day with the line stored on its `closed_days` row (the line it actually had), not today's line. The dashed line in the chart and the "under your 351k line" summary use today's line.
3. **Today's bar is live** (counted so far, accent), as in the prototype; the story ignores it.
4. **Missed only after the user started.** Past unclosed days before the first day 6pm has any spend or closed day show as dimmed "idle", never "missed" (a new user would otherwise see a month of "missed").
5. **Missed day filing** confirms every waiting spend of that day (`setStatus(…, 'kept')`), then files `closed_days` with `late: true` and the spent/line/tomorrow the daily-number engine gives for that day over its own pay cycle (current plan, bills and pots). It then reloads the store, because `setStatus`/`closeDay` would otherwise put a spend or closed day from before the current cycle into the cycle snapshot.
6. **Selected receipt** defaults to the most recently filed closed day (by `closed_at`), so closing today or filing a missed day selects it, as the prototype does, with no cross-screen state. A tapped day stays selected until another day is filed.
7. **Receipt numbers** are real: the count of closed days up to that day (prototype used 274 + day).
8. **Zine numbers**: spent and "plan" are the closed days' spent and lines added up; "spare/over" on the shelf is their difference. Future you is goal-pot moves in the month's pay cycles and their running total. Nº counts months with closed days from the first.
9. **Covers** for months other than August and September (the designed ones) use the same lightness/chroma round the hue wheel (`diary-colours.ts`).
10. **The missed sheet uses a local `CardSheet`** (`features/diary/card-sheet.tsx`) instead of `SheetFrame`: the design is a floating, content-height card (8 pt inset, 44 pt radius), which `SheetFrame` (58 pt from top, full height) cannot draw. Same easing, thresholds and dim as `SheetFrame`. The zine uses `SheetFrame` with its own tinted header and body.
11. **Paper colours** (receipt paper, stamp red, zine ink, year book) are the prototype's fixed hexes, kept in one file (`diary-colours.ts`), matching how `close-receipt.tsx` does it. The calendar dots use `oklchSrgbHex` for `oklch(0.66 0.14 150)` / `oklch(0.7 0.15 45)`.

## For the controller to wire

1. Register both routes in `app/_layout.tsx` with `options={sheet}`:
   `<Stack.Screen name="missed-day" options={sheet} />` and `<Stack.Screen name="money-diary" options={sheet} />`.
2. Typed routes: `.expo/types/router.d.ts` is stale (no Metro run here), so the two pushes in `diary-page.tsx` cast with `as Href`. After Metro regenerates the types the casts can go.
3. **Ask 6pm**: `/ask` does not exist. `AskEntry` renders and calls `onAsk(question?)`; `diary-page.tsx` passes a no-op. Wire it to `/ask` (with the chip's question) when Ask lands.
4. Today's week strip could open these routes too (prototype: past day → diary day, missed → `/missed-day`), but `tonight-card.tsx` is outside my scope.
5. Optional: promote `CardSheet` into `ui/navigation` (or give `SheetFrame` a floating variant), and move the paper colours into `@6pm/theme`.
6. `SheetFrame` exposes no animated dismiss, so the zine's Done (like `SheetScreen`'s) calls `router.back()` and the sheet disappears without sliding down. A `dismiss` from `SheetFrame` would fix both.

## Undesigned states (for `docs/undesigned-states.md`)

| Screen | State | What the app does | Why |
|---|---|---|---|
| Diary | No closed day this week | Recap page one: "A fresh week. Close tonight and it starts to fill in." | The prototype's story is scripted |
| Diary | Week recap story | Computed from closed days (under/over/even), never the scripted Grab line | Real behaviour only |
| Diary | Nothing counted this week | Recap page three: "Nothing counted this week yet." | Undesigned |
| Diary | No closed day this month | Calendar summary "Close tonight to file your first day"; no day receipt | Undesigned |
| Diary | Days before the user's first data | Dimmed like days ahead, not "missed" | A new user would see a month of "missed" |
| Diary | "Spotted" recurring card | Not shown | Needs recurring-spend detection (not built) |
| Diary | Ask 6pm entry | Drawn; does nothing yet | `/ask` lands with Ask (phase 11) |
| Diary | Year book | Drawn locked with the MAX badge; does nothing | Max and the paywall land in phase 10 |
| Diary | Money diaries shelf | This month plus every earlier month with a closed day; covers for months other than Aug/Sep use the same tint rule | The design shows three fixed covers |
| Diary | Day receipt with no kept spends | "NOTHING SPENT" line, total 0 | Undesigned |
| Missed day | Nothing caught that day | No list; "Nothing was caught that day. Close it as a quiet day…"; button "Close Wednesday · 0k" | Undesigned |
| Missed day | Only kept spends that day | Lists them; "Nothing's waiting from that day. Close it…" | Undesigned |
| Missed day | Already closed / not a past day (stale link) | "Wednesday is already filed." and Done | Undesigned |
| Missed day | Companion toast after filing ("Wednesday, filed. Better late than lost.") | Not shown; success haptic only | No island toast system yet |
| Money diary | Save image / Share buttons | Hidden | Needs view capture + share sheet (not installed); a button that does nothing would be a fake |
| Money diary | Quietest/biggest day note | Shows the day's own note; hidden when it has none | Notes are not editable yet (`closed_days.note` is null from the close) |
| Money diary | Month with one closed day | Biggest day ticket hidden | Quietest and biggest would be the same day |
| Money diary | Headline and note | Chosen from the month's numbers (spare / over, with or without Future you paid) | The prototype's lines are per-month copy |
| Recap / zine | Place sub-label | "N visits" for every merchant | The prototype says "14 rides" for Grab only |

## Verification

- `pnpm --filter @6pm/domain test` (13 files, 142 tests, incl. the 2 new files with 18 tests): pass.
- `pnpm --filter @6pm/i18n test` (completeness): pass.
- `tsc --noEmit -p apps/mobile`: no errors in my files (errors present belong to the concurrent Plan work: `features/plan/*`, `app/new-pot.tsx`).
- ESLint and Prettier clean on every file I touched; every file ≤ 300 lines.
- Not checked: running on a device or simulator (forbidden on this machine), so no side-by-side with `08-diary-recaps.png` / `18-missed-day-catch-up.png`; gesture arbitration between the recap pan and the tab pager is by threshold (10 pt vs 14 pt) and needs a device check.

## Open questions

1. Recap story wording (decision 1) and whether page one should ever mention Future you.
2. Should the missed-day button also cover days in an earlier month (the calendar only shows this month)?
3. Cover tints for the ten undesigned months.
4. Keep "visits" for all merchants, or add "rides" for transport?

Status: DONE_WITH_CONCERNS
Summary: The Diary tab, the missed-day sheet and the money diary zine are built on real data (domain maths with 18 new tests, read-only queries, en and vi copy). The controller still has to register two routes, and nothing has been checked on a device yet.
Evidence: domain diary tests 18/18 (full domain suite 142/142); i18n completeness passes; mobile tsc shows no errors in these files; ESLint and Prettier clean. Not checked: device or simulator comparison with renders 08 and 18; how the recap pan and the tab pager share a drag.
Concerns/Blockers: the missed sheet uses a local `CardSheet`, not `SheetFrame`, because the design is a floating card. The `as Href` casts stay until typed routes are regenerated. The recap story copy replaces the prototype's scripted line and needs the founder's review.
