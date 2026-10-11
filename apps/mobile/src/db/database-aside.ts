/** The part of a directory the move-aside needs; the app backs it with expo-file-system. */
export interface DatabaseFiles {
  /** Names of the files in the database directory. */
  names(): string[];
  rename(from: string, to: string): void;
  remove(name: string): void;
}

/** SQLite keeps unwritten changes in a write-ahead log beside the file; it travels with it. */
const COMPANIONS = ['', '-wal', '-shm'] as const;

const STAMP = /^\d{8}T\d{6}Z$/;

function stampOf(now: Date): string {
  return now
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d+Z$/, 'Z');
}

/** The stamp in a moved-aside file's name, or null when the file is not one of ours. */
function asideStamp(file: string, name: string): string | null {
  for (const companion of COMPANIONS) {
    const prefix = `${name}${companion}.aside-`;
    if (file.startsWith(prefix)) {
      const stamp = file.slice(prefix.length);
      return STAMP.test(stamp) ? stamp : null;
    }
  }
  return null;
}

/**
 * Moves the database file (and its log) to a dated name in the same directory instead of deleting
 * it, so a database whose key was lost for a reason that can be undone is still there to recover.
 * Only the newest moved-aside copy is kept; older ones are deleted. Returns the stamp used, or
 * null when there was nothing to move.
 */
export function moveDatabaseAside(files: DatabaseFiles, name: string, now: Date): string | null {
  const present = files.names();
  const toMove = COMPANIONS.map((c) => `${name}${c}`).filter((file) => present.includes(file));
  if (toMove.length === 0) return null;
  const stamp = stampOf(now);
  for (const file of toMove) files.rename(file, `${file}.aside-${stamp}`);
  const stamps = files
    .names()
    .map((file) => asideStamp(file, name))
    .filter((s): s is string => s !== null);
  const newest = [...stamps, stamp].sort().at(-1);
  for (const file of files.names()) {
    const found = asideStamp(file, name);
    if (found !== null && found !== newest) files.remove(file);
  }
  return stamp;
}
