import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { UserWhereUniqueInputSchema } from './UserWhereUniqueInputSchema';
import { UserCreateWithoutCategoriesInputSchema } from './UserCreateWithoutCategoriesInputSchema';
import { UserUncheckedCreateWithoutCategoriesInputSchema } from './UserUncheckedCreateWithoutCategoriesInputSchema';

export const UserCreateOrConnectWithoutCategoriesInputSchema: z.ZodType<Prisma.UserCreateOrConnectWithoutCategoriesInput> = z.object({
  where: z.lazy(() => UserWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => UserCreateWithoutCategoriesInputSchema),z.lazy(() => UserUncheckedCreateWithoutCategoriesInputSchema) ]),
}).strict();

export default UserCreateOrConnectWithoutCategoriesInputSchema;
