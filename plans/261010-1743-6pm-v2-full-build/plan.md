# 6pm v2: full build

Status: in progress · Started 10 Oct 2026 · Launch target Fri 6 Nov 2026 18:00 ICT
Inputs: `docs/product-decisions.md`, `docs/tech-decisions.md`, `docs/design-system.md`, `plans/reports/design-inventory-261010-1732-6pm-v2-prototype-report.md`, `plans/reports/researcher-261010-1732-old-6pm-and-reference-stacks-report.md`.

## Phases

| # | Phase | Depends on | Status |
|---|---|---|---|
| 01 | [Foundation](phase-01-foundation.md): workspace, domain core, theme engine, i18n, fonts/icons, app + API skeletons, CI | — | done |
| 02 | [Shell and motion](phase-02-shell-and-motion.md): tab pager + scrub/condense bar, FAB, sheets, island toasts, Skia sky (Basic, Golden Hour), companion, odometer | 01 | built; audited and fixed 11 Oct (fix-and-finish batches 1–7); device check in the TestFlight pass |
| 03 | [Today, Inbox, Details, store](phase-03-today-and-store.md) | 02 | built; audited and fixed 11 Oct (fix-and-finish batches 2–4); device check in the TestFlight pass |
| 04 | [Quick add and the 6pm Close](phase-04-quick-add-and-close.md) | 03 | built; audited and fixed 11 Oct (fix-and-finish batches 2–4); device check in the TestFlight pass |
| 05 | Plan: river, daily bars + what-if, bills, Future you, occasions/pots | 03 | built (simulator-checked) |
| 06 | Diary: week recap, calendar, day receipt, missed day, money diaries | 04 | built (simulator-checked) |
| 07 | Onboarding v2 (wheels), Settings, close reminder notifications, serious mode, Categories and rules | 03 | built; Settings and Categories simulator-checked, onboarding welcome checked (later steps need taps) |
| 08 | Capture: VietQR scan-to-pay + pending, share extension OCR, receipt email (API), App Intent, voice | 04 | built 12 Oct: Scan to pay, share extension OCR, App Intent + Wallet automation, voice; receipt email built 13 Oct |
| 09 | System surfaces: widgets, Live Activity, controls, notification actions (native batch) | 08 | built 12 Oct: widgets, Live Activity, controls (fix-and-finish batch 8); device check in the TestFlight pass |
| 10 | [Looks and Max](phase-10-looks-and-max.md): all 11 looks + try-on, RevenueCat purchases, Max paywall, welcome and gates | 02 | built: 9 paid skies within 2/255 of the prototype and seen on the simulator; shop, try-on, Max sheet and welcome built; 11 store products ready and in RevenueCat, each with its review screenshot; Max gates wired for Ask, pots, icons, Travel, export, backup, Year book, widgets and the companion; sandbox purchase on TestFlight todo |
| 11 | Ask 6pm, encrypted backup and export, travel/FX | 05, 10 | Ask 6pm built 11 Oct; encrypted backup built; export CSV, Year book, travel/FX and the Max companion built 13 Oct; Budget together (shared pots, Sign in with Apple) merged 13 Oct (#406); API and D1 migration deployed to dev and prd |
| 12 | Coming Soon site + waitlist; deployed dev/prd on `6pm.oddeggs.studio` | 01 | done |
| 13 | [Release](phase-13-release.md): signed builds on `ai.sixpm.app`, TestFlight, store listing | all | in progress: 2.0.0 build 65 (all extensions) on TestFlight 12 Oct; 6pm Dev app created for rehearsal builds; TestFlight 2.0.0-14 and -15 13 Oct, -16 (Budget together) building; App Store 2.0.0 version created 13 Oct with en + vi name, subtitle, description, keywords, What's New and review notes (manual release); screenshots uploaded (iPhone and iPad 13", en + vi); App Privacy labels to publish on the day 2.0.0 is submitted (publishing earlier would change the live 1.0.2 page) |

## Acceptance (launch)

- Every state in `design/renders/app` and `design/renders/onboarding` reproduced on device, compared side by side.
- Domain maths reproduces the prototype seed (49.000 safe today / 351k line / 353k tomorrow) and the decisions in product-decisions §3.
- 60 fps on iPhone 12-class hardware for tab paging, card swipes and the sky.
- en + vi complete; offline works for everything but email capture, Ask phrasing and backup.

## Founder gates

Apple team + RevenueCat for `ai.sixpm.app` (before phase 13 and IAP testing in 10); Cloudflare zone `oddeggs.studio` access (phase 12); open items in product-decisions.
