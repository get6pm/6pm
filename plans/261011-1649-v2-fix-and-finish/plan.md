# 6pm v2: fix what's broken, then finish

Status: in progress · Started 11 Oct 2026 · Launch Fri 6 Nov 2026 18:00 ICT
Inputs: four code audits (11 Oct), all passing CI (typecheck, lint, 174 Vitest, 282 Jest) — every finding below lives where tests don't reach.
- `plans/reports/audit-261011-1604-today-close-quick-add-report.md`
- `plans/reports/audit-261011-1604-plan-diary-report.md`
- `plans/reports/audit-261011-1604-settings-onboarding-purchases-report.md`
- `plans/reports/audit-261011-1604-performance-report.md`

## Batches (one commit each, in order)

| # | Batch | Key findings | Status |
|---|---|---|---|
| 1 | Launch safety | DB key missing on a new/restored iPhone → launch crash; splash hangs if first load throws; unguarded `JSON.parse` of the plan; `SQLiteProvider` without `onError` | todo |
| 2 | The money day | One 04:00 boundary for Today, the close, the Diary and captures (M6); earlier waiting items reachable and in tonight's close (M1); closed days read beyond the pay cycle | todo |
| 3 | Today, Quick add, Close wiring | top-bar +, tappable Delete panel, double-save guards (Quick add, New pot, Scan), close card snap-back, close pause/resume, typed cash amount, wallets from onboarding, receipt rows = total, undo restores edits, Saved toast | todo |
| 4 | Capture rules | merchant rules on every capture and learned in the close (M8), duplicate merge with source trail (M9), work question for QR spends (M10) | todo |
| 5 | Plan correctness | pot set-aside moves each cycle, months-left by cycle, what-if and New pot use the joined share (M5/M2a), river pre-join segment, pot maths into domain; edit/delete pots, bills, income, payday; bill due day in onboarding; Future you goals; 1-pot free gate | todo |
| 6 | Settings, reminders, Max | close time 15:00–23:45 picker, notification tap → close, reminder after restore + reschedule on launch, serious mode hides companion everywhere, Max icons for members, Year book gate, Max welcome backup line and href, delete-all errors, Scan stuck on hand-off, honest copy, universal link `/app/*`, Max tiles match what exists | todo |
| 7 | Performance | pause sky/companion when not visible, companion per-frame allocations, store selectors + memoised pages, tab switch work, rain/fog blur, layout props → transforms, minute tick re-render, lazy tab mount + splash on first layout | todo |
| 8 | Unbuilt features | receipt + money diary share image, Ask 6pm, voice, share extension OCR, receipt email, App Intent, widgets/Live Activity, export, Year book, Travel | todo |
| 9 | Docs | undesigned-states refreshed (stale rows, no phase ids), build plan statuses | todo |

## Acceptance

- Each batch: focused tests for money/time/state-machine changes, typecheck + lint green, simulator check where UI changed.
- After 1–7: a TestFlight build; founder re-test list in the final report.
