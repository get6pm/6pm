const PREFIX = '6pm-spends-';
const SUFFIX = '.csv';

/** The CSV's name in Files, Mail or Sheets: `6pm-spends-2026-10-12.csv`. */
export function exportFileName(today: string): string {
  return `${PREFIX}${today.replace(/[^0-9-]/g, '')}${SUFFIX}`;
}

/** The cache folder the CSV passes through, kept small enough to test without a device. */
export interface ExportFolder {
  readonly names: () => readonly string[];
  readonly write: (name: string, text: string) => Promise<string>;
  readonly remove: (name: string) => void;
}

function removeQuietly(folder: ExportFolder, name: string) {
  try {
    folder.remove(name);
  } catch {
    // Already gone, or iOS cleared the cache itself.
  }
}

/**
 * Writes the CSV, hands its URI to `use` (the share sheet) and deletes it once `use` settles,
 * shared, cancelled or failed. A file an interrupted export left behind is swept first, so the
 * cache never keeps a copy of the person's spends.
 */
export async function withExportFile<T>(
  folder: ExportFolder,
  name: string,
  text: string,
  use: (uri: string) => Promise<T>,
): Promise<T> {
  for (const old of folder.names()) {
    if (old.startsWith(PREFIX) && old.endsWith(SUFFIX)) removeQuietly(folder, old);
  }
  const uri = await folder.write(name, text);
  try {
    return await use(uri);
  } finally {
    removeQuietly(folder, name);
  }
}
