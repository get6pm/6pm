import { z } from 'zod';

import {
  billRowSchema,
  categoryRowSchema,
  closedDayRowSchema,
  merchantRuleRowSchema,
  potRowSchema,
  spendRowSchema,
  spendSourceSchema,
} from './local-rows';

/**
 * End-to-end encrypted backup. The phone seals a snapshot of its database with a random AES-256
 * key that only iCloud Keychain holds, and sends the ciphertext under a token derived from that
 * key. The server stores bytes it can never read and never learns who sent them.
 */

/** Wire format of the sealed envelope. A phone refuses any version it does not know. */
export const BACKUP_FORMAT_VERSION = 1;
/**
 * Format of the snapshot inside the envelope. Bumped when a table or field changes meaning, and
 * when a table is added: the snapshot is a strict object, so a phone that does not know the new
 * table must say "update 6pm" rather than call the backup damaged. A phone reads every version up
 * to its own.
 */
export const BACKUP_SNAPSHOT_VERSION = 2;

/** AES-GCM: a 12-byte nonce in front of the ciphertext, a 16-byte tag behind it. */
export const BACKUP_IV_BYTES = 12;
export const BACKUP_TAG_BYTES = 16;
/** The most sealed bytes (nonce + ciphertext + tag) the server keeps for one backup. */
export const BACKUP_MAX_SEALED_BYTES = 6 * 1024 * 1024;

export const BACKUP_TOKEN_HEADER = 'X-Backup-Token';
/** What the server accepts as a backup token: 43 URL-safe characters from a 32-byte hash. */
export const backupTokenPattern = /^[A-Za-z0-9_-]{32,128}$/;

// A flat character class: a pattern that groups by four backtracks per group and overflows the
// regex stack on a multi-megabyte string. The length-multiple-of-four rule is checked apart.
const base64Pattern = /^[A-Za-z0-9+/]+={0,2}$/;

/** Bytes a padded base64 string decodes to, without decoding it. Assumes well-formed padding. */
export function base64DecodedLength(text: string): number {
  const padding = text.endsWith('==') ? 2 : text.endsWith('=') ? 1 : 0;
  return (text.length / 4) * 3 - padding;
}

const BACKUP_MAX_BASE64_CHARS = Math.ceil(BACKUP_MAX_SEALED_BYTES / 3) * 4;

/** The request body of the largest sealed backup: its base64 plus the JSON around it. */
export const BACKUP_MAX_BODY_BYTES = BACKUP_MAX_BASE64_CHARS + 64;

/** The sealed snapshot: `data` is base64 of nonce, ciphertext and tag, in that order. */
export const backupEnvelopeSchema = z.strictObject({
  version: z.number().int().min(1).max(255),
  data: z
    .string()
    .max(BACKUP_MAX_BASE64_CHARS)
    .regex(base64Pattern)
    .refine(
      (text) => {
        if (text.length % 4 !== 0) return false;
        const bytes = base64DecodedLength(text);
        return bytes > BACKUP_IV_BYTES + BACKUP_TAG_BYTES && bytes <= BACKUP_MAX_SEALED_BYTES;
      },
      { message: 'Sealed data has the wrong size' },
    ),
});
export type BackupEnvelope = z.infer<typeof backupEnvelopeSchema>;

/** PUT /v1/backup: the request body is a `BackupEnvelope`; the answer says when it was kept. */
export const putBackupResponseSchema = z.object({
  updatedAt: z.string().min(20),
  /** Sealed bytes kept. */
  bytes: z.number().int().positive(),
});
export type PutBackupResponse = z.infer<typeof putBackupResponseSchema>;

/** GET /v1/backup: the envelope exactly as it was sent, and when the server kept it. */
export const getBackupResponseSchema = z.object({
  envelope: backupEnvelopeSchema,
  updatedAt: z.string().min(20),
});
export type GetBackupResponse = z.infer<typeof getBackupResponseSchema>;

export const deleteBackupResponseSchema = z.object({ deleted: z.literal(true) });

/**
 * The settings rows a backup carries, by key. Each value is the stored text (JSON for plan, look
 * and wallets; 'en' or 'vi' for language), so the readers that already check them on every launch
 * stay the only ones that know their shapes. Everything else in `settings` is this phone's own and is never sent: what the
 * store said about purchases, and where backup itself stands.
 */
export const BACKUP_SETTING_KEYS = ['plan', 'wallets', 'look', 'language'] as const;
export type BackupSettingKey = (typeof BACKUP_SETTING_KEYS)[number];

const settingText = z.string().max(100_000).optional();

export const spendSightingRowSchema = z.object({
  spendId: z.string().min(1),
  source: spendSourceSchema,
  seenAt: z.string().min(20),
  detail: z.string().nullable(),
  /** The capture it came from; absent in backups taken before sightings kept it. */
  captureId: z.string().nullable().optional(),
});
export type SpendSightingRow = z.infer<typeof spendSightingRowSchema>;

export const potMoveRowSchema = z.object({
  id: z.string().min(1),
  potId: z.string().min(1),
  amount: z.number().int(),
  kind: z.enum(['setAside', 'topUp', 'spent']),
  cycle: z.string().min(1),
  at: z.string().min(20),
});
export type PotMoveRow = z.infer<typeof potMoveRowSchema>;

/**
 * Money this phone's person put into a Budget together pot, from `together_moves`. It is kept in
 * the home currency and counts like a top-up in its pay cycle, so it has to come back with the
 * rest or the daily number rises after a restore.
 */
export const togetherMoveRowSchema = z.object({
  id: z.string().min(1),
  potId: z.string().min(1),
  potName: z.string(),
  amount: z.number().int().positive(),
  cycle: z.string().min(1),
  at: z.string().min(20),
});
export type TogetherMoveRow = z.infer<typeof togetherMoveRowSchema>;

/**
 * Everything the app keeps, as plain JSON. Rows are exactly the rows of the phone's database, so
 * a restore puts back what was there. Spend sightings come from `spend_sightings` and have no
 * contract elsewhere; the field names here are the camel-case of its columns.
 */
export const backupSnapshotSchema = z.strictObject({
  version: z.number().int().min(1).max(BACKUP_SNAPSHOT_VERSION),
  /** When the phone took it, ISO 8601 UTC. */
  takenAt: z.string().min(20),
  settings: z.strictObject({
    plan: settingText,
    wallets: settingText,
    look: settingText,
    language: settingText,
  }),
  categories: z.array(categoryRowSchema),
  spends: z.array(spendRowSchema),
  spendSightings: z.array(spendSightingRowSchema),
  merchantRules: z.array(merchantRuleRowSchema),
  bills: z.array(billRowSchema),
  pots: z.array(potRowSchema),
  potMoves: z.array(potMoveRowSchema),
  /** Absent in backups taken before Budget together history was carried. */
  togetherMoves: z.array(togetherMoveRowSchema).optional(),
  closedDays: z.array(closedDayRowSchema),
});
export type BackupSnapshot = z.infer<typeof backupSnapshotSchema>;

/**
 * What "284 items" counts: the things a person made and would miss. Sightings and pot moves are
 * detail of a spend and a pot, so they are not counted twice.
 */
export function backupItemCount(snapshot: BackupSnapshot): number {
  return (
    snapshot.spends.length +
    snapshot.bills.length +
    snapshot.pots.length +
    snapshot.closedDays.length +
    snapshot.categories.length +
    snapshot.merchantRules.length
  );
}
