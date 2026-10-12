# Phase 01: Foundation

status: done

## Context

- Scootch root configs and mobile/api skeletons: `~/Projects/scootch` (copy, then own).
- Money maths: inventory §4; theme engine: inventory §7, prototype `App:2058-2196`.

## Owns

Root configs, `packages/domain`, `packages/theme`, `packages/i18n`, `apps/mobile` skeleton, `apps/api` skeleton, `.github/workflows/ci.yml`, `tools/`.

## Tasks

1. Workspace: `package.json`, `pnpm-workspace.yaml` (Scootch catalog subset), tsconfig/eslint/prettier/vitest, `.gitignore`, `.env.example`.
   - Done when: `pnpm install` succeeds; `pnpm -r typecheck` clean.
2. `@6pm/domain`: money format (`fmt`, `num`, `short`), plan maths (`computeDay`), pay cycle days, close-time rules, amount parser (vi/en), category prediction by hour.
   - Done when: tests reproduce the prototype seed (safe 49.000, line 351k, tomorrow 353k) and the formatting examples.
3. `@6pm/theme`: looks catalogue (ids, names, prices, fonts, variants, controls), keyframe tables ported programmatically from the prototype, `palette(look, cfg, hour, serious)` → tokens, oklch → sRGB, category tile colours, motion curves.
   - Done when: tests match prototype outputs for Golden Hour at 18.12 and serious mode.
4. `@6pm/i18n`: en/vi catalogue types, `translate`, completeness test.
5. Fonts and icons: static font files (Bricolage Grotesque, Be Vietnam Pro, IBM Plex Mono, Patrick Hand) and Material Symbols Rounded outline/filled instances + codepoint map.
6. `apps/mobile`: Expo 58 app config (`ai.sixpm.app[.dev]`), expo-router root with gesture root, SQLite provider + migration runner, theme provider driven by the clock, first screen rendering the sky + hero number from domain.
   - Done when: `expo export --platform ios` bundles; simulator dev build shows the Today hero over the Golden Hour sky.
7. `apps/api`: Hono Worker skeleton (route registry, `/api/health`, `/api/devices`), wrangler config for dev/prd hosts, D1 migration runner, vitest pool-workers.
   - Done when: tests pass in workerd.
8. CI: install, typecheck, lint, format check, package tests, api tests, mobile jest.

## Risks

- RN 0.88-rc + Expo 58 native build size/time on this Mac (25 GB free). Mitigation: one simulator build, delete outputs after.
- Static instancing of Material Symbols needs `fonttools`; fallback: ship the variable font and use `fontVariationSettings` on iOS.
