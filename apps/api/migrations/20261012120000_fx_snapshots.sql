-- Exchange rates for Travel mode, one row per pair per day per source, written by the scheduled
-- ingest. A rate is `quote` for one `base`, kept as the exact decimal text the source sent; a row
-- is never rewritten once stored. `as_of` is the date the source gives the rate; times are UTC.
CREATE TABLE fx_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  base TEXT NOT NULL CHECK (length(base) = 3),
  quote TEXT NOT NULL CHECK (length(quote) = 3),
  rate TEXT NOT NULL,
  as_of TEXT NOT NULL,
  source TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (base, quote, as_of, source)
);

CREATE INDEX fx_snapshots_pair ON fx_snapshots (base, quote, as_of);
