# 6pm in every currency

Status: in progress · Started 15 Oct 2026 · Branch `feat/money-home-currency` (from `main`)
Decided by the founder 15 Oct 2026: the app's currency is the phone's currency, 6pm works in every country, and no bank list falls back to Vietnamese banks.

## The model

- **Home currency.** Read once from the phone (`expo-localization` currency code) when the month is first set up, kept in the plan setting (`plan.currency`, backed up with the plan). A plan saved before has none and is `VND`, so old backups restore as they were.
- **Amounts stay integers**, now in the home currency's minor unit (cents for USD, đồng for VND, yen for JPY). VND has no minor unit: no stored row changes.
- **The step.** What 1.000₫ is to the design: daily lines floor to it, set-asides ceil to 50 steps, the keypad's `k`, cash chips and steppers count in it. Amounts the design names in đồng scale by value with `designAmount` (thresholds, chart scales, presets, templates). The step comes from the currency's rough value (`money/currency.ts`), never below one whole unit.
- **Formatting** in `@6pm/domain` without `Intl`: the currency's symbol and the phone's separators and symbol position. VND keeps the design's exact forms.
- **Exchange rates** stay on the Frankfurter pipeline, quoted in đồng per unit; any pair converts through đồng exactly (`homeRate`, `foreignToHome`). A stored `foreignAmount.rate` is home units per unit.
- **Travel** from any home: a trip is wherever the local currency differs from home.
- **Banks.** In Vietnam, the catalogue as today. Elsewhere, the person's own banks typed by name; nothing fills with Vietnamese banks.
- **Budget together.** A shared pot counts in its creator's currency; a member at another home sees and adds in the pot's currency, and their own plan counts it converted.
- **Type.** Hero amounts fit their row (`FitWidth`); a symbol the look's face lacks is drawn in the system face (`currency_glyphs.py` → `currency-glyphs.generated.ts`).

VietQR and Vietnamese bank receipts read đồng; on another home they are foreign đồng spends priced to home.

## Phases

| # | Phase | Status |
|---|---|---|
| 1 | Domain money core: currency table, step, formatter, parser, keypad, amount editing, home FX, plan/ask/diary maths | done |
| 2 | App money context: plan currency, device detection, `useMoneyFormat`, odometer symbol and glyph fallback | done |
| 3 | Lanes: Today/close/quick add/scan · Plan · Ask/diary/insights/export · Native/capture/receipts · Travel/FX · Onboarding/banks · Budget together | in progress |
| 4 | Docs, simulator check in VND, USD, EUR, JPY, IDR | todo |

## Acceptance

- Domain Vitest: currency table, step, formatter (VND byte-identical), parser, keypad, home FX, rounding.
- A VND phone shows exactly what it showed before.
- USD, EUR (de-DE), JPY, IDR: every amount has the right symbol, side, separators and decimals; heroes fit at the longest plausible amount; no "₫", "k", "tr" where they do not belong.
- Typecheck, lint, the changed tests, `expo export --platform ios`, a simulator build where Swift changed.

## Known limits

- Indian digit grouping (12,34,567) is drawn as 1,234,567.
- A phone whose currency changes later keeps the first one.
- A currency Frankfurter does not quote has no conversion: its foreign amounts wait for the close, as offline today.
