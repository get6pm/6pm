import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { UserWalletAccountWhereUniqueInputSchema } from './UserWalletAccountWhereUniqueInputSchema';
import { UserWalletAccountUpdateWithoutUserInputSchema } from './UserWalletAccountUpdateWithoutUserInputSchema';
import { UserWalletAccountUncheckedUpdateWithoutUserInputSchema } from './UserWalletAccountUncheckedUpdateWithoutUserInputSchema';
import { UserWalletAccountCreateWithoutUserInputSchema } from './UserWalletAccountCreateWithoutUserInputSchema';
import { UserWalletAccountUncheckedCreateWithoutUserInputSchema } from './UserWalletAccountUncheckedCreateWithoutUserInputSchema';

export const UserWalletAccountUpsertWithWhereUniqueWithoutUserInputSchema: z.ZodType<Prisma.UserWalletAccountUpsertWithWhereUniqueWithoutUserInput> = z.object({
  where: z.lazy(() => UserWalletAccountWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => UserWalletAccountUpdateWithoutUserInputSchema),z.lazy(() => UserWalletAccountUncheckedUpdateWithoutUserInputSchema) ]),
  create: z.union([ z.lazy(() => UserWalletAccountCreateWithoutUserInputSchema),z.lazy(() => UserWalletAccountUncheckedCreateWithoutUserInputSchema) ]),
}).strict();

export default UserWalletAccountUpsertWithWhereUniqueWithoutUserInputSchema;
