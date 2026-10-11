import type { SqlDatabase } from '../../../data/table';
import { openMoneyTables } from '../../../data/money-tables';
import { writePlan } from '../../../data/plan-settings';

/** A month with something in every table the backup carries. */
export async function seedMoney(db: SqlDatabase): Promise<void> {
  const tables = openMoneyTables(db);
  await writePlan(db, {
    income: 15_500_000,
    payday: { kind: 'sameDay', day: 25 },
    futureYou: 1_900_000,
    closeAt: '19:30',
    persona: 'roast',
    serious: false,
    startedOn: '2026-10-01',
  });
  for (const [key, value] of [
    ['wallets', JSON.stringify(['MB', 'CASH'])],
    ['look', JSON.stringify({ look: 'goldenHour', config: {} })],
    ['language', 'vi'],
    ['purchases', '{"this":"phone only"}'],
  ] as const) {
    await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, value]);
  }
  await tables.categories.put({
    id: 'food',
    name: 'Ăn uống',
    icon: 'restaurant',
    hue: 45,
    countsDaily: true,
    sort: 0,
    archivedAt: null,
  });
  await tables.categories.put({
    id: 'rent',
    name: 'Nhà',
    icon: 'home',
    hue: 30,
    countsDaily: false,
    sort: 1,
    archivedAt: '2026-09-01T00:00:00.000Z',
  });
  await tables.spends.put({
    id: 'spend-1',
    day: '2026-10-10',
    at: '2026-10-10T05:12:00.000Z',
    amount: 45_000,
    categoryId: 'food',
    merchant: 'Phở Thìn',
    note: 'with An',
    source: 'qr',
    status: 'kept',
    previousStatus: 'caught',
    wallet: 'MB',
    forWork: true,
    detail: 'Read from your MB Bank receipt',
    foreignAmount: { currency: 'USD', amount: 3.5, rate: 25_400 },
    createdAt: '2026-10-10T05:12:00.000Z',
    updatedAt: '2026-10-10T12:30:00.000Z',
  });
  await tables.spends.put({
    id: 'spend-2',
    day: '2026-10-11',
    at: '2026-10-11T02:00:00.000Z',
    amount: 30_000,
    categoryId: 'food',
    merchant: 'Cà phê Cộng',
    note: null,
    source: 'manual',
    status: 'deleted',
    previousStatus: null,
    wallet: null,
    forWork: false,
    detail: null,
    foreignAmount: null,
    createdAt: '2026-10-11T02:00:00.000Z',
    updatedAt: '2026-10-11T02:01:00.000Z',
  });
  await db.runAsync(
    'INSERT INTO spend_sightings (spend_id, source, seen_at, detail) VALUES (?, ?, ?, ?)',
    ['spend-1', 'email', '2026-10-10T05:13:00.000Z', 'Duplicate merged'],
  );
  await tables.rules.put({
    merchantKey: 'pho thin',
    merchant: 'Phở Thìn',
    categoryId: 'food',
    learnedTimes: 3,
    setByUser: true,
  });
  await tables.bills.put({
    id: 'bill-1',
    name: 'Tiền nhà',
    icon: 'home',
    hue: 30,
    amount: 4_000_000,
    dueDay: 5,
    paidCycle: '2026-09-25',
    sort: 0,
    archivedAt: null,
  });
  await tables.pots.put({
    id: 'pot-1',
    kind: 'occasion',
    name: 'Tết',
    icon: 'redeem',
    hue: 350,
    goal: 6_000_000,
    neededBy: '2027-01',
    share: null,
    paused: false,
    createdAt: '2026-09-01T00:00:00.000Z',
    archivedAt: null,
  });
  await db.runAsync(
    'INSERT INTO pot_moves (id, pot_id, amount, kind, cycle, at) VALUES (?, ?, ?, ?, ?, ?)',
    ['move-1', 'pot-1', 500_000, 'setAside', '2026-09-25', '2026-10-01T00:00:00.000Z'],
  );
  await tables.closedDays.put({
    day: '2026-10-10',
    closedAt: '2026-10-10T12:30:00.000Z',
    late: false,
    spent: 45_000,
    line: 600_000,
    tomorrow: 612_000,
    note: 'quiet',
  });
}
