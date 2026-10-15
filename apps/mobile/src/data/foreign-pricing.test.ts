import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { currencyOf, type InboxSpend, type LocalDate } from '@6pm/domain';

import { openMemoryDb } from '../features/backup/test/memory-db';
import { priceWaitingForeign, type ForeignPricingDeps } from './foreign-pricing';
import { importInbox } from './inbox-import';
import { moneyActions } from './money-actions';
import { createMoneyStore, type MoneyStore } from './money-store';
import { DEFAULT_PLAN, writePlan } from './plan-settings';

jest.mock('expo-crypto', () => ({ randomUUID: () => crypto.randomUUID() }));

const TODAY = '2026-10-11';
const paidAt = new Date(2026, 8, 2, 11, 55);

/** A Bali receipt the share extension could not price: no rate in its context. */
const jumi = (over: Partial<InboxSpend> = {}): InboxSpend => ({
  v: 1,
  id: crypto.randomUUID(),
  kind: 'spend',
  source: 'shared',
  status: 'caught',
  at: paidAt.toISOString(),
  amount: null,
  merchant: 'Jumi',
  categoryId: null,
  foreign: { currency: 'IDR', amount: '496650' },
  ...over,
});

describe('pricing captured foreign amounts', () => {
  let store: MoneyStore;
  let actions: ReturnType<typeof moneyActions>;
  let asked: LocalDate[];

  beforeEach(async () => {
    const db = openMemoryDb();
    store = createMoneyStore(db, TODAY);
    await writePlan(db, { ...DEFAULT_PLAN, income: 20_000_000, startedOn: '2026-08-25' });
    await store.tables.categories.put({
      id: 'food',
      name: 'food',
      icon: 'restaurant',
      hue: 40,
      countsDaily: true,
      sort: 0,
      archivedAt: null,
    });
    await store.load(TODAY);
    actions = moneyActions(store);
    asked = [];
  });

  const save = async (items: readonly InboxSpend[]) => {
    const files = new Map(items.map((item, i) => [`f${i}`, JSON.stringify(item)]));
    await importInbox({
      store,
      actions,
      report: () => undefined,
      enrich: (item) => Promise.resolve(item),
      inbox: {
        readInbox: () => Promise.resolve([...files].map(([id, json]) => ({ id, json }))),
        removeInbox: () => Promise.resolve(),
      },
    });
  };

  const price = (over: Partial<ForeignPricingDeps> = {}) =>
    priceWaitingForeign({
      store,
      actions,
      ratesOn: (day) => {
        asked.push(day);
        return Promise.resolve(day === '2026-09-02' ? [{ currency: 'IDR', rate: '1.6' }] : []);
      },
      lastRate: () => null,
      ...over,
    });

  it('saves a receipt with no rate as its foreign amount, waiting, never a silent 0₫', async () => {
    const item = jumi();
    await save([item]);
    expect(await store.tables.spends.get(item.id)).toMatchObject({
      amount: 0,
      status: 'caught',
      foreignAmount: { currency: 'IDR', amount: 496_650, rate: 0 },
    });
  });

  it('prices it at the rate of the day it was paid', async () => {
    const item = jumi();
    await save([item]);
    expect(await price()).toBe(1);
    expect(asked).toEqual(['2026-09-02']);
    expect(await store.tables.spends.get(item.id)).toMatchObject({
      amount: 794_640,
      foreignAmount: { currency: 'IDR', amount: 496_650, rate: 1.6 },
    });
    expect(await price()).toBe(0);
  });

  it('prices a receipt shared weeks later at its own day’s rate, not the card’s', async () => {
    const late = jumi({
      amount: 844_305,
      foreign: { currency: 'IDR', amount: '496650', rate: '1.7' },
    });
    await save([late]);
    expect(await price()).toBe(1);
    expect(await store.tables.spends.get(late.id)).toMatchObject({
      amount: 794_640,
      foreignAmount: { rate: 1.6 },
    });
  });

  it('asks once for each day, however many receipts it holds', async () => {
    await save([jumi(), jumi({ at: new Date(2026, 8, 2, 20, 2).toISOString() })]);
    expect(await price()).toBe(2);
    expect(asked).toEqual(['2026-09-02']);
  });

  it('falls back to the last rate kept, and keeps waiting with none', async () => {
    const item = jumi();
    await save([item]);
    const offline = { ratesOn: () => Promise.reject(new Error('offline')) };
    expect(await price({ ...offline, lastRate: () => null })).toBe(0);
    expect((await store.tables.spends.get(item.id))?.amount).toBe(0);
    expect(await price({ ...offline, lastRate: () => '1.62' })).toBe(1);
    expect((await store.tables.spends.get(item.id))?.amount).toBe(804_573);
  });

  it('prices in a home other than đồng with home’s quote of the same day', async () => {
    const item = jumi();
    await save([item]);
    const usd = currencyOf('USD');
    const ratesOn = () =>
      Promise.resolve([
        { currency: 'IDR', rate: '1.6' },
        { currency: 'USD', rate: '26000' },
      ]);
    expect(await price({ ratesOn, home: usd })).toBe(1);
    // Rp496.650 at 1,6₫ ÷ 26.000₫ a dollar = $30.56
    expect(await store.tables.spends.get(item.id)).toMatchObject({
      amount: 3_056,
      foreignAmount: { currency: 'IDR', amount: 496_650, rate: 0.000061538461 },
    });
  });

  it('falls back to the last rate kept when the day has no quote for home', async () => {
    const item = jumi();
    await save([item]);
    const home = currencyOf('USD');
    expect(await price({ home, lastRate: () => '0.0000615' })).toBe(1);
    expect((await store.tables.spends.get(item.id))?.amount).toBe(3_054);
  });

  it('repairs a receipt saved at 0₫ with its printed amount in the note', async () => {
    const older = jumi({ note: 'Rp496.650', foreign: undefined });
    delete older.foreign;
    await save([older]);
    expect(await store.tables.spends.get(older.id)).toMatchObject({
      amount: 0,
      foreignAmount: null,
    });
    expect(await price({ ratesOn: () => Promise.resolve([]) })).toBe(0);
    expect(await store.tables.spends.get(older.id)).toMatchObject({
      note: null,
      foreignAmount: { currency: 'IDR', amount: 496_650, rate: 0 },
    });
    expect(await price()).toBe(1);
    expect(await store.tables.spends.get(older.id)).toMatchObject({ amount: 794_640, note: null });
  });

  it('leaves a 0₫ spend with an ordinary note alone', async () => {
    const voice = jumi({ source: 'voice', note: 'Rp496.650' });
    delete voice.foreign;
    const typed = jumi({ note: 'Dinner with Linh' });
    delete typed.foreign;
    await save([voice, typed]);
    expect(await price()).toBe(0);
    expect((await store.tables.spends.get(typed.id))?.note).toBe('Dinner with Linh');
    expect((await store.tables.spends.get(voice.id))?.foreignAmount).toBeNull();
  });
});
