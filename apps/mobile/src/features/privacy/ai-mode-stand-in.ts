import type { AiMode, AiModeSettings } from './ai-mode';

/** Settings holding one AI mode, for tests of the callers behind the gate. */
export function aiModeSettings(mode: AiMode): AiModeSettings {
  const getFirstSync = <T>(_source: string, params: unknown[]): T | null =>
    (params[0] === 'ai.mode' ? { value: mode } : null) as T | null;
  return { getFirstSync: getFirstSync as AiModeSettings['getFirstSync'] };
}
