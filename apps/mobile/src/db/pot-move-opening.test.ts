import { describe, expect, it } from '@jest/globals';

import { sql as createSettings } from './migrations/0001-create-settings';
import { sql as createMoneyTables } from './migrations/0002-create-money-tables';
import { sql as addPotMoveOpening } from './migrations/0007-pot-move-opening';

// A real SQLite database in memory, from Node's own module (see migrate.test.ts).
const { DatabaseSync } = process.getBuiltinModule('node:sqlite');

describe('pot moves that can be an opening', () => {
  it('keeps every move it had and takes the new kind, with foreign keys on', () => {
    const sqlite = new DatabaseSync(':memory:');
    sqlite.exec('PRAGMA foreign_keys = ON;');
    sqlite.exec(createSettings);
    sqlite.exec(createMoneyTables);
    sqlite.exec(
      `INSERT INTO pots (id, kind, name, icon, hue, goal, needed_by, share, paused, created_at)
       VALUES ('tet', 'occasion', 'Tết', 'celebration', 85, 3000000, '2027-01', NULL, 0, '2026-10-01T00:00:00.000Z')`,
    );
    sqlite.exec(
      `INSERT INTO pot_moves (id, pot_id, amount, kind, cycle, at)
       VALUES ('m1', 'tet', 500000, 'setAside', '2026-09-30', '2026-10-01T00:00:00.000Z')`,
    );
    sqlite.exec('BEGIN');
    sqlite.exec(addPotMoveOpening);
    sqlite.exec('COMMIT');
    sqlite.exec(
      `INSERT INTO pot_moves (id, pot_id, amount, kind, cycle, at)
       VALUES ('opening:tet', 'tet', 1000000, 'opening', '2026-09-30', '2026-10-02T00:00:00.000Z')`,
    );
    expect(sqlite.prepare('SELECT id, kind FROM pot_moves ORDER BY id').all()).toEqual([
      { id: 'm1', kind: 'setAside' },
      { id: 'opening:tet', kind: 'opening' },
    ]);
    expect(() =>
      sqlite.exec(
        `INSERT INTO pot_moves (id, pot_id, amount, kind, cycle, at)
         VALUES ('x', 'tet', 1, 'other', '2026-09-30', '2026-10-02T00:00:00.000Z')`,
      ),
    ).toThrow();
    // Deleting the pot still takes its moves with it.
    sqlite.exec("DELETE FROM pots WHERE id = 'tet'");
    expect(sqlite.prepare('SELECT COUNT(*) AS n FROM pot_moves').get()).toEqual({ n: 0 });
    expect(
      sqlite.prepare("SELECT name FROM sqlite_master WHERE name = 'pot_moves_cycle'").get(),
    ).toEqual({
      name: 'pot_moves_cycle',
    });
  });
});
