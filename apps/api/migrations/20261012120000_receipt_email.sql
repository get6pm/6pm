-- Receipt email. A handle is the random local part of a phone's forwarding address
-- (`<handle>@<host>`): one per device, replaced when the phone asks for a new one. Times are
-- ISO 8601 in UTC. Deleting a device deletes its handle and anything waiting for it.
CREATE TABLE email_handles (
  handle TEXT PRIMARY KEY,
  device_hash TEXT NOT NULL UNIQUE REFERENCES devices (token_hash) ON DELETE CASCADE,
  created_at TEXT NOT NULL
);

-- Receipts read from email, waiting for their phone to fetch them. The email itself is never
-- stored: only what was read from it, sealed with AES-256-GCM under a key derived from a Worker
-- secret and the device (see `src/receipt-email/seal.ts`). A row is deleted when the phone
-- acknowledges it, or when it has waited too long.
CREATE TABLE email_captures (
  id TEXT PRIMARY KEY,
  device_hash TEXT NOT NULL REFERENCES devices (token_hash) ON DELETE CASCADE,
  sealed TEXT NOT NULL,
  received_at TEXT NOT NULL
);

CREATE INDEX email_captures_device ON email_captures (device_hash, received_at);
CREATE INDEX email_captures_received_at ON email_captures (received_at);
