import { z } from 'zod';

export const TransactionScalarFieldEnumSchema = z.enum(['id','createdAt','updatedAt','amount','currency','date','note','categoryId','budgetId','walletAccountId','createdByUserId']);

export default TransactionScalarFieldEnumSchema;
