/**
 * The money tables. Amounts are integer đồng; days are the phone's calendar day 'YYYY-MM-DD'
 * (a spend's `day` is the day it is filed under, which a late close can set to yesterday);
 * instants are ISO 8601 UTC. Ids are UUIDs made on the phone.
 */
export const sql = `
  CREATE TABLE categories (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    hue REAL NOT NULL,
    counts_daily INTEGER NOT NULL DEFAULT 1 CHECK (counts_daily IN (0, 1)),
    sort INTEGER NOT NULL,
    archived_at TEXT
  );

  CREATE TABLE spends (
    id TEXT PRIMARY KEY NOT NULL,
    day TEXT NOT NULL,
    at TEXT NOT NULL,
    amount INTEGER NOT NULL CHECK (amount >= 0),
    category_id TEXT NOT NULL REFERENCES categories (id),
    merchant TEXT NOT NULL,
    note TEXT,
    source TEXT NOT NULL
      CHECK (source IN ('manual', 'voice', 'shared', 'qr', 'email', 'applePay', 'cash')),
    status TEXT NOT NULL CHECK (status IN ('caught', 'pending', 'kept', 'skipped', 'deleted')),
    previous_status TEXT,
    wallet TEXT,
    for_work INTEGER NOT NULL DEFAULT 0 CHECK (for_work IN (0, 1)),
    -- Where it was read ("Read from your MB Bank receipt") and how it was seen (a merged duplicate).
    detail TEXT,
    -- Foreign amount when it was paid in another currency: {"currency":"USD","amount":3.5,"rate":25400}.
    foreign_amount TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE INDEX spends_day ON spends (day);
  CREATE INDEX spends_status ON spends (status);

  -- Every way a spend was seen: the source trail on Details, and the evidence for merging duplicates.
  CREATE TABLE spend_sightings (
    spend_id TEXT NOT NULL REFERENCES spends (id) ON DELETE CASCADE,
    source TEXT NOT NULL,
    seen_at TEXT NOT NULL,
    detail TEXT,
    PRIMARY KEY (spend_id, source, seen_at)
  );

  -- Merchant → category, learned from the user's own corrections or set by them.
  CREATE TABLE merchant_rules (
    merchant_key TEXT PRIMARY KEY NOT NULL,
    merchant TEXT NOT NULL,
    category_id TEXT NOT NULL REFERENCES categories (id),
    learned_times INTEGER NOT NULL DEFAULT 0,
    set_by_user INTEGER NOT NULL DEFAULT 0 CHECK (set_by_user IN (0, 1))
  );

  CREATE TABLE bills (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    hue REAL NOT NULL,
    amount INTEGER NOT NULL CHECK (amount >= 0),
    due_day INTEGER NOT NULL CHECK (due_day BETWEEN 1 AND 31),
    -- The pay cycle (its start day) it was last marked paid in.
    paid_cycle TEXT,
    sort INTEGER NOT NULL,
    archived_at TEXT
  );

  -- Future you goals and occasion pots: money set aside before the daily number.
  CREATE TABLE pots (
    id TEXT PRIMARY KEY NOT NULL,
    kind TEXT NOT NULL CHECK (kind IN ('goal', 'occasion')),
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    hue REAL NOT NULL,
    goal INTEGER NOT NULL CHECK (goal >= 0),
    -- 'YYYY-MM' the pot should be full by; null for open-ended goals.
    needed_by TEXT,
    -- A goal's share of Future you (0–1); null for occasions.
    share REAL,
    paused INTEGER NOT NULL DEFAULT 0 CHECK (paused IN (0, 1)),
    created_at TEXT NOT NULL,
    archived_at TEXT
  );

  CREATE TABLE pot_moves (
    id TEXT PRIMARY KEY NOT NULL,
    pot_id TEXT NOT NULL REFERENCES pots (id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    kind TEXT NOT NULL CHECK (kind IN ('setAside', 'topUp', 'spent')),
    cycle TEXT NOT NULL,
    at TEXT NOT NULL
  );
  CREATE INDEX pot_moves_cycle ON pot_moves (cycle);

  -- One row per closed day: the receipt the Diary shows.
  CREATE TABLE closed_days (
    day TEXT PRIMARY KEY NOT NULL,
    closed_at TEXT NOT NULL,
    late INTEGER NOT NULL DEFAULT 0 CHECK (late IN (0, 1)),
    spent INTEGER NOT NULL,
    line INTEGER NOT NULL,
    tomorrow INTEGER NOT NULL,
    note TEXT
  );
`;
