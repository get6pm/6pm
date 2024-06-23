import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { UserWalletAccountCreateManyInputSchema } from '../inputTypeSchemas/UserWalletAccountCreateManyInputSchema'

export const UserWalletAccountCreateManyAndReturnArgsSchema: z.ZodType<Prisma.UserWalletAccountCreateManyAndReturnArgs> = z.object({
  data: z.union([ UserWalletAccountCreateManyInputSchema,UserWalletAccountCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export default UserWalletAccountCreateManyAndReturnArgsSchema;
