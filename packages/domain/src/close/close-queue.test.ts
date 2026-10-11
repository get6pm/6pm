import { describe, expect, it } from 'vitest';

import { closeQueue, type QueueSpend } from './close-queue';

const spend = (id: string, day: string, at: string, status: QueueSpend['status']): QueueSpend => ({
  id,
  day,
  at,
  status,
});

describe('closeQueue', () => {
  const spends = [
    spend('today-late', '2026-10-11', '2026-10-11T13:00:00.000Z', 'caught'),
    spend('earlier', '2026-10-09', '2026-10-09T16:00:00.000Z', 'pending'),
    spend('kept', '2026-10-11', '2026-10-11T02:00:00.000Z', 'kept'),
    spend('skipped', '2026-10-10', '2026-10-10T02:00:00.000Z', 'skipped'),
    spend('today-early', '2026-10-11', '2026-10-11T03:00:00.000Z', 'caught'),
  ];

  it('holds earlier waiting items and the closing day, oldest first', () => {
    expect(closeQueue(spends, '2026-10-11').map((s) => s.id)).toEqual([
      'earlier',
      'today-early',
      'today-late',
    ]);
  });

  it('leaves out anything filed after the closing day', () => {
    expect(closeQueue(spends, '2026-10-10').map((s) => s.id)).toEqual(['earlier']);
  });
});
