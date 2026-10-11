# Ask 6pm screen: report

## Files

Created
- `apps/mobile/src/app/ask.tsx`: route; optional `q` param is sent once the screen is up (350 ms, like the prototype).
- `apps/mobile/src/features/ask/`
  - `ask-screen.tsx`: header (glass back, companion 44 with mood, title/sub), scroll, composer. No companion in serious mode.
  - `ask-bubbles.tsx`: intro, me, answer (display-font text, Now/After bars with growing After bar, rows, note), typing dots.
  - `ask-suggestion-list.tsx`: "Try" rows. `ask-composer.tsx`: free meter, locked bar, chips, input and send; rides the keyboard via `useAnimatedKeyboard` (UI thread).
  - `ask-motion.ts`: `rise`, `bubbleIn`, grow easing as Reanimated keyframes.
  - `use-ask.ts`: chat state, quota gate, server-then-rules reading, answer, haptic.
  - `ask-context.ts`: store snapshot to `AskContext` (day via `dayOf`, pots with saved and monthly).
  - `ask-reader.ts`: server first (4 s overall deadline including first registration), then `readIntent`.
  - `ask-words.ts`: `AskAnswer` to card (text, mood, bars, rows, note) from the catalogue; numbers only via `formatVnd`/`formatShort`.
  - `ask-suggestions.ts`, `ask-quota-store.ts` (settings key `ask.askedOn`, JSON array of money days, last 4 weeks kept, no migration).
  - Tests: `ask-words`, `ask-reader`, `ask-quota-store`, `ask-context`, `ask-suggestions`.
- `apps/mobile/src/features/api/`: reusable device client.
  - `api-client.ts` (`createApiClient().request({method, path, body, schema, timeoutMs})`: registers once, token in SecureStore, bearer header, 401 re-registers with the same token and retries once, wire-error parsing, timeout, schema-checked response), `api-error.ts` (`ApiRequestError.failure/retryable`; messages carry path and status only), `device-token-store.ts`, `native-api.ts` (`useApi()`; no `apiBase` gives a client that fails like a dead connection, so Ask still works offline), `api-client.test.ts`.
- `packages/i18n/src/en-ask.ts`, `vi-ask.ts` (registered in `en.ts`, `vi.ts`).

Edited (small)
- `apps/mobile/src/app/_layout.tsx`: `<Stack.Screen name="ask" options={takeover} />`.
- `packages/i18n/src/en.ts`, `vi.ts`: one import and one spread each.

## Behaviour

- Send: not Max and no free question left (read from the settings table at send time, not from state) opens `/max?from=ask`. Otherwise the question appears, typing dots show, the question is counted (not for Max), the server reads it (4 s), else `readIntent`; `answerAsk` runs on the store as it is after the wait; the card is built from the catalogue (en + vi); light haptic on the answer. Auto-scroll to the newest bubble. A question in flight blocks a second send.
- Meter "N of 3 free questions left this week" + "Unlimited with MAX" for free users with questions left; locked bar when none left (input is replaced by it; chips stay, a chip tap opens Max). Hidden for Max and until the count is read.
- The server only gets `{question}`; no amount of the plan leaves the phone.
- Suggestions: afford 2tr on Saturday, weekend, save 500k more, and "When is <first pot> full?" only with a pot. Tests confirm each reads to the right intent offline in en and vi.

## Undesigned states (to add to `docs/undesigned-states.md`)

| Screen | State | What the app does | Why |
|---|---|---|---|
| Ask | Server unreachable, slow (>4 s), rate limited or refusing | Answers with the phone's rules, no error shown | Product decision: offline is rules-only |
| Ask | Offline and the rules cannot read the question | Help answer plus note "I couldn't reach the server, so I only read simple questions right now." | The prototype has only an online help line |
| Ask | Something throws while answering | Answer bubble "Something went wrong, so I couldn't answer that. Try again.", logged to Sentry | Never leave the typing dots hanging or fail silently |
| Ask | Weekend question when payday comes before the weekend | Text "Payday on {date} comes before the weekend, so a fresh number starts then." no rows | `weekend` answer has no days |
| Ask | Weekend question with one weekend day left | "About X on Sunday, ..." with a single row | Same |
| Ask | Save-more that changes nothing a day | "Moving X more ... would barely change your days." | Avoids "cost about 0k a day" |
| Ask | Affordability answer fits today | Rows Safe today / This / Tomorrow instead of the prototype's raw "left per day" | The engine returns `safe` and an unchanged tomorrow, not the spread figure |
| Ask | Save-more rows | "Future you each month" and "Moving more + X"; no "After" total | A sum would be money maths outside the domain package |
| Ask | Today question (`today` intent) | Sentence with safe today and tomorrow; "used up" wording when safe <= 0 | Intent exists in the engine, no prototype line |
| Ask | Pot with nothing going in / already full / no pots | Dedicated lines ("won't fill by itself", "already full", "make one in Plan") | Engine returns these cases |
| Ask | Free count not yet read | Meter hidden, input usable; count enforced at send | Avoids a flash of "3 of 3" |
| Ask | Locked | Input replaced by the dark Max bar (uses `MAX_INK`/`MAX_CREAM`), chips stay | Prototype leaves the input and the bar both possible; a disabled input under the lock read badly |
| Ask | Serious mode | No companion in the header; copy is already plain, so the same lines | Spec: no companion, plain copy |

## Entry points to wire (controller)

```ts
router.push('/ask');                                   // Today companion tap, Max welcome
router.push({ pathname: '/ask', params: { q } });      // Diary Ask card chips; q is the exact question text
```
For the Diary chips, `q` should be a catalogue question (e.g. `t('ask.suggest.weekend')`), not the short chip label, so it reads right.

## Verification

- `pnpm exec jest src/features/ask src/features/api`: 6 suites, 32 tests pass.
- `pnpm --filter @6pm/i18n test`: pass (en/vi completeness included).
- `eslint` on my files: clean. `prettier --check`: clean.
- `tsc --noEmit` (apps/mobile): no errors in my files. Unrelated errors from other lanes' in-progress edits remain (plan-actions, plan-colours, plan-page, daily-card, month-calendar, bill-card-parts, onboarding-maths test, today-view test, details/autosave test); not touched.
- Not checked: no simulator run, so the visual comparison to `design/renders/app/09-ask-6pm.png`, keyboard behaviour (`useAnimatedKeyboard` inside a full-screen modal), the Keyframe `transformOrigin` on the bubbles and the real device registration/ask round trip are unverified on device. Pot `monthly` reads `setAsideThisCycle` for occasions (the plan view's current meaning), so a pot's fill month follows what was recorded this cycle.

## Concerns

- The After bar width (share of Now, min 3%) is computed in `ask-words.ts`, as in the prototype; it is geometry, not displayed money.
- The vi copy is mine and should get a native read.
- The first free question of a new week is counted when sent; a Max member's questions are never counted.

Status: DONE_WITH_CONCERNS
