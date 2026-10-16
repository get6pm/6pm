import { describe, expect, it } from '@jest/globals';

import { BACKUP_SNAPSHOT_VERSION, backupSnapshotSchema } from '@6pm/domain';

import { openMemoryDb } from '../features/backup/test/memory-db';
import { seedMoney } from '../features/backup/test/seed-money';
import {
  buildSnapshot,
  isFreshDatabase,
  restoreSnapshot,
  snapshotItemCount,
  SnapshotRefused,
} from './backup-snapshot';
import { openMoneyTables } from './money-tables';

const TAKEN = '2026-10-11T12:00:00.000Z';

async function settingsOf(db: ReturnType<typeof openMemoryDb>) {
  const rows = await db.getAllAsync<{ key: string; value: string }>(
    'SELECT key, value FROM settings ORDER BY key',
    [],
  );
  return Object.fromEntries(rows.map((row) => [row.key, row.value]));
}

describe('the snapshot of the phone', () => {
  it('carries every table the app keeps and only the settings a person chose', async () => {
    const db = openMemoryDb();
    await seedMoney(db);
    const snapshot = await buildSnapshot(db, TAKEN);

    expect(backupSnapshotSchema.safeParse(snapshot).success).toBe(true);
    expect(snapshot.version).toBe(BACKUP_SNAPSHOT_VERSION);
    expect(snapshot.categories.map((row) => row.id)).toEqual(['food', 'rent']);
    expect(snapshot.spends.map((row) => row.id)).toEqual(['spend-1', 'spend-2']);
    expect(snapshot.spends[0]?.foreignAmount).toEqual({
      currency: 'USD',
      amount: 3.5,
      rate: 25_400,
    });
    expect(snapshot.spendSightings).toEqual([
      {
        spendId: 'spend-1',
        source: 'email',
        seenAt: '2026-10-10T05:13:00.000Z',
        detail: 'Duplicate merged',
        captureId: null,
      },
    ]);
    expect(snapshot.merchantRules).toHaveLength(1);
    expect(snapshot.bills).toHaveLength(1);
    expect(snapshot.pots).toHaveLength(1);
    expect(snapshot.potMoves).toEqual([
      {
        id: 'move-1',
        potId: 'pot-1',
        amount: 500_000,
        kind: 'setAside',
        cycle: '2026-09-25',
        at: '2026-10-01T00:00:00.000Z',
      },
    ]);
    expect(snapshot.closedDays).toHaveLength(1);
    expect(Object.keys(snapshot.settings).sort()).toEqual(['language', 'look', 'plan', 'wallets']);
    expect(snapshotItemCount(snapshot)).toBe(2 + 1 + 1 + 1 + 2 + 1);
  });

  it('puts everything back on an empty phone exactly as it was', async () => {
    const original = openMemoryDb();
    await seedMoney(original);
    const snapshot = await buildSnapshot(original, TAKEN);

    const fresh = openMemoryDb();
    expect(await isFreshDatabase(fresh)).toBe(true);
    await restoreSnapshot(fresh, snapshot);

    expect(await isFreshDatabase(fresh)).toBe(false);
    expect(await buildSnapshot(fresh, TAKEN)).toEqual(snapshot);
  });

  it('replaces what the phone held and leaves the settings that are its own', async () => {
    const source = openMemoryDb();
    await seedMoney(source);
    const snapshot = await buildSnapshot(source, TAKEN);

    const phone = openMemoryDb();
    const tables = openMoneyTables(phone);
    await tables.categories.put({
      id: 'stray',
      name: 'Stray',
      icon: 'redeem',
      hue: 1,
      countsDaily: true,
      sort: 0,
      archivedAt: null,
    });
    for (const [key, value] of [
      ['purchases', '{"max":"here"}'],
      ['backup.lastAt', '2026-10-01T00:00:00.000Z'],
      ['language', 'en'],
      ['look', '{"look":"other","config":{}}'],
    ] as const) {
      await phone.runAsync('INSERT INTO settings (key, value) VALUES (?, ?)', [key, value]);
    }

    await restoreSnapshot(phone, {
      ...snapshot,
      settings: { ...snapshot.settings, look: undefined },
    });

    expect((await tables.categories.all()).map((row) => row.id)).toEqual(['food', 'rent']);
    const settings = await settingsOf(phone);
    expect(settings['purchases']).toBe('{"max":"here"}');
    expect(settings['backup.lastAt']).toBe('2026-10-01T00:00:00.000Z');
    expect(settings['language']).toBe('vi');
    // The snapshot had no look, so the phone's own is cleared rather than kept.
    expect(settings['look']).toBeUndefined();
  });

  it('leaves the phone untouched when a snapshot fails half way', async () => {
    const source = openMemoryDb();
    await seedMoney(source);
    const snapshot = await buildSnapshot(source, TAKEN);

    const phone = openMemoryDb();
    await seedMoney(phone);
    const before = await buildSnapshot(phone, TAKEN);

    // A spend whose category is not in the snapshot: the foreign key refuses it mid-restore.
    const broken = {
      ...snapshot,
      categories: snapshot.categories.filter((row) => row.id !== 'food'),
    };
    await expect(restoreSnapshot(phone, broken)).rejects.toThrow();
    expect(await buildSnapshot(phone, TAKEN)).toEqual(before);
  });

  it('refuses unusable settings before it clears anything', async () => {
    const source = openMemoryDb();
    await seedMoney(source);
    const snapshot = await buildSnapshot(source, TAKEN);
    const phone = openMemoryDb();
    await seedMoney(phone);
    const before = await buildSnapshot(phone, TAKEN);

    for (const settings of [
      { ...snapshot.settings, plan: 'not json' },
      { ...snapshot.settings, plan: '{"income":-1}' },
      { ...snapshot.settings, language: 'fr' },
      { ...snapshot.settings, wallets: '{' },
    ]) {
      await expect(restoreSnapshot(phone, { ...snapshot, settings })).rejects.toBeInstanceOf(
        SnapshotRefused,
      );
    }
    expect(await buildSnapshot(phone, TAKEN)).toEqual(before);
  });

  it('leaves out a sighting or a move whose parent is not in the snapshot', async () => {
    const db = openMemoryDb();
    await seedMoney(db);
    await db.runAsync('PRAGMA foreign_keys = OFF', []);
    await db.runAsync(
      'INSERT INTO spend_sightings (spend_id, source, seen_at, detail) VALUES (?, ?, ?, ?)',
      ['gone', 'qr', '2026-10-10T05:13:00.000Z', null],
    );
    await db.runAsync(
      'INSERT INTO pot_moves (id, pot_id, amount, kind, cycle, at) VALUES (?, ?, ?, ?, ?, ?)',
      ['orphan', 'gone', 1, 'topUp', '2026-09-25', '2026-10-01T00:00:00.000Z'],
    );
    const snapshot = await buildSnapshot(db, TAKEN);
    expect(snapshot.spendSightings.map((row) => row.spendId)).toEqual(['spend-1']);
    expect(snapshot.potMoves.map((row) => row.id)).toEqual(['move-1']);
  });
});

describe('a fresh phone', () => {
  it('is one with no plan and no spend', async () => {
    const db = openMemoryDb();
    expect(await isFreshDatabase(db)).toBe(true);
    await openMoneyTables(db).categories.put({
      id: 'food',
      name: 'Food',
      icon: 'restaurant',
      hue: 45,
      countsDaily: true,
      sort: 0,
      archivedAt: null,
    });
    expect(await isFreshDatabase(db)).toBe(true);
    await db.runAsync("INSERT INTO settings (key, value) VALUES ('plan', '{}')", []);
    expect(await isFreshDatabase(db)).toBe(false);
  });
});
