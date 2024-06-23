import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { StringFilterSchema } from './StringFilterSchema';
import { DateTimeFilterSchema } from './DateTimeFilterSchema';
import { StringNullableFilterSchema } from './StringNullableFilterSchema';

export const UserWalletAccountScalarWhereInputSchema: z.ZodType<Prisma.UserWalletAccountScalarWhereInput> = z.object({
  AND: z.union([ z.lazy(() => UserWalletAccountScalarWhereInputSchema),z.lazy(() => UserWalletAccountScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => UserWalletAccountScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => UserWalletAccountScalarWhereInputSchema),z.lazy(() => UserWalletAccountScalarWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  name: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  icon: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  description: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  lastDigits: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  preferredCurrency: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  userId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
}).strict();

export default UserWalletAccountScalarWhereInputSchema;
