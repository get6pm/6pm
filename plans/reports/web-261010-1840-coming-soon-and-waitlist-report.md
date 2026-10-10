# Coming Soon site and waitlist API

Date: 2026-10-10. Scope: `apps/web/**` (new `@6pm/web`), `POST /v1/waitlist` in `apps/api`, the waitlist contract in `@6pm/domain`, comparison renders in `design/renders/web/`. Nothing committed or deployed.

## What was built

### Site (`apps/web`)
- **Astro 7.3.5, static output.** Served as an assets-only Worker (`wrangler.jsonc`, no `main`, so no script runs per request). `dev` routes `6pm-dev.oddeggs.studio/*` and `prd` routes `6pm.oddeggs.studio/*` on zone `oddeggs.studio`. The API Worker's `<host>/api/*` route is more specific, so it wins (Cloudflare docs: "More specific routes take precedence over wildcard routes"). I didn't use `@astrojs/cloudflare`, because no route renders per request.
- **One bilingual page `/`**, as designed: English, with every Vietnamese line marked `lang="vi"`. The design has no language switch, so there is no `/vi`.
- **Scenes ported 1:1 from `6pm 2.0 Coming Soon.dc.html`:**
  - hero sunset with rippled reflection, flare and halftone
  - three title cards
  - the leak: 84 chips flying in 3D, the counter to 4.217.000₫, "Stop." with chromatic split, burst, "6pm catches all of it."
  - "How big is your leak?" calculator (6 habits)
  - the dial: 60 ticks, hand, 60 → 1
  - swipe-to-close demo: drag, 82% threshold, stamp, shake, Undo
  - odometer down to 312.000₫, with the eclipse
  - diary: 30 tiles stamping, +2.000.000₫, sticky note
  - companion: Soft / Cheeky / Roast picker
  - credits card
  - "Be there at six" with the rolling countdown to `2026-11-06T18:00:00+07:00`
  - ticket with hold-to-stamp (900 ms)
  - sticky dock, hour ruler, footer
- **Shared effects:** the time-of-day sky, fixed starfield and moon, drifting blooms, vignette, grain, and the impact flash and shake. The sky sets as you scroll by default; `?sky=six` previews "Always 6pm".
- **Companion:** `<dusk-buddy>` is ported to a TypeScript custom element (canvas) for the moods the page uses. It stops drawing when off screen.
- **Small vanilla TypeScript islands, no framework.** One bundle: 21 KB, 8.6 KB gzipped. HTML is 147 KB, 19.5 KB gzipped, with CSS inlined. No images apart from an SVG favicon.
- **Fonts are self-hosted** in `public/fonts`, using Google Fonts' own WOFF2 subsets unchanged (Latin and Vietnamese only, licences in `README.txt`):
  - Bricolage Grotesque variable (opsz, wdth, wght)
  - Be Vietnam Pro 400/600/700
  - IBM Plex Mono 400–600
  - Playfair Display italic 500
  - Patrick Hand
  - a Material Symbols Rounded subset of the 21 icons the page uses (11.6 KB)

  Each family has a local fallback face with `size-adjust` and ascent/descent overrides measured from the files. The two first-screen faces are preloaded.
- **Waitlist forms:** the quick form under the calculator and the ticket share one email and one result. They post to same-origin `/api/v1/waitlist` and show the server's ticket as `Nº 0042`.
  - The design's lines are kept: "Write your email on the receipt first." and "That doesn't look like an email yet."
  - Rate limiting, offline, timeout (10 s) and server errors show a line plus a "Try again" button.
  - "Use a different email" resets the form.
  - The leak amount is sent only after the visitor has used the calculator.
  - `language` comes from the browser locale (`vi*` → `vi`).
- **Accessibility:**
  - Semantic headings (`h1` "6pm", `h2` per scene).
  - The hold-to-stamp also fires on Enter or Space (a click with no pointer), and Enter in either email field submits.
  - There is a screen-reader-only plain submit button, plus a `role=status` success line.
  - The swipe thumb is a button that closes on Enter.
  - Persona buttons use `aria-pressed`.
  - The countdown reads as words to screen readers instead of reels of digits.
  - Reduce Motion stops the loops, flash, shake, ripple and buddy animation; entrances become a 200 ms fade.
- **Package files:**
  - `package.json` scripts: `dev` (proxies `/api` to a local API on 8787), `build`, `preview`, `typecheck` (astro check), `deploy:dev`, `deploy:prd`
  - `public/_headers`: one-year immutable cache for `/_astro/*` and `/fonts/*`, plus `nosniff` and a referrer policy
