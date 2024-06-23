import type { Prisma } from '@prisma/client';

import { z } from 'zod';

export const UserWalletAccountCreateManyUserInputSchema: z.ZodType<Prisma.UserWalletAccountCreateManyUserInput> = z.object({
  id: z.string().cuid().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  name: z.string(),
  icon: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  lastDigits: z.string().optional().nullable(),
  preferredCurrency: z.string()
}).strict();

export default UserWalletAccountCreateManyUserInputSchema;
