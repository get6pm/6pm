/**
 * Bills gain a kind (a card's payment never moves free money), a last month after which they stop,
 * what paying one actually took this cycle, and the cycle the close last asked about it. A spend
 * can say which bill it paid (or 'repayment' for a card or loan with none): it is then kept out of
 * the daily number.
 */
export const sql = `
  ALTER TABLE bills ADD COLUMN kind TEXT NOT NULL DEFAULT 'other' CHECK (kind IN ('card', 'other'));
  ALTER TABLE bills ADD COLUMN last_month TEXT;
  ALTER TABLE bills ADD COLUMN paid_amount INTEGER CHECK (paid_amount >= 0);
  ALTER TABLE bills ADD COLUMN asked_cycle TEXT;
  ALTER TABLE spends ADD COLUMN pays_bill TEXT;
`;
