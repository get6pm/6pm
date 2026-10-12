import type { SkImage } from '@shopify/react-native-skia';
import { Directory, File, Paths } from 'expo-file-system';
import {
  getPermissionsAsync,
  requestPermissionsAsync,
  saveToLibraryAsync,
} from 'expo-media-library/legacy';
import * as Sharing from 'expo-sharing';

import { encodePng } from './capture-view';
import { withShareFile, type ShareFolder } from './share-file';

/** The app's cache, where an image waits only while the share sheet or the save uses it. */
const cacheFolder: ShareFolder = {
  names: () => {
    const cache = new Directory(Paths.cache);
    return cache.exists ? cache.list().map((entry) => entry.name) : [];
  },
  write: async (name, bytes) => {
    const file = new File(Paths.cache, name);
    await file.write(bytes);
    return file.uri;
  },
  remove: (name) => new File(Paths.cache, name).delete(),
};

/**
 * Opens the iOS share sheet with the image as a PNG. It resolves when the sheet closes, shared or
 * cancelled (a cancel is not an error), and the file is deleted then.
 */
export function shareImage(image: SkImage, name: string): Promise<void> {
  return withShareFile(cacheFolder, name, encodePng(image), (uri) =>
    Sharing.shareAsync(uri, { mimeType: 'image/png', UTI: 'public.png' }),
  );
}

export type SaveResult = 'saved' | 'denied';

/** Adds the image to Photos, asking only for add access (6pm never reads the library). */
export async function saveImage(make: () => Promise<SkImage>, name: string): Promise<SaveResult> {
  const permission = await requestPermissionsAsync(true);
  if (!permission.granted) return 'denied';
  const png = encodePng(await make());
  await withShareFile(cacheFolder, name, png, (uri) => saveToLibraryAsync(uri));
  return 'saved';
}

/** Whether Photos add access is on, to notice it was turned on in Settings. */
export async function canSaveImages(): Promise<boolean> {
  return (await getPermissionsAsync(true)).granted;
}
