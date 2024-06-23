import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { UserCountOutputTypeSelectSchema } from './UserCountOutputTypeSelectSchema';

export const UserCountOutputTypeArgsSchema: z.ZodType<Prisma.UserCountOutputTypeDefaultArgs> = z.object({
  select: z.lazy(() => UserCountOutputTypeSelectSchema).nullish(),
}).strict();

export default UserCountOutputTypeSelectSchema;
