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
    expect(backupSnapshotSchema.safeParse({ ...empty, version: 2 }).success).toBe(false);
    expect(
      backupSnapshotSchema.safeParse({ ...empty, settings: { purchases: '{}' } }).success,
    ).toBe(false);
    expect(backupSnapshotSchema.safeParse({ ...empty, extra: [] }).success).toBe(false);
  });

  it('counts what a person made and would miss', () => {
    expect(backupItemCount(backupSnapshotSchema.parse(empty))).toBe(0);
  });
});
