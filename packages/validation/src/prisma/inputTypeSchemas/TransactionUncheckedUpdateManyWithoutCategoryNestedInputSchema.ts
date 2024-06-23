import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { TransactionCreateWithoutCategoryInputSchema } from './TransactionCreateWithoutCategoryInputSchema';
import { TransactionUncheckedCreateWithoutCategoryInputSchema } from './TransactionUncheckedCreateWithoutCategoryInputSchema';
import { TransactionCreateOrConnectWithoutCategoryInputSchema } from './TransactionCreateOrConnectWithoutCategoryInputSchema';
import { TransactionUpsertWithWhereUniqueWithoutCategoryInputSchema } from './TransactionUpsertWithWhereUniqueWithoutCategoryInputSchema';
import { TransactionCreateManyCategoryInputEnvelopeSchema } from './TransactionCreateManyCategoryInputEnvelopeSchema';
import { TransactionWhereUniqueInputSchema } from './TransactionWhereUniqueInputSchema';
import { TransactionUpdateWithWhereUniqueWithoutCategoryInputSchema } from './TransactionUpdateWithWhereUniqueWithoutCategoryInputSchema';
import { TransactionUpdateManyWithWhereWithoutCategoryInputSchema } from './TransactionUpdateManyWithWhereWithoutCategoryInputSchema';
import { TransactionScalarWhereInputSchema } from './TransactionScalarWhereInputSchema';

export const TransactionUncheckedUpdateManyWithoutCategoryNestedInputSchema: z.ZodType<Prisma.TransactionUncheckedUpdateManyWithoutCategoryNestedInput> = z.object({
  create: z.union([ z.lazy(() => TransactionCreateWithoutCategoryInputSchema),z.lazy(() => TransactionCreateWithoutCategoryInputSchema).array(),z.lazy(() => TransactionUncheckedCreateWithoutCategoryInputSchema),z.lazy(() => TransactionUncheckedCreateWithoutCategoryInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => TransactionCreateOrConnectWithoutCategoryInputSchema),z.lazy(() => TransactionCreateOrConnectWithoutCategoryInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => TransactionUpsertWithWhereUniqueWithoutCategoryInputSchema),z.lazy(() => TransactionUpsertWithWhereUniqueWithoutCategoryInputSchema).array() ]).optional(),
  createMany: z.lazy(() => TransactionCreateManyCategoryInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => TransactionWhereUniqueInputSchema),z.lazy(() => TransactionWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => TransactionWhereUniqueInputSchema),z.lazy(() => TransactionWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => TransactionWhereUniqueInputSchema),z.lazy(() => TransactionWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => TransactionWhereUniqueInputSchema),z.lazy(() => TransactionWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => TransactionUpdateWithWhereUniqueWithoutCategoryInputSchema),z.lazy(() => TransactionUpdateWithWhereUniqueWithoutCategoryInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => TransactionUpdateManyWithWhereWithoutCategoryInputSchema),z.lazy(() => TransactionUpdateManyWithWhereWithoutCategoryInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => TransactionScalarWhereInputSchema),z.lazy(() => TransactionScalarWhereInputSchema).array() ]).optional(),
}).strict();

export default TransactionUncheckedUpdateManyWithoutCategoryNestedInputSchema;
