import { z } from 'zod';
import type { Prisma } from '@prisma/client';

export const UserWalletAccountCountOutputTypeSelectSchema: z.ZodType<Prisma.UserWalletAccountCountOutputTypeSelect> = z.object({
  transactions: z.boolean().optional(),
}).strict();

export default UserWalletAccountCountOutputTypeSelectSchema;
