# 6pm v2: full build

Status: in progress · Started 10 Oct 2026 · Launch target Fri 6 Nov 2026 18:00 ICT
Inputs: `docs/product-decisions.md`, `docs/tech-decisions.md`, `docs/design-system.md`, `plans/reports/design-inventory-261010-1732-6pm-v2-prototype-report.md`, `plans/reports/researcher-261010-1732-old-6pm-and-reference-stacks-report.md`.

## Phases

| # | Phase | Depends on | Status |
|---|---|---|---|
| 01 | [Foundation](phase-01-foundation.md): workspace, domain core, theme engine, i18n, fonts/icons, app + API skeletons, CI | — | done |
| 02 | [Shell and motion](phase-02-shell-and-motion.md): tab pager + scrub/condense bar, FAB, sheets, island toasts, Skia sky (Basic, Golden Hour), companion, odometer | 01 | in progress |
| 03 | [Today, Inbox, Details, store](phase-03-today-and-store.md) | 02 | in progress |
| 04 | [Quick add and the 6pm Close](phase-04-quick-add-and-close.md) | 03 | in progress |
| 05 | Plan: river, daily bars + what-if, bills, Future you, occasions/pots | 03 | built (simulator-checked) |
| 06 | Diary: week recap, calendar, day receipt, missed day, money diaries | 04 | built (simulator-checked) |
| 07 | Onboarding v2 (wheels), Settings, close reminder notifications, serious mode, Categories and rules | 03 | built; Settings and Categories simulator-checked, onboarding welcome checked (later steps need taps) |
| 08 | Capture: VietQR scan-to-pay + pending, share extension OCR, receipt email (API), App Intent, voice | 04 | todo |
| 09 | System surfaces: widgets, Live Activity, controls, notification actions (native batch) | 08 | todo |
| 10 | Looks (all 11 + try-on), RevenueCat purchases, Max paywall, welcome and gates | 02 | todo |
| 11 | Ask 6pm, encrypted backup and export, travel/FX | 05, 10 | todo |
| 12 | Coming Soon site + waitlist; deployed dev/prd on `6pm.oddeggs.studio` | 01 | done |
| 13 | Release: signed builds on `ai.sixpm.app`, TestFlight, store listing | all | in progress: tag `testflight/*` builds and submits (builds 59 and 60) |

## Acceptance (launch)

- Every state in `design/renders/app` and `design/renders/onboarding` reproduced on device, compared side by side.
- Domain maths reproduces the prototype seed (49.000 safe today / 351k line / 353k tomorrow) and the decisions in product-decisions §3.
- 60 fps on iPhone 12-class hardware for tab paging, card swipes and the sky.
- en + vi complete; offline works for everything but email capture, Ask phrasing and backup.

## Founder gates

Apple team + RevenueCat for `ai.sixpm.app` (before phase 13 and IAP testing in 10); Cloudflare zone `oddeggs.studio` access (phase 12); open items in product-decisions.
