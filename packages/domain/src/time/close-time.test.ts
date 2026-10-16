import { describe, expect, it } from 'vitest';

import {
  CLOSE_REMINDER_DAYS,
  CLOSE_TIME_OPTIONS,
  clockOf,
  closeMoment,
  closeRemindersAhead,
  filingDay,
  moneyDayOf,
  moneyHourOf,
} from './close-time';

describe('closeMoment', () => {
  it('walks the evening around an 18:00 close', () => {
    expect(closeMoment(17.5, '18:00', false)).toBe('before');
    expect(closeMoment(18.12, '18:00', false)).toBe('due');
    expect(closeMoment(19.5, '18:00', false)).toBe('open');
    expect(closeMoment(20.4, '18:00', false)).toBe('open');
    expect(closeMoment(21.5, '18:00', false)).toBe('late');
    expect(closeMoment(21.5, '18:00', true)).toBe('closed');
  });

  it('is late no earlier than two hours after a later close', () => {
    expect(closeMoment(22.9, '21:00', false)).toBe('open');
    expect(closeMoment(23, '21:00', false)).toBe('late');
  });
});

describe('clock helpers', () => {
  it('formats decimal hours like the design clock', () => {
    expect(clockOf(18.12)).toBe('18:07');
    expect(clockOf(21.5)).toBe('21:30');
  });

  it('offers 15:00 to 23:45 in quarter hours', () => {
    expect(CLOSE_TIME_OPTIONS[0]).toBe('15:00');
    expect(CLOSE_TIME_OPTIONS.at(-1)).toBe('23:45');
    expect(CLOSE_TIME_OPTIONS).toHaveLength(36);
  });

  it('files a close after midnight under the day before', () => {
    expect(filingDay('2026-10-10', 0.67)).toBe('2026-10-09');
    expect(filingDay('2026-10-10', 9)).toBe('2026-10-10');
  });
});

describe('the money day', () => {
  it('ends at 04:00, not at midnight', () => {
    expect(moneyDayOf(new Date(2026, 9, 12, 0, 30))).toBe('2026-10-11');
    expect(moneyDayOf(new Date(2026, 9, 12, 3, 59))).toBe('2026-10-11');
    expect(moneyDayOf(new Date(2026, 9, 12, 4, 0))).toBe('2026-10-12');
    expect(moneyDayOf(new Date(2026, 9, 11, 23, 59))).toBe('2026-10-11');
  });

  it('rolls back across a month and a year', () => {
    expect(moneyDayOf(new Date(2026, 10, 1, 1, 0))).toBe('2026-10-31');
    expect(moneyDayOf(new Date(2027, 0, 1, 2, 0))).toBe('2026-12-31');
  });

  it('keeps the evening clock counting past midnight, so the close stays late', () => {
    expect(moneyHourOf(new Date(2026, 9, 12, 0, 30))).toBe(24.5);
    expect(moneyHourOf(new Date(2026, 9, 12, 4, 0))).toBe(4);
    expect(closeMoment(moneyHourOf(new Date(2026, 9, 12, 1, 0)), '18:00', false)).toBe('late');
    expect(closeMoment(moneyHourOf(new Date(2026, 9, 12, 5, 0)), '18:00', false)).toBe('before');
  });
});

describe('closeRemindersAhead', () => {
  const none = new Set<string>();

  it('schedules today and the days after at the close time on the phone', () => {
    const slots = closeRemindersAhead(new Date(2026, 9, 15, 9, 0), '18:30', none);
    expect(slots).toHaveLength(CLOSE_REMINDER_DAYS);
    expect(slots[0]).toEqual({ day: '2026-10-15', at: new Date(2026, 9, 15, 18, 30) });
    expect(slots[13]).toEqual({ day: '2026-10-28', at: new Date(2026, 9, 28, 18, 30) });
  });

  it('leaves out days already closed', () => {
    const slots = closeRemindersAhead(
      new Date(2026, 9, 15, 9, 0),
      '18:00',
      new Set(['2026-10-15', '2026-10-17']),
    );
    expect(slots.map((s) => s.day).slice(0, 3)).toEqual(['2026-10-16', '2026-10-18', '2026-10-19']);
  });

  it("starts tomorrow once today's close time has passed", () => {
    const slots = closeRemindersAhead(new Date(2026, 9, 15, 18, 0), '18:00', none);
    expect(slots[0]?.day).toBe('2026-10-16');
    expect(slots).toHaveLength(CLOSE_REMINDER_DAYS - 1);
  });

  it('after midnight, still on the money day before, starts with the coming evening', () => {
    const slots = closeRemindersAhead(new Date(2026, 9, 16, 1, 0), '18:00', none);
    expect(slots[0]).toEqual({ day: '2026-10-16', at: new Date(2026, 9, 16, 18, 0) });
  });

  it('crosses a month end', () => {
    const slots = closeRemindersAhead(new Date(2026, 9, 31, 9, 0), '23:45', none, 2);
    expect(slots).toEqual([
      { day: '2026-10-31', at: new Date(2026, 9, 31, 23, 45) },
      { day: '2026-11-01', at: new Date(2026, 10, 1, 23, 45) },
    ]);
  });
});
