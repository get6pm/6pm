import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { UserWalletAccountWhereInputSchema } from '../inputTypeSchemas/UserWalletAccountWhereInputSchema'
import { UserWalletAccountOrderByWithRelationInputSchema } from '../inputTypeSchemas/UserWalletAccountOrderByWithRelationInputSchema'
import { UserWalletAccountWhereUniqueInputSchema } from '../inputTypeSchemas/UserWalletAccountWhereUniqueInputSchema'

export const UserWalletAccountAggregateArgsSchema: z.ZodType<Prisma.UserWalletAccountAggregateArgs> = z.object({
  where: UserWalletAccountWhereInputSchema.optional(),
  orderBy: z.union([ UserWalletAccountOrderByWithRelationInputSchema.array(),UserWalletAccountOrderByWithRelationInputSchema ]).optional(),
  cursor: UserWalletAccountWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export default UserWalletAccountAggregateArgsSchema;
