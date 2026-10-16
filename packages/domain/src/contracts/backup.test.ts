import { describe, expect, it } from 'vitest';

import {
  BACKUP_FORMAT_VERSION,
  BACKUP_MAX_SEALED_BYTES,
  BACKUP_SNAPSHOT_VERSION,
  backupEnvelopeSchema,
  backupItemCount,
  backupSnapshotSchema,
  base64DecodedLength,
} from './backup';

/** Base64 of `bytes` bytes that are all 3: three of them are "AwMD", so a long string is cheap. */
function sealed(bytes: number): string {
  const rest = ['', 'Aw==', 'AwM='][bytes % 3] ?? '';
  return 'AwMD'.repeat(Math.floor(bytes / 3)) + rest;
}

describe('base64DecodedLength', () => {
  it('counts the bytes a padded string decodes to', () => {
    for (let length = 0; length < 40; length += 1) {
      expect(base64DecodedLength(sealed(length))).toBe(length);
    }
  });
});

describe('backupEnvelopeSchema', () => {
  it('takes sealed data between a nonce and a tag and the cap', () => {
    const ok = (bytes: number) =>
      backupEnvelopeSchema.safeParse({ version: BACKUP_FORMAT_VERSION, data: sealed(bytes) });
    expect(ok(29).success).toBe(true);
    expect(ok(BACKUP_MAX_SEALED_BYTES).success).toBe(true);
    expect(ok(28).success).toBe(false);
    expect(ok(BACKUP_MAX_SEALED_BYTES + 1).success).toBe(false);
  });

  it('refuses anything that is not base64, a missing version and extra fields', () => {
    const data = sealed(64);
    expect(backupEnvelopeSchema.safeParse({ version: 1, data: `${data}!` }).success).toBe(false);
    expect(backupEnvelopeSchema.safeParse({ version: 1, data: data.slice(1) }).success).toBe(false);
    expect(backupEnvelopeSchema.safeParse({ data }).success).toBe(false);
    expect(backupEnvelopeSchema.safeParse({ version: 1, data, key: 'x' }).success).toBe(false);
  });

  it('checks a multi-megabyte string without overflowing the regex stack', () => {
    const result = backupEnvelopeSchema.safeParse({
      version: 1,
      data: sealed(BACKUP_MAX_SEALED_BYTES),
    });
    expect(result.success).toBe(true);
  });
});

describe('backupSnapshotSchema', () => {
  const empty = {
    version: BACKUP_SNAPSHOT_VERSION,
    takenAt: '2026-10-11T12:00:00.000Z',
    settings: {},
    categories: [],
    spends: [],
    spendSightings: [],
    merchantRules: [],
    bills: [],
    pots: [],
    potMoves: [],
    closedDays: [],
  };

  it('takes a snapshot of this version and refuses another version, or a setting it does not carry', () => {
    expect(backupSnapshotSchema.safeParse(empty).success).toBe(true);
    expect(backupSnapshotSchema.safeParse({ ...empty, version: 0 }).success).toBe(false);
    expect(
      backupSnapshotSchema.safeParse({ ...empty, version: BACKUP_SNAPSHOT_VERSION + 1 }).success,
    ).toBe(false);
    expect(
      backupSnapshotSchema.safeParse({ ...empty, settings: { purchases: '{}' } }).success,
    ).toBe(false);
    expect(backupSnapshotSchema.safeParse({ ...empty, extra: [] }).success).toBe(false);
  });

  it('reads an older snapshot without Budget together history, and a newer one with it', () => {
    expect(backupSnapshotSchema.safeParse({ ...empty, version: 1 }).success).toBe(true);
    const move = {
      id: 'together-1',
      potId: 'shared-1',
      potName: 'Đà Lạt',
      amount: 300_000,
      cycle: '2026-09-25',
      at: '2026-10-05T00:00:00.000Z',
    };
    expect(backupSnapshotSchema.safeParse({ ...empty, togetherMoves: [move] }).success).toBe(true);
    for (const amount of [0, -1, 1.5]) {
      expect(
        backupSnapshotSchema.safeParse({ ...empty, togetherMoves: [{ ...move, amount }] }).success,
      ).toBe(false);
    }
  });

  it('restores bills from formats 1 to 3 as plain bills with no end, and keeps format 4 kinds', () => {
    const bill = {
      id: 'bill-1',
      name: 'Rent',
      icon: 'home',
      hue: 30,
      amount: 5_000_000,
      dueDay: 5,
      paidCycle: null,
      sort: 0,
      archivedAt: null,
    };
    for (const version of [1, 2, 3]) {
      const parsed = backupSnapshotSchema.parse({ ...empty, version, bills: [bill] });
      expect(parsed.bills[0]).toMatchObject({
        kind: 'other',
        lastMonth: null,
        paidAmount: null,
        askedCycle: null,
      });
    }
    const card = {
      ...bill,
      kind: 'card',
      lastMonth: '2027-09',
      paidAmount: null,
      askedCycle: null,
    };
    expect(backupSnapshotSchema.parse({ ...empty, bills: [card] }).bills[0]).toMatchObject({
      kind: 'card',
      lastMonth: '2027-09',
    });
    expect(
      backupSnapshotSchema.safeParse({ ...empty, bills: [{ ...bill, kind: 'loan' }] }).success,
    ).toBe(false);
    expect(
      backupSnapshotSchema.safeParse({ ...empty, bills: [{ ...bill, lastMonth: '2027-9' }] })
        .success,
    ).toBe(false);
  });

  it('keeps which bill a spend paid, and reads spends from before it was kept', () => {
    const spend = {
      id: 'spend-1',
      day: '2026-10-05',
      at: '2026-10-05T03:00:00.000Z',
      amount: 8_000_000,
      categoryId: 'shopping',
      merchant: 'THANH TOAN THE',
      note: null,
      source: 'email',
      status: 'kept',
      previousStatus: null,
      wallet: null,
      forWork: false,
      detail: null,
      foreignAmount: null,
      createdAt: '2026-10-05T03:00:00.000Z',
      updatedAt: '2026-10-05T03:00:00.000Z',
    };
    expect(
      backupSnapshotSchema.parse({ ...empty, version: 3, spends: [spend] }).spends[0],
    ).not.toHaveProperty('paysBill');
    const paid = { ...spend, paysBill: 'bill-1' };
    expect(backupSnapshotSchema.parse({ ...empty, spends: [paid] }).spends[0]?.paysBill).toBe(
      'bill-1',
    );
  });

  it('counts what a person made and would miss', () => {
    expect(backupItemCount(backupSnapshotSchema.parse(empty))).toBe(0);
  });
});
