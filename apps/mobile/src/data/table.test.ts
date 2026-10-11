import { describe, expect, it } from '@jest/globals';

import { openMemoryDb } from '../features/backup/test/memory-db';
import { openMoneyTables } from './money-tables';

const at = '2026-10-11T03:00:00.000Z';

describe('table put', () => {
  it('updates a row in place, so the rows that belong to it are kept', async () => {
    const db = openMemoryDb();
    const tables = openMoneyTables(db);
    await tables.pots.put({
      id: 'tet',
      kind: 'occasion',
      name: 'Tet',
      icon: 'redeem',
      hue: 20,
      goal: 3_000_000,
      neededBy: '2027-02',
      share: null,
      paused: false,
      createdAt: at,
      archivedAt: null,
    });
    await db.runAsync(
      "INSERT INTO pot_moves (id, pot_id, amount, kind, cycle, at) VALUES ('m1', 'tet', 500000, 'setAside', '2026-09-30', ?)",
      [at],
    );
    const pot = await tables.pots.get('tet');
    await tables.pots.put({ ...pot!, goal: 4_000_000 });
    expect((await tables.pots.get('tet'))?.goal).toBe(4_000_000);
    const moves = await db.getAllAsync<{ id: string }>('SELECT id FROM pot_moves', []);
    expect(moves).toEqual([{ id: 'm1' }]);
  });

  it('inserts a new row and rejects one that breaks the contract', async () => {
    const tables = openMoneyTables(openMemoryDb());
    const category = {
      id: 'food',
      name: 'Food',
      icon: 'restaurant',
      hue: 40,
      countsDaily: true,
      sort: 0,
      archivedAt: null,
    };
    await tables.categories.put(category);
    await tables.categories.put({ ...category, name: 'Eating' });
    expect(await tables.categories.all()).toEqual([{ ...category, name: 'Eating' }]);
    await expect(tables.categories.put({ ...category, name: '' })).rejects.toThrow();
  });
});
