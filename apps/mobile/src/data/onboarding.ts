import { randomUUID } from 'expo-crypto';

import {
  billDueIn,
  lastMonthAfter,
  payCycleOn,
  type BillKind,
  type LocalDate,
  type Payday,
} from '@6pm/domain';
import { t, type Language } from '@6pm/i18n';

import type { MoneyStore } from './money-store';
import { deviceCurrencyCode } from '../money/device-money';
import { DEFAULT_PLAN, planCurrencyCode, readPlan, writePlan } from './plan-settings';

/** Everything onboarding asks, ready to store. Amounts are monthly, in home-currency minor units. */
export interface OnboardingAnswers {
  readonly income: number;
  readonly payday: Payday;
  readonly futureYou: number;
  readonly bills: readonly OnboardingBill[];
  /**
   * Bank and wallet codes from the VietQR catalogue ("MB", "MOMO"), "CASH", and banks added by the
   * name typed for them ("name:Chase"; see `features/banks/named-bank`).
   */
  readonly wallets: readonly string[];
  /** 'HH:MM', one of the close times the app offers. */
  readonly closeAt: string;
  /**
   * Joining part-way through a pay cycle: what the person said they spent since payday, not
   * counting bills. Null when they left the estimate as it was.
   */
  readonly spentSincePayday?: number | null;
  /** "Start Future you at payday" was chosen for the cycle they joined. */
  readonly futureYouAtPayday?: boolean;
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
  /** A card's payment never moves free money; `other` when left out. */
  readonly kind?: BillKind;
  /** Payments still to go (trả góp): the bill stops by itself after the last. No end when left out. */
  readonly monthsLeft?: number;
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
    const {
      spentSincePayday: _answer,
      futureYouAtPayday: _skip,
      ...kept
    } = existing ?? DEFAULT_PLAN;
    const answer = answers.spentSincePayday;
    await writePlan(db, {
      ...DEFAULT_PLAN,
      ...kept,
      ...(answer == null ? {} : { spentSincePayday: Math.max(0, Math.round(answer)) }),
      ...(answers.futureYouAtPayday === true ? { futureYouAtPayday: true } : {}),
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
      const paid = billDueIn(cycle, dueDay) < today;
      await tables.bills.put({
        id: randomUUID(),
        name: bill.name,
        icon: bill.icon,
        hue: bill.hue,
        amount: Math.max(0, Math.round(bill.amount)),
        dueDay,
        paidCycle: paid ? cycle.start : null,
        sort: sort++,
        archivedAt: null,
        kind: bill.kind ?? 'other',
        lastMonth:
          bill.monthsLeft === undefined ? null : lastMonthAfter(cycle, bill.monthsLeft, paid),
        paidAmount: null,
        askedCycle: null,
      });
    }

    await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [
      WALLETS_KEY,
      JSON.stringify([...new Set(answers.wallets)]),
    ]);
  });
  await store.loadInTurn(today);
}

/** The banks and wallets chosen in onboarding, for capture and the scan hand-off; codes as saved. */
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
