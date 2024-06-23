import { z } from 'zod';
import type { Prisma } from '@prisma/client';

export const UserCountOutputTypeSelectSchema: z.ZodType<Prisma.UserCountOutputTypeSelect> = z.object({
  walletAccounts: z.boolean().optional(),
  budgetUsers: z.boolean().optional(),
  transactions: z.boolean().optional(),
  createdBudgetUserInvitations: z.boolean().optional(),
  categories: z.boolean().optional(),
}).strict();

export default UserCountOutputTypeSelectSchema;