- **No new third-party dependencies, so there are no catalog changes.** `@6pm/domain` is a workspace dependency; it provides `formatVnd`, `formatShort` and the request type.

### API
- **`packages/domain/src/contracts/waitlist.ts`** (one export line added to `index.ts`):
  - `waitlistRequestSchema`: email trimmed, lowercased, valid, ≤ 254 characters; `language` `en`|`vi`; optional `leak` as an integer from 0 to 1e9.
  - `waitlistResponseSchema`: `{ticket}`.
- **`apps/api/migrations/20261010120210_waitlist.sql`:** table `waitlist` (`ticket INTEGER PRIMARY KEY AUTOINCREMENT`, `email UNIQUE`, `language`, `leak`, `created_at`).
- **`apps/api/src/routes/waitlist.ts`:** public `POST /v1/waitlist`, rate limited by the existing app-wide IP limiter. It answers `{ticket}` only.
  - It looks the email up first, then inserts with `ON CONFLICT DO NOTHING RETURNING`, then looks up again if two signups raced.
  - A test showed why the lookup comes first: an upsert that hits the unique constraint still uses up an AUTOINCREMENT value, which would leave gaps in ticket numbers.
  - A repeat signup returns the existing ticket and changes nothing.
- **`apps/api/test/waitlist.test.ts`** (18 cases):
  - a new signup is stored trimmed and lowercased, and the answer contains only `ticket`
  - tickets are sequential
  - the leak is stored as null when absent
  - a duplicate in any case or with spaces gets the same ticket, one row, and no gap
  - 4 invalid emails are rejected
  - 7 wrong bodies are rejected, the error never echoes the value, and nothing is stored
  - a body that isn't JSON is rejected
  - GET returns 404
- `index.generated.ts` was regenerated.

