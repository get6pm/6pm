import { describe, expect, it } from '@jest/globals';

import type { ClosedDayRow } from '@6pm/domain';

import { DEFAULT_PLAN } from '../../data/plan-settings';
import { CLOSE_REMINDER_ID } from '../onboarding/close-reminder';
import { routeForTappedNotification } from './reminder-route';

const closed = (day: string): ClosedDayRow => ({
  day,
  closedAt: `${day}T11:00:00.000Z`,
  late: false,
  spent: 0,
  line: 0,
  tomorrow: 0,
  note: null,
});
const open = { plan: DEFAULT_PLAN, today: '2026-10-11', closedDays: [closed('2026-10-10')] };

describe('where the close reminder leads', () => {
  it('opens the close when there is a plan and today is not closed', () => {
    expect(routeForTappedNotification(CLOSE_REMINDER_ID, open)).toBe('/close');
  });

  it('stays on the app when today is already closed', () => {
    expect(
      routeForTappedNotification(CLOSE_REMINDER_ID, {
        ...open,
        closedDays: [closed('2026-10-11')],
      }),
    ).toBeNull();
  });

  it('stays on the app before a plan exists', () => {
    expect(routeForTappedNotification(CLOSE_REMINDER_ID, { ...open, plan: null })).toBeNull();
  });

  it('ignores notifications that are not the close reminder', () => {
    expect(routeForTappedNotification('something-else', open)).toBeNull();
  });
});
