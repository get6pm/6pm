import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { TransactionCreateWithoutCreatedByUserInputSchema } from './TransactionCreateWithoutCreatedByUserInputSchema';
import { TransactionUncheckedCreateWithoutCreatedByUserInputSchema } from './TransactionUncheckedCreateWithoutCreatedByUserInputSchema';
import { TransactionCreateOrConnectWithoutCreatedByUserInputSchema } from './TransactionCreateOrConnectWithoutCreatedByUserInputSchema';
import { TransactionCreateManyCreatedByUserInputEnvelopeSchema } from './TransactionCreateManyCreatedByUserInputEnvelopeSchema';
import { TransactionWhereUniqueInputSchema } from './TransactionWhereUniqueInputSchema';

export const TransactionCreateNestedManyWithoutCreatedByUserInputSchema: z.ZodType<Prisma.TransactionCreateNestedManyWithoutCreatedByUserInput> = z.object({
  create: z.union([ z.lazy(() => TransactionCreateWithoutCreatedByUserInputSchema),z.lazy(() => TransactionCreateWithoutCreatedByUserInputSchema).array(),z.lazy(() => TransactionUncheckedCreateWithoutCreatedByUserInputSchema),z.lazy(() => TransactionUncheckedCreateWithoutCreatedByUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => TransactionCreateOrConnectWithoutCreatedByUserInputSchema),z.lazy(() => TransactionCreateOrConnectWithoutCreatedByUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => TransactionCreateManyCreatedByUserInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => TransactionWhereUniqueInputSchema),z.lazy(() => TransactionWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export default TransactionCreateNestedManyWithoutCreatedByUserInputSchema;
