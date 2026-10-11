import { describe, expect, it } from '@jest/globals';

import {
  BACKUP_FORMAT_VERSION,
  type BackupEnvelope,
  type GetBackupResponse,
  type PutBackupResponse,
} from '@6pm/domain';

import {
  buildSnapshot,
  isFreshDatabase,
  restoreSnapshot,
  snapshotItemCount,
} from '../../data/backup-snapshot';
import { createBackupStateStore } from '../../data/backup-state';
import type { SqlDatabase } from '../../data/table';
import type { BackupApi } from './backup-api';
import { BackupError } from './backup-error';
import { backupTokenOf } from './backup-seal';
import { createBackupService, type BackupService } from './backup-service';
import { createBackupVault, type SecretStore } from './backup-vault';
import { openMemoryDb } from './test/memory-db';
import { nodeBackupCrypto } from './test/node-crypto';
import { seedMoney } from './test/seed-money';

/** The server: sealed envelopes by token, like the real one, and a switch to cut the network. */
class FakeServer implements BackupApi {
  readonly stored = new Map<string, { envelope: BackupEnvelope; updatedAt: string }>();
  offline = false;
  puts = 0;

  private reach(): void {
    if (this.offline) throw new BackupError('network');
  }

  meta(token: string): Promise<PutBackupResponse | null> {
    return this.answer(() => {
      const row = this.stored.get(token);
      return row ? { updatedAt: row.updatedAt, bytes: 1 } : null;
    });
  }

  get(token: string): Promise<GetBackupResponse | null> {
    return this.answer(() => this.stored.get(token) ?? null);
  }

  put(token: string, envelope: BackupEnvelope): Promise<PutBackupResponse> {
    return this.answer(() => {
      this.puts += 1;
      const updatedAt = new Date(Date.UTC(2026, 9, 11, 12, this.puts)).toISOString();
      this.stored.set(token, { envelope, updatedAt });
      return { updatedAt, bytes: 1 };
    });
  }

  remove(token: string): Promise<void> {
    return this.answer(() => {
      this.stored.delete(token);
    });
  }

  private answer<T>(run: () => T): Promise<T> {
    try {
      this.reach();
      return Promise.resolve(run());
    } catch (error) {
      return Promise.reject(error instanceof Error ? error : new Error('failed'));
    }
  }
}

const fakeServer = () => new FakeServer();

/** The one backup the server holds, with the token it is filed under. */
function onlyBackup(server: FakeServer): [string, { envelope: BackupEnvelope; updatedAt: string }] {
  const [entry] = [...server.stored];
  if (entry === undefined) throw new Error('The server holds no backup');
  return entry;
}

/** The iCloud Keychain: one item shared by every phone signed in to the same Apple ID. */
class FakeKeychain implements SecretStore {
  value: string | null = null;
  broken = false;

  read(): Promise<string | null> {
    return this.broken ? Promise.reject(new Error('locked')) : Promise.resolve(this.value);
  }

  write(value: string): Promise<void> {
    if (this.broken) return Promise.reject(new Error('locked'));
    this.value = value;
    return Promise.resolve();
  }

  clear(): Promise<void> {
    this.value = null;
    return Promise.resolve();
  }
}

const fakeKeychain = () => new FakeKeychain();

function phone(
  server: FakeServer,
  keychain: SecretStore,
  clock: { now: number } = { now: Date.UTC(2026, 9, 11, 12) },
) {
  const db: SqlDatabase = openMemoryDb();
  const state = createBackupStateStore(db);
  const service: BackupService = createBackupService({
    crypto: nodeBackupCrypto,
    vault: createBackupVault(keychain),
    api: server,
    data: {
      build: (takenAt) => buildSnapshot(db, takenAt),
      restore: (snapshot) => restoreSnapshot(db, snapshot),
      isFresh: () => isFreshDatabase(db),
      itemCount: snapshotItemCount,
    },
    state,
    now: () => clock.now,
  });
  return { db, state, service, clock };
}

