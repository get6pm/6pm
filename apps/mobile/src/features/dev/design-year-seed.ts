import { randomUUID } from 'expo-crypto';

import { addDays, parts, payCycleOn, type LocalDate } from '@6pm/domain';

import type { MoneyStore } from '../../data/money-store';
import { seedDesignFriday } from './design-friday-seed';

const PLACES = [
  ['Phở Hòa', 'food', 45_000],
  ['Cà phê sữa đá', 'drinks', 29_000],
  ['Circle K', 'shopping', 65_000],
  ['Grab', 'transport', 38_000],
  ['Bách hoá Xanh', 'groceries', 120_000],
  ['Bánh mì Cô Ba', 'food', 25_000],
] as const;

const NOTES = ['Bún chả with Linh', 'Rainy, stayed in', 'Birthday dinner', 'Nothing much'];

/**
 * Developer tool: the prototype's Friday, plus every earlier day back to 1 January last year
 * closed (one in nine missed), with two or three spends each, so the shelf has full years and the
 * year book has months to bind. Replaces everything in the money tables.
 */
export async function seedDesignYear(store: MoneyStore, today: LocalDate): Promise<void> {
  await seedDesignFriday(store, today);
  const { db, tables } = store;
  const iso = new Date().toISOString();
  const cycle = payCycleOn(today, { kind: 'sameDay', day: 31 });
  const first = `${parts(today).year - 1}-01-01`;
  await db.withTransactionAsync(async () => {
    for (let day = first, n = 0; day < cycle.start; day = addDays(day, 1), n++) {
      if (n % 9 === 4) continue;
      const { year, month, day: dd } = parts(day);
      const count = 2 + (n % 2);
      let spent = 0;
      for (let k = 0; k < count; k++) {
        const [merchant, categoryId, base] = PLACES[(n * 3 + k) % PLACES.length] ?? PLACES[0];
        const amount = base + ((n * 7 + k * 13) % 9) * 10_000;
        spent += amount;
        const at = new Date(year, month - 1, dd, 9 + k * 4, 15).toISOString();
        await tables.spends.put({
          id: randomUUID(),
          day,
          at,
          amount,
          categoryId,
          merchant,
          note: null,
          source: 'manual',
          status: 'kept',
          previousStatus: null,
          wallet: null,
          forWork: false,
          detail: null,
          foreignAmount: null,
          createdAt: iso,
          updatedAt: iso,
        });
      }
      await tables.closedDays.put({
        day,
        closedAt: new Date(year, month - 1, dd, 18, 20).toISOString(),
        late: false,
        spent,
        line: 340_000,
        tomorrow: 340_000,
        note: n % 11 === 0 ? (NOTES[n % NOTES.length] ?? null) : null,
      });
    }
  });
  await store.load(today);
}
