import { describe, expect, it } from 'vitest';

import { CLOSE_TIME_OPTIONS, clockOf, closeMoment, filingDay } from './close-time';

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