describe('backing up', () => {
  it('makes a key, keeps it in the Keychain and sends only ciphertext under a token', async () => {
    const server = fakeServer();
    const keychain = fakeKeychain();
    const { db, service, state } = phone(server, keychain);
    await seedMoney(db);

    expect(await service.status()).toEqual({ kind: 'off' });
    expect(await service.backUpNow()).toBe('sent');

    expect(keychain.value).toMatch(/^v1\./);
    const [token, row] = onlyBackup(server);
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(row?.envelope.version).toBe(BACKUP_FORMAT_VERSION);
    const raw = Buffer.from(row?.envelope.data ?? '', 'base64').toString('latin1');
    for (const secret of ['Phở', 'Cộng', 'Tiền nhà', 'income', 'spend-1']) {
      expect(raw).not.toContain(secret);
    }
    expect(JSON.stringify([...server.stored])).not.toContain(keychain.value?.slice(3) ?? 'x');

    expect(await service.status()).toMatchObject({ kind: 'on', items: 8, tooLarge: false });
    expect((await state.read()).lastAt).toBe('2026-10-11T12:00:00.000Z');
  });

  it('sends nothing from a phone with nothing in it', async () => {
    const server = fakeServer();
    const keychain = fakeKeychain();
    const { service } = phone(server, keychain);
    expect(await service.backUpNow()).toBe('empty');
    expect(server.stored.size).toBe(0);
    expect(keychain.value).toBeNull();
  });

  it('reuses the key and replaces the earlier backup', async () => {
    const server = fakeServer();
    const keychain = fakeKeychain();
    const { db, service } = phone(server, keychain);
    await seedMoney(db);
    await service.backUpNow();
    const key = keychain.value;
    await service.backUpNow();
    expect(keychain.value).toBe(key);
    expect(server.stored.size).toBe(1);
    expect(server.puts).toBe(2);
  });

  it('does not make a key it cannot keep', async () => {
    const server = fakeServer();
    const keychain = fakeKeychain();
    keychain.broken = true;
    const { db, service } = phone(server, keychain);
    await seedMoney(db);
    await expect(service.backUpNow()).rejects.toMatchObject({ reason: 'keychain' });
    expect(server.stored.size).toBe(0);
  });

  it('remembers a backup that was too large and stops trying by itself', async () => {
    const server = fakeServer();
    server.put = () => Promise.reject(new BackupError('too_large'));
    const keychain = fakeKeychain();
    const { db, service } = phone(server, keychain);
    await seedMoney(db);
    await expect(service.backUpNow()).rejects.toMatchObject({ reason: 'too_large' });
    expect(await service.status()).toMatchObject({ kind: 'on', tooLarge: true });
    expect(await service.backUpIfDue(null)).toBe(false);
  });
});

describe('restoring on a new iPhone', () => {
  async function backedUpPhone() {
    const server = fakeServer();
    const keychain = fakeKeychain();
    const first = phone(server, keychain);
    await seedMoney(first.db);
    await first.service.backUpNow();
    return { server, keychain, first };
  }

  it('finds the backup with the key from iCloud Keychain and brings everything back', async () => {
    const { server, keychain, first } = await backedUpPhone();
    const second = phone(server, keychain);

    expect(await second.service.status()).toEqual({ kind: 'unsettled' });
    const search = await second.service.findRestore();
    if (search.kind !== 'found') throw new Error(`Expected a backup, got ${search.kind}`);
    expect(search.offer.items).toBe(8);

    await second.service.restore(search.offer);
    const takenAt = '2026-10-11T12:00:00.000Z';
    expect(await buildSnapshot(second.db, takenAt)).toEqual(await buildSnapshot(first.db, takenAt));
    expect(await second.service.status()).toMatchObject({ kind: 'on', items: 8 });
    expect(await second.service.findRestore()).toEqual({ kind: 'none' });
  });

  it('knows a backup is waiting without downloading it', async () => {
    const { server, keychain } = await backedUpPhone();
    const second = phone(server, keychain);
    server.offline = true;
    expect(await second.service.hasUnclaimedBackup()).toBe(false);
    server.offline = false;
    expect(await second.service.hasUnclaimedBackup()).toBe(true);
    await second.service.declineRestore();
    expect(await second.service.hasUnclaimedBackup()).toBe(false);
    expect(await phone(server, fakeKeychain()).service.hasUnclaimedBackup()).toBe(false);
  });

  it('offers nothing to an iPhone with no key', async () => {
    const { server } = await backedUpPhone();
    const stranger = phone(server, fakeKeychain());
    expect(await stranger.service.findRestore()).toEqual({ kind: 'none' });
  });

  it('settles when the key is there but the server has nothing', async () => {
    const server = fakeServer();
    const keychain = fakeKeychain();
    const { db, service } = phone(server, keychain);
    await seedMoney(db);
    await service.backUpNow();
    server.stored.clear();

    const second = phone(server, keychain);
    expect(await second.service.findRestore()).toEqual({ kind: 'none' });
    expect(await second.service.status()).toMatchObject({ kind: 'on' });
  });

  it('says a wrong key from a newer app and from damage, without touching the phone', async () => {
    const { server, keychain } = await backedUpPhone();
    const [token, row] = onlyBackup(server);

    const bytes = Buffer.from(row?.envelope.data ?? '', 'base64');
    bytes[30] = (bytes[30] ?? 0) ^ 1;
    server.stored.set(token, {
      updatedAt: row?.updatedAt ?? '',
      envelope: { version: BACKUP_FORMAT_VERSION, data: bytes.toString('base64') },
    });
    const wrong = phone(server, keychain);
    expect(await wrong.service.findRestore()).toEqual({ kind: 'unreadable', reason: 'wrong_key' });

    server.stored.set(token, {
      updatedAt: row?.updatedAt ?? '',
      envelope: { version: BACKUP_FORMAT_VERSION + 1, data: row?.envelope.data ?? '' },
    });
    const newer = phone(server, keychain);
    expect(await newer.service.findRestore()).toEqual({
      kind: 'unreadable',
      reason: 'unsupported',
    });
    expect(await isFreshDatabase(newer.db)).toBe(true);
  });

  it('throws network when the server cannot be asked, and asks again next time', async () => {
    const { server, keychain } = await backedUpPhone();
    const second = phone(server, keychain);
    server.offline = true;
    await expect(second.service.findRestore()).rejects.toMatchObject({ reason: 'network' });
    server.offline = false;
    expect((await second.service.findRestore()).kind).toBe('found');
  });

  it('never replaces a backup the phone has not taken or declined', async () => {
    const { server, keychain, first } = await backedUpPhone();
    const [token, before] = onlyBackup(server);

    const other = phone(server, keychain);
    await seedMoney(other.db);
    await other.db.runAsync("UPDATE spends SET merchant = 'Someone else' WHERE id = 'spend-1'", []);
    await expect(other.service.backUpNow()).rejects.toMatchObject({ reason: 'exists' });
    expect(await other.service.backUpIfDue(null)).toBe(false);
    expect(server.stored.get(token)).toEqual(before);

    await other.service.declineRestore();
    expect(await other.service.backUpNow()).toBe('sent');
    expect(server.stored.get(token)).not.toEqual(before);
    expect(first.service).toBeDefined();
  });

  it('leaves the phone as it was when the restore fails', async () => {
    const { server, keychain } = await backedUpPhone();
    const second = phone(server, keychain);
    await seedMoney(second.db);
    const before = await buildSnapshot(second.db, 'x'.repeat(24));
    const search = await second.service.findRestore();
    if (search.kind !== 'found') throw new Error('Expected a backup');
    const broken = {
      ...search.offer,
      snapshot: { ...search.offer.snapshot, settings: { plan: 'not json' } },
    };
    await expect(second.service.restore(broken)).rejects.toMatchObject({ reason: 'damaged' });
    expect(await buildSnapshot(second.db, 'x'.repeat(24))).toEqual(before);
  });
});

