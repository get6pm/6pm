import { useInboxImport } from './use-inbox-import';
import { useSurfaceWriters } from './use-surface-writers';

/** The app's side of its extensions: imports their captures, writes what they show. */
export function SurfacesSync() {
  useInboxImport();
  useSurfaceWriters();
  return null;
}
