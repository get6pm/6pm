import { describe, expect, it } from '@jest/globals';

import { sql as createSettings } from '../../db/migrations/0001-create-settings';
import type { SqlDatabase, SqlValue } from '../../data/table';
import {
  CLOUD_VOICE_KEY,
  cloudVoiceUsed,
  FREE_CLOUD_VOICE_PER_DAY,
  mayUseCloudVoice,
  recordCloudVoice,
  voiceSource,
} from './cloud-allowance';

// A real SQLite database in memory, from Node's own module (see look-settings.test.ts).
const { DatabaseSync } = process.getBuiltinModule('node:sqlite');

function openDb() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(createSettings);
  const db: SqlDatabase = {
    getAllAsync: <T>(source: string, params: SqlValue[]) =>
      Promise.resolve(sqlite.prepare(source).all(...params) as T[]),
    runAsync: (source, params) => Promise.resolve(sqlite.prepare(source).run(...params)),
    withTransactionAsync: (task) => task(),
  };
  return { db, sqlite };
}

describe('the free cloud voice count', () => {
  it('counts each transcription against its day and starts over the next', async () => {
    const { db } = openDb();
    expect(await cloudVoiceUsed(db, '2026-10-15')).toBe(0);
    await recordCloudVoice(db, '2026-10-15');
    expect(await recordCloudVoice(db, '2026-10-15')).toBe(2);
    expect(await cloudVoiceUsed(db, '2026-10-15')).toBe(2);
    expect(await cloudVoiceUsed(db, '2026-10-16')).toBe(0);
    expect(await recordCloudVoice(db, '2026-10-16')).toBe(1);
  });

  it('reads a damaged setting as none used', async () => {
    const { db, sqlite } = openDb();
    sqlite
      .prepare('INSERT INTO settings (key, value) VALUES (?, ?)')
      .run(CLOUD_VOICE_KEY, '{"day":');
    expect(await cloudVoiceUsed(db, '2026-10-15')).toBe(0);
  });

  it('lets Free use ten a day and Max any number', () => {
    expect(FREE_CLOUD_VOICE_PER_DAY).toBe(10);
    expect(mayUseCloudVoice(false, 9)).toBe(true);
    expect(mayUseCloudVoice(false, 10)).toBe(false);
    expect(mayUseCloudVoice(true, 500)).toBe(true);
  });
});

describe('who hears a spend', () => {
  const base = {
    mode: 'server',
    streams: true,
    max: false,
    usedToday: 0,
    appleReady: true,
  } as const;

  it('streams to the cloud in server mode', () => {
    expect(voiceSource(base)).toBe('cloud');
  });

  it('never reaches the cloud in on-device mode, whatever the plan', () => {
    expect(voiceSource({ ...base, mode: 'device', max: true })).toBe('apple');
    expect(voiceSource({ ...base, mode: 'device', appleReady: false })).toBeNull();
  });

  it('hands Free over to Apple after the ten of the day, and never Max', () => {
    expect(voiceSource({ ...base, usedToday: 10 })).toBe('apple');
    expect(voiceSource({ ...base, usedToday: 10, max: true })).toBe('cloud');
  });

  it('uses Apple in a build without the microphone stream', () => {
    expect(voiceSource({ ...base, streams: false })).toBe('apple');
  });
});
