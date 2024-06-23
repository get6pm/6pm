import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { UserWalletAccountWhereUniqueInputSchema } from './UserWalletAccountWhereUniqueInputSchema';
import { UserWalletAccountUpdateWithoutUserInputSchema } from './UserWalletAccountUpdateWithoutUserInputSchema';
import { UserWalletAccountUncheckedUpdateWithoutUserInputSchema } from './UserWalletAccountUncheckedUpdateWithoutUserInputSchema';

export const UserWalletAccountUpdateWithWhereUniqueWithoutUserInputSchema: z.ZodType<Prisma.UserWalletAccountUpdateWithWhereUniqueWithoutUserInput> = z.object({
  where: z.lazy(() => UserWalletAccountWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => UserWalletAccountUpdateWithoutUserInputSchema),z.lazy(() => UserWalletAccountUncheckedUpdateWithoutUserInputSchema) ]),
}).strict();

export default UserWalletAccountUpdateWithWhereUniqueWithoutUserInputSchema;
