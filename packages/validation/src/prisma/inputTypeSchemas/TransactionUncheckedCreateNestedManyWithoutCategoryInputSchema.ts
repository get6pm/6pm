import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { TransactionCreateWithoutCategoryInputSchema } from './TransactionCreateWithoutCategoryInputSchema';
import { TransactionUncheckedCreateWithoutCategoryInputSchema } from './TransactionUncheckedCreateWithoutCategoryInputSchema';
import { TransactionCreateOrConnectWithoutCategoryInputSchema } from './TransactionCreateOrConnectWithoutCategoryInputSchema';
import { TransactionCreateManyCategoryInputEnvelopeSchema } from './TransactionCreateManyCategoryInputEnvelopeSchema';
import { TransactionWhereUniqueInputSchema } from './TransactionWhereUniqueInputSchema';

export const TransactionUncheckedCreateNestedManyWithoutCategoryInputSchema: z.ZodType<Prisma.TransactionUncheckedCreateNestedManyWithoutCategoryInput> = z.object({
  create: z.union([ z.lazy(() => TransactionCreateWithoutCategoryInputSchema),z.lazy(() => TransactionCreateWithoutCategoryInputSchema).array(),z.lazy(() => TransactionUncheckedCreateWithoutCategoryInputSchema),z.lazy(() => TransactionUncheckedCreateWithoutCategoryInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => TransactionCreateOrConnectWithoutCategoryInputSchema),z.lazy(() => TransactionCreateOrConnectWithoutCategoryInputSchema).array() ]).optional(),
  createMany: z.lazy(() => TransactionCreateManyCategoryInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => TransactionWhereUniqueInputSchema),z.lazy(() => TransactionWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export default TransactionUncheckedCreateNestedManyWithoutCategoryInputSchema;
