import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { UserWhereInputSchema } from './UserWhereInputSchema';
import { UserUpdateWithoutCreatedFromInvitationInputSchema } from './UserUpdateWithoutCreatedFromInvitationInputSchema';
import { UserUncheckedUpdateWithoutCreatedFromInvitationInputSchema } from './UserUncheckedUpdateWithoutCreatedFromInvitationInputSchema';

export const UserUpdateToOneWithWhereWithoutCreatedFromInvitationInputSchema: z.ZodType<Prisma.UserUpdateToOneWithWhereWithoutCreatedFromInvitationInput> = z.object({
  where: z.lazy(() => UserWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => UserUpdateWithoutCreatedFromInvitationInputSchema),z.lazy(() => UserUncheckedUpdateWithoutCreatedFromInvitationInputSchema) ]),
}).strict();

export default UserUpdateToOneWithWhereWithoutCreatedFromInvitationInputSchema;
