import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { withExportFile, type ExportFolder } from './export-file';

/** The app's cache, where the CSV waits only while the share sheet has it. */
const cacheFolder: ExportFolder = {
  names: () => {
    const cache = new Directory(Paths.cache);
    return cache.exists ? cache.list().map((entry) => entry.name) : [];
  },
  write: async (name, text) => {
    const file = new File(Paths.cache, name);
    // UTF-8; the text carries its own byte order mark.
    await file.write(text);
    return file.uri;
  },
  remove: (name) => new File(Paths.cache, name).delete(),
};

/**
 * Opens the iOS share sheet with the CSV: Save to Files, Mail, Numbers, or Google Sheets, which
 * opens it as a spreadsheet. Resolves when the sheet closes, shared or cancelled; the file is
 * deleted then.
 */
export function shareCsv(name: string, text: string): Promise<void> {
  return withExportFile(cacheFolder, name, text, (uri) =>
    Sharing.shareAsync(uri, { mimeType: 'text/csv', UTI: 'public.comma-separated-values-text' }),
  );
}
