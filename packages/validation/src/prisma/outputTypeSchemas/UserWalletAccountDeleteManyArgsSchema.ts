import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { UserWalletAccountWhereInputSchema } from '../inputTypeSchemas/UserWalletAccountWhereInputSchema'

export const UserWalletAccountDeleteManyArgsSchema: z.ZodType<Prisma.UserWalletAccountDeleteManyArgs> = z.object({
  where: UserWalletAccountWhereInputSchema.optional(),
}).strict() ;

export default UserWalletAccountDeleteManyArgsSchema;
