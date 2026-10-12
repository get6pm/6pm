import { describe, expect, it } from '@jest/globals';

import type { SpendRow } from '@6pm/domain';

import { captureSourceOf, onCount, sourceStatuses } from './source-status';

function spend(over: Partial<SpendRow>): SpendRow {
  return {
    id: 's1',
    day: '2026-10-12',
    at: '2026-10-12T09:00:00.000Z',
    amount: 45000,
    categoryId: 'food',
    merchant: 'Phở Hòa',
    note: null,
    source: 'manual',
    status: 'kept',
    previousStatus: null,
    wallet: null,
    forWork: false,
    detail: null,
    foreignAmount: null,
    createdAt: '2026-10-12T09:00:00.000Z',
    updatedAt: '2026-10-12T09:00:00.000Z',
    ...over,
  };
}

const byName = (statuses: ReturnType<typeof sourceStatuses>) =>
  Object.fromEntries(statuses.map((s) => [s.source, s]));

describe('sourceStatuses', () => {
  it('lists the five ways in Settings order', () => {
    expect(sourceStatuses([]).map((s) => s.source)).toEqual([
      'share',
      'email',
      'scan',
      'wallet',
      'widgets',
    ]);
  });

  it('starts with share, scan and the widgets on, email and Wallet off', () => {
    const s = byName(sourceStatuses([]));
    expect(s['share']?.on).toBe(true);
    expect(s['scan']?.on).toBe(true);
    expect(s['widgets']?.on).toBe(true);
    expect(s['email']?.on).toBe(false);
    expect(s['wallet']?.on).toBe(false);
    expect(onCount(sourceStatuses([]))).toBe(3);
  });

  it('turns the Wallet automation on once an Apple Pay spend has arrived', () => {
    const tap = spend({ id: 'a', source: 'applePay', status: 'caught', merchant: 'Highlands' });
    const s = byName(sourceStatuses([tap]));
    expect(s['wallet']?.on).toBe(true);
    expect(s['wallet']?.last?.id).toBe('a');
    expect(onCount(sourceStatuses([tap]))).toBe(4);
  });

  it('keeps the Wallet automation off when its only spend was deleted', () => {
    const tap = spend({ source: 'applePay', status: 'deleted' });
    expect(byName(sourceStatuses([tap]))['wallet']?.on).toBe(false);
  });

  it('remembers the newest spend each way caught, whatever the list order', () => {
    const older = spend({ id: 'old', source: 'shared', at: '2026-10-12T02:00:00.000Z' });
    const newer = spend({ id: 'new', source: 'shared', at: '2026-10-12T09:40:00.000Z' });
    const qr = spend({ id: 'qr', source: 'qr', status: 'pending' });
    const s = byName(sourceStatuses([older, qr, newer]));
    expect(s['share']?.last?.id).toBe('new');
    expect(s['scan']?.last?.id).toBe('qr');
    expect(s['email']?.last).toBeNull();
    expect(s['widgets']?.last).toBeNull();
  });

  it('ignores typed, voiced and cash spends', () => {
    const typed = [
      spend({ source: 'manual' }),
      spend({ source: 'voice' }),
      spend({ source: 'cash' }),
    ];
    expect(sourceStatuses(typed).every((s) => s.last === null)).toBe(true);
  });
});

describe('captureSourceOf', () => {
  it('reads the guide a link names', () => {
    expect(captureSourceOf('wallet')).toBe('wallet');
    expect(captureSourceOf(['widgets', 'scan'])).toBe('widgets');
  });

  it('opens Share to 6pm for a missing or unknown name', () => {
    expect(captureSourceOf(undefined)).toBe('share');
    expect(captureSourceOf('fax')).toBe('share');
  });
});
