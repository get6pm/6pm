import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetCreateWithoutBudgetUsersInputSchema } from './BudgetCreateWithoutBudgetUsersInputSchema';
import { BudgetUncheckedCreateWithoutBudgetUsersInputSchema } from './BudgetUncheckedCreateWithoutBudgetUsersInputSchema';
import { BudgetCreateOrConnectWithoutBudgetUsersInputSchema } from './BudgetCreateOrConnectWithoutBudgetUsersInputSchema';
import { BudgetUpsertWithoutBudgetUsersInputSchema } from './BudgetUpsertWithoutBudgetUsersInputSchema';
import { BudgetWhereUniqueInputSchema } from './BudgetWhereUniqueInputSchema';
import { BudgetUpdateToOneWithWhereWithoutBudgetUsersInputSchema } from './BudgetUpdateToOneWithWhereWithoutBudgetUsersInputSchema';
import { BudgetUpdateWithoutBudgetUsersInputSchema } from './BudgetUpdateWithoutBudgetUsersInputSchema';
import { BudgetUncheckedUpdateWithoutBudgetUsersInputSchema } from './BudgetUncheckedUpdateWithoutBudgetUsersInputSchema';

export const BudgetUpdateOneRequiredWithoutBudgetUsersNestedInputSchema: z.ZodType<Prisma.BudgetUpdateOneRequiredWithoutBudgetUsersNestedInput> = z.object({
  create: z.union([ z.lazy(() => BudgetCreateWithoutBudgetUsersInputSchema),z.lazy(() => BudgetUncheckedCreateWithoutBudgetUsersInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => BudgetCreateOrConnectWithoutBudgetUsersInputSchema).optional(),
  upsert: z.lazy(() => BudgetUpsertWithoutBudgetUsersInputSchema).optional(),
  connect: z.lazy(() => BudgetWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => BudgetUpdateToOneWithWhereWithoutBudgetUsersInputSchema),z.lazy(() => BudgetUpdateWithoutBudgetUsersInputSchema),z.lazy(() => BudgetUncheckedUpdateWithoutBudgetUsersInputSchema) ]).optional(),
}).strict();

export default BudgetUpdateOneRequiredWithoutBudgetUsersNestedInputSchema;
