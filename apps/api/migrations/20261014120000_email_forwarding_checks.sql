-- Forwarding checks: a mail service (Gmail) asked to forward to a phone's address and sent it a
-- code and a confirm link. Only what was read from that email is kept, sealed like a receipt
-- (see `src/receipt-email/seal.ts`), one per device: a newer check replaces the older. A row is
-- deleted when the phone dismisses it, or after a week.
CREATE TABLE email_forwarding_checks (
  device_hash TEXT PRIMARY KEY REFERENCES devices (token_hash) ON DELETE CASCADE,
  id TEXT NOT NULL,
  sealed TEXT NOT NULL,
  received_at TEXT NOT NULL
);

CREATE INDEX email_forwarding_checks_received_at ON email_forwarding_checks (received_at);
