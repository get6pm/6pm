# 6pm: agent contract

Binding for every coding agent working on 6pm v2 (branch `v2` of `get6pm/6pm`).

## Read before coding

1. [docs/product-decisions.md](docs/product-decisions.md) §1 (rules that never bend) and the section your task touches.
2. Your phase file in `plans/261010-1743-6pm-v2-full-build/`, then your task.
3. [docs/tech-decisions.md](docs/tech-decisions.md) §1 and §4 (motion contract); [docs/design-system.md](docs/design-system.md) for any UI.
4. For interface work: the prototype markup for your screen (`design/prototype/6pm App.dc.html`, line refs in `plans/reports/design-inventory-*.md`) and its renders in `design/renders/`.

Precedence: product decisions > phase file > prototype > older reports.

## The bar

- **Native feel is the product.** UI-thread animation only (Reanimated worklets, Gesture Handler). Every state change animates with the prototype's curve. No layout jumps, no blank frames, no JS-thread `Animated`.
- **Pixel- and colour-exact.** Sizes, radii, spacing, type and colour come from the prototype; colour only through `@6pm/theme`. Compare against `design/renders/` before calling UI done.
- **Real behaviour only.** No fake timers standing in for real work (the prototype fakes camera, payments and Ask; we don't).

## How to work

- **Owns list.** Change only files your task lists. Needing more: stop and report `NEEDS_CONTEXT`.
- **Tests where they protect behaviour:** money maths, the close state machine, parsers (VietQR, amounts, receipts), sync/backup, permissions, purchases. No snapshot tests. Run only the file you changed locally: `pnpm --filter @6pm/<pkg> test -- <file>`.
- **No ids in code.** No plan, phase or task ids in code, comments, test names or commits. No "MVP", "v2", "later" for designed behaviour.
- **Undesigned states** are built from existing components and logged in `docs/undesigned-states.md` (screen, state, reason).
- Copy is never hard-coded in a screen: it comes from `@6pm/i18n` (en + vi). Companion lines come from the companion catalogue.

## Repo conventions

- Packages are `@6pm/<dir>`, ESM, export TS source. Versions live in the `catalog:` of `pnpm-workspace.yaml`; pnpm 12 blocks install scripts unless listed under `allowBuilds`.
- TypeScript 6 strict (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax`). Named exports except route files and configs. Files ≤ 300 lines.
- Relative imports are extensionless (Metro cannot map `.js` to `.ts`).
- Money is integer đồng. All money/time maths lives in `@6pm/domain`, never in a screen.
- Run `pnpm exec prettier --write` on what you changed.

## This Mac

- Native work is checked on the local iOS simulator (Xcode 27, iOS 27 runtime): the commands are in [docs/tech-decisions.md](docs/tech-decisions.md) §6. CI's `native-build.yml` stays the gate for signed and TestFlight builds. `apps/mobile/ios` is generated and ignored; regenerate it after any native change (`expo prebuild -p ios --clean`).
- Kill only process ids you started. Never `pkill -f` / `killall`. Never `git stash`.
- Temp files go in the session scratchpad, never the repo.

## Secrets

Only `.env.example` files are committed. Never print a secret value; list names only.

## Commits

Branch from `v2` as `feat/<area>-<behaviour>`; conventional commits; one commit per task; no AI references or attribution lines.

## Status

End every pass with:

```
Status: DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT
Summary: one or two sentences
Evidence: tests run, screenshots compared; what was not checked
Concerns/Blockers: optional
```
