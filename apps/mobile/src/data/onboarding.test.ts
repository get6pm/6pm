import { describe, expect, it, jest } from '@jest/globals';

import { sql as createSettings } from '../db/migrations/0001-create-settings';
import { sql as createMoneyTables } from '../db/migrations/0002-create-money-tables';
import { sql as createTogetherMoves } from '../db/migrations/0003-create-together-moves';
import { sql as addCurrencyGuessed } from '../db/migrations/0004-spend-currency-guessed';
import { sql as addBillPayments } from '../db/migrations/0008-bill-kind-and-payments';
import { sql as addSpendMemo } from '../db/migrations/0009-spend-memo';
import { dayOf, createMoneyStore } from './money-store';
import {
  completeOnboarding,
  readWallets,
  writeWallets,
  type OnboardingAnswers,
} from './onboarding';
import type { SqlDatabase, SqlValue } from './table';

jest.mock('expo-crypto', () => ({ randomUUID: () => crypto.randomUUID() }));

// The phone's currency, as its region gives it: Vietnam unless a test moves it.
let mockPhoneCurrency = 'VND';
jest.mock('../money/device-money', () => ({ deviceCurrencyCode: () => mockPhoneCurrency }));

// A real SQLite database in memory, from Node's own module (see migrate.test.ts).
const { DatabaseSync } = process.getBuiltinModule('node:sqlite');

function openStore(today: string) {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(createSettings);
  sqlite.exec(createMoneyTables);
  sqlite.exec(createTogetherMoves);
  sqlite.exec(addCurrencyGuessed);
  sqlite.exec(addBillPayments);
  sqlite.exec(addSpendMemo);
  const db: SqlDatabase = {
    getAllAsync: <T>(source: string, params: SqlValue[]) =>
      Promise.resolve(sqlite.prepare(source).all(...params) as T[]),
    runAsync: (source, params) => Promise.resolve(sqlite.prepare(source).run(...params)),
    withTransactionAsync: async (task) => {
      sqlite.exec('BEGIN');
      try {
        await task();
        sqlite.exec('COMMIT');
      } catch (error) {
        sqlite.exec('ROLLBACK');
        throw error;
      }
    },
  };
  return createMoneyStore(db, today);
}

const answers: OnboardingAnswers = {
  income: 15_500_000,
  payday: { kind: 'sameDay', day: 25 },
  futureYou: 1_900_000,
  bills: [
    { name: 'Tiền nhà', icon: 'home', hue: 30, amount: 4_000_000 },
    { name: 'Spotify', icon: 'music_note', hue: 330, amount: 0 },
  ],
  wallets: ['MB', 'MOMO', 'CASH', 'MB'],
  closeAt: '19:30',
};

