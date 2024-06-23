import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { TransactionSelectSchema } from '../inputTypeSchemas/TransactionSelectSchema';
import { TransactionIncludeSchema } from '../inputTypeSchemas/TransactionIncludeSchema';

export const TransactionArgsSchema: z.ZodType<Prisma.TransactionDefaultArgs> = z.object({
  select: z.lazy(() => TransactionSelectSchema).optional(),
  include: z.lazy(() => TransactionIncludeSchema).optional(),
}).strict();

export default TransactionArgsSchema;
