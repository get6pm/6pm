# Phase 02: Shell and motion

status: in progress

## Context

- Prototype shell: `App:521-563` (top nav, tab bar, FAB), gestures `App:2911-2988`, `gest()` `App:2989-3006`.
- Motion contract: `docs/tech-decisions.md` §4; tokens in `packages/theme/src/motion.ts`.

## Owns

`apps/mobile/src/features/home/**`, `apps/mobile/src/ui/{primitives,navigation,odometer.tsx,haptics.ts}`, `apps/mobile/src/app/{_layout,index,settings,quick-add,scan}.tsx`. Parallel lanes: `ui/sky/**` (sky agent), `ui/companion/**` + `packages/i18n/src/*-companion.ts` (companion agent), `packages/domain/src/vietqr/**` (VietQR agent).

## Tasks

1. Home shell: Today/Plan/Diary pager (finger-follow ×0.45, ×0.16 at edges, fade to 70 %, switch past 70 pt or a flick, directional slide-in 44 pt / 420 ms). — built; renders correctly on the iOS 27 simulator, gestures not yet exercised (headless simulator takes no touches)
2. Glass tab bar: overshooting active pill, scrub with ticks, condenses 64→52 on scroll-down past 80 pt, labels hide; FAB tap → Scan, hold 480 ms → Quick add. — built; renders correctly on the iOS 27 simulator, gestures not yet exercised (headless simulator takes no touches)
3. Compact top bar (fades in past 250 pt on Today / 40 pt elsewhere, blur + sheet at 84 %, tap → scroll to top); sky edge fade. — built
4. Hero parallax (×0.5, scale to 0.9, fade by 300 pt), odometer hero, animated meter. — built
5. Sheets drawn by `SheetFrame` (58 pt top, 40 pt corners, header drag to dismiss) over transparent modals — native form sheets mis-laid out content on iOS 27 + RN 0.88 rc; full-screen takeovers native. — built, checked on simulator
6. Sky (Skia atmosphere: Basic, Golden Hour, serious) behind home. — done, ≤0.7/255 mean diff vs prototype
7. Companion (Skia, moods, Max form) + line catalogue en/vi. — done
8. Dynamic-Island-style toast host and the undo pill. — todo
9. Today sheet contents: companion bubble, tonight card, week strip, list rows with swipe confirm/delete. — phase 03

## Done when

Side-by-side with `design/renders/app/01-today.png`, `07-plan.png`, `08-diary-recaps.png`; 60 fps paging and scrolling on the simulator's performance monitor; Reduce Motion honoured.
