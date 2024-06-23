import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { UserCreateNestedOneWithoutWalletAccountsInputSchema } from './UserCreateNestedOneWithoutWalletAccountsInputSchema';

export const UserWalletAccountCreateWithoutTransactionsInputSchema: z.ZodType<Prisma.UserWalletAccountCreateWithoutTransactionsInput> = z.object({
  id: z.string().cuid().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  name: z.string(),
  icon: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  lastDigits: z.string().optional().nullable(),
  preferredCurrency: z.string(),
  user: z.lazy(() => UserCreateNestedOneWithoutWalletAccountsInputSchema)
}).strict();

export default UserWalletAccountCreateWithoutTransactionsInputSchema;
