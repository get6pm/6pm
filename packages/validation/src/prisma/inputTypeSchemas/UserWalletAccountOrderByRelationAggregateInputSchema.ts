import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';

export const UserWalletAccountOrderByRelationAggregateInputSchema: z.ZodType<Prisma.UserWalletAccountOrderByRelationAggregateInput> = z.object({
  _count: z.lazy(() => SortOrderSchema).optional()
}).strict();

export default UserWalletAccountOrderByRelationAggregateInputSchema;
