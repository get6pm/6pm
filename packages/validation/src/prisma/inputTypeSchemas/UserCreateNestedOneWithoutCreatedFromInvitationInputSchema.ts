import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { UserCreateWithoutCreatedFromInvitationInputSchema } from './UserCreateWithoutCreatedFromInvitationInputSchema';
import { UserUncheckedCreateWithoutCreatedFromInvitationInputSchema } from './UserUncheckedCreateWithoutCreatedFromInvitationInputSchema';
import { UserCreateOrConnectWithoutCreatedFromInvitationInputSchema } from './UserCreateOrConnectWithoutCreatedFromInvitationInputSchema';
import { UserWhereUniqueInputSchema } from './UserWhereUniqueInputSchema';

export const UserCreateNestedOneWithoutCreatedFromInvitationInputSchema: z.ZodType<Prisma.UserCreateNestedOneWithoutCreatedFromInvitationInput> = z.object({
  create: z.union([ z.lazy(() => UserCreateWithoutCreatedFromInvitationInputSchema),z.lazy(() => UserUncheckedCreateWithoutCreatedFromInvitationInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutCreatedFromInvitationInputSchema).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional()
}).strict();

export default UserCreateNestedOneWithoutCreatedFromInvitationInputSchema;
