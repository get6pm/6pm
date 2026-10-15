import Constants from 'expo-constants';
import { Directory, File, Paths } from 'expo-file-system';

import type { AiMode } from './ai-mode';

/**
 * A copy of the AI mode in the App Group, at `surfaces/ai.json` (`{"mode":"device"}`), for what
 * cannot read the app's database: the share extension, which skips the server's look at a
 * receipt photo in on-device mode, and the app itself before its database has opened, so crash
 * reports are never started in on-device mode. The database stays the source of truth: the copy
 * is written whenever the mode is, and again at every launch.
 */
export const SHARED_AI_MODE_FILE = 'ai.json';

function sharedFolder(): Directory | null {
  const group: unknown = Constants.expoConfig?.extra?.['appGroup'];
  if (typeof group !== 'string' || group === '') return null;
  const container = Paths.appleSharedContainers[group];
  return container === undefined ? null : new Directory(container, 'surfaces');
}

/** Writes the mode for the extensions. A failure is reported to the caller, never thrown. */
export function shareAiMode(mode: AiMode): boolean {
  try {
    const folder = sharedFolder();
    if (folder === null) return false;
    if (!folder.exists) folder.create({ intermediates: true, idempotent: true });
    new File(folder, SHARED_AI_MODE_FILE).writeSync(JSON.stringify({ mode }));
    return true;
  } catch {
    return false;
  }
}

/** The mode last written for the extensions, or null when none was written or it is unreadable. */
export function readSharedAiMode(): AiMode | null {
  try {
    const folder = sharedFolder();
    if (folder === null) return null;
    const file = new File(folder, SHARED_AI_MODE_FILE);
    if (!file.exists) return null;
    const parsed: unknown = JSON.parse(file.textSync());
    const mode = (parsed as { mode?: unknown } | null)?.mode;
    return mode === 'device' || mode === 'server' ? mode : null;
  } catch {
    return null;
  }
}
