# Phase 04: Quick add and the 6pm Close

status: in progress

## Owns

`packages/domain/src/close/**`, `apps/mobile/src/features/close/**`, `apps/mobile/src/app/{close,quick-add}.tsx`.

## Tasks

1. Close state machine (cards → sorted → cash/sweep → question → receipt → reveal; undo; pause). — done, 11 tests incl. property test
2. Close screen: card stack with drag physics and stamps, sorted beat, cash chips, work question, printed receipt with stamp, reveal odometer and month dots, edit overlay, decisions saved as they happen. — built, device check pending
3. Close reminder notification at the close time; "Close paused" / resume on Today. — todo
4. Quick add: ticket, keypad (k / 000 / ₫→$), category tiles predicted by hour, wallets, voice. — todo
5. Share the receipt as an image. — todo

## Decisions taken here

- Work question asks about the largest waiting spend ≥ 100k read from a bank receipt or email (the prototype hard-codes one). Logged in product decisions.
- Leaving the close keeps every decision already made; reopening resumes with what still waits.
