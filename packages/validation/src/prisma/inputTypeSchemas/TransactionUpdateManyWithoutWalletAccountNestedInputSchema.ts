import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { TransactionCreateWithoutWalletAccountInputSchema } from './TransactionCreateWithoutWalletAccountInputSchema';
import { TransactionUncheckedCreateWithoutWalletAccountInputSchema } from './TransactionUncheckedCreateWithoutWalletAccountInputSchema';
import { TransactionCreateOrConnectWithoutWalletAccountInputSchema } from './TransactionCreateOrConnectWithoutWalletAccountInputSchema';
import { TransactionUpsertWithWhereUniqueWithoutWalletAccountInputSchema } from './TransactionUpsertWithWhereUniqueWithoutWalletAccountInputSchema';
import { TransactionCreateManyWalletAccountInputEnvelopeSchema } from './TransactionCreateManyWalletAccountInputEnvelopeSchema';
import { TransactionWhereUniqueInputSchema } from './TransactionWhereUniqueInputSchema';
import { TransactionUpdateWithWhereUniqueWithoutWalletAccountInputSchema } from './TransactionUpdateWithWhereUniqueWithoutWalletAccountInputSchema';
import { TransactionUpdateManyWithWhereWithoutWalletAccountInputSchema } from './TransactionUpdateManyWithWhereWithoutWalletAccountInputSchema';
import { TransactionScalarWhereInputSchema } from './TransactionScalarWhereInputSchema';

export const TransactionUpdateManyWithoutWalletAccountNestedInputSchema: z.ZodType<Prisma.TransactionUpdateManyWithoutWalletAccountNestedInput> = z.object({
  create: z.union([ z.lazy(() => TransactionCreateWithoutWalletAccountInputSchema),z.lazy(() => TransactionCreateWithoutWalletAccountInputSchema).array(),z.lazy(() => TransactionUncheckedCreateWithoutWalletAccountInputSchema),z.lazy(() => TransactionUncheckedCreateWithoutWalletAccountInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => TransactionCreateOrConnectWithoutWalletAccountInputSchema),z.lazy(() => TransactionCreateOrConnectWithoutWalletAccountInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => TransactionUpsertWithWhereUniqueWithoutWalletAccountInputSchema),z.lazy(() => TransactionUpsertWithWhereUniqueWithoutWalletAccountInputSchema).array() ]).optional(),
  createMany: z.lazy(() => TransactionCreateManyWalletAccountInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => TransactionWhereUniqueInputSchema),z.lazy(() => TransactionWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => TransactionWhereUniqueInputSchema),z.lazy(() => TransactionWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => TransactionWhereUniqueInputSchema),z.lazy(() => TransactionWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => TransactionWhereUniqueInputSchema),z.lazy(() => TransactionWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => TransactionUpdateWithWhereUniqueWithoutWalletAccountInputSchema),z.lazy(() => TransactionUpdateWithWhereUniqueWithoutWalletAccountInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => TransactionUpdateManyWithWhereWithoutWalletAccountInputSchema),z.lazy(() => TransactionUpdateManyWithWhereWithoutWalletAccountInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => TransactionScalarWhereInputSchema),z.lazy(() => TransactionScalarWhereInputSchema).array() ]).optional(),
}).strict();

export default TransactionUpdateManyWithoutWalletAccountNestedInputSchema;
