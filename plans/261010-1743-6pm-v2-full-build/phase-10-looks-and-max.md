# Phase 10: Looks and 6pm Max

status: built (sandbox purchase and gates todo)

## Context

- Product: `docs/product-decisions.md` §5 (free tier, 49.000₫ classic looks, 99.000₫ living scenes, Max 78.000₫/month or 598.000₫/year with a 7-day trial; prices read from the store).
- Looks: `plans/reports/design-inventory-261010-1732-6pm-v2-prototype-report.md` §7 (catalogue, palette, atmosphere per look), prototype `App:2097-2196` (themes), `App:2253-2361` (`atm`, `premiumAtm`), `App:2222-2252` (`sunFx`, `sig`), layer markup `App:62-121`, `App:1929-1941`.
- Engine: `packages/theme` already computes every look's palette and atmosphere (`paletteFor`, `atmosphereFor`, `sunFor`). The Skia sky (`apps/mobile/src/ui/sky`) draws the shared layers (blooms, sun, flare, moon, bokeh, halftone, leak, vignette, grain) from the slot array for any look.
- Screens: Looks shop `App:857-912`, `App:2426-2461`; Max `App:2394-2425`, `App:2445-2452`; renders `design/renders/app/11-looks-shop.png`, `12-6pm-max.png`, `13-max-welcome.png`.

## Scene layers

A look's own layers live in `apps/mobile/src/ui/sky/scenes/<lane>/` and take `SceneProps` (`scenes/scene-props.ts`): the hour's atmosphere object, palette, size, the sky clock and scroll. Hour-driven numbers tween through `useSceneTween`. They draw inside the sky's Skia canvas at two depths, as the prototype stacks them: **middle** (after the light leak, before the vignette) and **top** (after grain). Sun extras (thread, ghost sun, masks) draw with the sun. The controller wires lanes into `sky.tsx`.

## Tasks

1. Weather lane: rain tile (Neon Noir, Monsoon), drops sliding on the glass, fog drift, lightning flash at night; Neon's city-light bokeh check.
2. Surface lane: Arcade (dot screen, CRT vignette, rolling bar, scanlines, striped sun mask, text glow), Holo Foil (conic foil, sheen, sparkles, conic sun), Sơn Mài (metal bloom, sheen sweep, gold-leaf glints, metallic sun), Riso (hard blooms, ghost sun off-register, banded sky).
3. Scene lane: Long Exposure (star-trail rings, car light-trails on four lanes, no sun), Paper Diorama (five parallax hill layers per variant, paper clouds, sun on a thread, night tint), Lantern River (wires with bulbs, swaying silk lanterns, river reflections and floating lanterns).
4. Look fonts: Barlow Condensed, Baloo 2, Lora, Playfair Display, Cormorant Garamond, Unbounded embedded; the display face follows the look.
5. Looks shop sheet (Settings → Look): Max card, grid of live look cards, try-on, Restore purchases; Settings Look card.
6. Purchases: RevenueCat, App Store products for the 9 looks and Max (monthly, yearly, trial), entitlement store, Max sheet and welcome, gates (Ask, pots, icons, widgets in look).

## Done when

Each look at 08:30, 14:00, 18:07 and 21:30 compared with the prototype rendered in Chromium (same harness as the Golden Hour sky); the shop matches `11-looks-shop.png`; a sandbox purchase unlocks a look and Max unlocks all.
