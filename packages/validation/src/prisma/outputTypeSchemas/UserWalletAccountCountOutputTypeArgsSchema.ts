import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { UserWalletAccountCountOutputTypeSelectSchema } from './UserWalletAccountCountOutputTypeSelectSchema';

export const UserWalletAccountCountOutputTypeArgsSchema: z.ZodType<Prisma.UserWalletAccountCountOutputTypeDefaultArgs> = z.object({
  select: z.lazy(() => UserWalletAccountCountOutputTypeSelectSchema).nullish(),
}).strict();

export default UserWalletAccountCountOutputTypeSelectSchema;
