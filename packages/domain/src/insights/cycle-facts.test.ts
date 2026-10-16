import { describe, expect, it } from 'vitest';

import { cycleHalfwayFacts, firstWeekPaceFacts, paceFacts } from './cycle-facts';
import { day, input, spend } from './insight-fixture';

// The fixture's cycle: 30 Sep through payday 31 Oct, 32 days; today Fri 9 Oct is day ten.

describe('cycleHalfwayFacts', () => {
  const halfway = (spentBefore: number, startFree: number) =>
    input({
      today: '2026-10-16',
      day: day({ startFree, free: startFree }),
      cycle: { start: '2026-09-30', payday: '2026-10-31', daysLeft: 15 },
      spends: [spend('2026-10-02', 'Lotte', spentBefore, 'groceries')],
    });

  it('tells the share used just past the middle, good when on pace', () => {
    const facts = cycleHalfwayFacts(halfway(4_000_000, 4_000_000));
    expect(facts[0]).toMatchObject({
      kind: 'cycleHalfway',
      tone: 'good',
      slots: { percent: { value: 50 }, left: { value: 4_000_000 } },
    });
  });

  it('is a watch when well ahead of the calendar', () => {
    expect(cycleHalfwayFacts(halfway(6_000_000, 2_000_000))[0]?.tone).toBe('watch');
  });

  it('stays quiet before the middle and a few days after it', () => {
    expect(cycleHalfwayFacts(input())).toEqual([]);
    const late = { ...halfway(4_000_000, 4_000_000), today: '2026-10-20' };
    expect(cycleHalfwayFacts(late)).toEqual([]);
  });
});

describe('firstWeekPaceFacts', () => {
  const week = (firstWeek: number, startFree: number) =>
    input({
      day: day({ startFree, free: startFree }),
      spends: [spend('2026-10-01', 'Lotte', firstWeek, 'groceries')],
    });

  it('tells a first week well ahead of an even pace as a watch', () => {
    const facts = firstWeekPaceFacts(week(3_000_000, 5_000_000));
    expect(facts[0]).toMatchObject({
      kind: 'firstWeekPace',
      tone: 'watch',
      slots: { percent: { value: 38 }, even: { value: 22 }, compare: { value: 'muchMore' } },
    });
  });

  it('tells a light first week as good, and an even one not at all', () => {
    expect(firstWeekPaceFacts(week(500_000, 7_500_000))[0]?.tone).toBe('good');
    expect(firstWeekPaceFacts(week(1_750_000, 6_250_000))).toEqual([]);
  });

  it('is told only in the days right after the first week', () => {
    expect(firstWeekPaceFacts({ ...week(3_000_000, 5_000_000), today: '2026-10-05' })).toEqual([]);
    expect(firstWeekPaceFacts({ ...week(3_000_000, 5_000_000), today: '2026-10-12' })).toEqual([]);
  });
});

describe('paceFacts', () => {
  it('tells money to spare at payday at the pace so far', () => {
    const facts = paceFacts(
      input({
        day: day({ free: 7_000_000 }),
        spends: [spend('2026-10-03', 'Lotte', 900_000, 'groceries')],
      }),
    );
    expect(facts[0]).toMatchObject({
      kind: 'paceSpare',
      tone: 'good',
      slots: { spare: { value: 4_800_000 }, payday: { value: '2026-10-31' } },
    });
  });

  it('tells the day the money runs out when that is before payday', () => {
    const facts = paceFacts(
      input({
        day: day({ free: 3_000_000 }),
        spends: [spend('2026-10-03', 'Lotte', 4_500_000, 'groceries')],
      }),
    );
    expect(facts[0]).toMatchObject({
      kind: 'paceShort',
      tone: 'watch',
      slots: { runsOut: { value: '2026-10-16' } },
    });
  });

  it('waits for a week of spending, and says nothing once the money is gone', () => {
    const spends = [spend('2026-10-03', 'Lotte', 900_000, 'groceries')];
    expect(paceFacts(input({ today: '2026-10-05', spends }))).toEqual([]);
    expect(paceFacts(input({ day: day({ free: -10_000 }), spends }))).toEqual([]);
  });

  it('measures the pace from the day the user joined, in the cycle they joined', () => {
    const joined = input({
      today: '2026-10-21',
      joinedOn: '2026-10-12',
      cycle: { start: '2026-09-30', payday: '2026-10-31', daysLeft: 10 },
      day: day({ free: 1_500_000, line: 150_000 }),
      spends: [spend('2026-10-13', 'Lotte', 2_700_000, 'groceries')],
    });
    // 2,7tr over the nine days since joining runs out on the 27th; spread over 21 it would not.
    expect(paceFacts(joined)[0]).toMatchObject({
      kind: 'paceShort',
      slots: { runsOut: { value: '2026-10-27' } },
    });
    expect(paceFacts({ ...joined, joinedOn: null })[0]?.kind).toBe('paceSpare');
  });

  it('counts the first week from the joining day', () => {
    const joined = input({
      today: '2026-10-09',
      joinedOn: '2026-10-02',
      day: day({ startFree: 5_000_000, free: 5_000_000 }),
      spends: [spend('2026-10-08', 'Lotte', 3_000_000, 'groceries')],
    });
    expect(firstWeekPaceFacts(joined)[0]?.tone).toBe('watch');
    // From the cycle's start the week would be 30 Sep to 6 Oct, before any spending was caught.
    expect(firstWeekPaceFacts({ ...joined, joinedOn: null })[0]?.tone).toBe('good');
  });
});
