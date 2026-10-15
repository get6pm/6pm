-- A shared pot keeps one currency, its maker's home currency (ISO 4217, upper case), and its goal
-- and every contribution are whole minor units of it (đồng, cents, yen). Pots made before pots
-- had a currency are in đồng, as are pots from a phone that sends none.
ALTER TABLE together_pots
  ADD COLUMN currency TEXT NOT NULL DEFAULT 'VND' CHECK (currency GLOB '[A-Z][A-Z][A-Z]');
