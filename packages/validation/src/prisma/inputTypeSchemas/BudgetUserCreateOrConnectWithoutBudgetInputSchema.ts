import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetUserWhereUniqueInputSchema } from './BudgetUserWhereUniqueInputSchema';
import { BudgetUserCreateWithoutBudgetInputSchema } from './BudgetUserCreateWithoutBudgetInputSchema';
import { BudgetUserUncheckedCreateWithoutBudgetInputSchema } from './BudgetUserUncheckedCreateWithoutBudgetInputSchema';

export const BudgetUserCreateOrConnectWithoutBudgetInputSchema: z.ZodType<Prisma.BudgetUserCreateOrConnectWithoutBudgetInput> = z.object({
  where: z.lazy(() => BudgetUserWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => BudgetUserCreateWithoutBudgetInputSchema),z.lazy(() => BudgetUserUncheckedCreateWithoutBudgetInputSchema) ]),
}).strict();

export default BudgetUserCreateOrConnectWithoutBudgetInputSchema;
