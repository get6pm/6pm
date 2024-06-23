import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetUserWhereUniqueInputSchema } from './BudgetUserWhereUniqueInputSchema';
import { BudgetUserUpdateWithoutUserInputSchema } from './BudgetUserUpdateWithoutUserInputSchema';
import { BudgetUserUncheckedUpdateWithoutUserInputSchema } from './BudgetUserUncheckedUpdateWithoutUserInputSchema';
import { BudgetUserCreateWithoutUserInputSchema } from './BudgetUserCreateWithoutUserInputSchema';
import { BudgetUserUncheckedCreateWithoutUserInputSchema } from './BudgetUserUncheckedCreateWithoutUserInputSchema';

export const BudgetUserUpsertWithWhereUniqueWithoutUserInputSchema: z.ZodType<Prisma.BudgetUserUpsertWithWhereUniqueWithoutUserInput> = z.object({
  where: z.lazy(() => BudgetUserWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => BudgetUserUpdateWithoutUserInputSchema),z.lazy(() => BudgetUserUncheckedUpdateWithoutUserInputSchema) ]),
  create: z.union([ z.lazy(() => BudgetUserCreateWithoutUserInputSchema),z.lazy(() => BudgetUserUncheckedCreateWithoutUserInputSchema) ]),
}).strict();

export default BudgetUserUpsertWithWhereUniqueWithoutUserInputSchema;
