import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { UserCreateWithoutCreatedFromInvitationInputSchema } from './UserCreateWithoutCreatedFromInvitationInputSchema';
import { UserUncheckedCreateWithoutCreatedFromInvitationInputSchema } from './UserUncheckedCreateWithoutCreatedFromInvitationInputSchema';
import { UserCreateOrConnectWithoutCreatedFromInvitationInputSchema } from './UserCreateOrConnectWithoutCreatedFromInvitationInputSchema';
import { UserUpsertWithoutCreatedFromInvitationInputSchema } from './UserUpsertWithoutCreatedFromInvitationInputSchema';
import { UserWhereInputSchema } from './UserWhereInputSchema';
import { UserWhereUniqueInputSchema } from './UserWhereUniqueInputSchema';
import { UserUpdateToOneWithWhereWithoutCreatedFromInvitationInputSchema } from './UserUpdateToOneWithWhereWithoutCreatedFromInvitationInputSchema';
import { UserUpdateWithoutCreatedFromInvitationInputSchema } from './UserUpdateWithoutCreatedFromInvitationInputSchema';
import { UserUncheckedUpdateWithoutCreatedFromInvitationInputSchema } from './UserUncheckedUpdateWithoutCreatedFromInvitationInputSchema';

export const UserUpdateOneWithoutCreatedFromInvitationNestedInputSchema: z.ZodType<Prisma.UserUpdateOneWithoutCreatedFromInvitationNestedInput> = z.object({
  create: z.union([ z.lazy(() => UserCreateWithoutCreatedFromInvitationInputSchema),z.lazy(() => UserUncheckedCreateWithoutCreatedFromInvitationInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutCreatedFromInvitationInputSchema).optional(),
  upsert: z.lazy(() => UserUpsertWithoutCreatedFromInvitationInputSchema).optional(),
  disconnect: z.union([ z.boolean(),z.lazy(() => UserWhereInputSchema) ]).optional(),
  delete: z.union([ z.boolean(),z.lazy(() => UserWhereInputSchema) ]).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => UserUpdateToOneWithWhereWithoutCreatedFromInvitationInputSchema),z.lazy(() => UserUpdateWithoutCreatedFromInvitationInputSchema),z.lazy(() => UserUncheckedUpdateWithoutCreatedFromInvitationInputSchema) ]).optional(),
}).strict();

export default UserUpdateOneWithoutCreatedFromInvitationNestedInputSchema;
