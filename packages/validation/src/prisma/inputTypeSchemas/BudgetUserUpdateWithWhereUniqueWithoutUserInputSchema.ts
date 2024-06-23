import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetUserWhereUniqueInputSchema } from './BudgetUserWhereUniqueInputSchema';
import { BudgetUserUpdateWithoutUserInputSchema } from './BudgetUserUpdateWithoutUserInputSchema';
import { BudgetUserUncheckedUpdateWithoutUserInputSchema } from './BudgetUserUncheckedUpdateWithoutUserInputSchema';

export const BudgetUserUpdateWithWhereUniqueWithoutUserInputSchema: z.ZodType<Prisma.BudgetUserUpdateWithWhereUniqueWithoutUserInput> = z.object({
  where: z.lazy(() => BudgetUserWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => BudgetUserUpdateWithoutUserInputSchema),z.lazy(() => BudgetUserUncheckedUpdateWithoutUserInputSchema) ]),
}).strict();

export default BudgetUserUpdateWithWhereUniqueWithoutUserInputSchema;
