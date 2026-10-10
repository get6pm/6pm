# Phase 03: Today, Inbox, Details and the local store

status: in progress

## Owns

`apps/mobile/src/data/**`, `apps/mobile/src/db/migrations/**`, `apps/mobile/src/features/{today,inbox}/**`, `apps/mobile/src/app/{inbox,(dev)/index}.tsx`, `packages/domain/src/contracts/local-rows.ts`.

## Tasks

1. Encrypted SQLite (SQLCipher key in Keychain), money tables migration, zod row contracts. — done
2. Money store: snapshot + `useSyncExternalStore`, write-then-publish actions (add, status, undo, work, close day). — done
3. Today sheet: companion greeting, tonight card + week strip, list with swipe confirm/delete, Inbox row. — done, device check pending
4. Inbox sheet: sections, keep, confirm all. — done, device check pending
5. Spend detail sheet (category chips, rule prompt "Always file X as Y?", pot, paid with, note, source trail, delete with undo). — todo
6. Categories and rules sheet; merchant rules applied to new captures. — todo
7. Undo toast host (Dynamic-Island style). — todo
8. Developer fixture "Load the designed Friday" for design comparison. — done
9. Month and week reads beyond the pay cycle (week strip across a payday). — todo
