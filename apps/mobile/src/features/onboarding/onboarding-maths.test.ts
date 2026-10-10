import { describe, expect, it } from '@jest/globals';

import { billTotal, chosenBills, dealDeck, NO_BILL_ANSWERS, type BillAnswers } from './bill-deck';
import {
  billDigits,
  billOf,
  CLOSE_HOURS,
  CLOSE_MINUTES,
  firstDay,
  futureYouOf,
  incomeDigits,
  incomeOf,
} from './onboarding-maths';

describe('onboarding maths', () => {
  it('reads the wheels as the digits of a real amount', () => {
    expect(incomeDigits(15_500_000)).toEqual({ millions: 15, hundreds: 5 });
    expect(incomeOf(15, 5)).toBe(15_500_000);
    expect(incomeDigits(0)).toEqual({ millions: 1, hundreds: 0 });
    expect(billDigits(3_520_000)).toEqual({ millions: 3, hundreds: 5, tens: 2 });
    expect(billOf(0, 2, 2)).toBe(220_000);
  });

  it('rounds Future you to the nearest 100.000₫', () => {
    expect(futureYouOf(15_500_000, 12)).toBe(1_900_000);
    expect(futureYouOf(15_500_000, 0)).toBe(0);
  });

  it('offers close times 15:00 to 23:45 in quarter hours', () => {
    expect(CLOSE_HOURS).toEqual(['15', '16', '17', '18', '19', '20', '21', '22', '23']);
    expect(CLOSE_MINUTES).toEqual(['00', '15', '30', '45']);
  });

  it('computes the first day with the same engine as Today', () => {
    // 9 Oct with payday on the 31st: 22 days left, so the money covers 23 days.
    const day = firstDay(
      {
        income: 17_400_000,
        payday: { kind: 'sameDay', day: 31 },
        bills: 4_200_000,
        futureYou: 2_000_000,
      },
      '2026-10-09',
    );
    expect(day.days).toBe(23);
    expect(day.free).toBe(11_200_000);
    expect(day.line).toBe(486_000);
  });

  it('never reveals a negative number', () => {
    const day = firstDay(
      { income: 1_000_000, payday: { kind: 'lastDay' }, bills: 5_000_000, futureYou: 0 },
      '2026-10-10',
    );
    expect(day.line).toBe(0);
  });
});

describe('bill deck', () => {
  it('deals an amount card after each yes and each picked option', () => {
    const answers: BillAnswers = {
      asks: { rent: true, power: false },
      multis: { subs: { picked: ['spotify', 'icloud'], done: true } },
      amounts: {},
    };
    const deck = dealDeck(answers);
    expect(deck.map((d) => (d.type === 'amount' ? d.key : d.type))).toEqual([
      'ask',
      'rent',
      'ask',
      'ask',
      'multi',
      'subs:spotify',
      'subs:icloud',
      'multi',
    ]);
    expect(dealDeck(NO_BILL_ANSWERS)).toHaveLength(5);
  });

  it('keeps answered bills, including ones put off without an amount', () => {
    const answers: BillAnswers = {
      asks: { rent: true },
      multis: { subs: { picked: ['spotify'], done: true } },
      amounts: { rent: 5_000_000, 'subs:spotify': 0, 'subs:netflix': 260_000 },
    };
    const bills = chosenBills(dealDeck(answers), answers);
    // Netflix was unpicked after its amount was set: it is not a bill any more.
    expect(bills.map((b) => [b.key, b.amount, b.deckIndex])).toEqual([
      ['rent', 5_000_000, 1],
      ['subs:spotify', 0, 5],
    ]);
    expect(billTotal(bills)).toBe(5_000_000);
  });
});
