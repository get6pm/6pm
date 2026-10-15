/**
 * The Ask conversation, kept on the phone so it is still there next time: each question and
 * each answer card, with the reading behind an answer for follow-ups. Never sent anywhere.
 */
export const sql = `
  CREATE TABLE ask_turns (
    id TEXT PRIMARY KEY NOT NULL,
    at TEXT NOT NULL,
    kind TEXT NOT NULL CHECK (kind IN ('me', 'answer')),
    body TEXT NOT NULL
  );
`;
