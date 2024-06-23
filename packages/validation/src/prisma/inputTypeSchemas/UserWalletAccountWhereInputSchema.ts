import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { StringFilterSchema } from './StringFilterSchema';
import { DateTimeFilterSchema } from './DateTimeFilterSchema';
import { StringNullableFilterSchema } from './StringNullableFilterSchema';
import { UserRelationFilterSchema } from './UserRelationFilterSchema';
import { UserWhereInputSchema } from './UserWhereInputSchema';
import { TransactionListRelationFilterSchema } from './TransactionListRelationFilterSchema';

export const UserWalletAccountWhereInputSchema: z.ZodType<Prisma.UserWalletAccountWhereInput> = z.object({
  AND: z.union([ z.lazy(() => UserWalletAccountWhereInputSchema),z.lazy(() => UserWalletAccountWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => UserWalletAccountWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => UserWalletAccountWhereInputSchema),z.lazy(() => UserWalletAccountWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
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
}).strict();

export default UserWalletAccountWhereInputSchema;
