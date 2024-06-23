import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { UserCreateWithoutCategoriesInputSchema } from './UserCreateWithoutCategoriesInputSchema';
import { UserUncheckedCreateWithoutCategoriesInputSchema } from './UserUncheckedCreateWithoutCategoriesInputSchema';
import { UserCreateOrConnectWithoutCategoriesInputSchema } from './UserCreateOrConnectWithoutCategoriesInputSchema';
import { UserWhereUniqueInputSchema } from './UserWhereUniqueInputSchema';

export const UserCreateNestedOneWithoutCategoriesInputSchema: z.ZodType<Prisma.UserCreateNestedOneWithoutCategoriesInput> = z.object({
  create: z.union([ z.lazy(() => UserCreateWithoutCategoriesInputSchema),z.lazy(() => UserUncheckedCreateWithoutCategoriesInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutCategoriesInputSchema).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional()
}).strict();

export default UserCreateNestedOneWithoutCategoriesInputSchema;
