import { describe, expect, it } from '@jest/globals';

import {
  currencyOf,
  moneyFormat,
  moneyLocale,
  payCycleOn,
  surfaceContextSchema,
  type SpendRow,
} from '@6pm/domain';
import { t as translate } from '@6pm/i18n';

import type { MoneySnapshot } from '../../data/money-store';
import { DEFAULT_PLAN } from '../../data/plan-settings';
import type { I18n } from '../../i18n/i18n';
import { surfaceContext } from './surface-context';
import { widgetLook } from './surface-palette';
import { surfaceSnapshot } from './surface-snapshot';

const phone = { languageTag: 'en-US', decimal: '.', group: ',' };
const dollars = moneyFormat(moneyLocale(currencyOf('USD'), 'en', phone));
const en: I18n['t'] = (key, ...params) => translate('en', key, ...params);
const today = '2026-10-09';
const stamp = '2026-10-09T05:00:00.000Z';

const coffee: SpendRow = {
  id: 's1',
  day: today,
  at: '2026-10-09T08:00:00.000Z',
  amount: 450,
  categoryId: 'food',
  merchant: 'Blue Bottle',
  note: null,
  source: 'manual',
  status: 'kept',
  previousStatus: null,
  wallet: null,
  forWork: false,
  detail: null,
  foreignAmount: null,
  createdAt: stamp,
  updatedAt: stamp,
};

const money: MoneySnapshot = {
  today,
  plan: { ...DEFAULT_PLAN, income: 400_000, futureYou: 0, currency: 'USD' },
  cycle: payCycleOn(today, { kind: 'lastDay' }),
  categories: [
    {
      id: 'food',
      name: 'Food',
      icon: 'restaurant',
      hue: 45,
      countsDaily: true,
      sort: 0,
      archivedAt: null,
    },
  ],
  cycleSpends: [coffee],
  waitingBefore: [],
  bills: [],
  pots: [],
  potSaved: {},
  topUpsThisCycle: 0,
  setAsideThisCycle: {},
  closedDays: [],
};

describe('the surfaces on a phone counting dollars', () => {
  it('write the widgets’ amounts in dollars', () => {
    const snap = surfaceSnapshot({
      money,
      look: widgetLook({ max: false, look: 'golden', serious: false }),
      maxLook: null,
      t: en,
      format: dollars,
      writtenAt: new Date(stamp),
    });
    expect(snap.entries[0]?.list[0]?.amountText).toBe('$4.50');
    expect(snap.entries[0]?.safeShort).toMatch(/^\$/);
  });

  it('name the home currency and the phone’s number style in the context', () => {
    const context = surfaceContext({
      money,
      rules: [],
      language: 'en',
      host: '6pm.oddeggs.studio',
      currency: 'USD',
      numberStyle: phone,
    });
    expect(surfaceContextSchema.parse(context)).toEqual(context);
    expect(context).toMatchObject({ currency: 'USD', numberStyle: phone });
  });

  it('leave đồng unsaid, as the context always was', () => {
    const context = surfaceContext({
      money,
      rules: [],
      language: 'vi',
      host: '6pm.oddeggs.studio',
      currency: 'VND',
      numberStyle: phone,
    });
    expect(context.currency).toBeUndefined();
    expect(context.numberStyle).toBeUndefined();
  });
});
