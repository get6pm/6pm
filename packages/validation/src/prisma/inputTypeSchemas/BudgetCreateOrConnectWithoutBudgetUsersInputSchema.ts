import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetWhereUniqueInputSchema } from './BudgetWhereUniqueInputSchema';
import { BudgetCreateWithoutBudgetUsersInputSchema } from './BudgetCreateWithoutBudgetUsersInputSchema';
import { BudgetUncheckedCreateWithoutBudgetUsersInputSchema } from './BudgetUncheckedCreateWithoutBudgetUsersInputSchema';

export const BudgetCreateOrConnectWithoutBudgetUsersInputSchema: z.ZodType<Prisma.BudgetCreateOrConnectWithoutBudgetUsersInput> = z.object({
  where: z.lazy(() => BudgetWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => BudgetCreateWithoutBudgetUsersInputSchema),z.lazy(() => BudgetUncheckedCreateWithoutBudgetUsersInputSchema) ]),
}).strict();

export default BudgetCreateOrConnectWithoutBudgetUsersInputSchema;
