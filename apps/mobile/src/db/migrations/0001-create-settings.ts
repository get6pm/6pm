/** Small key-value settings: close time, look, persona, language. Values are JSON text. */
export const sql = `
  CREATE TABLE settings (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL
  );
`;
