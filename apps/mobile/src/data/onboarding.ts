import { randomUUID } from 'expo-crypto';

import type { LocalDate, Payday } from '@6pm/domain';
import { t, type Language } from '@6pm/i18n';

import type { MoneyStore } from './money-store';
import { DEFAULT_PLAN, readPlan, writePlan } from './plan-settings';

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
  /** Day of the month it is due; onboarding does not ask, so the 1st. */
  readonly dueDay?: number;
}

/** The categories a new month starts with: id, icon and hue. Names follow the user's language. */
export const DEFAULT_CATEGORIES = [
  ['food', 'restaurant', 45],
  ['drinks', 'local_cafe', 25],
  ['transport', 'two_wheeler', 245],
  ['groceries', 'shopping_basket', 140],
  ['shopping', 'local_mall', 300],
  ['gifts', 'redeem', 350],
] as const;

const WALLETS_KEY = 'wallets';
const FIRST_DUE_DAY = 1;

/**
 * Sets the month up from onboarding's answers in one transaction: the plan, the starter categories
 * (only when there are none yet), the chosen bills and the banks and wallets the user pays with.
 * Then reloads the store for `today`, so Home opens on the same number the reveal showed.
 */
export async function completeOnboarding(
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

    const bills = await tables.bills.all();
    let sort = bills.reduce((max, b) => Math.max(max, b.sort + 1), 0);
    for (const bill of answers.bills) {
      await tables.bills.put({
        id: randomUUID(),
        name: bill.name,
        icon: bill.icon,
        hue: bill.hue,
        amount: Math.max(0, Math.round(bill.amount)),
        dueDay: bill.dueDay ?? FIRST_DUE_DAY,
        paidCycle: null,
        sort: sort++,
        archivedAt: null,
      });
    }

    await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [
      WALLETS_KEY,
      JSON.stringify([...new Set(answers.wallets)]),
    ]);
  });
  await store.load(today);
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
