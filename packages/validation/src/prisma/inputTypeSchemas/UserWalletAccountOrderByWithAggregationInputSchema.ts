import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';
import { SortOrderInputSchema } from './SortOrderInputSchema';
import { UserWalletAccountCountOrderByAggregateInputSchema } from './UserWalletAccountCountOrderByAggregateInputSchema';
import { UserWalletAccountMaxOrderByAggregateInputSchema } from './UserWalletAccountMaxOrderByAggregateInputSchema';
import { UserWalletAccountMinOrderByAggregateInputSchema } from './UserWalletAccountMinOrderByAggregateInputSchema';

export const UserWalletAccountOrderByWithAggregationInputSchema: z.ZodType<Prisma.UserWalletAccountOrderByWithAggregationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  icon: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  description: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  lastDigits: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  preferredCurrency: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => UserWalletAccountCountOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => UserWalletAccountMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => UserWalletAccountMinOrderByAggregateInputSchema).optional()
}).strict();

export default UserWalletAccountOrderByWithAggregationInputSchema;