## Verification
- `pnpm --filter @6pm/web build` ✓ · `astro check` 0 errors · `pnpm --filter @6pm/api test` 23/23 ✓ · `pnpm --filter @6pm/domain test` 108/108 ✓ · api and domain `tsc` ✓.
- ESLint: 24 files, 0 problems. Prettier was run on every TS, CSS and JSON file I touched. `.astro` files can't be checked: the repo has no Prettier Astro plugin.
- Every file is ≤ 300 lines (the largest is `leak-calculator.astro`/`leak-card.astro`, split to 128/172).
- **Interaction run** against the build (Playwright, API intercepted), all 11 pass:
  - steppers
  - drag at 50% (doesn't close) and at 95% (closes), Undo, Enter
  - persona picker
  - a short hold sends nothing
  - a 900 ms hold stamps `0042`
  - Enter on the stamp and Enter in the field
  - quick form
  - 400, 429 and offline lines with Try again
  - Reduce Motion
- **End to end against a real local API** (`wrangler dev` with migrations applied, state kept in the scratchpad): tickets came back 0001, 0002, 0002 for the same inbox in a different case, then 0003. Rows were stored lowercased, with `language: vi` from a `vi-VN` browser.
- **Layout shift:** 0 on a normal load. With fonts delayed by 1 s it is 0.043 at 1440 and 0.010 at 390, both under the 0.1 "good" threshold. Largest paint was at 0.2–0.5 s locally.
- **Build fix found by comparison:** the CSS minifier collapsed `backdrop-filter`/`-webkit-backdrop-filter` and kept only the prefixed one, so the dock lost its blur. Writing the prefixed declaration first fixed it.

## Comparison with the prototype
I rendered the prototype and the build with the same clock and scroll positions, froze looping animations at t = 0, and compared them by eye and by RMSE.

The pairs (prototype left, build right, 50% scale) are in `design/renders/web/1440/`, `design/renders/web/390/` and `design/renders/web/states/` (closed day, stamped ticket). Scores are in `design/renders/web/rmse-scores.txt`. Page and section heights are identical at both sizes (for example 19318 px at 1440).

| Scene | 1440 RMSE | 390 RMSE | Remaining difference |
|---|---|---|---|
| Hero k 0 / 0.5 / 1 | 0.020 / 0.021 / 0.018 | 0.021 / 0.021 / 0.019 | Grain texture noise only |
| Title cards 1–3 | 0.008–0.013 | 0.008–0.012 | None visible |
| Leak: flying / count / Stop / answer | 0.007–0.008 | 0.008–0.010 | None visible |
| Your leak | 0.012 | 0.010–0.011 | None visible |
| Dial start / end | 0.011–0.012 | 0.010 | None visible |
| Close (open, and closed state) | 0.011 | 0.012 | None visible |
| Odometer start / end | 0.011–0.012 | 0.011 | None visible |
| Diary mid / end | 0.012 | 0.015–0.017 | None visible |
| Companion | 0.014–0.017 | 0.034–0.036 | The buddy canvas is mid-animation (time-dependent pose) |
| Credits | 0.011 | 0.009 | None visible |
| Waitlist | 0.020–0.028 | 0.036–0.038 | Live countdown seconds |
| Footer | 0.024 | 0.028 | Live seconds and the sleeping buddy's pose |

Where the build looked different and why it now matches:
- **Sticky note:** it renders at 23px because the prototype's runtime drops the `!important` clamp.
- **Buddy box:** it is reserved at size + 4px, because the prototype's inline canvas sits on a text baseline.
- **Credits date at 390:** the launch date is its own element, because the prototype's interpolation makes it a separate flex item that wraps on its own.

The prototype also crowds at 390: the hour ruler overlaps text, and the diary grid runs past the screen. I kept both as designed.

## Deploy
1. **D1, if not created yet.** The API config still has placeholder ids, and that file belongs to the API owners. Run `cd apps/api && pnpm exec wrangler d1 create sixpm-dev` (and `sixpm` for prd), then put each `database_id` into `apps/api/wrangler.jsonc`.
2. **Waitlist migration:**
   - `cd apps/api && pnpm exec wrangler d1 migrations apply DB --env dev --remote`
   - then the same with `--env prd`
   - this applies `20261010120210_waitlist.sql` and any earlier migrations not yet applied
3. **API:** `cd apps/api && pnpm exec wrangler deploy --env dev` (or `prd`). This publishes route `<host>/api/*`.
4. **DNS:** Workers routes need a proxied record for each host. If `6pm-dev.oddeggs.studio` / `6pm.oddeggs.studio` don't exist yet, add an originless proxied `AAAA 100::` record.
5. **Site:** `pnpm --filter @6pm/web deploy:dev` (or `deploy:prd`). That runs `astro build && wrangler deploy --env <env>`. A dry run already passes for both environments.
6. **Check:**
   - `curl -I https://6pm-dev.oddeggs.studio/`
   - `curl -X POST https://6pm-dev.oddeggs.studio/api/v1/waitlist -H 'Content-Type: application/json' -d '{"email":"you@example.com","language":"en"}'` should answer `{"ticket":N}`
   - read the list with `pnpm exec wrangler d1 execute DB --env prd --remote --command "SELECT ticket, email, language, leak, created_at FROM waitlist ORDER BY ticket"`

## States the design doesn't cover (not logged in `docs/undesigned-states.md`, which is outside my files)
- Error lines: "Too many tries from here. Give it a minute, then try again." and "Couldn't reach the list. Check your connection and try again."
- A "Try again" button, styled like "Use a different email".
- While the request is in flight, the stamp stays filled.
- A screen-reader-only success line: "You're on the list. Your ticket is number 0042."

## Unresolved questions
1. The footer links Press kit, Privacy and Contact point to `#`, as in the design. What are the real targets? A list that collects emails should link a privacy notice.
2. Nothing sends the launch email yet ("One email, at six"), and there is no unsubscribe or consent record. Who builds that, and does it need double opt-in?
3. Tickets start at 1; the prototype showed random numbers from 400 to 899. Should they start from an offset?
4. A repeat signup keeps its first language and leak. Should the latest values win instead?
5. There is no `og:image`, because the brief said "images none or SVG". Is a social card wanted?
6. `dev` and `prd` share one build, so the dev host is indexable. Should dev get `X-Robots-Tag: noindex` (through a per-environment `_headers`)?
7. Should the 390 crowding (ruler over text, diary overflow) go back to design?

Status: DONE_WITH_CONCERNS
Summary: The Coming Soon site and `POST /v1/waitlist` are built and verified. All 26 scenes at both sizes match the prototype within about 1–4% RMSE, and what remains is live clock digits, canvas animation phase and grain. Build, type, lint, API (23/23) and domain (108/108) checks pass, as does an end-to-end signup against a local API.
Evidence: build, astro check, eslint, prettier, api and domain tests, 11 Playwright interaction checks, end to end with wrangler dev and D1, CLS and LCP measurement, prototype comparison pairs in design/renders/web. Not checked: a real Cloudflare deploy, Safari or Firefox rendering, real phones, a Lighthouse run.
Concerns/Blockers: D1 database ids in `apps/api/wrangler.jsonc` are still placeholders. Footer link targets and the launch-email sender are undecided. `pnpm-lock.yaml` changed from the one install that added `@6pm/web`.
