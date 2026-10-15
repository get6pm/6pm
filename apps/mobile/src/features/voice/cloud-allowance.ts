import { z } from 'zod';

import type { LocalDate } from '@6pm/domain';

import type { SqlDatabase } from '../../data/table';
import type { AiMode } from '../privacy/ai-mode';

/** The settings key holding today's count of cloud transcriptions. */
export const CLOUD_VOICE_KEY = 'voice.cloudUsed';

/** Cloud transcriptions a Free member gets a day; after them Apple's on-device recognition hears. */
export const FREE_CLOUD_VOICE_PER_DAY = 10;

const usedSchema = z.object({ day: z.string(), count: z.number().int().nonnegative() });

/** Cloud transcriptions used on `today`, counted on this phone. A damaged setting reads as none. */
export async function cloudVoiceUsed(db: SqlDatabase, today: LocalDate): Promise<number> {
  const rows = await db.getAllAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', [
    CLOUD_VOICE_KEY,
  ]);
  const raw = rows[0]?.value;
  if (raw === undefined) return 0;
  try {
    const parsed = usedSchema.safeParse(JSON.parse(raw));
    return parsed.success && parsed.data.day === today ? parsed.data.count : 0;
  } catch {
    return 0;
  }
}

/** Counts one more cloud transcription on `today`; a new day starts from one. */
export async function recordCloudVoice(db: SqlDatabase, today: LocalDate): Promise<number> {
  const count = (await cloudVoiceUsed(db, today)) + 1;
  await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [
    CLOUD_VOICE_KEY,
    JSON.stringify({ day: today, count }),
  ]);
  return count;
}

/** Whether this person may use the cloud transcriber now: Max always, Free within the day's ten. */
export function mayUseCloudVoice(max: boolean, usedToday: number): boolean {
  return max || usedToday < FREE_CLOUD_VOICE_PER_DAY;
}

/**
 * Who hears a spend said aloud: the cloud transcriber in server mode (within the allowance, in a
 * build with the microphone stream), else Apple's recogniser on this iPhone when it knows the
 * language, else no one. On-device mode never reaches the cloud.
 */
export function voiceSource({
  mode,
  streams,
  max,
  usedToday,
  appleReady,
}: {
  readonly mode: AiMode;
  readonly streams: boolean;
  readonly max: boolean;
  readonly usedToday: number;
  readonly appleReady: boolean;
}): 'cloud' | 'apple' | null {
  if (mode === 'server' && streams && mayUseCloudVoice(max, usedToday)) return 'cloud';
  return appleReady ? 'apple' : null;
}
