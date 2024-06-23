import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetUserWhereUniqueInputSchema } from './BudgetUserWhereUniqueInputSchema';
import { BudgetUserUpdateWithoutBudgetInputSchema } from './BudgetUserUpdateWithoutBudgetInputSchema';
import { BudgetUserUncheckedUpdateWithoutBudgetInputSchema } from './BudgetUserUncheckedUpdateWithoutBudgetInputSchema';
import { BudgetUserCreateWithoutBudgetInputSchema } from './BudgetUserCreateWithoutBudgetInputSchema';
import { BudgetUserUncheckedCreateWithoutBudgetInputSchema } from './BudgetUserUncheckedCreateWithoutBudgetInputSchema';

export const BudgetUserUpsertWithWhereUniqueWithoutBudgetInputSchema: z.ZodType<Prisma.BudgetUserUpsertWithWhereUniqueWithoutBudgetInput> = z.object({
  where: z.lazy(() => BudgetUserWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => BudgetUserUpdateWithoutBudgetInputSchema),z.lazy(() => BudgetUserUncheckedUpdateWithoutBudgetInputSchema) ]),
  create: z.union([ z.lazy(() => BudgetUserCreateWithoutBudgetInputSchema),z.lazy(() => BudgetUserUncheckedCreateWithoutBudgetInputSchema) ]),
}).strict();

export default BudgetUserUpsertWithWhereUniqueWithoutBudgetInputSchema;
