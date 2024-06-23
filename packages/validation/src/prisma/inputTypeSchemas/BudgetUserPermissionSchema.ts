import { z } from 'zod';

export const BudgetUserPermissionSchema = z.enum(['OWNER','MEMBER']);

export type BudgetUserPermissionType = `${z.infer<typeof BudgetUserPermissionSchema>}`

export default BudgetUserPermissionSchema;
