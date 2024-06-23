import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetUserScalarWhereInputSchema } from './BudgetUserScalarWhereInputSchema';
import { BudgetUserUpdateManyMutationInputSchema } from './BudgetUserUpdateManyMutationInputSchema';
import { BudgetUserUncheckedUpdateManyWithoutBudgetInputSchema } from './BudgetUserUncheckedUpdateManyWithoutBudgetInputSchema';

export const BudgetUserUpdateManyWithWhereWithoutBudgetInputSchema: z.ZodType<Prisma.BudgetUserUpdateManyWithWhereWithoutBudgetInput> = z.object({
  where: z.lazy(() => BudgetUserScalarWhereInputSchema),
  data: z.union([ z.lazy(() => BudgetUserUpdateManyMutationInputSchema),z.lazy(() => BudgetUserUncheckedUpdateManyWithoutBudgetInputSchema) ]),
}).strict();

export default BudgetUserUpdateManyWithWhereWithoutBudgetInputSchema;
