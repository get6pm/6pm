import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { UserWhereUniqueInputSchema } from './UserWhereUniqueInputSchema';
import { UserCreateWithoutCreatedFromInvitationInputSchema } from './UserCreateWithoutCreatedFromInvitationInputSchema';
import { UserUncheckedCreateWithoutCreatedFromInvitationInputSchema } from './UserUncheckedCreateWithoutCreatedFromInvitationInputSchema';

export const UserCreateOrConnectWithoutCreatedFromInvitationInputSchema: z.ZodType<Prisma.UserCreateOrConnectWithoutCreatedFromInvitationInput> = z.object({
  where: z.lazy(() => UserWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => UserCreateWithoutCreatedFromInvitationInputSchema),z.lazy(() => UserUncheckedCreateWithoutCreatedFromInvitationInputSchema) ]),
}).strict();

export default UserCreateOrConnectWithoutCreatedFromInvitationInputSchema;
