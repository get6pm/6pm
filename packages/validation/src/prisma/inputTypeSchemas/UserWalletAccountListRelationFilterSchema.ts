import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { UserWalletAccountWhereInputSchema } from './UserWalletAccountWhereInputSchema';

export const UserWalletAccountListRelationFilterSchema: z.ZodType<Prisma.UserWalletAccountListRelationFilter> = z.object({
  every: z.lazy(() => UserWalletAccountWhereInputSchema).optional(),
  some: z.lazy(() => UserWalletAccountWhereInputSchema).optional(),
  none: z.lazy(() => UserWalletAccountWhereInputSchema).optional()
}).strict();

export default UserWalletAccountListRelationFilterSchema;
