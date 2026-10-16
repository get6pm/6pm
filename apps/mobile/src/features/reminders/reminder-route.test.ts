import { describe, expect, it } from '@jest/globals';

import type { ClosedDayRow } from '@6pm/domain';

import { DEFAULT_PLAN } from '../../data/plan-settings';
import { CLOSE_REMINDER_PREFIX } from '../onboarding/close-reminder';
import {
  closeReminderStaysQuiet,
  deliveredAtOf,
  routeForTappedNotification,
} from './reminder-route';

const closed = (day: string): ClosedDayRow => ({
  day,
  closedAt: `${day}T11:00:00.000Z`,
  late: false,
  spent: 0,
  line: 0,
  tomorrow: 0,
  note: null,
});
const open = { plan: DEFAULT_PLAN, today: '2026-10-11', closedDays: [closed('2026-10-09')] };
const tonight = `${CLOSE_REMINDER_PREFIX}2026-10-11`;
const lastNight = `${CLOSE_REMINDER_PREFIX}2026-10-10`;
const sixToday = new Date(2026, 9, 11, 18, 0);
const sixYesterday = new Date(2026, 9, 10, 18, 0);

describe('where the close reminder leads', () => {
  it('opens the close when there is a plan and today is not closed', () => {
    expect(routeForTappedNotification(tonight, sixToday, open)).toBe('/close');
  });

  it('stays on the app when today is already closed', () => {
    const done = { ...open, closedDays: [closed('2026-10-11')] };
    expect(routeForTappedNotification(tonight, sixToday, done)).toBeNull();
  });

  it("opens last night's day, not today's close, when its reminder is tapped the next morning", () => {
    expect(routeForTappedNotification(lastNight, sixYesterday, open)).toBe(
      '/missed-day?day=2026-10-10',
    );
  });

  it("stays on the app when last night's reminder is tapped after that day was closed", () => {
    const done = { ...open, closedDays: [closed('2026-10-10')] };
    expect(routeForTappedNotification(lastNight, sixYesterday, done)).toBeNull();
  });

  it('reads the day from when an older repeating reminder was delivered', () => {
    expect(routeForTappedNotification('close-reminder', sixYesterday, open)).toBe(
      '/missed-day?day=2026-10-10',
    );
    expect(routeForTappedNotification('close-reminder', sixToday, open)).toBe('/close');
  });

  it('stays on the app before a plan exists', () => {
    expect(routeForTappedNotification(tonight, sixToday, { ...open, plan: null })).toBeNull();
  });

  it('ignores notifications that are not the close reminder', () => {
    expect(routeForTappedNotification('something-else', sixToday, open)).toBeNull();
  });
});

describe('when the close reminder arrives with 6pm open', () => {
  it('nudges on a day still open', () => {
    expect(closeReminderStaysQuiet(tonight, open, '/')).toBe(false);
  });

  it('says nothing once the day is closed', () => {
    const done = { ...open, closedDays: [closed('2026-10-11')] };
    expect(closeReminderStaysQuiet(tonight, done, '/')).toBe(true);
    expect(closeReminderStaysQuiet('close-reminder', done, '/')).toBe(true);
  });

  it('says nothing while the close is open', () => {
    expect(closeReminderStaysQuiet(tonight, open, '/close')).toBe(true);
  });
});

describe('when a notification was delivered', () => {
  it('reads seconds (iOS) and milliseconds (Android) alike', () => {
    const at = Date.UTC(2026, 9, 11, 11, 0);
    expect(deliveredAtOf(at / 1000).getTime()).toBe(at);
    expect(deliveredAtOf(at).getTime()).toBe(at);
  });
});
