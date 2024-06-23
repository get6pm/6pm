import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { BudgetUserCreateWithoutUserInputSchema } from './BudgetUserCreateWithoutUserInputSchema';
import { BudgetUserUncheckedCreateWithoutUserInputSchema } from './BudgetUserUncheckedCreateWithoutUserInputSchema';
import { BudgetUserCreateOrConnectWithoutUserInputSchema } from './BudgetUserCreateOrConnectWithoutUserInputSchema';
import { BudgetUserCreateManyUserInputEnvelopeSchema } from './BudgetUserCreateManyUserInputEnvelopeSchema';
import { BudgetUserWhereUniqueInputSchema } from './BudgetUserWhereUniqueInputSchema';

export const BudgetUserUncheckedCreateNestedManyWithoutUserInputSchema: z.ZodType<Prisma.BudgetUserUncheckedCreateNestedManyWithoutUserInput> = z.object({
  create: z.union([ z.lazy(() => BudgetUserCreateWithoutUserInputSchema),z.lazy(() => BudgetUserCreateWithoutUserInputSchema).array(),z.lazy(() => BudgetUserUncheckedCreateWithoutUserInputSchema),z.lazy(() => BudgetUserUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => BudgetUserCreateOrConnectWithoutUserInputSchema),z.lazy(() => BudgetUserCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => BudgetUserCreateManyUserInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => BudgetUserWhereUniqueInputSchema),z.lazy(() => BudgetUserWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export default BudgetUserUncheckedCreateNestedManyWithoutUserInputSchema;
