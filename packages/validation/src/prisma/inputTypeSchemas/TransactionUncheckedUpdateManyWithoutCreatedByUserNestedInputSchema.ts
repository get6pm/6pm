import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { TransactionCreateWithoutCreatedByUserInputSchema } from './TransactionCreateWithoutCreatedByUserInputSchema';
import { TransactionUncheckedCreateWithoutCreatedByUserInputSchema } from './TransactionUncheckedCreateWithoutCreatedByUserInputSchema';
import { TransactionCreateOrConnectWithoutCreatedByUserInputSchema } from './TransactionCreateOrConnectWithoutCreatedByUserInputSchema';
import { TransactionUpsertWithWhereUniqueWithoutCreatedByUserInputSchema } from './TransactionUpsertWithWhereUniqueWithoutCreatedByUserInputSchema';
import { TransactionCreateManyCreatedByUserInputEnvelopeSchema } from './TransactionCreateManyCreatedByUserInputEnvelopeSchema';
import { TransactionWhereUniqueInputSchema } from './TransactionWhereUniqueInputSchema';
import { TransactionUpdateWithWhereUniqueWithoutCreatedByUserInputSchema } from './TransactionUpdateWithWhereUniqueWithoutCreatedByUserInputSchema';
import { TransactionUpdateManyWithWhereWithoutCreatedByUserInputSchema } from './TransactionUpdateManyWithWhereWithoutCreatedByUserInputSchema';
import { TransactionScalarWhereInputSchema } from './TransactionScalarWhereInputSchema';

export const TransactionUncheckedUpdateManyWithoutCreatedByUserNestedInputSchema: z.ZodType<Prisma.TransactionUncheckedUpdateManyWithoutCreatedByUserNestedInput> = z.object({
  create: z.union([ z.lazy(() => TransactionCreateWithoutCreatedByUserInputSchema),z.lazy(() => TransactionCreateWithoutCreatedByUserInputSchema).array(),z.lazy(() => TransactionUncheckedCreateWithoutCreatedByUserInputSchema),z.lazy(() => TransactionUncheckedCreateWithoutCreatedByUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => TransactionCreateOrConnectWithoutCreatedByUserInputSchema),z.lazy(() => TransactionCreateOrConnectWithoutCreatedByUserInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => TransactionUpsertWithWhereUniqueWithoutCreatedByUserInputSchema),z.lazy(() => TransactionUpsertWithWhereUniqueWithoutCreatedByUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => TransactionCreateManyCreatedByUserInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => TransactionWhereUniqueInputSchema),z.lazy(() => TransactionWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => TransactionWhereUniqueInputSchema),z.lazy(() => TransactionWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => TransactionWhereUniqueInputSchema),z.lazy(() => TransactionWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => TransactionWhereUniqueInputSchema),z.lazy(() => TransactionWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => TransactionUpdateWithWhereUniqueWithoutCreatedByUserInputSchema),z.lazy(() => TransactionUpdateWithWhereUniqueWithoutCreatedByUserInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => TransactionUpdateManyWithWhereWithoutCreatedByUserInputSchema),z.lazy(() => TransactionUpdateManyWithWhereWithoutCreatedByUserInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => TransactionScalarWhereInputSchema),z.lazy(() => TransactionScalarWhereInputSchema).array() ]).optional(),
}).strict();

export default TransactionUncheckedUpdateManyWithoutCreatedByUserNestedInputSchema;
