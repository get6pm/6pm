import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { UserCreateWithoutCategoriesInputSchema } from './UserCreateWithoutCategoriesInputSchema';
import { UserUncheckedCreateWithoutCategoriesInputSchema } from './UserUncheckedCreateWithoutCategoriesInputSchema';
import { UserCreateOrConnectWithoutCategoriesInputSchema } from './UserCreateOrConnectWithoutCategoriesInputSchema';
import { UserUpsertWithoutCategoriesInputSchema } from './UserUpsertWithoutCategoriesInputSchema';
import { UserWhereUniqueInputSchema } from './UserWhereUniqueInputSchema';
import { UserUpdateToOneWithWhereWithoutCategoriesInputSchema } from './UserUpdateToOneWithWhereWithoutCategoriesInputSchema';
import { UserUpdateWithoutCategoriesInputSchema } from './UserUpdateWithoutCategoriesInputSchema';
import { UserUncheckedUpdateWithoutCategoriesInputSchema } from './UserUncheckedUpdateWithoutCategoriesInputSchema';

export const UserUpdateOneRequiredWithoutCategoriesNestedInputSchema: z.ZodType<Prisma.UserUpdateOneRequiredWithoutCategoriesNestedInput> = z.object({
  create: z.union([ z.lazy(() => UserCreateWithoutCategoriesInputSchema),z.lazy(() => UserUncheckedCreateWithoutCategoriesInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutCategoriesInputSchema).optional(),
  upsert: z.lazy(() => UserUpsertWithoutCategoriesInputSchema).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => UserUpdateToOneWithWhereWithoutCategoriesInputSchema),z.lazy(() => UserUpdateWithoutCategoriesInputSchema),z.lazy(() => UserUncheckedUpdateWithoutCategoriesInputSchema) ]).optional(),
}).strict();

export default UserUpdateOneRequiredWithoutCategoriesNestedInputSchema;
