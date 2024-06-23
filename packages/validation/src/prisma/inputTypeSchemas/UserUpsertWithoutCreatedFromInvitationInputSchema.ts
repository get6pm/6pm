import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { UserUpdateWithoutCreatedFromInvitationInputSchema } from './UserUpdateWithoutCreatedFromInvitationInputSchema';
import { UserUncheckedUpdateWithoutCreatedFromInvitationInputSchema } from './UserUncheckedUpdateWithoutCreatedFromInvitationInputSchema';
import { UserCreateWithoutCreatedFromInvitationInputSchema } from './UserCreateWithoutCreatedFromInvitationInputSchema';
import { UserUncheckedCreateWithoutCreatedFromInvitationInputSchema } from './UserUncheckedCreateWithoutCreatedFromInvitationInputSchema';
import { UserWhereInputSchema } from './UserWhereInputSchema';

export const UserUpsertWithoutCreatedFromInvitationInputSchema: z.ZodType<Prisma.UserUpsertWithoutCreatedFromInvitationInput> = z.object({
  update: z.union([ z.lazy(() => UserUpdateWithoutCreatedFromInvitationInputSchema),z.lazy(() => UserUncheckedUpdateWithoutCreatedFromInvitationInputSchema) ]),
  create: z.union([ z.lazy(() => UserCreateWithoutCreatedFromInvitationInputSchema),z.lazy(() => UserUncheckedCreateWithoutCreatedFromInvitationInputSchema) ]),
  where: z.lazy(() => UserWhereInputSchema).optional()
}).strict();

export default UserUpsertWithoutCreatedFromInvitationInputSchema;
