import { stripAppPrefix } from '../features/links/strip-app-prefix';

/** Maps a link that opened the app onto one of its routes, before the router sees it. */
export function redirectSystemPath({ path }: { path: string; initial: boolean }): string {
  return stripAppPrefix(path);
}
