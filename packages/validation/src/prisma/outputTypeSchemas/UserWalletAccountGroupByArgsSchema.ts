import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { UserWalletAccountWhereInputSchema } from '../inputTypeSchemas/UserWalletAccountWhereInputSchema'
import { UserWalletAccountOrderByWithAggregationInputSchema } from '../inputTypeSchemas/UserWalletAccountOrderByWithAggregationInputSchema'
import { UserWalletAccountScalarFieldEnumSchema } from '../inputTypeSchemas/UserWalletAccountScalarFieldEnumSchema'
import { UserWalletAccountScalarWhereWithAggregatesInputSchema } from '../inputTypeSchemas/UserWalletAccountScalarWhereWithAggregatesInputSchema'

export const UserWalletAccountGroupByArgsSchema: z.ZodType<Prisma.UserWalletAccountGroupByArgs> = z.object({
  where: UserWalletAccountWhereInputSchema.optional(),
  orderBy: z.union([ UserWalletAccountOrderByWithAggregationInputSchema.array(),UserWalletAccountOrderByWithAggregationInputSchema ]).optional(),
  by: UserWalletAccountScalarFieldEnumSchema.array(),
  having: UserWalletAccountScalarWhereWithAggregatesInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export default UserWalletAccountGroupByArgsSchema;
