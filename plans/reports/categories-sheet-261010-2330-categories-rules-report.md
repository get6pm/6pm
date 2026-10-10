# Categories & rules sheet: report

## Built
- `apps/mobile/src/app/categories.tsx`: route (default export). It uses `SheetScreen` and has the intro, "Your categories" (count, rows, New category) and "Learned from you" (rules, an empty state and a note). The editor overlay is rendered as a sibling of the sheet.
- `apps/mobile/src/features/categories/`
  - `category-list.tsx`: category row (38pt tile, name 16/550, tally sub, Not daily chip, chevron), New category row (dashed tile), `ListSection` (an animated card whose height follows its rows)
  - `rule-list.tsx`: rule row (merchant → mini tile + category, sub, × remove), "Nothing learned yet."
  - `category-editor.tsx`: floating card (inset 8, radius 44) over the sheet, with dim. It rises in 0.45s on the house enter curve. Cancel, tapping the backdrop or dragging the grabber/header (120pt or a flick) dismisses it. It has the name input, the icon grid, hue swatches, the daily Switch and Delete (red oklch(0.66 0.19 25)).
  - `icon-picker.tsx`: 9 prototype packs, 6 per row in a 292pt scroll well. When an icon is selected, the tile overlay fades in over 0.2s. Max packs are locked.
  - `hue-picker.tsx`: 8 hues; the selection ring fades in over 0.2s.
  - `icon-packs.ts`: pack data and hues
- `apps/mobile/src/data/category-actions.ts` (+ test against real in-memory SQLite)
  - `saveCategory` (create appended to sort / edit in place), `deleteCategory`, `readRules`, `removeRule`, `tallyByCategory`, `fallbackFor`
- i18n: `en-categories.ts` and `vi-categories.ts` are spread into `en.ts` / `vi.ts`
- `docs/undesigned-states.md`: 4 rows (back label, sub-line, Max packs, delete semantics)

## Behaviour notes
- Rules and spends store **category id**, so a rename re-files nothing. That is correct by construction, and a test covers it.
- Delete runs in one transaction. It moves spends in every cycle to the first other active category, deletes that category's rules, and archives the row (`archived_at`) so the spends FK stays valid. Then `store.load` runs, so Today/Details update. The last category cannot be deleted: there is no delete button, and the action also returns null.
- Save/edit publishes the new categories snapshot (`countsDaily` changes flow into `dayOf`). Save gives a success haptic plus the `catSaved` companion toast. Delete and rule removal give a tap haptic.
- Sub-line: the count and total of this pay cycle's non-skipped spends (`formatShort`), or "Nothing yet this month".
- Rows animate: FadeIn/FadeOut plus a spring LinearTransition. Initial category rows skip entering (`LayoutAnimationConfig`). Rules rise in (FadeInDown 250ms).

## For the controller
- Register `categories` in `_layout.tsx` with the same transparent-modal presentation as the other `SheetScreen` routes. Link it from Settings (and from Details if wanted).
- The Max icon packs are not tappable until a Max sheet exists. The prototype calls `openMax('icons')` there.
- Not checked on the simulator, as instructed. Pixel comparison with `design/renders/` is still to do.

## Checks
- `npx tsc --noEmit -p .`: clean. eslint on all touched files: clean. Prettier applied.
- `npx jest`: 12 suites, 68 tests pass (including 4 new ones). `pnpm --filter @6pm/i18n test`: pass.
