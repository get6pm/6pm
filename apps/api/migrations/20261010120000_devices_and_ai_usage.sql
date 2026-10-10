-- Anonymous devices. The token itself never reaches the database: only its SHA-256 hash does.
-- Times are ISO 8601 in UTC.
CREATE TABLE devices (
  token_hash TEXT PRIMARY KEY,
  language TEXT NOT NULL CHECK (language IN ('en', 'vi')),
  created_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL
);

-- The cost ledger: one row per model call, with no request or response text (no amounts, no
-- merchants). Deleting a device keeps the spend and drops the link to it.
CREATE TABLE ai_usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  route TEXT NOT NULL,
  model TEXT NOT NULL,
  input_tokens INTEGER NOT NULL CHECK (input_tokens >= 0),
  output_tokens INTEGER NOT NULL CHECK (output_tokens >= 0),
  device_hash TEXT REFERENCES devices (token_hash) ON DELETE SET NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX ai_usage_created_at ON ai_usage (created_at);
CREATE INDEX ai_usage_device_hash ON ai_usage (device_hash);
