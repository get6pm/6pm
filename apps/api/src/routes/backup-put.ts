import {
  BACKUP_MAX_BODY_BYTES,
  backupEnvelopeSchema,
  base64DecodedLength,
  type PutBackupResponse,
} from '@6pm/domain';

import { backupObjectKey } from '../backup-token';
import { ApiError } from '../errors';
import { readBody, type RouteDefinition } from '../route';

/**
 * Keeps the sealed snapshot under the backup token, replacing any earlier one. The server checks
 * the envelope's shape and size and nothing else: it cannot open it. A backup over the size cap is
 * refused and the earlier one stays as it was.
 */
export const backupPutRoute: RouteDefinition = {
  method: 'PUT',
  path: '/v1/backup',
  access: 'backup',
  handle: async (c) => {
    const envelope = await readBody(c, backupEnvelopeSchema, { maxBytes: BACKUP_MAX_BODY_BYTES });
    const bytes = base64DecodedLength(envelope.data);
    const stored = await c.env.FILES.put(
      backupObjectKey(c.var.backupHash),
      JSON.stringify(envelope),
      {
        httpMetadata: { contentType: 'application/json' },
        customMetadata: { version: String(envelope.version), bytes: String(bytes) },
      },
    );
    if (stored === null) throw new ApiError('internal', 'The backup was not kept');
    const body: PutBackupResponse = { updatedAt: stored.uploaded.toISOString(), bytes };
    return c.json(body);
  },
};
