import { backupObjectKey } from '../backup-token';
import type { RouteDefinition } from '../route';

/** Deletes the snapshot stored under the backup token. Answers the same when there was none. */
export const backupDeleteRoute: RouteDefinition = {
  method: 'DELETE',
  path: '/v1/backup',
  access: 'backup',
  handle: async (c) => {
    await c.env.FILES.delete(backupObjectKey(c.var.backupHash));
    return c.json({ deleted: true as const });
  },
};
