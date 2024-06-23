import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetWhereInputSchema } from './BudgetWhereInputSchema';
import { BudgetUpdateWithoutBudgetUsersInputSchema } from './BudgetUpdateWithoutBudgetUsersInputSchema';
import { BudgetUncheckedUpdateWithoutBudgetUsersInputSchema } from './BudgetUncheckedUpdateWithoutBudgetUsersInputSchema';

export const BudgetUpdateToOneWithWhereWithoutBudgetUsersInputSchema: z.ZodType<Prisma.BudgetUpdateToOneWithWhereWithoutBudgetUsersInput> = z.object({
  where: z.lazy(() => BudgetWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => BudgetUpdateWithoutBudgetUsersInputSchema),z.lazy(() => BudgetUncheckedUpdateWithoutBudgetUsersInputSchema) ]),
}).strict();

export default BudgetUpdateToOneWithWhereWithoutBudgetUsersInputSchema;
