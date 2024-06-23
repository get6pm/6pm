import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { TransactionWhereUniqueInputSchema } from './TransactionWhereUniqueInputSchema';
import { TransactionUpdateWithoutCreatedByUserInputSchema } from './TransactionUpdateWithoutCreatedByUserInputSchema';
import { TransactionUncheckedUpdateWithoutCreatedByUserInputSchema } from './TransactionUncheckedUpdateWithoutCreatedByUserInputSchema';
import { TransactionCreateWithoutCreatedByUserInputSchema } from './TransactionCreateWithoutCreatedByUserInputSchema';
import { TransactionUncheckedCreateWithoutCreatedByUserInputSchema } from './TransactionUncheckedCreateWithoutCreatedByUserInputSchema';

export const TransactionUpsertWithWhereUniqueWithoutCreatedByUserInputSchema: z.ZodType<Prisma.TransactionUpsertWithWhereUniqueWithoutCreatedByUserInput> = z.object({
  where: z.lazy(() => TransactionWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => TransactionUpdateWithoutCreatedByUserInputSchema),z.lazy(() => TransactionUncheckedUpdateWithoutCreatedByUserInputSchema) ]),
  create: z.union([ z.lazy(() => TransactionCreateWithoutCreatedByUserInputSchema),z.lazy(() => TransactionUncheckedCreateWithoutCreatedByUserInputSchema) ]),
}).strict();

export default TransactionUpsertWithWhereUniqueWithoutCreatedByUserInputSchema;
