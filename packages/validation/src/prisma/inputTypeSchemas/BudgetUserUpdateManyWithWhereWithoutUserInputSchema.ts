import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetUserScalarWhereInputSchema } from './BudgetUserScalarWhereInputSchema';
import { BudgetUserUpdateManyMutationInputSchema } from './BudgetUserUpdateManyMutationInputSchema';
import { BudgetUserUncheckedUpdateManyWithoutUserInputSchema } from './BudgetUserUncheckedUpdateManyWithoutUserInputSchema';

export const BudgetUserUpdateManyWithWhereWithoutUserInputSchema: z.ZodType<Prisma.BudgetUserUpdateManyWithWhereWithoutUserInput> = z.object({
  where: z.lazy(() => BudgetUserScalarWhereInputSchema),
  data: z.union([ z.lazy(() => BudgetUserUpdateManyMutationInputSchema),z.lazy(() => BudgetUserUncheckedUpdateManyWithoutUserInputSchema) ]),
}).strict();

export default BudgetUserUpdateManyWithWhereWithoutUserInputSchema;
