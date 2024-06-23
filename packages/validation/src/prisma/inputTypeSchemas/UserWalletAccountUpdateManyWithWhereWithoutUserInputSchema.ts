import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { UserWalletAccountScalarWhereInputSchema } from './UserWalletAccountScalarWhereInputSchema';
import { UserWalletAccountUpdateManyMutationInputSchema } from './UserWalletAccountUpdateManyMutationInputSchema';
import { UserWalletAccountUncheckedUpdateManyWithoutUserInputSchema } from './UserWalletAccountUncheckedUpdateManyWithoutUserInputSchema';

export const UserWalletAccountUpdateManyWithWhereWithoutUserInputSchema: z.ZodType<Prisma.UserWalletAccountUpdateManyWithWhereWithoutUserInput> = z.object({
  where: z.lazy(() => UserWalletAccountScalarWhereInputSchema),
  data: z.union([ z.lazy(() => UserWalletAccountUpdateManyMutationInputSchema),z.lazy(() => UserWalletAccountUncheckedUpdateManyWithoutUserInputSchema) ]),
}).strict();

export default UserWalletAccountUpdateManyWithWhereWithoutUserInputSchema;
