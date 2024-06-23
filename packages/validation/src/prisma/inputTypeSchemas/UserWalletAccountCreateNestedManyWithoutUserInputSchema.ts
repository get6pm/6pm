import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { UserWalletAccountCreateWithoutUserInputSchema } from './UserWalletAccountCreateWithoutUserInputSchema';
import { UserWalletAccountUncheckedCreateWithoutUserInputSchema } from './UserWalletAccountUncheckedCreateWithoutUserInputSchema';
import { UserWalletAccountCreateOrConnectWithoutUserInputSchema } from './UserWalletAccountCreateOrConnectWithoutUserInputSchema';
import { UserWalletAccountCreateManyUserInputEnvelopeSchema } from './UserWalletAccountCreateManyUserInputEnvelopeSchema';
import { UserWalletAccountWhereUniqueInputSchema } from './UserWalletAccountWhereUniqueInputSchema';

export const UserWalletAccountCreateNestedManyWithoutUserInputSchema: z.ZodType<Prisma.UserWalletAccountCreateNestedManyWithoutUserInput> = z.object({
  create: z.union([ z.lazy(() => UserWalletAccountCreateWithoutUserInputSchema),z.lazy(() => UserWalletAccountCreateWithoutUserInputSchema).array(),z.lazy(() => UserWalletAccountUncheckedCreateWithoutUserInputSchema),z.lazy(() => UserWalletAccountUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => UserWalletAccountCreateOrConnectWithoutUserInputSchema),z.lazy(() => UserWalletAccountCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => UserWalletAccountCreateManyUserInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => UserWalletAccountWhereUniqueInputSchema),z.lazy(() => UserWalletAccountWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export default UserWalletAccountCreateNestedManyWithoutUserInputSchema;
