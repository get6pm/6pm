import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetUserCreateWithoutBudgetInputSchema } from './BudgetUserCreateWithoutBudgetInputSchema';
import { BudgetUserUncheckedCreateWithoutBudgetInputSchema } from './BudgetUserUncheckedCreateWithoutBudgetInputSchema';
import { BudgetUserCreateOrConnectWithoutBudgetInputSchema } from './BudgetUserCreateOrConnectWithoutBudgetInputSchema';
import { BudgetUserCreateManyBudgetInputEnvelopeSchema } from './BudgetUserCreateManyBudgetInputEnvelopeSchema';
import { BudgetUserWhereUniqueInputSchema } from './BudgetUserWhereUniqueInputSchema';

export const BudgetUserCreateNestedManyWithoutBudgetInputSchema: z.ZodType<Prisma.BudgetUserCreateNestedManyWithoutBudgetInput> = z.object({
  create: z.union([ z.lazy(() => BudgetUserCreateWithoutBudgetInputSchema),z.lazy(() => BudgetUserCreateWithoutBudgetInputSchema).array(),z.lazy(() => BudgetUserUncheckedCreateWithoutBudgetInputSchema),z.lazy(() => BudgetUserUncheckedCreateWithoutBudgetInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => BudgetUserCreateOrConnectWithoutBudgetInputSchema),z.lazy(() => BudgetUserCreateOrConnectWithoutBudgetInputSchema).array() ]).optional(),
  createMany: z.lazy(() => BudgetUserCreateManyBudgetInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => BudgetUserWhereUniqueInputSchema),z.lazy(() => BudgetUserWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export default BudgetUserCreateNestedManyWithoutBudgetInputSchema;
