import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { UserUpdateWithoutCategoriesInputSchema } from './UserUpdateWithoutCategoriesInputSchema';
import { UserUncheckedUpdateWithoutCategoriesInputSchema } from './UserUncheckedUpdateWithoutCategoriesInputSchema';
import { UserCreateWithoutCategoriesInputSchema } from './UserCreateWithoutCategoriesInputSchema';
import { UserUncheckedCreateWithoutCategoriesInputSchema } from './UserUncheckedCreateWithoutCategoriesInputSchema';
import { UserWhereInputSchema } from './UserWhereInputSchema';

export const UserUpsertWithoutCategoriesInputSchema: z.ZodType<Prisma.UserUpsertWithoutCategoriesInput> = z.object({
  update: z.union([ z.lazy(() => UserUpdateWithoutCategoriesInputSchema),z.lazy(() => UserUncheckedUpdateWithoutCategoriesInputSchema) ]),
  create: z.union([ z.lazy(() => UserCreateWithoutCategoriesInputSchema),z.lazy(() => UserUncheckedCreateWithoutCategoriesInputSchema) ]),
  where: z.lazy(() => UserWhereInputSchema).optional()
}).strict();

export default UserUpsertWithoutCategoriesInputSchema;
