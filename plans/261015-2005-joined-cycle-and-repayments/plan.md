# The joined cycle and repayments

Status: planned · Written 15 Oct 2026 · Branch per phase, from `main`
Decided by the founder 15 Oct 2026, kept small on purpose: the cycle a person joins starts from what they say they have spent, not a guess; savings they already have count in their pots; repayments are bills; and paying a bill is never counted as spending too. Details marked *(default)* await founder review.

## Why

- **Joining mid-cycle guesses.** M2a assumes everything before the set-up day went at the average rate. Someone who joins on the 20th with most of their salary gone is shown far more than they have, on the day trust is won or lost.
- **Paying a bill is counted twice.** A card statement, trả góp or loan payment caught from a bank email lands as a new spend, while its bill already came off the plan.

Apps built around one number (PocketGuard, SafeToSpend) treat debt as scheduled bills; only full budgeting apps (YNAB) model balances and payoff. 6pm follows the first: no debt section, no interest or payoff maths.

## The model

### Spent since payday (replaces M2a's guess)

- In the cycle a person joins, onboarding asks one question: **"Since payday on {date}, about how much have you spent? Not counting bills."** It is prefilled with today's estimate, the part of the cycle's free money M2a takes as already gone, so skipping it changes nothing. It sits on the first-number step as one editable line under the number, not a step of its own, so onboarding gets no longer *(default)*.
- The answer replaces the estimate. The joined cycle's free money = income − bills − Future you − occasions − the answer. The river already draws this as its "before you joined" segment; it now shows the person's own amount.
- More than the free money is fine: the cycle starts overspent and Today says so calmly ("past the plan"), as it does for any overspent cycle. So that day one is not a red number, the first-number step then offers "Start Future you at payday": this cycle's Future you set-aside is skipped, later cycles are whole *(default)*.
- In Plan, the "before you joined" segment can be tapped to change the amount while that cycle lasts. Later cycles are whole, as now.
- A plan saved before has no answer and keeps the estimate.

### Repayments are bills

- Bills gain an optional **last month** ("until"), after which the bill stops by itself. A 12-month trả góp is one bill with an end; a card or loan repayment is a bill with or without one.
- The onboarding bill deck gains one card, **"Paying anything off?"**: credit card, trả góp, loan, someone I owe. Each yes asks its monthly amount, plus the months left for trả góp. Plan's bill editor offers the same.
- Bills have a kind: **card** or **other**. Spending on a card counts when it happens, as now, so a card bill is only what the person plans to pay off a balance they already had *(default copy explains this in one line)*. Someone who pays their card in full each month adds no card bill at all.

### Paying a bill is not spending

- When a capture looks like a bill's payment, the close asks once: **"Is this your {bill}?"**. Yes marks the bill paid for this cycle (the existing `paidCycle`) and keeps the capture out of the daily number. No keeps it as spending.
- It looks like a bill's payment when the bill is unpaid this cycle, it is within 7 days of the bill's due day, and either its amount matches exactly or the payee or note names the bill or a word for one ("thanh toán thẻ", "trả góp", "trả nợ", "khoản vay", "credit card payment") *(default)*. Each bill is asked about at most once a cycle.
- A payment of an **other** bill that differs from its amount becomes this cycle's bill, so free money moves by the difference once.
- A payment of a **card** bill marks it paid and never moves free money, whatever the amount: anything above the bill is card spending that already counted the day it happened. Counting it again is the double count this plan exists to remove.
- A payment with a repayment word and no matching bill (the pay-in-full card) asks **"Paying off a card or loan?"**. Yes keeps it out of the daily number.
- Any spend's details gain "This was a bill" for what the close didn't catch.

### Savings you already have

- Creating or editing a pot (occasions and Future you goals) has an optional **"Already saved"** amount, 0 unless typed.
- It is a pot move of a new kind, `opening`: it counts in the pot's saved total, its progress and its monthly need, and never in this cycle's top-ups, so it never lowers the daily number. A 50tr wedding pot due in 10 months with 20tr already saved needs 3tr a month, not 5tr.
- The monthly need counts what was saved before the cycle; an opening move counts as saved before, whenever it was entered, so this cycle's set-aside already knows about it.
- Editing it later changes the opening move, never a top-up. Shared pots keep their own rule (each partner's money counts on their own phone).

All maths in `@6pm/domain`. Nothing leaves the phone; the new bill fields, the bill-payment mark and opening pot moves are in the backup snapshot (optional fields, so older backups restore).

## Phases

| # | Phase | Owns | Status |
|---|---|---|---|
| 1 | Spent since payday: domain (joined-cycle free money from an answer, else the estimate), plan setting, onboarding step, editable river segment, tests | `plan/*`, `features/onboarding/*`, `features/plan/*`, `data/plan-settings.ts` | todo |
| 2 | Repayments and bill payments: bill kind and last month, the deck's "Paying anything off?" card, bill matching in the close, "Paying off a card or loan?", "This was a bill", migration and backup, tests | `plan/*`, `capture/*`, `features/onboarding/*`, `features/close/*`, `features/details/*`, `data/*`, `db/migrations/*` | todo |
| 3 | Savings you already have: `opening` pot moves, "Already saved" in the pot and goal editors, monthly need and progress, backup, tests | `plan/pots.ts`, `contracts/*`, `features/plan/*`, `data/pot-moves.ts` | todo |

The prototype has neither screen. Both are built from existing components (onboarding's money step and bill deck, the close's question card) and logged in `docs/undesigned-states.md`.

## Acceptance

- Joining on 20 Oct, payday 31st, 15tr income, 5tr bills, 2tr Future you, answer 6tr: today's line is (15 − 5 − 2 − 6)tr ÷ 12 days, floored to the step.
- Skipping the question gives exactly today's number.
- A 12-month trả góp of 1tr comes off each cycle and stops after the twelfth.
- A 5tr card payment caught by email, answered "Yes, my card" in the close: the daily number does not drop; the card bill shows paid this cycle. Paid 6tr against a 5tr bill: free money drops by 1tr once.
- A 2tr card bill and an 8tr full statement caught by email, "Yes, my card": the bill is paid, free money does not move.
- A 50tr pot due in 10 months with 20tr already saved: 3tr a month, and today's number is the same as before the pot's saved amount was typed.
- Domain Vitest for each rule; typecheck, lint, the changed tests; simulator check of both onboarding steps and the close question in VND and USD.
