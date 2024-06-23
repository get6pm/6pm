import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { TransactionCreateWithoutBudgetInputSchema } from './TransactionCreateWithoutBudgetInputSchema';
import { TransactionUncheckedCreateWithoutBudgetInputSchema } from './TransactionUncheckedCreateWithoutBudgetInputSchema';
import { TransactionCreateOrConnectWithoutBudgetInputSchema } from './TransactionCreateOrConnectWithoutBudgetInputSchema';
import { TransactionCreateManyBudgetInputEnvelopeSchema } from './TransactionCreateManyBudgetInputEnvelopeSchema';
import { TransactionWhereUniqueInputSchema } from './TransactionWhereUniqueInputSchema';

export const TransactionUncheckedCreateNestedManyWithoutBudgetInputSchema: z.ZodType<Prisma.TransactionUncheckedCreateNestedManyWithoutBudgetInput> = z.object({
  create: z.union([ z.lazy(() => TransactionCreateWithoutBudgetInputSchema),z.lazy(() => TransactionCreateWithoutBudgetInputSchema).array(),z.lazy(() => TransactionUncheckedCreateWithoutBudgetInputSchema),z.lazy(() => TransactionUncheckedCreateWithoutBudgetInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => TransactionCreateOrConnectWithoutBudgetInputSchema),z.lazy(() => TransactionCreateOrConnectWithoutBudgetInputSchema).array() ]).optional(),
  createMany: z.lazy(() => TransactionCreateManyBudgetInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => TransactionWhereUniqueInputSchema),z.lazy(() => TransactionWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export default TransactionUncheckedCreateNestedManyWithoutBudgetInputSchema;
