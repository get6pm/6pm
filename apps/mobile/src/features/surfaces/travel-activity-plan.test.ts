import { describe, expect, it } from '@jest/globals';

import { currencyOf, moneyFormat, moneyLocale, VND } from '@6pm/domain';
import { t as translate } from '@6pm/i18n';
import { paletteFor } from '@6pm/theme';

import type { RunningActivity } from '../../../modules/surfaces';
import type { I18n } from '../../i18n/i18n';
import { tripOf, type FxCache } from '../travel/trip';
import { travelState } from './activity-state';
import { isIdle } from './live-activity-plan';
import { travelActivityPlan, type TravelPlanInput } from './travel-activity-plan';

const trip = { key: 'trip-TH', stateJson: '{"left":"฿560 left"}' };
const travelling = (key: string, stateJson = trip.stateJson, id = `act-${key}`) =>
  ({ id, kind: 'travel', key, stateJson }) satisfies RunningActivity;
const waiting: RunningActivity = { id: 'p', kind: 'pendingPay', key: 'spend', stateJson: '{}' };

function plan(overrides: Partial<TravelPlanInput>) {
  return travelActivityPlan({ running: [], trip, foreground: true, enabled: true, ...overrides });
}

describe('the trip’s Live Activity', () => {
  it('starts one for a trip, in the foreground, when activities are allowed', () => {
    expect(plan({}).start).toEqual({ kind: 'travel', ...trip });
    expect(plan({ foreground: false }).start).toBeNull();
    expect(plan({ enabled: false }).start).toBeNull();
  });

  it('updates the running one only when what it shows changed', () => {
    expect(isIdle(plan({ running: [travelling('trip-TH')] }))).toBe(true);
    const changed = plan({ running: [travelling('trip-TH', '{"left":"฿500 left"}')] });
    expect(changed.update).toEqual([{ id: 'act-trip-TH', stateJson: trip.stateJson }]);
    expect(changed.start).toBeNull();
  });

  it('ends it when the trip ends, and replaces it in a new country', () => {
    expect(plan({ trip: null, running: [travelling('trip-TH')] }).end).toEqual([
      { id: 'act-trip-TH', finalStateJson: null },
    ]);
    const moved = plan({
      trip: { key: 'trip-SG', stateJson: '{}' },
      running: [travelling('trip-TH')],
    });
    expect(moved.end).toHaveLength(1);
    expect(moved.start?.key).toBe('trip-SG');
  });

  it('ends a duplicate and never touches a waiting payment', () => {
    const twice = plan({
      running: [
        waiting,
        travelling('trip-TH', trip.stateJson, 'a'),
        travelling('trip-TH', trip.stateJson, 'b'),
      ],
    });
    expect(twice.end).toEqual([{ id: 'b', finalStateJson: null }]);
    expect(isIdle(plan({ trip: null, running: [waiting] }))).toBe(true);
  });
});

describe('what the trip’s activity says', () => {
  const now = new Date('2026-10-12T05:00:00Z');
  const cache: FxCache = {
    fetchedAt: now.toISOString(),
    rates: {
      snapshotId: '1',
      asOf: '2026-10-12',
      stale: false,
      rates: [{ currency: 'THB', rate: '770.17', asOf: '2026-10-12', source: 'frankfurter' }],
    },
  };
  const place = { country: 'TH', name: 'Bangkok', at: now.toISOString() };
  const palette = paletteFor({ look: 'basic', hour: 18, serious: false });
  const t: I18n['t'] = (key, ...params) => translate('en', key, ...params);
  const format = moneyFormat(moneyLocale(VND, 'en'));

  it('reads like the design: place, what is left, spent of the line, đồng underneath', () => {
    const active = tripOf({ on: true, max: true, place, cache, now });
    expect(active).not.toBeNull();
    const state = travelState(active!, { line: 924_000, spent: 493_000 }, { t, palette, format });
    expect(state).toMatchObject({
      place: 'Bangkok · today',
      left: '฿559 left',
      spent: '฿640',
      of: 'of ฿1.199 · ≈ 493.000₫',
      path: '/',
      accent: palette.accent,
    });
  });

  it('says how far over when the day went over, and nothing without a rate', () => {
    const active = tripOf({ on: true, max: true, place, cache, now })!;
    expect(
      travelState(active, { line: 100_000, spent: 150_000 }, { t, palette, format })?.left,
    ).toBe('฿65 over');
    const noRate = tripOf({ on: true, max: true, place, cache: null, now })!;
    expect(travelState(noRate, { line: 100_000, spent: 0 }, { t, palette, format })).toBeNull();
  });

  it('shows the day in the home currency on a phone counting dollars', () => {
    const usd = currencyOf('USD');
    const phone = { languageTag: 'en-US', decimal: '.', group: ',' };
    const dollars = moneyFormat(moneyLocale(usd, 'en', phone));
    const quotes: FxCache = {
      ...cache,
      rates: {
        ...cache.rates,
        rates: [
          ...cache.rates.rates,
          { currency: 'USD', rate: '26000', asOf: '2026-10-12', source: 'frankfurter' },
        ],
      },
    };
    const active = tripOf({ on: true, max: true, place, cache: quotes, now, home: usd })!;
    const state = travelState(
      active,
      { line: 3_000, spent: 1_500 },
      { t, palette, format: dollars, phone },
    );
    expect(state).toMatchObject({
      left: '฿506 left',
      spent: '฿506',
      of: 'of ฿1,012 · ≈ $15',
    });
  });
});
