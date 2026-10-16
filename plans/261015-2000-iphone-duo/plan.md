# iPhone Duo: one app, five ways to hold it

Status: in progress · 15 Oct 2026 · Branch per phase, from `main`
Decided by the founder 15 Oct 2026: build the whole Duo design (`design/prototype/6pm iPhone Duo.dc.html`, screens in `DuoScreen.dc.html`), hinge-driven parts included, checked on the iPhone Duo simulator in Xcode 27.1. Apple announced the iPhone Duo on 9 Sep 2026; it ships 23 Oct 2026.

## What the platform gives us (iOS 27.1 SDK)

- **Hinge:** `UIHingeInteraction` on a view reports `UIHinge` updates: `status` (unknown, closed, partially open, fully open) and `angle`. No single "pose" value: pose is read from the status, the angle and where the fold runs.
- **Regions:** `UIView.reservedRegions(kind:)` returns `.division` (the fold across the inner screen) and `.occlusion` (the vertical island on the outer screen) with frames in the view's space.
- **Arrangements:** `UIArrangementViewController` with split and overlay arrangements, for native two-pane apps. 6pm draws its own pages in React Native, so it reads the regions instead.
- **Displays:** outer 466×678 pt, inner 669×951 pt (951×669 turned). The simulator folds from Device Hub (`Xcode-27.1.app/Contents/Applications/DeviceHub.app`); `simctl` has no posture command.
- **Readings (simulator):** closed: hinge closed, angle 0, window 466×678, the island strip 84×174 at the top right. Book: partial, ≈2.23 rad, 951×669, a 40 pt upright division at x 455.5. Flat: open, π, no division once flat. Stand: partial, 669×951, the division across at y 455.5. The angle is in radians.
- **Builds:** CI builds with Xcode 26.6, so every 27.1 call sits behind `#if compiler(>=6.4)` and `#available(iOS 27.1, *)`. A build from CI runs on the Duo with no hinge (one page everywhere) until CI moves to Xcode 27.1.

## Phases

| #   | Phase                            | Work                                                                                                                                                                                                                                                  | Status      |
| --- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| 0   | Builds with Xcode 27.1           | Expo 58 patch releases (PR #455)                                                                                                                                                                                                                      | done        |
| 1   | Fold foundation                  | `modules/fold` (hinge, divisions, occlusions as events); `FoldProvider`/`useFold`; `foldForm()` turning a snapshot and window into phone · rail · spread · book · stand, with tests. The inner screen turns on its own: iOS ignores the portrait lock there | done |
| 2   | Outer screen: right rail         | When the island runs down the right edge: status, island, Add, the tabs and Scan in a 72 pt rail on the right; the sky and number take the full height (design 1a)                                                                                    | done        |
| 3   | Inner screen: Today + October    | Two pages split at the fold: Today on the left; October (the month, daily numbers) on the right, or the spend/bill tapped on the left; the rail on the right edge; lists never put a control in the fold (1b)                                         | done        |
| 4   | The money diary as a spread      | Month on the left page, the tapped day on the right, page up/down and share on the right edge (1c)                                                                                                                                                    | todo        |
| 5   | Ask beside your day              | Opened, Ask sits on the right page and the left page previews what the answer would do to today's number (2b)                                                                                                                                         | todo        |
| 6   | Book pose: the Close as a ledger | Half-open with the fold upright: the receipt on the left page, Keep/Edit/Not mine on the right; folding shut with nothing left to confirm closes the day and the outer screen shows tomorrow's number (1d)                                            | todo        |
| 7   | Stand: Market mode               | Half-open with the fold across: "left for today" large on the top half, a keypad and category chips on the flat half, each Add saved as a spend (1e)                                                                                                  | todo        |
| 8   | Propped: Scan to pay             | Half-open across: the camera on the top half finds the VietQR, the confirm on the flat half; after paying, a receipt the seller can read on the top half (2c)                                                                                         | todo        |
| 9   | Split View: catch from your bank | With 6pm beside another app, text or a bank line dropped on 6pm is read as a spend into the Inbox (2d)                                                                                                                                                | todo        |
| 10  | The vertical island              | Live Activity layouts for the vertical island: caught, paying, six o'clock, closed, payday (2e)                                                                                                                                                       | todo        |
| 11  | Docs and store                   | Product decisions rows, undesigned states, the Duo screenshots of the store listing (`6pm Duo Store Listing.dc.html`)                                                                                                                                 | todo        |

## Rules from the design

- Nothing that is tapped sits in the fold; lists may scroll across it.
- The order is the same on both screens, so closing the phone part way through keeps the place.
- Every pose change animates (pages slide apart, the rail eases in), never a jump.
