import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { BudgetUserInvitationResponseIncludeSchema } from '../inputTypeSchemas/BudgetUserInvitationResponseIncludeSchema'
import { BudgetUserInvitationResponseWhereUniqueInputSchema } from '../inputTypeSchemas/BudgetUserInvitationResponseWhereUniqueInputSchema'
import { RelationLoadStrategySchema } from '../inputTypeSchemas/RelationLoadStrategySchema'
import { BudgetUserInvitationArgsSchema } from "../outputTypeSchemas/BudgetUserInvitationArgsSchema"
import { UserArgsSchema } from "../outputTypeSchemas/UserArgsSchema"
// Select schema needs to be in file to prevent circular imports
//------------------------------------------------------

export const BudgetUserInvitationResponseSelectSchema: z.ZodType<Prisma.BudgetUserInvitationResponseSelect> = z.object({
  id: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  acceptedAt: z.boolean().optional(),
  declinedAt: z.boolean().optional(),
  invitationId: z.boolean().optional(),
  createdUserId: z.boolean().optional(),
  invitation: z.union([z.boolean(),z.lazy(() => BudgetUserInvitationArgsSchema)]).optional(),
  createdUser: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
}).strict()

export const BudgetUserInvitationResponseFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.BudgetUserInvitationResponseFindUniqueOrThrowArgs> = z.object({
  select: BudgetUserInvitationResponseSelectSchema.optional(),
  include: BudgetUserInvitationResponseIncludeSchema.optional(),
  where: BudgetUserInvitationResponseWhereUniqueInputSchema,
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export default BudgetUserInvitationResponseFindUniqueOrThrowArgsSchema;
