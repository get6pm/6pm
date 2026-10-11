import type { PutBackupResponse } from '@6pm/domain';

import { backupObjectKey } from '../backup-token';
import { ApiError } from '../errors';
import type { RouteDefinition } from '../route';

/**
 * Says whether a backup is stored under the token, and when and how big, without sending it. A
 * phone asks this before it would replace a backup it did not make.
 */
export const backupMetaRoute: RouteDefinition = {
  method: 'GET',
  path: '/v1/backup/meta',
  access: 'backup',
  handle: async (c) => {
    const object = await c.env.FILES.head(backupObjectKey(c.var.backupHash));
    if (object === null) throw new ApiError('not_found', 'No backup is stored under this token');
    const body: PutBackupResponse = {
      updatedAt: object.uploaded.toISOString(),
      bytes: Number(object.customMetadata?.['bytes'] ?? object.size),
    };
    return c.json(body);
  },
};
