/** What an image shared out of 6pm is of; it names the file the other app receives. */
export type ShareKind = 'receipt' | 'money-diary' | 'payment-qr';

const PREFIX = '6pm-';
const SUFFIX = '.png';

/**
 * The file name the receiving app shows: `6pm-receipt-2026-10-09.png`. The key (a day or a month)
 * keeps only characters every file system accepts.
 */
export function shareFileName(kind: ShareKind, key: string): string {
  const safe = key.replace(/[^0-9A-Za-z-]/g, '');
  return `${PREFIX}${kind}${safe ? `-${safe}` : ''}${SUFFIX}`;
}

/** A file this feature wrote and may delete. */
export function isShareFile(name: string): boolean {
  return name.startsWith(PREFIX) && name.endsWith(SUFFIX);
}

/** The cache folder the images pass through, kept small enough to test without a device. */
export interface ShareFolder {
  readonly names: () => readonly string[];
  readonly write: (name: string, bytes: Uint8Array) => Promise<string>;
  readonly remove: (name: string) => void;
}

function removeQuietly(folder: ShareFolder, name: string) {
  try {
    folder.remove(name);
  } catch {
    // Already gone, or iOS clears the cache itself; nothing to tell the user.
  }
}

/**
 * Writes the image, hands its URI to `use` (the share sheet or the Photos save) and deletes it once
 * `use` settles, whether it finished, was cancelled or failed. Files an interrupted share left
 * behind are swept first, so the cache never collects old receipts.
 */
export async function withShareFile<T>(
  folder: ShareFolder,
  name: string,
  bytes: Uint8Array,
  use: (uri: string) => Promise<T>,
): Promise<T> {
  for (const old of folder.names()) if (isShareFile(old)) removeQuietly(folder, old);
  const uri = await folder.write(name, bytes);
  try {
    return await use(uri);
  } finally {
    removeQuietly(folder, name);
  }
}
