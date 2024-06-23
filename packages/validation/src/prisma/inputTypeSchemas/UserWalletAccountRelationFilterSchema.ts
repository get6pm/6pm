import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { UserWalletAccountWhereInputSchema } from './UserWalletAccountWhereInputSchema';

export const UserWalletAccountRelationFilterSchema: z.ZodType<Prisma.UserWalletAccountRelationFilter> = z.object({
  is: z.lazy(() => UserWalletAccountWhereInputSchema).optional(),
  isNot: z.lazy(() => UserWalletAccountWhereInputSchema).optional()
}).strict();

export default UserWalletAccountRelationFilterSchema;
