import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetUserWhereUniqueInputSchema } from './BudgetUserWhereUniqueInputSchema';
import { BudgetUserCreateWithoutUserInputSchema } from './BudgetUserCreateWithoutUserInputSchema';
import { BudgetUserUncheckedCreateWithoutUserInputSchema } from './BudgetUserUncheckedCreateWithoutUserInputSchema';

export const BudgetUserCreateOrConnectWithoutUserInputSchema: z.ZodType<Prisma.BudgetUserCreateOrConnectWithoutUserInput> = z.object({
  where: z.lazy(() => BudgetUserWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => BudgetUserCreateWithoutUserInputSchema),z.lazy(() => BudgetUserUncheckedCreateWithoutUserInputSchema) ]),
}).strict();

export default BudgetUserCreateOrConnectWithoutUserInputSchema;
