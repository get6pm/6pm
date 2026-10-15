import type { SQLiteDatabase } from 'expo-sqlite';

/**
 * Where 6pm's AI runs. `server`: Claude on our server reads questions, words lines and reads
 * receipt photos, and voice goes to a cloud transcriber. `device`: nothing AI leaves the phone;
 * the phone's rules answer first, and a local model the person downloaded does the rest.
 */
export type AiMode = 'server' | 'device';

/** The local models a person can download for on-device mode. */
export type LocalModelId = 'gemma-4-e2b' | 'gemma-4-e4b' | 'qwen-3.5-4b';

export interface LocalModel {
  readonly id: LocalModelId;
  /** Shown as is: model names are not translated. */
  readonly name: string;
  /** Which runtime loads it. */
  readonly runtime: 'litert' | 'mlx';
  /** The download, in bytes, as stored on the phone. */
  readonly bytes: number;
  /** The least memory a phone needs to run it well, in GB. */
  readonly minMemoryGb: number;
  /** What it is best at, for the picker: an i18n key under `privacy.model.`. */
  readonly strength: 'fast' | 'words' | 'reading';
}

/** In the order the picker lists them; the first one this phone can run is suggested. */
export const LOCAL_MODELS: readonly LocalModel[] = [
  {
    id: 'gemma-4-e2b',
    name: 'Gemma 4 E2B',
    runtime: 'litert',
    bytes: 2_430_000_000,
    minMemoryGb: 6,
    strength: 'fast',
  },
  {
    id: 'gemma-4-e4b',
    name: 'Gemma 4 E4B',
    runtime: 'litert',
    bytes: 3_490_000_000,
    minMemoryGb: 8,
    strength: 'words',
  },
  {
    id: 'qwen-3.5-4b',
    name: 'Qwen3.5 4B',
    runtime: 'mlx',
    bytes: 3_060_000_000,
    minMemoryGb: 8,
    strength: 'reading',
  },
];

const MODE_KEY = 'ai.mode';
const MODEL_KEY = 'ai.localModel';

type Reader = Pick<SQLiteDatabase, 'getFirstSync'>;
/** What reads the AI mode: the app's database, or anything with its synchronous read. */
export type AiModeSettings = Reader;
type Writer = Pick<SQLiteDatabase, 'runSync'>;

function read(db: Reader, key: string): string | null {
  return (
    db.getFirstSync<{ value: string }>('SELECT value FROM settings WHERE key = ?', [key])?.value ??
    null
  );
}

export function readAiMode(db: Reader): AiMode {
  return read(db, MODE_KEY) === 'device' ? 'device' : 'server';
}

export function writeAiMode(db: Writer, mode: AiMode): void {
  db.runSync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [MODE_KEY, mode]);
}

/** The local model chosen for on-device mode; null until one is picked. */
export function readLocalModel(db: Reader): LocalModelId | null {
  const value = read(db, MODEL_KEY);
  return LOCAL_MODELS.find((m) => m.id === value)?.id ?? null;
}

export function writeLocalModel(db: Writer, id: LocalModelId | null): void {
  if (id === null) db.runSync('DELETE FROM settings WHERE key = ?', [MODEL_KEY]);
  else db.runSync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [MODEL_KEY, id]);
}

/** The local models a phone with this much memory can run, in the picker's order. */
export function modelsFor(memoryGb: number): readonly LocalModel[] {
  return LOCAL_MODELS.filter((m) => memoryGb >= m.minMemoryGb);
}

/** Raised by a server AI call asked for in on-device mode: the caller answers on the phone. */
export class OnDeviceOnly extends Error {
  constructor(readonly feature: string) {
    super(`${feature} stays on this iPhone in on-device mode`);
    this.name = 'OnDeviceOnly';
  }
}

/**
 * The gate every AI request to our server or an AI vendor passes first. It throws before the
 * request is built, so no feature can send something in on-device mode by forgetting to check.
 */
export function requireServerAi(db: Reader, feature: string): void {
  if (readAiMode(db) === 'device') throw new OnDeviceOnly(feature);
}
