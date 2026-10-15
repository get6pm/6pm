import { EMAIL_HANDLE_ALPHABET, EMAIL_HANDLE_LENGTH } from '@6pm/domain';

/**
 * A new handle: random letters and digits, nothing about the person. 32 symbols over 6 places is
 * about a billion addresses, so a guessed one almost never belongs to anyone, and a clash with
 * another phone's is retried.
 */
export function newEmailHandle(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(EMAIL_HANDLE_LENGTH));
  // 256 is a multiple of 32, so taking each byte modulo the alphabet has no bias.
  return Array.from(bytes, (byte) => EMAIL_HANDLE_ALPHABET[byte % 32] ?? '').join('');
}

/** The device a handle belongs to, or null when no phone holds it. */
export async function deviceOfHandle(db: D1Database, handle: string): Promise<string | null> {
  const row = await db
    .prepare('SELECT device_hash FROM email_handles WHERE handle = ?')
    .bind(handle)
    .first<{ device_hash: string }>();
  return row?.device_hash ?? null;
}

/**
 * The device's handle: a new one when `replace` is set or it has none, else the one it has.
 * Receipts already waiting stay with the device, so a new address loses none of them. A clash
 * with another device's handle is tried again with a fresh one.
 */
export async function assignHandle(
  db: D1Database,
  deviceHash: string,
  replace: boolean,
): Promise<string> {
  if (!replace) {
    const row = await db
      .prepare('SELECT handle FROM email_handles WHERE device_hash = ?')
      .bind(deviceHash)
      .first<{ handle: string }>();
    if (row) return row.handle;
  }
  for (let attempt = 0; ; attempt += 1) {
    const handle = newEmailHandle();
    try {
      await db
        .prepare(
          `INSERT INTO email_handles (handle, device_hash, created_at) VALUES (?1, ?2, ?3)
           ON CONFLICT (device_hash) DO UPDATE
             SET handle = excluded.handle, created_at = excluded.created_at`,
        )
        .bind(handle, deviceHash, new Date().toISOString())
        .run();
      return handle;
    } catch (error) {
      if (attempt >= 2) throw error;
    }
  }
}
