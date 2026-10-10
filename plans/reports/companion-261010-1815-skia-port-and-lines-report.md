# Companion: Skia port and lines (en + vi)

Date: 2026-10-10 · Not committed.

## What was built

**apps/mobile/src/ui/companion/**
| File | Contents |
|---|---|
| `companion.tsx` | `Companion({ size, mood, form = 'base', serious = false })`: a Skia `Canvas` with one `Picture` recorded per frame in a `useDerivedValue` worklet. `useFrameCallback` advances a UI-thread clock, so no JS timers. `serious` forces `plain`. |
| `companion-mood.ts` | `companionMoods`, `CompanionMood`, `CompanionForm`, `companionMood({ hour, serious, safe, toast, closed? })` |
| `companion-mood.test.ts` | 6 cases covering precedence and boundaries (9:00, 21:30, safe 0, closed day) |
| `draw-kit.ts` | `Frame` geometry (`makeFrame`: breathe, hop, tilt), the seeded jitter, and paint, gradient and ellipse helpers |
| `draw-body.ts` | ground shadow, feet, arms, 22-point body path, sky and sea gradients, wave horizon, glints, Max twinkles, specular highlight, outline |
| `draw-face.ts` | cheeks, eyes (open, happy arcs, closed or blink arcs, plain dots, think look-offset), mouths |
| `draw-rays.ts` | crown of rays: 3, or 5 in Max with star tips; pulse when happy, droop when sleepy; none when plain |
| `draw-max.ts` | the ring's back and front halves with gradient and orbiting moons, the 8-point star, the 1.4 s burst |
| `draw-extras.ts` | sparkles (happy or Max), sleepy "z"s, think bubbles |
| `draw-companion.ts` | the prototype's back-to-front draw order |

**apps/mobile/src/app/(dev)/companion.tsx**: a gallery of all 7 moods × sizes 62 and 120 × base and max, on a dark ground (`sheetSolid`, golden look at 18:00) and a light ground (`bubbleBg`). At the top, a tappable 120 pt happy companion switches base ⇄ max to show the burst. In a non-dev build the screen redirects to `/`. Its labels are identifiers (mood, form, size), not copy.

**packages/i18n**: `en-companion.ts` and `vi-companion.ts` (116 keys each), with import and spread lines added to `en.ts` and `vi.ts`.

## Fidelity

Every shape, colour, gradient stop, proportion and timing constant in `companion.js` is ported 1:1. This includes the 6 fps hand-drawn wobble from the seeded `rnd`, the blink window (`el % 4.1 > 3.96`), the stronger hop in the first 1.2 s after turning happy, and the moons passing behind and in front of the body.

The drawing code was checked outside the device by rendering it in Node with CanvasKit (the same Skia API, through `JsiSkApi`). All moods in both forms were rendered on dark and light grounds, plus a frame mid-burst, and compared by eye with `13-max-welcome.png` and `01-today.png`. Shapes, ring tilt, ray stars, z's, think bubbles and the greyscale plain form all match. Not checked: the iOS simulator (no native build per instructions) and frame rate on device.

### Differences from companion.js
1. **Reduce Motion**: the prototype has none. With Reduce Motion on, the frame callback never starts. The companion holds a fixed pose at `el = 2.6 s` (eyes open, z's and sparkles visible, wave arm raised) with no hop. The Max burst is skipped, because a one-shot animation can't play on a frozen clock.
2. **Sleepy "z" font**: the prototype asks for `Newsreader, Georgia, serif`. Newsreader is not loaded in the prototype or the app, so browsers draw Georgia. The port uses `matchFont` with Georgia italic on iOS and the system `serif` italic on Android.
3. **Colours** are illustration constants inside `ui/companion` (INK `#3a1d2a`, body and sea gradients, etc.), not `@6pm/theme` tokens. `@6pm/theme` has no companion palette and is outside my owns list.
4. **Seed**: as in the prototype, each instance gets a random seed, so two companions on screen wobble differently.
5. Paths use `Skia.PathBuilder`. The mutating `SkPath.moveTo`/`lineTo`/… calls are deprecated in Skia 2.13 and log warnings.

## companionMood
This follows the prototype exactly (App ~3224), including its `!s.closed` guard on the nod. That guard is an optional `closed` field (default `false`), so the requested signature `{hour, serious, safe, toast}` still works.

## Lines: events and keys
Keys are `companion.<event>.soft|cheeky|roast|plain`, for 29 events. The prototype has 29, not 26: idle, closedIdle, capture, reveal, replan, zero, question, save, export, copied, late, paused, nudge, potFull, lateClose, potMade, maxOff, shareInvite, widgets, yearBook, maxOn, lookNew, lookSet, restored, catSaved, ruleSaved, pinned, walletOn, share.

- Soft, Cheeky and Roast are the prototype's English, word for word, except for the `{day}` change below.
- The serious table `P` has no line for 8 events, so I wrote neutral ones: maxOff "Max is off.", shareInvite "Invite link copied.", widgets "Long-press the Home Screen to add a widget.", yearBook "Your year book binds on 31 December.", maxOn "Max is on.", lookNew "Look purchased.", lookSet "Look changed.", restored "Purchases restored."
- **Placeholder change**: the prototype hard-codes the demo days. "Adulting on a Friday", "Responsible? On a Friday?" and every `lateClose` line ("Wednesday’s filed…") now take `{day}`, so callers must pass a weekday name. `{t}` and `{b}` stay as in the prototype. The completeness test confirms the placeholders match in both languages.
- **Vietnamese**: casual Southern-neutral texting voice. The companion calls itself "mình" and the user "bạn", with particles like "nha", "nè", "ghê", "dữ ta". A pot is "hũ", Future you is "bạn của tương lai", a look is "giao diện", the year book is "kỷ yếu năm", and closing the day is "chốt ngày", matching `vi-today`. Roast lines tease the habit, never the person.

## Verification
- `pnpm --filter @6pm/i18n test`: 4/4 pass (completeness included). `pnpm --filter @6pm/i18n typecheck`: clean.
- `pnpm --filter @6pm/mobile test -- companion`: 6/6 pass.
- `pnpm --filter @6pm/mobile typecheck`: no errors in my files. It fails on files owned by the concurrent shell work: `src/features/home/home-shell.tsx` (`/settings`, `/quick-add`, `/scan`) and `src/app/index.tsx` (`/(dev)`). These are stale typed-route types, not part of this task.
- eslint and prettier: clean on every file I changed.

## Unresolved questions
1. **`{day}` placeholder**: is converting the hard-coded Friday and Wednesday to `{day}` acceptable? It changes the contract for callers of reveal.roast, save.roast and lateClose.*.
2. **Nudge copy**: the nudge lines say "It’s six" / "Sáu giờ", but the close time is configurable (15:00–23:45). Should they take `{time}` like `today.tonight.dueLater`?
3. **Serious mode**: product-decisions §1 says serious mode *removes* the companion, yet `plain` exists and the prototype still renders it in places. Which screens should show `plain` and which should hide the companion?
4. **Companion colours**: should they move into `@6pm/theme` as named art tokens? That needs that package's owner.
5. **Performance**: the dev gallery runs 57 live instances, each recording a picture every frame on the UI thread. Real screens show one or two. If the gallery stutters on the simulator, that comes from the gallery's instance count, not the component.
6. **Persona fallback**: the prototype falls back to Cheeky when a persona has no line. Every event here has all three, so no fallback exists in the catalogue. Choosing the persona belongs to the caller.
