import { useEmailImport } from '../receipt-email/use-email-import';
import { useInboxImport } from './use-inbox-import';
import { useSurfaceWriters } from './use-surface-writers';

/**
 * The app's side of its extensions and of receipt email: imports their captures, writes what
 * they show.
 */
export function SurfacesSync() {
  useInboxImport();
  useEmailImport();
  useSurfaceWriters();
  return null;
}
