# Undesigned states and deliberate gaps

Screens built from existing components where the prototype has no design, or where the prototype
fakes behaviour the app cannot fake. Founder review.

| Screen | State | What the app does | Why |
|---|---|---|---|
| Home | No month set up yet (before onboarding exists) | Sky only; developer builds show a "Developer tools" link | Onboarding v2 takes this place (phase 07) |
| Quick add | Voice segment | Hidden; keypad only | Voice capture lands with on-device speech (phase 08); the prototype's transcript is scripted |
| Quick add | ₫→$ key | Hidden | Needs a live rate; the prototype's fixed 25.400₫/$ is a fake (FX lands in phase 11) |
| Close | Cash "Say it" mic | Hidden; chips only | Same as voice above |
| Close | Receipt "Share" | Does nothing yet | Receipt-as-image share lands with the share sheet work (phase 04) |
| Close | Work question | Asked about the largest waiting spend ≥ 100k read from a receipt or email | The prototype hard-codes one spend (product-decisions M10) |
| Sky | Film grain | Drawn as the prototype's code specifies | The prototype's grain never renders in browsers (malformed data URL), so the designer has not seen it — founder call to keep or drop |
| Plan · Bills | Unpaid bill past due / due today | "Was due 1 Oct" / "Due today" in the warn colour |  |
| Plan · Bills | No bills | Timeline only (today, payday); river note "No bills yet." |  |
| Plan · lede | Future you is 0 | "Bills are set aside. The X left is yours: …" |  |
| Plan · Future you | One goal or none | Sub "Before you can spend it." (no split) |  |
| Plan · Occasions | "New pot" Max lock after one pot, "Budget together" card | Not built: Max state does not exist yet. New pot is always open; Budget together is omitted |  |
| Plan | Toasts `potMade` / `potFull` / `save` | Haptics only: no island toast system yet |  |
| Diary | No closed day this week | Recap page one: "A fresh week. Close tonight and it starts to fill in." | The prototype's story is scripted |
| Diary | Week recap story | Computed from closed days (under/over/even), never the scripted Grab line | Real behaviour only |
| Diary | Nothing counted this week | Recap page three: "Nothing counted this week yet." | Undesigned |
| Diary | No closed day this month | Calendar summary "Close tonight to file your first day"; no day receipt | Undesigned |
| Diary | Days before the user's first data | Dimmed like days ahead, not "missed" | A new user would see a month of "missed" |
| Diary | "Spotted" recurring card | Not shown | Needs recurring-spend detection (not built) |
| Diary | Ask 6pm entry | Drawn; does nothing yet | `/ask` lands with Ask (phase 11) |
| Diary | Year book | Drawn locked with the MAX badge; does nothing | Max and the paywall land in phase 10 |
| Diary | Money diaries shelf | This month plus every earlier month with a closed day; covers for months other than Aug/Sep use the same tint rule | The design shows three fixed covers |
| Diary | Day receipt with no kept spends | "NOTHING SPENT" line, total 0 | Undesigned |
| Missed day | Nothing caught that day | No list; "Nothing was caught that day. Close it as a quiet day…"; button "Close Wednesday · 0k" | Undesigned |
| Missed day | Only kept spends that day | Lists them; "Nothing's waiting from that day. Close it…" | Undesigned |
| Missed day | Already closed / not a past day (stale link) | "Wednesday is already filed." and Done | Undesigned |
| Missed day | Companion toast after filing ("Wednesday, filed. Better late than lost.") | Not shown; success haptic only | No island toast system yet |
| Money diary | Save image / Share buttons | Hidden | Needs view capture + share sheet (not installed); a button that does nothing would be a fake |
| Money diary | Quietest/biggest day note | Shows the day's own note; hidden when it has none | Notes are not editable yet (`closed_days.note` is null from the close) |
| Money diary | Month with one closed day | Biggest day ticket hidden | Quietest and biggest would be the same day |
| Money diary | Headline and note | Chosen from the month's numbers (spare / over, with or without Future you paid) | The prototype's lines are per-month copy |
| Recap / zine | Place sub-label | "N visits" for every merchant | The prototype says "14 rides" for Grab only |
| Details | Receipt photo | Hidden | Needs the photo picker (native batch) |
