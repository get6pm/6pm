import { z } from 'zod';

export const UserWalletAccountScalarFieldEnumSchema = z.enum(['id','createdAt','updatedAt','name','icon','description','lastDigits','preferredCurrency','userId']);

export default UserWalletAccountScalarFieldEnumSchema;
