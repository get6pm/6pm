-- A phone with Max has no daily allowance of model reads for its receipt email. The phone says so
-- each time it fetches its receipts; this is when that word runs out, so a phone that stops
-- fetching (or lets Max lapse) falls back to the free allowance. ISO 8601 in UTC; null for free.
ALTER TABLE email_handles ADD COLUMN max_until TEXT;
