import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { UserWalletAccountCreateManyUserInputSchema } from './UserWalletAccountCreateManyUserInputSchema';

export const UserWalletAccountCreateManyUserInputEnvelopeSchema: z.ZodType<Prisma.UserWalletAccountCreateManyUserInputEnvelope> = z.object({
  data: z.union([ z.lazy(() => UserWalletAccountCreateManyUserInputSchema),z.lazy(() => UserWalletAccountCreateManyUserInputSchema).array() ]),
  skipDuplicates: z.boolean().optional()
}).strict();

export default UserWalletAccountCreateManyUserInputEnvelopeSchema;
