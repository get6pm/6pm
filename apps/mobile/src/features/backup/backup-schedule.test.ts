import { describe, expect, it } from '@jest/globals';

import { backupIsDue, DAY_MS, MIN_GAP_MS } from './backup-schedule';

const NOW = Date.parse('2026-10-11T12:00:00.000Z');

describe('backupIsDue', () => {
  it('is due when nothing has been sent yet', () => {
    expect(backupIsDue({ now: NOW, lastAt: null, latestClosedAt: null })).toBe(true);
  });

  it('is due once a day has been closed since the last backup', () => {
    const lastAt = NOW - 5 * 60 * 60 * 1000;
    expect(backupIsDue({ now: NOW, lastAt, latestClosedAt: lastAt + 1000 })).toBe(true);
    expect(backupIsDue({ now: NOW, lastAt, latestClosedAt: lastAt - 1000 })).toBe(false);
  });

  it('is due after a day with no close at all, so the server is never a day behind', () => {
    expect(backupIsDue({ now: NOW, lastAt: NOW - DAY_MS, latestClosedAt: null })).toBe(true);
    expect(backupIsDue({ now: NOW, lastAt: NOW - DAY_MS + 1000, latestClosedAt: null })).toBe(
      false,
    );
  });

  it('never sends twice within the minimum gap, whatever closed', () => {
    const lastAt = NOW - MIN_GAP_MS + 1000;
    expect(backupIsDue({ now: NOW, lastAt, latestClosedAt: NOW })).toBe(false);
  });
});