describe('the automatic backup', () => {
  it('sends after a close and then waits for the next, and never throws', async () => {
    const server = fakeServer();
    const keychain = fakeKeychain();
    const { db, service, clock } = phone(server, keychain);
    await seedMoney(db);
    await service.backUpNow();
    expect(server.puts).toBe(1);

    clock.now += 3 * 60 * 60 * 1000;
    expect(await service.backUpIfDue(null)).toBe(false);
    expect(await service.backUpIfDue(clock.now - 1000)).toBe(true);
    expect(server.puts).toBe(2);
    expect(await service.backUpIfDue(clock.now - 1000)).toBe(false);

    clock.now += 25 * 60 * 60 * 1000;
    server.offline = true;
    expect(await service.backUpIfDue(null)).toBe(false);
    server.offline = false;
    expect(await service.backUpIfDue(null)).toBe(true);
  });

  it('does nothing when backup was never turned on', async () => {
    const server = fakeServer();
    const { db, service } = phone(server, fakeKeychain());
    await seedMoney(db);
    expect(await service.backUpIfDue(Date.now())).toBe(false);
    expect(server.puts).toBe(0);
  });
});

describe('deleting the backup', () => {
  it('removes the backup from the server and the key from the Keychain', async () => {
    const server = fakeServer();
    const keychain = fakeKeychain();
    const { db, service, state } = phone(server, keychain);
    await seedMoney(db);
    await service.backUpNow();

    expect(await service.deleteBackup()).toBe('deleted');
    expect(server.stored.size).toBe(0);
    expect(keychain.value).toBeNull();
    expect(await state.read()).toMatchObject({ lastAt: null, settled: false });
    expect(await service.status()).toEqual({ kind: 'off' });
  });

  it('answers none when there was nothing to delete', async () => {
    const { service } = phone(fakeServer(), fakeKeychain());
    expect(await service.deleteBackup()).toBe('none');
  });

  it('keeps the key and stops uploads while the server cannot be reached, then finishes', async () => {
    const server = fakeServer();
    const keychain = fakeKeychain();
    const { db, service } = phone(server, keychain);
    await seedMoney(db);
    await service.backUpNow();

    server.offline = true;
    expect(await service.deleteBackup()).toBe('pending');
    expect(keychain.value).toMatch(/\.deleting$/);
    expect(await service.status()).toEqual({ kind: 'deleting' });
    await expect(service.backUpNow()).rejects.toMatchObject({ reason: 'deleting' });
    expect(await service.findRestore()).toEqual({ kind: 'none' });
    expect(await service.finishPendingDelete()).toBe(false);
    expect(server.stored.size).toBe(1);

    server.offline = false;
    expect(await service.finishPendingDelete()).toBe(true);
    expect(server.stored.size).toBe(0);
    expect(keychain.value).toBeNull();
  });

  it('is the token derived from the key that the delete names', async () => {
    const server = fakeServer();
    const keychain = fakeKeychain();
    const { db, service } = phone(server, keychain);
    await seedMoney(db);
    await service.backUpNow();
    const record = await createBackupVault(keychain).read();
    const token = await backupTokenOf(nodeBackupCrypto, record?.key ?? new Uint8Array());
    expect(server.stored.has(token)).toBe(true);
  });
});
