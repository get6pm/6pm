import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { StringFilterSchema } from './StringFilterSchema';
import { DateTimeFilterSchema } from './DateTimeFilterSchema';
import { StringNullableFilterSchema } from './StringNullableFilterSchema';
import { EnumBudgetTypeFilterSchema } from './EnumBudgetTypeFilterSchema';
import { BudgetTypeSchema } from './BudgetTypeSchema';
import { BudgetPeriodConfigNullableRelationFilterSchema } from './BudgetPeriodConfigNullableRelationFilterSchema';
import { BudgetPeriodConfigWhereInputSchema } from './BudgetPeriodConfigWhereInputSchema';
import { BudgetUserListRelationFilterSchema } from './BudgetUserListRelationFilterSchema';
import { TransactionListRelationFilterSchema } from './TransactionListRelationFilterSchema';
import { BudgetUserInvitationListRelationFilterSchema } from './BudgetUserInvitationListRelationFilterSchema';

export const BudgetWhereInputSchema: z.ZodType<Prisma.BudgetWhereInput> = z.object({
  AND: z.union([ z.lazy(() => BudgetWhereInputSchema),z.lazy(() => BudgetWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => BudgetWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => BudgetWhereInputSchema),z.lazy(() => BudgetWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  name: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  description: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  preferredCurrency: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  type: z.union([ z.lazy(() => EnumBudgetTypeFilterSchema),z.lazy(() => BudgetTypeSchema) ]).optional(),
  periodConfig: z.union([ z.lazy(() => BudgetPeriodConfigNullableRelationFilterSchema),z.lazy(() => BudgetPeriodConfigWhereInputSchema) ]).optional().nullable(),
  budgetUsers: z.lazy(() => BudgetUserListRelationFilterSchema).optional(),
  transactions: z.lazy(() => TransactionListRelationFilterSchema).optional(),
  invitations: z.lazy(() => BudgetUserInvitationListRelationFilterSchema).optional()
}).strict();

export default BudgetWhereInputSchema;
