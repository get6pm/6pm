import { BACKUP_TOKEN_HEADER, backupTokenPattern } from '@6pm/domain';
import { createMiddleware } from 'hono/factory';

import { hashDeviceToken } from './device-auth';
import type { AppEnv } from './env';
import { ApiError } from './errors';

/**
 * Lets a request through only with a well-formed backup token header, and keeps the token's hash
 * for the route. No device is involved: the token is derived on the phone from the key that seals
 * the backup, so it names a backup and nothing else, and the server never learns who owns it. The
 * database and the bucket only ever see the hash.
 */
export const requireBackupToken = createMiddleware<AppEnv>(async (c, next) => {
  const token = c.req.header(BACKUP_TOKEN_HEADER);
  if (token === undefined || !backupTokenPattern.test(token)) {
    throw new ApiError('unauthorized', `A valid ${BACKUP_TOKEN_HEADER} header is required`);
  }
  c.set('backupHash', await hashDeviceToken(token));
  await next();
});

/** Where a backup lives in the bucket: one object per token hash. */
export function backupObjectKey(hash: string): string {
  return `backups/${hash}`;
}
