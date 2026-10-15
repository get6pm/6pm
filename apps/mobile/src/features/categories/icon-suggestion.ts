import { categoryIconResponseSchema, suggestCategoryIcon, type CategoryIcon } from '@6pm/domain';

import type { ApiClient } from '../api/api-client';
import { ICON_PACKS, isPackLocked } from './icon-packs';

/** How long the typing has to rest before the server is asked. */
export const ICON_ASK_PAUSE_MS = 700;
/** One short attempt: a late answer arrives after the person has moved on. */
export const ICON_ASK_TIMEOUT_MS = 2_500;

/** The icons this person may wear: the free pack, or every pack with Max. In the grid's order. */
export function usableIcons(hasMax: boolean): string[] {
  return ICON_PACKS.filter((pack) => !isPackLocked(pack, hasMax)).flatMap((pack) => pack.icons);
}

/**
 * Whether the editor may choose the icon for the person. A new category may; an existing one only
 * while its icon is the one its name already points to, so an icon chosen by hand is never
 * replaced by renaming.
 */
export function mayAutoPick(initial: { readonly name: string; readonly icon: string }): boolean {
  return initial.name.trim() === '' || suggestCategoryIcon(initial.name) === initial.icon;
}

/**
 * Asks the server for the icon a name points to, among the icons given. Null when the server is
 * unsure, unreachable, slow or refuses: the editor keeps the icon it has.
 */
export async function askCategoryIcon(
  request: ApiClient['request'],
  name: string,
  icons: readonly string[],
): Promise<CategoryIcon | null> {
  try {
    const answer = await request({
      method: 'POST',
      path: '/v1/category-icon',
      body: { name: name.trim(), icons },
      schema: categoryIconResponseSchema,
      timeoutMs: ICON_ASK_TIMEOUT_MS,
    });
    return answer.icon !== null && icons.includes(answer.icon) ? answer.icon : null;
  } catch {
    return null;
  }
}
