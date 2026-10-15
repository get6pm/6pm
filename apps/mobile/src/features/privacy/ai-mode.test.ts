import { describe, expect, it } from '@jest/globals';

import {
  OnDeviceOnly,
  modelsFor,
  readAiMode,
  readLocalModel,
  requireServerAi,
  writeAiMode,
  writeLocalModel,
} from './ai-mode';

function settingsDb() {
  const rows = new Map<string, string>();
  return {
    getFirstSync: <T>(_: string, [key]: unknown[]) =>
      (rows.has(key as string) ? { value: rows.get(key as string) } : null) as T | null,
    runSync: (source: string, params: unknown[]) => {
      if (source.startsWith('DELETE')) rows.delete(params[0] as string);
      else rows.set(params[0] as string, params[1] as string);
      return { changes: 1, lastInsertRowId: 0 };
    },
  };
}

describe('the AI mode', () => {
  it('is server until on-device is chosen, and remembers the local model', () => {
    const db = settingsDb();
    expect(readAiMode(db as never)).toBe('server');
    expect(readLocalModel(db as never)).toBeNull();
    writeAiMode(db as never, 'device');
    writeLocalModel(db as never, 'gemma-4-e2b');
    expect(readAiMode(db as never)).toBe('device');
    expect(readLocalModel(db as never)).toBe('gemma-4-e2b');
    writeLocalModel(db as never, null);
    expect(readLocalModel(db as never)).toBeNull();
  });

  it('stops a server AI call in on-device mode, before anything is sent', () => {
    const db = settingsDb();
    expect(() => requireServerAi(db as never, 'ask')).not.toThrow();
    writeAiMode(db as never, 'device');
    expect(() => requireServerAi(db as never, 'ask')).toThrow(OnDeviceOnly);
  });

  it('offers only the models a phone has the memory for', () => {
    expect(modelsFor(6).map((m) => m.id)).toEqual(['gemma-4-e2b']);
    expect(modelsFor(8).map((m) => m.id)).toEqual(['gemma-4-e2b', 'gemma-4-e4b', 'qwen-3.5-4b']);
  });
});
