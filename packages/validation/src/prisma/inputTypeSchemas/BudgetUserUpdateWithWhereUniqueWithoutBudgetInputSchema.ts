import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetUserWhereUniqueInputSchema } from './BudgetUserWhereUniqueInputSchema';
import { BudgetUserUpdateWithoutBudgetInputSchema } from './BudgetUserUpdateWithoutBudgetInputSchema';
import { BudgetUserUncheckedUpdateWithoutBudgetInputSchema } from './BudgetUserUncheckedUpdateWithoutBudgetInputSchema';

export const BudgetUserUpdateWithWhereUniqueWithoutBudgetInputSchema: z.ZodType<Prisma.BudgetUserUpdateWithWhereUniqueWithoutBudgetInput> = z.object({
  where: z.lazy(() => BudgetUserWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => BudgetUserUpdateWithoutBudgetInputSchema),z.lazy(() => BudgetUserUncheckedUpdateWithoutBudgetInputSchema) ]),
}).strict();

export default BudgetUserUpdateWithWhereUniqueWithoutBudgetInputSchema;
