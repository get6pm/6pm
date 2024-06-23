import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { UserCreateNestedOneWithoutWalletAccountsInputSchema } from './UserCreateNestedOneWithoutWalletAccountsInputSchema';
import { TransactionCreateNestedManyWithoutWalletAccountInputSchema } from './TransactionCreateNestedManyWithoutWalletAccountInputSchema';

export const UserWalletAccountCreateInputSchema: z.ZodType<Prisma.UserWalletAccountCreateInput> = z.object({
  id: z.string().cuid().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  name: z.string(),
  icon: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  lastDigits: z.string().optional().nullable(),
  preferredCurrency: z.string(),
  user: z.lazy(() => UserCreateNestedOneWithoutWalletAccountsInputSchema),
  transactions: z.lazy(() => TransactionCreateNestedManyWithoutWalletAccountInputSchema).optional()
}).strict();

export default UserWalletAccountCreateInputSchema;
