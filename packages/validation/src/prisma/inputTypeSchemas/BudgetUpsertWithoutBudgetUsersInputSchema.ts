import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetUpdateWithoutBudgetUsersInputSchema } from './BudgetUpdateWithoutBudgetUsersInputSchema';
import { BudgetUncheckedUpdateWithoutBudgetUsersInputSchema } from './BudgetUncheckedUpdateWithoutBudgetUsersInputSchema';
import { BudgetCreateWithoutBudgetUsersInputSchema } from './BudgetCreateWithoutBudgetUsersInputSchema';
import { BudgetUncheckedCreateWithoutBudgetUsersInputSchema } from './BudgetUncheckedCreateWithoutBudgetUsersInputSchema';
import { BudgetWhereInputSchema } from './BudgetWhereInputSchema';

export const BudgetUpsertWithoutBudgetUsersInputSchema: z.ZodType<Prisma.BudgetUpsertWithoutBudgetUsersInput> = z.object({
  update: z.union([ z.lazy(() => BudgetUpdateWithoutBudgetUsersInputSchema),z.lazy(() => BudgetUncheckedUpdateWithoutBudgetUsersInputSchema) ]),
  create: z.union([ z.lazy(() => BudgetCreateWithoutBudgetUsersInputSchema),z.lazy(() => BudgetUncheckedCreateWithoutBudgetUsersInputSchema) ]),
  where: z.lazy(() => BudgetWhereInputSchema).optional()
}).strict();

export default BudgetUpsertWithoutBudgetUsersInputSchema;
