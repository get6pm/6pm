import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { UserWalletAccountWhereUniqueInputSchema } from './UserWalletAccountWhereUniqueInputSchema';
import { UserWalletAccountCreateWithoutUserInputSchema } from './UserWalletAccountCreateWithoutUserInputSchema';
import { UserWalletAccountUncheckedCreateWithoutUserInputSchema } from './UserWalletAccountUncheckedCreateWithoutUserInputSchema';

export const UserWalletAccountCreateOrConnectWithoutUserInputSchema: z.ZodType<Prisma.UserWalletAccountCreateOrConnectWithoutUserInput> = z.object({
  where: z.lazy(() => UserWalletAccountWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => UserWalletAccountCreateWithoutUserInputSchema),z.lazy(() => UserWalletAccountUncheckedCreateWithoutUserInputSchema) ]),
}).strict();

export default UserWalletAccountCreateOrConnectWithoutUserInputSchema;
