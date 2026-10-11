# Looks shop, look detail + try-on, Max sheet + welcome, purchases port

Date 2026-10-11. Lane: looks-shop. Nothing run on device (no Metro, simulator or native build).

## Built

Routes (apps/mobile/src/app): `looks.tsx`, `look/[id].tsx`, `max.tsx` (`?from=<gate>`), `max-welcome.tsx` (`?from=&look=`).

Data: `data/look-settings.ts` (+ `.test.ts`, node:sqlite). One JSON `settings` row, key `look`: `{ look, config: { <lookId>: Partial<LookConfig> } }`, zod-validated both ways, config cleaned to what each look has (variant in range, intensity 0-100, its two switches). Store: `setLook(id, canUse)` refuses a look the predicate rejects; `setConfig(id, patch, {persist})` (a slider drag persists once on release); `setTryOn(id|null)` (memory only); `reload()`. Writes are queued, last state wins; a failed write goes to `onError` (console.error by default) and the look stays on screen.

`features/purchases/`:
- `products.ts` ids and entitlements in ONE module. `purchases-port.ts` (`PurchasesPort`, `CustomerState`, `Offerings`, `unavailablePurchases`). `revenuecat-port.ts` (react-native-purchases; unset key = unavailable). `revenuecat-customer.ts` (pure mapping, tested). `entitlement.ts` (free ∪ owned ∪ all-if-Max, `resolveLook` falls back to Golden Hour; tested). `max-pricing.ts` (yearly saving % and per-month text from the store's prices, trial only when the store offers it for this Apple ID; tested). `max-status.ts`, `max-context.ts` (gate list, tile order, dense tile rows, welcome action; tested), `confetti.ts` (seeded, tested), `customer-memory.ts` (last known customer, read synchronously at launch so the first frame wears the right look).
- `purchases-provider.tsx`: `PurchasesProvider`, `usePurchases()`, `useEntitlement()`.
- Max UI: `max-sheet.tsx` (+ `max-sheet-frame.tsx`, `max-hero.tsx`, `max-glow.tsx` Skia blur, `max-tiles.tsx`, `max-tile-art.tsx`, `max-footer.tsx`, `max-colours.ts`), `max-welcome.tsx`.

`features/looks/`: `looks-shop.tsx`, `look-card.tsx`, `shop-max-card.tsx`, `sheet-header.tsx`, `look-preview.tsx` (+ `look-signature.ts` port of the prototype's `sig()`, `look-signature-art.tsx`), `look-detail.tsx` (+ `look-detail-parts.tsx`, `variant-picker.tsx`, `intensity-slider.tsx`), `look-catalogue.ts`, `look-copy.ts`, `look-settings-provider.tsx`, `look-card-lines.ts`.

i18n: `packages/i18n/src/en-looks.ts`, `vi-looks.ts` registered in `en.ts`/`vi.ts`; `pnpm --filter @6pm/i18n test` passes. A look's own words (tag, intensity name, 2 switches x label/sub, variants, a few names) are keyed `looks.<kind>.<look>...`; where Vietnamese reads the same as the engine (Neon Noir, Hội An, ...) there is no key and `look-copy.ts` uses the engine text. `look-copy.test.ts` proves en equals the engine and every vi key resolves.

## Wiring the controller must do

1. `app/_layout.tsx` stack: `looks` (`sheet`), `look/[id]` (`sheet`: transparent modal, it draws its own panel 384 pt down), `max` (`sheet`), `max-welcome` (`takeover`).
2. Providers inside `SQLiteProvider`, above `I18nProvider`: `<PurchasesProvider>` then `<LookSettingsProvider>`. Both read their saved state synchronously.
3. Root theme: `PlanTheme` becomes `const themeLook = useThemeLook(); <ThemeProvider {...themeLook} serious={plan?.serious ?? false}>`. `useThemeLook()` (features/looks/look-settings-provider) returns `{look, config?}` = try-on look, else the chosen look (Golden Hour if no longer the customer's), with that look's settings. Try-on is therefore live on the whole app, including the sheet.
4. Settings: Look card calls `router.replace('/looks')` (replace, not push: the shop and the try-on sheet each stand in for Settings, as the prototype's single sheet state does, and the app must show through behind the try-on). Card text from `useLookCardLines()` -> `{name, line}` ("Saigon · 7 more in the shop"); a preview can reuse `LookPreview` + `SHOP_PREVIEW`. Max card calls `router.push({pathname:'/max', params:{from:'looks'}})`; its status line: `useMaxStatusLine(customer)` (features/purchases) and `maxPriceLine` is built in `shop-max-card.tsx` if you want the same copy. The shop's "‹ Settings" does `router.replace('/settings')`, Done does `router.dismissAll()`.
5. `deleteAll` in Settings wipes the `settings` table: call `useLookSettingsStore().reload()` after it.
6. Gates open Max with `router.push({pathname:'/max', params:{from:'ask'|'pots'|'shared'|'travel'|'backup'|'diary'|'widgets'|'icons'|'buddy'|'looks'}})`; use `useEntitlement().max` to decide. The companion's Max form: `useEntitlement().max ? 'max' : 'base'`.
7. EAS/env: `EXPO_PUBLIC_REVENUECAT_IOS_KEY` (public iOS SDK key) in `.env.example` and the EAS profiles (I may not edit them). Unset = every purchase screen shows no price and the buy buttons are disabled.
8. `useCompanionToast` has no `maxOn`/`maxOff` events; not needed by these screens.

## Store products to create

App Store Connect, app `ai.sixpm.app`, same ids for every build:
- Auto-renewable, in the EXISTING group "Premium Subscriptions": `ai.sixpm.app.max.monthly` (1 month, tier near 78.000₫), `ai.sixpm.app.max.yearly` (1 year, tier near 598.000₫). Introductory offer on both: free, 7 days, new subscribers. en + vi display names/descriptions.
- Non-consumable: `ai.sixpm.app.look.neon`, `.riso`, `.lacquer`, `.monsoon`, `.holo`, `.arcade` (49.000₫ tier) and `ai.sixpm.app.look.expo`, `.paper`, `.lantern` (99.000₫ tier).

RevenueCat (existing v1 project): add the 11 products; entitlement `max` = the 2 Max products + `growth_monthly`, `growth_annually`, `wealth_monthly`, `wealth_annually`; entitlements `look_neon` ... `look_lantern`, one per look product (the app also accepts the bare non-subscription transaction when no entitlement exists, and lets a present-but-inactive entitlement win over an old transaction, i.e. a refund removes the look). No offering is needed: the app fetches products by id. The yearly per-month figure is the store's `pricePerMonthString`; the saving % is computed from the two store prices.

## Undesigned states to log (docs/undesigned-states.md)

| Screen | State | What the app does | Why |
|---|---|---|---|
| Looks shop / Max card / Max sheet | Store has not answered, or purchases unavailable | No price on the card badge, Max line or plan tiles; buy buttons disabled; note "The App Store isn't answering..." | Prices are read from the store, never hard-coded |
| Look detail | Buy | The real StoreKit sheet replaces the prototype's fake Face ID card; button shows a spinner and "Waiting for the App Store..." | Real behaviour only; no fake 1.3 s timers |
| Look detail / Max | Purchase fails | Toast "That didn't go through. Nothing was charged." (cancel says nothing) | Undesigned |
| Shop / Max | Restore finds nothing, or fails | Toast: "Nothing to restore on this Apple ID." / "Couldn't reach the App Store. Try again." (found uses the companion's `restored` line) | Undesigned |
| Max sheet | Trial not offered to this Apple ID (already used) | Button "Subscribe to Max", terms without a trial | Trial eligibility is the store's answer |
| Max sheet | Max on | Plan tiles hidden, status line (trial ends / renews / ends, store dates), "Manage subscription" opens Apple's sheet | Prototype turned Max off locally |
| Max welcome | Gate whose screen is not built (Ask, sharing, widgets, companion) | Single button "Back to my day" | No destination exists yet |
| Max welcome | Unlocks list says "Backup is on" | Kept as designed | Backup is not built; see open questions |
| Max sheet | Terms / Privacy links | Terms = Apple's standard EULA; Privacy = `https://6pm.oddeggs.studio/privacy` | No such page exists yet |
| Look detail | Intensity slider | Own Gesture Handler slider (4 pt track in the accent, 28 pt white thumb) | The render set has no try-on frame; the prototype used a browser range input |

## Deviations

- Shop's header is a custom `BackSheetHeader` on `SheetFrame` (the design has "‹ Settings / Looks / Done"; `SheetScreen` has no back). It uses the prototype's 14 pt side padding.
- No blur behind the shop's Max badge, the try-on pill and the Max close button (CSS `backdrop-filter`): plain translucent fills. Drop shadow on the Max companion omitted.
- CSS gradients React Native cannot draw are redrawn: repeating rain/trail hairlines (Neon, Monsoon) as a tiled, rotated line; Arcade scanlines as a tiled strip; Long Exposure rings and Holo's conic foil and sun as a small Skia canvas. Double-position stops are expanded to two stops. `look-signature.test.ts` parses every layer, variant and hour with React Native's own parsers.
- Max hero/welcome glow is a Skia blur + saturation matrix over nine bands (CSS `filter`), not a CSS-identical filter.
- The shop hides itself (opacity 0) while a look is tried on, so the real app shows behind the try-on sheet; the shop sets try-on before pushing so the first frame is already in the look.
- Welcome stamp, rise and confetti are Reanimated; Reduce Motion drops the confetti and the delays.

## Not visually checked

Everything. Nothing was run. Compared by reading markup line by line against `App:857-1100` and the three renders: sizes, radii, gaps, type sizes and the ordering. Specifically unverified: card previews per look (esp. Neon/Monsoon hatch angle and phase, Paper/Lantern percent-sized ellipses, Holo sweep angle), the Max banner bands, the hero glow strength, the slider's look, floating-card timing, the confetti fall, Hermes `Intl` use (none; dates use `useI18n().dayMonth`).

## Verification

`tsc --noEmit -p .` clean (ui/sky/scenes errors ignored; none appeared). eslint clean on all my files. Jest: 9 suites, 57 tests (look-settings on node:sqlite, entitlement, RevenueCat mapping, pricing, tile layout, welcome action, confetti, look copy, catalogue, signature). `pnpm --filter @6pm/i18n test` passes.

## Open questions

1. Dev builds (`ai.sixpm.app.dev`) use the same product ids as production: confirm the products are reachable from the dev bundle (sandbox on the dev app record, or a local StoreKit configuration), or ids will not resolve there.
2. Privacy page URL (`/privacy` on 6pm.oddeggs.studio) must exist before submission; Terms points at Apple's standard EULA.
3. "Backup is on" in the welcome's unlock list claims a feature that is not built. Keep until backup ships, or reword?
4. Apple's VND price points will not be exactly 78.000₫ / 598.000₫ / 49.000₫ / 99.000₫; the UI shows whatever the store returns.
5. Intro-offer eligibility is per subscription group, so v1 subscribers who took a trial are not offered one; the UI follows the store.

Status: DONE_WITH_CONCERNS
Summary: Shop, look detail with live try-on, Max sheet and welcome, purchases port (RevenueCat + unavailable), look settings store, i18n (en + vi) are built and wired through hooks; the controller still has to register routes/providers and the Settings cards.
Evidence: tsc clean, eslint clean, 57 Jest tests and the i18n suite pass; markup compared line by line against the prototype and renders; nothing was run on a device or simulator, so no visual comparison was done.
Concerns/Blockers: Controller wiring above; store products must be created before purchases work; dev-bundle product ids, privacy URL and the "Backup is on" copy need a founder call.