describe('completeOnboarding', () => {
  it('sets the month up and Home reads the same number the reveal showed', async () => {
    const store = openStore('2026-10-10');
    expect(dayOf(store.getSnapshot())).toBeNull();

    await completeOnboarding(store, answers, { today: '2026-10-10', language: 'vi' });

    const snap = store.getSnapshot();
    expect(snap.plan).toMatchObject({
      income: 15_500_000,
      payday: { kind: 'sameDay', day: 25 },
      futureYou: 1_900_000,
      closeAt: '19:30',
      persona: 'cheeky',
      serious: false,
      startedOn: '2026-10-10',
      currency: 'VND',
    });
    expect(snap.categories.map((c) => [c.id, c.name, c.icon, c.hue])).toEqual([
      ['food', 'Ăn uống', 'restaurant', 45],
      ['drinks', 'Đồ uống', 'local_cafe', 25],
      ['transport', 'Đi lại', 'two_wheeler', 245],
      ['groceries', 'Đi chợ', 'shopping_basket', 140],
      ['shopping', 'Mua sắm', 'local_mall', 300],
      ['fun', 'Giải trí', 'movie', 85],
      ['health', 'Sức khỏe', 'medical_services', 175],
      ['home', 'Nhà cửa', 'home', 210],
      ['family', 'Gia đình', 'family_restroom', 275],
      ['gifts', 'Quà tặng', 'redeem', 350],
    ]);
    expect(snap.bills.map((b) => [b.name, b.amount, b.dueDay, b.sort])).toEqual([
      ['Tiền nhà', 4_000_000, 1, 0],
      ['Spotify', 0, 1, 1],
    ]);
    expect(await readWallets(store)).toEqual(['MB', 'MOMO', 'CASH']);

    // 10 Oct with payday the 25th: 15 days left, 16 days covered, joining 16 days into a 31-day
    // cycle: (15.500.000 − 4.000.000 − 1.900.000) × 16/31 ÷ 16 = 309.677 → 309.000.
    expect(dayOf(snap)?.line).toBe(309_000);
  });

  it('counts what the person said they spent since payday in place of the estimate', async () => {
    const store = openStore('2026-10-10');
    await completeOnboarding(
      store,
      { ...answers, spentSincePayday: 6_000_000 },
      { today: '2026-10-10', language: 'vi' },
    );
    const snap = store.getSnapshot();
    expect(snap.plan?.spentSincePayday).toBe(6_000_000);
    // (15.500.000 − 4.000.000 − 1.900.000 − 6.000.000) ÷ 16 days = 225.000.
    expect(dayOf(snap)?.line).toBe(225_000);
  });

  it('starts Future you at payday: nothing set aside for it in the cycle joined', async () => {
    const store = openStore('2026-10-10');
    await completeOnboarding(
      store,
      { ...answers, spentSincePayday: 12_000_000, futureYouAtPayday: true },
      { today: '2026-10-10', language: 'vi' },
    );
    const snap = store.getSnapshot();
    expect(snap.plan?.futureYouAtPayday).toBe(true);
    // 15.500.000 − 4.000.000 − 12.000.000: still past the plan, but by 500.000 not 2.400.000.
    expect(dayOf(snap)).toMatchObject({ startFree: -500_000, line: 0, overspent: true });
  });

  it('counts in the phone’s currency, and a month set up again keeps the first one', async () => {
    mockPhoneCurrency = 'USD';
    try {
      const store = openStore('2026-10-10');
      const dollars = { ...answers, income: 500_000, futureYou: 50_000, bills: [] };
      await completeOnboarding(store, dollars, { today: '2026-10-10', language: 'en' });
      expect(store.getSnapshot().plan?.currency).toBe('USD');
      // ($5,000 − $500) × 16/31 ÷ 16 = $145.16, floored to whole dollars: $145.
      expect(dayOf(store.getSnapshot())?.line).toBe(14_500);

      mockPhoneCurrency = 'EUR';
      await completeOnboarding(store, dollars, { today: '2026-10-10', language: 'en' });
      expect(store.getSnapshot().plan?.currency).toBe('USD');
    } finally {
      mockPhoneCurrency = 'VND';
    }
  });

  it('keeps each bill’s due day and counts the ones already due before today as paid', async () => {
    const store = openStore('2026-10-10');
    await completeOnboarding(
      store,
      {
        ...answers,
        bills: [
          { name: 'Rent', icon: 'home', hue: 30, amount: 4_000_000, dueDay: 5 },
          { name: 'Power', icon: 'bolt', hue: 80, amount: 500_000, dueDay: 20 },
          { name: 'Gym', icon: 'fitness_center', hue: 150, amount: 300_000, dueDay: 10 },
        ],
      },
      { today: '2026-10-10', language: 'en' },
    );
    const snap = store.getSnapshot();
    expect(snap.bills.map((b) => [b.name, b.dueDay, b.paidCycle])).toEqual([
      ['Rent', 5, snap.cycle.start],
      ['Power', 20, null],
      ['Gym', 10, null],
    ]);
  });

  it('saves what is being paid off: a card bill, and a trả góp that ends after its months', async () => {
    const store = openStore('2026-10-10');
    await completeOnboarding(
      store,
      {
        ...answers,
        bills: [
          { name: 'Card', icon: 'credit_card', hue: 280, amount: 2_000_000, kind: 'card' },
          // Due on the 5th, already gone by: this cycle's payment is made, 12 are still to go.
          {
            name: 'Phone',
            icon: 'shopping_bag',
            hue: 280,
            amount: 1_000_000,
            dueDay: 5,
            monthsLeft: 12,
          },
          {
            name: 'Bike',
            icon: 'shopping_bag',
            hue: 280,
            amount: 900_000,
            dueDay: 20,
            monthsLeft: 3,
          },
        ],
      },
      { today: '2026-10-10', language: 'en' },
    );
    // Payday the 25th: 25 Sep → 25 Oct is October's cycle.
    expect(store.getSnapshot().bills.map((b) => [b.name, b.kind, b.lastMonth])).toEqual([
      ['Card', 'card', null],
      ['Phone', 'other', '2027-10'],
      ['Bike', 'other', '2026-12'],
    ]);
  });

  it('keeps categories the user already has', async () => {
    const store = openStore('2026-10-10');
    await store.tables.categories.put({
      id: 'coffee',
      name: 'Coffee',
      icon: 'local_cafe',
      hue: 25,
      countsDaily: true,
      sort: 0,
      archivedAt: null,
    });
    await completeOnboarding(store, answers, { today: '2026-10-10', language: 'en' });
    expect(store.getSnapshot().categories.map((c) => c.id)).toEqual(['coffee']);
  });

  it('replaces the chosen banks when Settings changes them', async () => {
    const store = openStore('2026-10-10');
    await completeOnboarding(store, answers, { today: '2026-10-10', language: 'en' });
    await writeWallets(store, ['VCB', 'CASH', 'VCB']);
    expect(await readWallets(store)).toEqual(['VCB', 'CASH']);
    await writeWallets(store, []);
    expect(await readWallets(store)).toEqual([]);
  });
});
