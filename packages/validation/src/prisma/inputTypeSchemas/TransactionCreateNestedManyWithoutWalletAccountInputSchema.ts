import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { TransactionCreateWithoutWalletAccountInputSchema } from './TransactionCreateWithoutWalletAccountInputSchema';
import { TransactionUncheckedCreateWithoutWalletAccountInputSchema } from './TransactionUncheckedCreateWithoutWalletAccountInputSchema';
import { TransactionCreateOrConnectWithoutWalletAccountInputSchema } from './TransactionCreateOrConnectWithoutWalletAccountInputSchema';
import { TransactionCreateManyWalletAccountInputEnvelopeSchema } from './TransactionCreateManyWalletAccountInputEnvelopeSchema';
import { TransactionWhereUniqueInputSchema } from './TransactionWhereUniqueInputSchema';

export const TransactionCreateNestedManyWithoutWalletAccountInputSchema: z.ZodType<Prisma.TransactionCreateNestedManyWithoutWalletAccountInput> = z.object({
  create: z.union([ z.lazy(() => TransactionCreateWithoutWalletAccountInputSchema),z.lazy(() => TransactionCreateWithoutWalletAccountInputSchema).array(),z.lazy(() => TransactionUncheckedCreateWithoutWalletAccountInputSchema),z.lazy(() => TransactionUncheckedCreateWithoutWalletAccountInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => TransactionCreateOrConnectWithoutWalletAccountInputSchema),z.lazy(() => TransactionCreateOrConnectWithoutWalletAccountInputSchema).array() ]).optional(),
  createMany: z.lazy(() => TransactionCreateManyWalletAccountInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => TransactionWhereUniqueInputSchema),z.lazy(() => TransactionWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export default TransactionCreateNestedManyWithoutWalletAccountInputSchema;
