-- Budget together. Two people signed in with Apple keep shared pots they both add to. The core
-- app has no account: only someone who starts or joins Budget together gets a row here. Times are
-- ISO 8601 in UTC; money is whole đồng.

-- A person, known by Apple's stable user id for this app (`sub`). No email is asked for. The name
-- is the given name Apple hands over the first time, if the person shares it. The refresh token
-- lets the server revoke the app's access when the person deletes their account; it is useless
-- without the app's private key, which never reaches the database.
CREATE TABLE together_users (
  id TEXT PRIMARY KEY,
  apple_sub TEXT NOT NULL UNIQUE,
  name TEXT,
  apple_refresh_token TEXT,
  -- The bundle id the person signed in from: revoking needs the same client id.
  apple_client_id TEXT,
  created_at TEXT NOT NULL
);

-- Which anonymous device is signed in as which person. Deleting either drops the link.
CREATE TABLE together_devices (
  device_hash TEXT PRIMARY KEY REFERENCES devices (token_hash) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES together_users (id) ON DELETE CASCADE,
  linked_at TEXT NOT NULL
);

CREATE INDEX together_devices_user ON together_devices (user_id);

-- A pair: one person until the invite is taken, then two. When either leaves, the pair and
-- everything under it is deleted.
CREATE TABLE together_pairs (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL
);

-- A person is in one pair at most.
CREATE TABLE together_members (
  pair_id TEXT NOT NULL REFERENCES together_pairs (id) ON DELETE CASCADE,
  user_id TEXT NOT NULL UNIQUE REFERENCES together_users (id) ON DELETE CASCADE,
  joined_at TEXT NOT NULL,
  PRIMARY KEY (pair_id, user_id)
);

-- An invite link. Only the SHA-256 of its code is kept. It works once, until it expires.
CREATE TABLE together_invites (
  code_hash TEXT PRIMARY KEY,
  pair_id TEXT NOT NULL REFERENCES together_pairs (id) ON DELETE CASCADE,
  created_by TEXT NOT NULL REFERENCES together_users (id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used_at TEXT,
  used_by TEXT REFERENCES together_users (id) ON DELETE SET NULL
);

CREATE INDEX together_invites_pair ON together_invites (pair_id);

-- A shared pot. The id is made on the phone, so a retried write is the same pot.
CREATE TABLE together_pots (
  id TEXT PRIMARY KEY,
  pair_id TEXT NOT NULL REFERENCES together_pairs (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  hue INTEGER NOT NULL CHECK (hue BETWEEN 0 AND 359),
  goal INTEGER NOT NULL CHECK (goal > 0 AND goal = CAST(goal AS INTEGER)),
  needed_by TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX together_pots_pair ON together_pots (pair_id, created_at);

-- Money one person says they put into a shared pot. 6pm never moves money; this only counts.
CREATE TABLE together_contributions (
  id TEXT PRIMARY KEY,
  pot_id TEXT NOT NULL REFERENCES together_pots (id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  amount INTEGER NOT NULL CHECK (amount > 0 AND amount = CAST(amount AS INTEGER)),
  added_at TEXT NOT NULL
);

CREATE INDEX together_contributions_pot ON together_contributions (pot_id, added_at);

-- Nonces for Sign in with Apple: the phone asks for one, puts its SHA-256 in Apple's request,
-- and sends it back with the identity token. Each works once, for ten minutes, from the device
-- it was handed to. Stored as the SHA-256 the token carries.
CREATE TABLE together_nonces (
  nonce_hash TEXT PRIMARY KEY,
  device_hash TEXT NOT NULL REFERENCES devices (token_hash) ON DELETE CASCADE,
  expires_at TEXT NOT NULL
);

CREATE INDEX together_nonces_expires ON together_nonces (expires_at);

-- Apple's server-to-server notifications already acted on, by their `jti`, so one cannot be
-- replayed. Kept a little longer than a notification is accepted, then pruned.
CREATE TABLE together_apple_events (
  jti TEXT PRIMARY KEY,
  received_at TEXT NOT NULL
);

CREATE INDEX together_apple_events_received ON together_apple_events (received_at);
