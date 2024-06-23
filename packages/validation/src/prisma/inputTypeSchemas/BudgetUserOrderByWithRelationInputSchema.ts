import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';
import { UserOrderByWithRelationInputSchema } from './UserOrderByWithRelationInputSchema';
import { BudgetOrderByWithRelationInputSchema } from './BudgetOrderByWithRelationInputSchema';

export const BudgetUserOrderByWithRelationInputSchema: z.ZodType<Prisma.BudgetUserOrderByWithRelationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  permission: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  budgetId: z.lazy(() => SortOrderSchema).optional(),
  user: z.lazy(() => UserOrderByWithRelationInputSchema).optional(),
  budget: z.lazy(() => BudgetOrderByWithRelationInputSchema).optional()
}).strict();

export default BudgetUserOrderByWithRelationInputSchema;
