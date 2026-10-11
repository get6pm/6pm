# Batch 8: unbuilt features

Status: todo (starts when batches 2–7 land) · Founder 11 Oct: every Max feature is built before launch; order below.

## Order and shape

| # | Feature | Native? | Shape | Prototype |
|---|---|---|---|---|
| 1 | Share the close receipt and a money diary as images | yes: `react-native-view-shot`, `expo-sharing` | capture the drawn view, share sheet; diary "Show amounts" off by default | `App:1678-1902`, zine share |
| 2 | Ask 6pm | no (API route) | domain `ask` engine computes every number (port `App:2678-2696`, real plan); Worker reads question → intent + amount and words the answer (DeepSeek, forced tool call, cost ledger); offline rules-only; free 3 a week (Monday reset), Max unlimited; entries: companion tap, Diary card, Max welcome | `App:1442-1507`, `2668-2696` |
| 3 | Share extension: bank receipt OCR | yes: `@bacons/apple-targets`, local Vision module, App Group | read image/PDF on the phone, parse amount/to/when/code, extension card Edit/Confirm, rule table then server naming (numbers-free) | `SS:182-215` |
| 4 | App Intent "Log in 6pm" + controls | yes | Wallet Shortcuts automation, Control Center / Action button → Scan or Quick add | Settings guide `App:2856-2862` |
| 5 | Voice | yes: on-device speech | Quick add hold-to-talk, close cash "Say it"; VI/EN amount parser in domain (k, nghìn, tr, triệu, rưỡi) | `App:2618-2630`, `3306-3318` |
| 6 | Widgets and Live Activity | yes | functional widgets free, in-your-look Max; Live Activity for pending pay ("Waiting · tap when paid") and Travel | `SS:40-160` |
| 7 | Receipt email | API | `{handle}@6pm.oddeggs.studio` → Email Worker → parse → held encrypted until fetched → deleted; Settings source row | `App:2856-2862` |
| 8 | Export (Max) | `expo-sharing` | CSV of every spend; Sheets = CSV that opens in Sheets | Settings `App:714-856` |
| 9 | Year book (Max) | `expo-print` | twelve money diaries bound 31 Dec as a PDF | Diary `App:382-519` |
| 10 | Max companion form | no | members see `form="max"` wherever the companion draws | `draw-max.ts` exists |
| 11 | Budget together (Max) | yes: Sign in with Apple | one shared ledger per pair on the Worker (D1); shared pot or month, close as two | `App:262-381` |
| 12 | Travel mode (Max) | location optional | FX rates cached on the Worker; **provider open** (must include VND) | `App:130`, `SS:153` |

## Native batch

Items 1, 3, 4, 5, 6, 11 add native code: declare them in one native batch (tech-decisions §5: App Group, Keychain sharing incl. the database key's access group so the extension can open the store, Live Activities, Sign in with Apple, microphone + speech, App Intents, widget/Live Activity/controls/share-extension targets), then one TestFlight build. After that, feature work ships over the air.

## Founder gates

- FX provider for Travel (open item 1).
- Budget together moves from "after launch" to launch scope — confirm the server account model (Sign in with Apple only for pairing).
