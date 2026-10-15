import { randomUUID } from 'expo-crypto';

import { billDueIn, payCycleOn, type LocalDate, type Payday } from '@6pm/domain';
import { t, type Language } from '@6pm/i18n';

import type { MoneyStore } from './money-store';
import { deviceCurrencyCode } from '../money/device-money';
import { DEFAULT_PLAN, planCurrencyCode, readPlan, writePlan } from './plan-settings';

/** Everything onboarding asks, ready to store. Amounts are integer đồng a month. */
export interface OnboardingAnswers {
  readonly income: number;
  readonly payday: Payday;
  readonly futureYou: number;
  readonly bills: readonly OnboardingBill[];
  /** Bank and wallet codes from the VietQR catalogue ("MB", "MOMO"), plus "CASH". */
  readonly wallets: readonly string[];
  /** 'HH:MM', one of the close times the app offers. */
  readonly closeAt: string;
}

export interface OnboardingBill {
  /** Already in the user's language. */
  readonly name: string;
  readonly icon: string;
  readonly hue: number;
  /** 0 when the user chose "Add later". */
  readonly amount: number;
  /** Day of the month it is due; the 1st when left out. */
  readonly dueDay?: number;
}

/**
 * The categories a new install starts with: id, icon and hue. Names follow the user's language.
 * Seeded only when there are none yet, so an install that already has categories keeps its own.
 */
export const DEFAULT_CATEGORIES = [
  ['food', 'restaurant', 45],
  ['drinks', 'local_cafe', 25],
  ['transport', 'two_wheeler', 245],
  ['groceries', 'shopping_basket', 140],
  ['shopping', 'local_mall', 300],
  ['fun', 'movie', 85],
  ['health', 'medical_services', 175],
  ['home', 'home', 210],
  ['family', 'family_restroom', 275],
  ['gifts', 'redeem', 350],
] as const;

const WALLETS_KEY = 'wallets';
const FIRST_DUE_DAY = 1;

/**
 * Sets the month up from onboarding's answers in one transaction: the plan, the starter categories
 * (only when there are none yet), the chosen bills and the banks and wallets the user pays with.
 * Then reloads the store for `today`, so Home opens on the same number the reveal showed.
 */
export function completeOnboarding(
  store: MoneyStore,
  answers: OnboardingAnswers,
  { today, language }: { readonly today: LocalDate; readonly language: Language },
): Promise<void> {
  return store.exclusive(() => setUp(store, answers, { today, language }));
}

async function setUp(
  store: MoneyStore,
  answers: OnboardingAnswers,
  { today, language }: { readonly today: LocalDate; readonly language: Language },
): Promise<void> {
  const { db, tables } = store;
  await db.withTransactionAsync(async () => {
    const existing = await readPlan(db);
    await writePlan(db, {
      ...DEFAULT_PLAN,
      ...existing,
      income: Math.max(0, Math.round(answers.income)),
      payday: answers.payday,
      futureYou: Math.max(0, Math.round(answers.futureYou)),
      closeAt: answers.closeAt,
      startedOn: existing?.startedOn ?? today,
      // The phone's currency, once: a month set up again keeps the one it was first set up in.
      currency: existing ? planCurrencyCode(existing) : deviceCurrencyCode(),
    });

    const categories = await tables.categories.all();
    if (categories.length === 0) {
      for (const [sort, [id, icon, hue]] of DEFAULT_CATEGORIES.entries()) {
        await tables.categories.put({
          id,
          name: t(language, `onboarding.category.${id}`),
          icon,
          hue,
          countsDaily: true,
          sort,
          archivedAt: null,
        });
      }
    }

    // A bill whose day in this pay cycle has already gone by was paid before 6pm started
    // counting: it is not shown overdue.
    const cycle = payCycleOn(today, answers.payday);
    const bills = await tables.bills.all();
    let sort = bills.reduce((max, b) => Math.max(max, b.sort + 1), 0);
    for (const bill of answers.bills) {
      const dueDay = bill.dueDay ?? FIRST_DUE_DAY;
      await tables.bills.put({
        id: randomUUID(),
        name: bill.name,
        icon: bill.icon,
        hue: bill.hue,
        amount: Math.max(0, Math.round(bill.amount)),
        dueDay,
        paidCycle: billDueIn(cycle, dueDay) < today ? cycle.start : null,
        sort: sort++,
        archivedAt: null,
      });
    }

    await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [
      WALLETS_KEY,
      JSON.stringify([...new Set(answers.wallets)]),
    ]);
  });
  await store.loadInTurn(today);
}

/** The banks and wallets chosen in onboarding, for capture and the scan hand-off. */
export async function readWallets(store: MoneyStore): Promise<string[]> {
  const rows = await store.db.getAllAsync<{ value: string }>(
    'SELECT value FROM settings WHERE key = ?',
    [WALLETS_KEY],
  );
  const raw = rows[0]?.value;
  if (raw === undefined) return [];
  const parsed: unknown = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
}

/** Replaces the chosen banks and wallets, as Settings changes them later. */
export async function writeWallets(store: MoneyStore, wallets: readonly string[]): Promise<void> {
  await store.exclusive(() =>
    store.db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [
      WALLETS_KEY,
      JSON.stringify([...new Set(wallets)]),
    ]),
  );
}
