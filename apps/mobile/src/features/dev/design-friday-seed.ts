import { randomUUID } from 'expo-crypto';

import { addDays, diffDays, parts, payCycleOn, type LocalDate } from '@6pm/domain';

import type { MoneyStore } from '../../data/money-store';
import { writePlan } from '../../data/plan-settings';

/**
 * Developer tool: fills the database with the prototype's Friday (income 17,4tr, payday the 31st,
 * four bills, a 750k-a-month occasion, 2.365.000₫ spent earlier this cycle and the six spends of
 * the day) placed on today's date, so every screen can be compared with the design renders.
 * Replaces everything in the money tables.
 */
export async function seedDesignFriday(store: MoneyStore, today: LocalDate): Promise<void> {
  const { db, tables } = store;
  const now = new Date();
  const iso = now.toISOString();
  await db.withTransactionAsync(async () => {
    for (const table of [
      'spends',
      'merchant_rules',
      'bills',
      'pot_moves',
      'pots',
      'closed_days',
      'categories',
    ]) {
      await db.runAsync(`DELETE FROM ${table}`, []);
    }
    await writePlan(db, {
      income: 17_400_000,
      payday: { kind: 'sameDay', day: 31 },
      futureYou: 2_000_000,
      closeAt: '18:00',
      persona: 'cheeky',
      serious: false,
    });
    const categories = [
      ['food', 'Food', 'restaurant', 45],
      ['drinks', 'Drinks', 'local_cafe', 25],
      ['transport', 'Transport', 'two_wheeler', 245],
      ['groceries', 'Groceries', 'shopping_basket', 140],
      ['shopping', 'Shopping', 'local_mall', 300],
      ['gifts', 'Gifts', 'redeem', 350],
    ] as const;
    for (const [i, [id, name, icon, hue]] of categories.entries()) {
      await tables.categories.put({
        id,
        name,
        icon,
        hue,
        countsDaily: true,
        sort: i,
        archivedAt: null,
      });
    }
    const bills = [
      ['Rent', 'home', 3_500_000, 1, true],
      ['Viettel phone', 'smartphone', 100_000, 3, true],
      ['FPT internet', 'wifi', 220_000, 12, false],
      ['EVN electricity', 'bolt', 380_000, 15, false],
    ] as const;
    const cycle = payCycleOn(today, { kind: 'sameDay', day: 31 });
    for (const [i, [name, icon, amount, dueDay, paid]] of bills.entries()) {
      await tables.bills.put({
        id: randomUUID(),
        name,
        icon,
        hue: 60 + i * 70,
        amount,
        dueDay,
        paidCycle: paid ? cycle.start : null,
        sort: i,
        archivedAt: null,
      });
    }
    const { year, month } = parts(today);
    const due = new Date(Date.UTC(year, month - 1 + 3, 1));
    await tables.pots.put({
      id: randomUUID(),
      kind: 'occasion',
      name: 'Tết',
      icon: 'celebration',
      hue: 20,
      goal: 2_250_000,
      neededBy: due.toISOString().slice(0, 7),
      share: null,
      paused: false,
      createdAt: iso,
      archivedAt: null,
    });

    // 2.365.000₫ spread over the cycle's earlier days, one meal-sized spend per day.
    const earlier = diffDays(today, cycle.start);
    const spends: [string, string, string, number, string, string, string | null][] = [];
    if (earlier > 0) {
      const each = Math.floor(2_365_000 / earlier / 1000) * 1000;
      for (let d = 0; d < earlier; d++) {
        const amount = d === earlier - 1 ? 2_365_000 - each * (earlier - 1) : each;
        spends.push([addDays(cycle.start, d), '12:30', 'Lunch', amount, 'food', 'kept', null]);
      }
    }
    spends.push(
      [today, '07:42', 'Bánh mì Cô Ba', 25_000, 'food', 'kept', null],
      [today, '08:15', 'Cà phê sữa đá', 29_000, 'drinks', 'caught', 'MB Bank · FT26285XYZ'],
      [today, '12:10', 'Phở Hòa', 45_000, 'food', 'pending', 'You didn’t say if it went through'],
      [
        today,
        '13:30',
        'Grab ride home',
        38_000,
        'transport',
        'caught',
        'From k7m2qx@at6pm.app',
      ],
      [today, '15:05', 'Trà sữa', 45_000, 'drinks', 'kept', null],
      [today, '16:40', 'Circle K', 120_000, 'shopping', 'caught', 'Vietcombank · FT26285ABC'],
    );
    const sourceOf = (merchant: string) =>
      merchant === 'Cà phê sữa đá' || merchant === 'Circle K'
        ? 'shared'
        : merchant === 'Phở Hòa'
          ? 'qr'
          : merchant === 'Grab ride home'
            ? 'email'
            : merchant === 'Trà sữa'
              ? 'voice'
              : 'manual';
    // This week's earlier days are closed, except the third (the design's missed Wednesday).
    for (let d = new Date(`${today}T12:00:00`).getDay() === 1 ? 0 : 1; ; d++) {
      const day = addDays(today, -d);
      if (day < cycle.start || d > 6) break;
      const weekday = (new Date(`${day}T12:00:00`).getDay() + 6) % 7;
      if (weekday === 2 || day >= today) continue;
      await tables.closedDays.put({
        day,
        closedAt: new Date(`${day}T18:20:00`).toISOString(),
        late: false,
        spent: 280_000,
        line: 340_000,
        tomorrow: 345_000,
        note: null,
      });
      if (weekday === 0) break;
    }
    for (const [day, time, merchant, amount, categoryId, status, detail] of spends) {
      const [h = 0, m = 0] = time.split(':').map(Number);
      const { year: y, month: mo, day: dd } = parts(day);
      const at = new Date(y, mo - 1, dd, h, m).toISOString();
      await tables.spends.put({
        id: randomUUID(),
        day,
        at,
        amount,
        categoryId,
        merchant,
        note: null,
        source: sourceOf(merchant),
        status: status as 'kept' | 'caught' | 'pending',
        previousStatus: null,
        wallet: null,
        forWork: false,
        detail,
        foreignAmount: null,
        createdAt: iso,
        updatedAt: iso,
      });
    }
  });
  await store.load(today);
}
