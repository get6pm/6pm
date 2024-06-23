import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { UserWalletAccountCreateManyInputSchema } from '../inputTypeSchemas/UserWalletAccountCreateManyInputSchema'

export const UserWalletAccountCreateManyArgsSchema: z.ZodType<Prisma.UserWalletAccountCreateManyArgs> = z.object({
  data: z.union([ UserWalletAccountCreateManyInputSchema,UserWalletAccountCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export default UserWalletAccountCreateManyArgsSchema;
