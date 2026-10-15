/**
 * A captured spend whose receipt printed no currency, saved in one 6pm guessed (from where the
 * photo was taken, the place it names, the trip, or đồng): it asks for a look until checked.
 */
export const sql = `
  ALTER TABLE spends ADD COLUMN currency_guessed INTEGER NOT NULL DEFAULT 0
    CHECK (currency_guessed IN (0, 1));
`;
