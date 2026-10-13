/**
 * Money this phone's person put into Budget together pots. It counts like a pot top-up in the pay
 * cycle it was added in, and stays here as history when the pot or the pair is gone.
 */
export const sql = `
  CREATE TABLE together_moves (
    id TEXT PRIMARY KEY NOT NULL,
    pot_id TEXT NOT NULL,
    pot_name TEXT NOT NULL,
    amount INTEGER NOT NULL CHECK (amount > 0),
    cycle TEXT NOT NULL,
    at TEXT NOT NULL
  );
  CREATE INDEX together_moves_cycle ON together_moves (cycle);
`;
