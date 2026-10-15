import { describe, expect, it } from 'vitest';

import { day } from '../insights/insight-fixture';
import type { AskContext } from './ask-engine';
import { answerGoal } from './goal';

const ctx: AskContext = {
  today: '2026-10-15',
  day: day(),
  daysLeft: 16,
  payday: '2026-10-31',
  futureYou: 4_000_000,
  share: 1,
  pots: [{ name: 'Mua nhà', goal: 600_000_000, saved: 120_000_000, monthly: 5_000_000 }],
};

describe('answerGoal', () => {
  it('answers from the pot kept for it', () => {
    expect(answerGoal({ what: 'nhà' }, ctx)).toMatchObject({
      kind: 'potFull',
      pot: { name: 'Mua nhà' },
      fullIn: '2034-10',
    });
  });

  it('counts a price over what goes to Future you each month', () => {
    expect(answerGoal({ what: 'xe', amount: 500_000_000 }, ctx)).toEqual({
      kind: 'goalPace',
      what: 'xe',
      amount: 500_000_000,
      monthly: 4_000_000,
      months: 125,
      years: 10,
      reachedIn: '2037-03',
    });
  });

  it('asks the price when none was said', () => {
    expect(answerGoal({ what: 'xe' }, ctx)).toEqual({ kind: 'goalAmount', what: 'xe' });
  });

  it('says there is no pace when nothing goes to Future you', () => {
    expect(answerGoal({ what: 'xe', amount: 500_000_000 }, { ...ctx, futureYou: 0 })).toEqual({
      kind: 'goalNoPace',
      what: 'xe',
      amount: 500_000_000,
    });
  });
});
