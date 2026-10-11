import { describe, expect, it } from '@jest/globals';

import { whenOf } from './backup-when';

const NOW = Date.parse('2026-10-11T12:00:00.000Z');
const ago = (ms: number) => new Date(NOW - ms).toISOString();

describe('whenOf', () => {
  it('reads in the largest whole unit', () => {
    expect(whenOf(ago(20_000), NOW)).toEqual({ key: 'backup.ago.now' });
    expect(whenOf(ago(2 * 60_000 + 5_000), NOW)).toEqual({ key: 'backup.ago.minutes', count: 2 });
    expect(whenOf(ago(59 * 60_000), NOW)).toEqual({ key: 'backup.ago.minutes', count: 59 });
    expect(whenOf(ago(3 * 3_600_000), NOW)).toEqual({ key: 'backup.ago.hours', count: 3 });
    expect(whenOf(ago(49 * 3_600_000), NOW)).toEqual({ key: 'backup.ago.days', count: 2 });
  });

  it('treats a time in the future, or text that is not a time, as just now', () => {
    expect(whenOf(ago(-5 * 60_000), NOW)).toEqual({ key: 'backup.ago.now' });
    expect(whenOf('never', NOW)).toEqual({ key: 'backup.ago.now' });
  });
});
