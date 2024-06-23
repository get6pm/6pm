import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { UserWhereInputSchema } from './UserWhereInputSchema';
import { UserUpdateWithoutCategoriesInputSchema } from './UserUpdateWithoutCategoriesInputSchema';
import { UserUncheckedUpdateWithoutCategoriesInputSchema } from './UserUncheckedUpdateWithoutCategoriesInputSchema';

export const UserUpdateToOneWithWhereWithoutCategoriesInputSchema: z.ZodType<Prisma.UserUpdateToOneWithWhereWithoutCategoriesInput> = z.object({
  where: z.lazy(() => UserWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => UserUpdateWithoutCategoriesInputSchema),z.lazy(() => UserUncheckedUpdateWithoutCategoriesInputSchema) ]),
}).strict();

export default UserUpdateToOneWithWhereWithoutCategoriesInputSchema;
