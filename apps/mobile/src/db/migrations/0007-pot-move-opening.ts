/**
 * A pot move can be `opening`: what a pot already held before 6pm. SQLite cannot change a CHECK in
 * place, so the table is built again with the new kind and every row copied across.
 */
export const sql = `
  CREATE TABLE pot_moves_next (
    id TEXT PRIMARY KEY NOT NULL,
    pot_id TEXT NOT NULL REFERENCES pots (id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    kind TEXT NOT NULL CHECK (kind IN ('setAside', 'topUp', 'spent', 'opening')),
    cycle TEXT NOT NULL,
    at TEXT NOT NULL
  );
  INSERT INTO pot_moves_next (id, pot_id, amount, kind, cycle, at)
    SELECT id, pot_id, amount, kind, cycle, at FROM pot_moves;
  DROP TABLE pot_moves;
  ALTER TABLE pot_moves_next RENAME TO pot_moves;
  CREATE INDEX pot_moves_cycle ON pot_moves (cycle);
`;
