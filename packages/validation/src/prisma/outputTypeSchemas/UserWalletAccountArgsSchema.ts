import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { UserWalletAccountSelectSchema } from '../inputTypeSchemas/UserWalletAccountSelectSchema';
import { UserWalletAccountIncludeSchema } from '../inputTypeSchemas/UserWalletAccountIncludeSchema';

export const UserWalletAccountArgsSchema: z.ZodType<Prisma.UserWalletAccountDefaultArgs> = z.object({
  select: z.lazy(() => UserWalletAccountSelectSchema).optional(),
  include: z.lazy(() => UserWalletAccountIncludeSchema).optional(),
}).strict();

export default UserWalletAccountArgsSchema;
