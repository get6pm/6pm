-- The launch list from the Coming Soon page. The ticket is the signup's place in line: handed out
-- in order and never reused (AUTOINCREMENT). Emails arrive trimmed and lowercased, and each is on
-- the list once. `leak` is the visitor's monthly leak from the calculator in đồng, when they sent
-- one. Times are ISO 8601 in UTC.
CREATE TABLE waitlist (
  ticket INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  language TEXT NOT NULL CHECK (language IN ('en', 'vi')),
  leak INTEGER CHECK (leak IS NULL OR leak >= 0),
  created_at TEXT NOT NULL
);
