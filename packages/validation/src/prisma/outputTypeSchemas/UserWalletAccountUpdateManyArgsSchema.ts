import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { UserWalletAccountUpdateManyMutationInputSchema } from '../inputTypeSchemas/UserWalletAccountUpdateManyMutationInputSchema'
import { UserWalletAccountUncheckedUpdateManyInputSchema } from '../inputTypeSchemas/UserWalletAccountUncheckedUpdateManyInputSchema'
import { UserWalletAccountWhereInputSchema } from '../inputTypeSchemas/UserWalletAccountWhereInputSchema'

export const UserWalletAccountUpdateManyArgsSchema: z.ZodType<Prisma.UserWalletAccountUpdateManyArgs> = z.object({
  data: z.union([ UserWalletAccountUpdateManyMutationInputSchema,UserWalletAccountUncheckedUpdateManyInputSchema ]),
  where: UserWalletAccountWhereInputSchema.optional(),
}).strict() ;

export default UserWalletAccountUpdateManyArgsSchema;
