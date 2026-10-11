import { ApiError } from '../errors';
import { backupObjectKey } from '../backup-token';
import type { RouteDefinition } from '../route';

/**
 * Gives back the sealed snapshot stored under the backup token, exactly as it was sent, with the
 * time the server kept it. The stored text was checked when it arrived, so it is sent on as it is
 * rather than parsed again.
 */
export const backupGetRoute: RouteDefinition = {
  method: 'GET',
  path: '/v1/backup',
  access: 'backup',
  handle: async (c) => {
    const object = await c.env.FILES.get(backupObjectKey(c.var.backupHash));
    if (object === null) throw new ApiError('not_found', 'No backup is stored under this token');
    const envelope = await object.text();
    const updatedAt = JSON.stringify(object.uploaded.toISOString());
    return new Response(`{"envelope":${envelope},"updatedAt":${updatedAt}}`, {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  },
};
