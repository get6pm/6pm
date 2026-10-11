import { describe, expect, it } from '@jest/globals';

import {
  BACKUP_FORMAT_VERSION,
  BACKUP_MAX_SEALED_BYTES,
  BACKUP_SNAPSHOT_VERSION,
  backupEnvelopeSchema,
  type BackupSnapshot,
} from '@6pm/domain';

import type { BackupCrypto } from './backup-crypto';
import { BackupError } from './backup-error';
import { backupTokenOf, newBackupKey, openEnvelope, sealSnapshot } from './backup-seal';
import { nodeBackupCrypto } from './test/node-crypto';

const crypto = nodeBackupCrypto;

const snapshot: BackupSnapshot = {
  version: BACKUP_SNAPSHOT_VERSION,
  takenAt: '2026-10-11T12:00:00.000Z',
  settings: { language: 'vi' },
  categories: [
    {
      id: 'food',
      name: 'Ăn uống',
      icon: 'restaurant',
      hue: 45,
      countsDaily: true,
      sort: 0,
      archivedAt: null,
    },
  ],
  spends: [],
  spendSightings: [],
  merchantRules: [],
  bills: [],
  pots: [],
  potMoves: [],
  closedDays: [],
};

async function reasonOf(promise: Promise<unknown>): Promise<string | undefined> {
  try {
    await promise;
  } catch (error) {
    return error instanceof BackupError ? error.reason : 'not a BackupError';
  }
  return undefined;
}

describe('sealing a snapshot', () => {
  it('opens with the key that sealed it', async () => {
    const key = newBackupKey(crypto);
    const envelope = await sealSnapshot(crypto, key, snapshot);
    expect(envelope.version).toBe(BACKUP_FORMAT_VERSION);
    expect(backupEnvelopeSchema.safeParse(envelope).success).toBe(true);
    expect(await openEnvelope(crypto, key, envelope)).toEqual(snapshot);
  });

  it('hides what is inside and seals the same snapshot differently each time', async () => {
    const key = newBackupKey(crypto);
    const first = await sealSnapshot(crypto, key, snapshot);
    const second = await sealSnapshot(crypto, key, snapshot);
    expect(first.data).not.toBe(second.data);
    expect(Buffer.from(first.data, 'base64').toString('latin1')).not.toContain('restaurant');
  });

  it('does not open with another key', async () => {
    const envelope = await sealSnapshot(crypto, newBackupKey(crypto), snapshot);
    expect(await reasonOf(openEnvelope(crypto, newBackupKey(crypto), envelope))).toBe('wrong_key');
  });

  it('does not open once a single byte was changed', async () => {
    const key = newBackupKey(crypto);
    const envelope = await sealSnapshot(crypto, key, snapshot);
    const bytes = Buffer.from(envelope.data, 'base64');
    bytes[20] = (bytes[20] ?? 0) ^ 1;
    const tampered = { ...envelope, data: bytes.toString('base64') };
    expect(await reasonOf(openEnvelope(crypto, key, tampered))).toBe('wrong_key');
  });

  it('refuses an envelope of a format it does not know', async () => {
    const key = newBackupKey(crypto);
    const envelope = await sealSnapshot(crypto, key, snapshot);
    const newer = { ...envelope, version: BACKUP_FORMAT_VERSION + 1 };
    expect(await reasonOf(openEnvelope(crypto, key, newer))).toBe('unsupported');
  });

  it('refuses a snapshot written by a newer app, whole', async () => {
    const key = newBackupKey(crypto);
    const newer = { ...snapshot, version: BACKUP_SNAPSHOT_VERSION + 1, brandNewTable: [] };
    const data = await crypto.seal(
      new TextEncoder().encode(JSON.stringify(newer)),
      key,
      new TextEncoder().encode(`6pm.backup.v${BACKUP_FORMAT_VERSION}`),
    );
    const envelope = { version: BACKUP_FORMAT_VERSION, data };
    expect(await reasonOf(openEnvelope(crypto, key, envelope))).toBe('unsupported');
  });

  it('calls something that opens but is not a snapshot damaged', async () => {
    const key = newBackupKey(crypto);
    const aad = new TextEncoder().encode(`6pm.backup.v${BACKUP_FORMAT_VERSION}`);
    for (const plain of ['not json', JSON.stringify({ version: 1, takenAt: 'x' })]) {
      const data = await crypto.seal(new TextEncoder().encode(plain), key, aad);
      const envelope = { version: BACKUP_FORMAT_VERSION, data };
      expect(await reasonOf(openEnvelope(crypto, key, envelope))).toBe('damaged');
    }
  });

  it('refuses to seal more than the server keeps', async () => {
    const huge: BackupCrypto = {
      ...crypto,
      seal: () => Promise.resolve(Buffer.alloc(BACKUP_MAX_SEALED_BYTES + 3).toString('base64')),
    };
    expect(await reasonOf(sealSnapshot(huge, newBackupKey(crypto), snapshot))).toBe('too_large');
  });
});

describe('the backup token', () => {
  it('comes from the key alone, so a second phone with the key finds the same backup', async () => {
    const key = newBackupKey(crypto);
    const token = await backupTokenOf(crypto, key);
    expect(await backupTokenOf(crypto, Uint8Array.from(key))).toBe(token);
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it('differs for every key and gives nothing of the key away', async () => {
    const key = newBackupKey(crypto);
    const token = await backupTokenOf(crypto, key);
    expect(await backupTokenOf(crypto, newBackupKey(crypto))).not.toBe(token);
    expect(Buffer.from(key).toString('base64url')).not.toBe(token);
  });
});
