import { categoryIconRequestSchema, type CategoryIconResponse } from '@6pm/domain';

import { pickCategoryIcon } from '../ai/pick-icon';
import { limitIconPicks } from '../rate-limit';
import { readBody, type RouteDefinition } from '../route';

/**
 * Chooses an icon for a category the person is naming, when the phone's own word match found
 * none. Only the name and the icons to choose from are sent; the phone waits for a pause in the
 * typing, and keeps the icon it has when this is offline, slow or unsure.
 */
export const categoryIconRoute: RouteDefinition = {
  method: 'POST',
  path: '/v1/category-icon',
  access: 'device',
  handle: async (c) => {
    await limitIconPicks(c);
    const request = await readBody(c, categoryIconRequestSchema, { maxBytes: 8_000 });
    const icon = await pickCategoryIcon(
      {
        env: c.env,
        route: 'category-icon',
        deviceHash: c.var.device.hash,
      },
      request.name,
      request.icons,
    );
    return c.json({ icon } satisfies CategoryIconResponse);
  },
};
