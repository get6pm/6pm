import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { UserWalletAccountWhereInputSchema } from './UserWalletAccountWhereInputSchema';
import { DateTimeFilterSchema } from './DateTimeFilterSchema';
import { StringFilterSchema } from './StringFilterSchema';
import { StringNullableFilterSchema } from './StringNullableFilterSchema';
import { UserRelationFilterSchema } from './UserRelationFilterSchema';
import { UserWhereInputSchema } from './UserWhereInputSchema';
import { TransactionListRelationFilterSchema } from './TransactionListRelationFilterSchema';

export const UserWalletAccountWhereUniqueInputSchema: z.ZodType<Prisma.UserWalletAccountWhereUniqueInput> = z.object({
  id: z.string().cuid()
})
.and(z.object({
  id: z.string().cuid().optional(),
  AND: z.union([ z.lazy(() => UserWalletAccountWhereInputSchema),z.lazy(() => UserWalletAccountWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => UserWalletAccountWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => UserWalletAccountWhereInputSchema),z.lazy(() => UserWalletAccountWhereInputSchema).array() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  name: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  icon: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  description: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  lastDigits: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  preferredCurrency: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  userId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  user: z.union([ z.lazy(() => UserRelationFilterSchema),z.lazy(() => UserWhereInputSchema) ]).optional(),
  transactions: z.lazy(() => TransactionListRelationFilterSchema).optional()
}).strict());

export default UserWalletAccountWhereUniqueInputSchema;
