import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetCreateWithoutBudgetUsersInputSchema } from './BudgetCreateWithoutBudgetUsersInputSchema';
import { BudgetUncheckedCreateWithoutBudgetUsersInputSchema } from './BudgetUncheckedCreateWithoutBudgetUsersInputSchema';
import { BudgetCreateOrConnectWithoutBudgetUsersInputSchema } from './BudgetCreateOrConnectWithoutBudgetUsersInputSchema';
import { BudgetWhereUniqueInputSchema } from './BudgetWhereUniqueInputSchema';

export const BudgetCreateNestedOneWithoutBudgetUsersInputSchema: z.ZodType<Prisma.BudgetCreateNestedOneWithoutBudgetUsersInput> = z.object({
  create: z.union([ z.lazy(() => BudgetCreateWithoutBudgetUsersInputSchema),z.lazy(() => BudgetUncheckedCreateWithoutBudgetUsersInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => BudgetCreateOrConnectWithoutBudgetUsersInputSchema).optional(),
  connect: z.lazy(() => BudgetWhereUniqueInputSchema).optional()
}).strict();

export default BudgetCreateNestedOneWithoutBudgetUsersInputSchema;
