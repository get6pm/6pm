export type BackupWhen =
  | { readonly key: 'backup.ago.now' }
  | {
      readonly key: 'backup.ago.minutes' | 'backup.ago.hours' | 'backup.ago.days';
      readonly count: number;
    };

const MINUTE_MS = 60 * 1000;

/** How long ago `iso` was, in the largest whole unit: "just now", "2 minutes", "3 hours", "4 days". */
export function whenOf(iso: string, now: number): BackupWhen {
  const elapsed = Math.max(0, now - Date.parse(iso));
  const minutes = Math.floor(elapsed / MINUTE_MS);
  if (!Number.isFinite(minutes) || minutes < 1) return { key: 'backup.ago.now' };
  if (minutes < 60) return { key: 'backup.ago.minutes', count: minutes };
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return { key: 'backup.ago.hours', count: hours };
  return { key: 'backup.ago.days', count: Math.floor(hours / 24) };
}
