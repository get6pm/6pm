import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { TransactionCreateWithoutBudgetInputSchema } from './TransactionCreateWithoutBudgetInputSchema';
import { TransactionUncheckedCreateWithoutBudgetInputSchema } from './TransactionUncheckedCreateWithoutBudgetInputSchema';
import { TransactionCreateOrConnectWithoutBudgetInputSchema } from './TransactionCreateOrConnectWithoutBudgetInputSchema';
import { TransactionUpsertWithWhereUniqueWithoutBudgetInputSchema } from './TransactionUpsertWithWhereUniqueWithoutBudgetInputSchema';
import { TransactionCreateManyBudgetInputEnvelopeSchema } from './TransactionCreateManyBudgetInputEnvelopeSchema';
import { TransactionWhereUniqueInputSchema } from './TransactionWhereUniqueInputSchema';
import { TransactionUpdateWithWhereUniqueWithoutBudgetInputSchema } from './TransactionUpdateWithWhereUniqueWithoutBudgetInputSchema';
import { TransactionUpdateManyWithWhereWithoutBudgetInputSchema } from './TransactionUpdateManyWithWhereWithoutBudgetInputSchema';
import { TransactionScalarWhereInputSchema } from './TransactionScalarWhereInputSchema';

export const TransactionUncheckedUpdateManyWithoutBudgetNestedInputSchema: z.ZodType<Prisma.TransactionUncheckedUpdateManyWithoutBudgetNestedInput> = z.object({
  create: z.union([ z.lazy(() => TransactionCreateWithoutBudgetInputSchema),z.lazy(() => TransactionCreateWithoutBudgetInputSchema).array(),z.lazy(() => TransactionUncheckedCreateWithoutBudgetInputSchema),z.lazy(() => TransactionUncheckedCreateWithoutBudgetInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => TransactionCreateOrConnectWithoutBudgetInputSchema),z.lazy(() => TransactionCreateOrConnectWithoutBudgetInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => TransactionUpsertWithWhereUniqueWithoutBudgetInputSchema),z.lazy(() => TransactionUpsertWithWhereUniqueWithoutBudgetInputSchema).array() ]).optional(),
  createMany: z.lazy(() => TransactionCreateManyBudgetInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => TransactionWhereUniqueInputSchema),z.lazy(() => TransactionWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => TransactionWhereUniqueInputSchema),z.lazy(() => TransactionWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => TransactionWhereUniqueInputSchema),z.lazy(() => TransactionWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => TransactionWhereUniqueInputSchema),z.lazy(() => TransactionWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => TransactionUpdateWithWhereUniqueWithoutBudgetInputSchema),z.lazy(() => TransactionUpdateWithWhereUniqueWithoutBudgetInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => TransactionUpdateManyWithWhereWithoutBudgetInputSchema),z.lazy(() => TransactionUpdateManyWithWhereWithoutBudgetInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => TransactionScalarWhereInputSchema),z.lazy(() => TransactionScalarWhereInputSchema).array() ]).optional(),
}).strict();

export default TransactionUncheckedUpdateManyWithoutBudgetNestedInputSchema;
