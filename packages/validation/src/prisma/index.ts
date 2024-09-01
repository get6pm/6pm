import { z } from 'zod';
import { Prisma } from '@prisma/client';
import Decimal from 'decimal.js';

/////////////////////////////////////////
// HELPER FUNCTIONS
/////////////////////////////////////////

// DECIMAL
//------------------------------------------------------

export const DecimalJsLikeSchema: z.ZodType<Prisma.DecimalJsLike> = z.object({
  d: z.array(z.number()),
  e: z.number(),
  s: z.number(),
  toFixed: z.function(z.tuple([]), z.string()),
})

export const DECIMAL_STRING_REGEX = /^(?:-?Infinity|NaN|-?(?:0[bB][01]+(?:\.[01]+)?(?:[pP][-+]?\d+)?|0[oO][0-7]+(?:\.[0-7]+)?(?:[pP][-+]?\d+)?|0[xX][\da-fA-F]+(?:\.[\da-fA-F]+)?(?:[pP][-+]?\d+)?|(?:\d+|\d*\.\d+)(?:[eE][-+]?\d+)?))$/;

export const isValidDecimalInput =
  (v?: null | string | number | Prisma.DecimalJsLike): v is string | number | Prisma.DecimalJsLike => {
    if (v === undefined || v === null) return false;
    return (
      (typeof v === 'object' && 'd' in v && 'e' in v && 's' in v && 'toFixed' in v) ||
      (typeof v === 'string' && DECIMAL_STRING_REGEX.test(v)) ||
      typeof v === 'number'
    )
  };

/////////////////////////////////////////
// ENUMS
/////////////////////////////////////////

export const TransactionIsolationLevelSchema = z.enum(['ReadUncommitted','ReadCommitted','RepeatableRead','Serializable']);

export const UserScalarFieldEnumSchema = z.enum(['id','createdAt','updatedAt','email','name']);

export const RelationLoadStrategySchema = z.enum(['query','join']);

export const UserWalletAccountScalarFieldEnumSchema = z.enum(['id','createdAt','updatedAt','name','icon','description','lastDigits','preferredCurrency','userId']);

export const BudgetScalarFieldEnumSchema = z.enum(['id','createdAt','updatedAt','name','description','preferredCurrency','type']);

export const BudgetPeriodConfigScalarFieldEnumSchema = z.enum(['id','createdAt','updatedAt','type','amount','startDate','endDate','budgetId']);

export const BudgetUserScalarFieldEnumSchema = z.enum(['id','createdAt','updatedAt','permission','userId','budgetId']);

export const BudgetUserInvitationScalarFieldEnumSchema = z.enum(['id','createdAt','updatedAt','email','token','expiresAt','permission','createdByUserId','budgetId']);

export const BudgetUserInvitationResponseScalarFieldEnumSchema = z.enum(['id','createdAt','updatedAt','acceptedAt','declinedAt','invitationId','createdUserId']);

export const TransactionScalarFieldEnumSchema = z.enum(['id','createdAt','updatedAt','amount','amountInVnd','currency','date','note','categoryId','budgetId','walletAccountId','createdByUserId']);

export const CategoryScalarFieldEnumSchema = z.enum(['id','createdAt','updatedAt','type','name','description','icon','color','userId','parentId']);

export const CachedGptResponseScalarFieldEnumSchema = z.enum(['id','createdAt','updatedAt','query','response']);

export const CurrencyExchangeRateScalarFieldEnumSchema = z.enum(['id','createdAt','updatedAt','fromCurrency','toCurrency','rate','date']);

export const SortOrderSchema = z.enum(['asc','desc']);

export const QueryModeSchema = z.enum(['default','insensitive']);

export const NullsOrderSchema = z.enum(['first','last']);

export const BudgetTypeSchema = z.enum(['SPENDING','SAVING','INVESTING','DEBT']);

export type BudgetTypeType = `${z.infer<typeof BudgetTypeSchema>}`

export const BudgetPeriodTypeSchema = z.enum(['WEEKLY','MONTHLY','QUARTERLY','YEARLY','CUSTOM']);

export type BudgetPeriodTypeType = `${z.infer<typeof BudgetPeriodTypeSchema>}`

export const BudgetUserPermissionSchema = z.enum(['OWNER','MEMBER']);

export type BudgetUserPermissionType = `${z.infer<typeof BudgetUserPermissionSchema>}`

export const CategoryTypeSchema = z.enum(['INCOME','EXPENSE']);

export type CategoryTypeType = `${z.infer<typeof CategoryTypeSchema>}`

/////////////////////////////////////////
// MODELS
/////////////////////////////////////////

/////////////////////////////////////////
// USER SCHEMA
/////////////////////////////////////////

export const UserSchema = z.object({
  id: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  email: z.string(),
  name: z.string().nullable(),
})

export type User = z.infer<typeof UserSchema>

// USER RELATION SCHEMA
//------------------------------------------------------

export type UserRelations = {
  walletAccounts: UserWalletAccountWithRelations[];
  budgetUsers: BudgetUserWithRelations[];
  transactions: TransactionWithRelations[];
  createdBudgetUserInvitations: BudgetUserInvitationWithRelations[];
  createdFromInvitation?: BudgetUserInvitationResponseWithRelations | null;
  categories: CategoryWithRelations[];
};

export type UserWithRelations = z.infer<typeof UserSchema> & UserRelations

export const UserWithRelationsSchema: z.ZodType<UserWithRelations> = UserSchema.merge(z.object({
  walletAccounts: z.lazy(() => UserWalletAccountWithRelationsSchema).array(),
  budgetUsers: z.lazy(() => BudgetUserWithRelationsSchema).array(),
  transactions: z.lazy(() => TransactionWithRelationsSchema).array(),
  createdBudgetUserInvitations: z.lazy(() => BudgetUserInvitationWithRelationsSchema).array(),
  createdFromInvitation: z.lazy(() => BudgetUserInvitationResponseWithRelationsSchema).nullable(),
  categories: z.lazy(() => CategoryWithRelationsSchema).array(),
}))

/////////////////////////////////////////
// USER WALLET ACCOUNT SCHEMA
/////////////////////////////////////////

export const UserWalletAccountSchema = z.object({
  id: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  name: z.string(),
  icon: z.string().nullable(),
  description: z.string().nullable(),
  lastDigits: z.string().nullable(),
  preferredCurrency: z.string(),
  userId: z.string(),
})

export type UserWalletAccount = z.infer<typeof UserWalletAccountSchema>

// USER WALLET ACCOUNT RELATION SCHEMA
//------------------------------------------------------

export type UserWalletAccountRelations = {
  user: UserWithRelations;
  transactions: TransactionWithRelations[];
};

export type UserWalletAccountWithRelations = z.infer<typeof UserWalletAccountSchema> & UserWalletAccountRelations

export const UserWalletAccountWithRelationsSchema: z.ZodType<UserWalletAccountWithRelations> = UserWalletAccountSchema.merge(z.object({
  user: z.lazy(() => UserWithRelationsSchema),
  transactions: z.lazy(() => TransactionWithRelationsSchema).array(),
}))

/////////////////////////////////////////
// BUDGET SCHEMA
/////////////////////////////////////////

export const BudgetSchema = z.object({
  type: BudgetTypeSchema,
  id: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  name: z.string(),
  description: z.string().nullable(),
  preferredCurrency: z.string(),
})

export type Budget = z.infer<typeof BudgetSchema>

// BUDGET RELATION SCHEMA
//------------------------------------------------------

export type BudgetRelations = {
  periodConfigs: BudgetPeriodConfigWithRelations[];
  budgetUsers: BudgetUserWithRelations[];
  transactions: TransactionWithRelations[];
  invitations: BudgetUserInvitationWithRelations[];
};

export type BudgetWithRelations = z.infer<typeof BudgetSchema> & BudgetRelations

export const BudgetWithRelationsSchema: z.ZodType<BudgetWithRelations> = BudgetSchema.merge(z.object({
  periodConfigs: z.lazy(() => BudgetPeriodConfigWithRelationsSchema).array(),
  budgetUsers: z.lazy(() => BudgetUserWithRelationsSchema).array(),
  transactions: z.lazy(() => TransactionWithRelationsSchema).array(),
  invitations: z.lazy(() => BudgetUserInvitationWithRelationsSchema).array(),
}))

/////////////////////////////////////////
// BUDGET PERIOD CONFIG SCHEMA
/////////////////////////////////////////

export const BudgetPeriodConfigSchema = z.object({
  type: BudgetPeriodTypeSchema,
  id: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  amount: z.instanceof(Prisma.Decimal, { message: "Field 'amount' must be a Decimal. Location: ['Models', 'BudgetPeriodConfig']"}),
  startDate: z.coerce.date().nullable(),
  endDate: z.coerce.date().nullable(),
  budgetId: z.string(),
})

export type BudgetPeriodConfig = z.infer<typeof BudgetPeriodConfigSchema>

// BUDGET PERIOD CONFIG RELATION SCHEMA
//------------------------------------------------------

export type BudgetPeriodConfigRelations = {
  budget: BudgetWithRelations;
};

export type BudgetPeriodConfigWithRelations = z.infer<typeof BudgetPeriodConfigSchema> & BudgetPeriodConfigRelations

export const BudgetPeriodConfigWithRelationsSchema: z.ZodType<BudgetPeriodConfigWithRelations> = BudgetPeriodConfigSchema.merge(z.object({
  budget: z.lazy(() => BudgetWithRelationsSchema),
}))

/////////////////////////////////////////
// BUDGET USER SCHEMA
/////////////////////////////////////////

export const BudgetUserSchema = z.object({
  permission: BudgetUserPermissionSchema,
  id: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  userId: z.string(),
  budgetId: z.string(),
})

export type BudgetUser = z.infer<typeof BudgetUserSchema>

// BUDGET USER RELATION SCHEMA
//------------------------------------------------------

export type BudgetUserRelations = {
  user: UserWithRelations;
  budget: BudgetWithRelations;
};

export type BudgetUserWithRelations = z.infer<typeof BudgetUserSchema> & BudgetUserRelations

export const BudgetUserWithRelationsSchema: z.ZodType<BudgetUserWithRelations> = BudgetUserSchema.merge(z.object({
  user: z.lazy(() => UserWithRelationsSchema),
  budget: z.lazy(() => BudgetWithRelationsSchema),
}))

/////////////////////////////////////////
// BUDGET USER INVITATION SCHEMA
/////////////////////////////////////////

export const BudgetUserInvitationSchema = z.object({
  permission: BudgetUserPermissionSchema.nullable(),
  id: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  email: z.string().nullable(),
  token: z.string(),
  expiresAt: z.coerce.date(),
  createdByUserId: z.string(),
  budgetId: z.string(),
})

export type BudgetUserInvitation = z.infer<typeof BudgetUserInvitationSchema>

// BUDGET USER INVITATION RELATION SCHEMA
//------------------------------------------------------

export type BudgetUserInvitationRelations = {
  createdByUser: UserWithRelations;
  budget: BudgetWithRelations;
  responses: BudgetUserInvitationResponseWithRelations[];
};

export type BudgetUserInvitationWithRelations = z.infer<typeof BudgetUserInvitationSchema> & BudgetUserInvitationRelations

export const BudgetUserInvitationWithRelationsSchema: z.ZodType<BudgetUserInvitationWithRelations> = BudgetUserInvitationSchema.merge(z.object({
  createdByUser: z.lazy(() => UserWithRelationsSchema),
  budget: z.lazy(() => BudgetWithRelationsSchema),
  responses: z.lazy(() => BudgetUserInvitationResponseWithRelationsSchema).array(),
}))

/////////////////////////////////////////
// BUDGET USER INVITATION RESPONSE SCHEMA
/////////////////////////////////////////

export const BudgetUserInvitationResponseSchema = z.object({
  id: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  acceptedAt: z.coerce.date().nullable(),
  declinedAt: z.coerce.date().nullable(),
  invitationId: z.string(),
  createdUserId: z.string().nullable(),
})

export type BudgetUserInvitationResponse = z.infer<typeof BudgetUserInvitationResponseSchema>

// BUDGET USER INVITATION RESPONSE RELATION SCHEMA
//------------------------------------------------------

export type BudgetUserInvitationResponseRelations = {
  invitation: BudgetUserInvitationWithRelations;
  createdUser?: UserWithRelations | null;
};

export type BudgetUserInvitationResponseWithRelations = z.infer<typeof BudgetUserInvitationResponseSchema> & BudgetUserInvitationResponseRelations

export const BudgetUserInvitationResponseWithRelationsSchema: z.ZodType<BudgetUserInvitationResponseWithRelations> = BudgetUserInvitationResponseSchema.merge(z.object({
  invitation: z.lazy(() => BudgetUserInvitationWithRelationsSchema),
  createdUser: z.lazy(() => UserWithRelationsSchema).nullable(),
}))

/////////////////////////////////////////
// TRANSACTION SCHEMA
/////////////////////////////////////////

export const TransactionSchema = z.object({
  id: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  amount: z.instanceof(Prisma.Decimal, { message: "Field 'amount' must be a Decimal. Location: ['Models', 'Transaction']"}),
  amountInVnd: z.instanceof(Prisma.Decimal, { message: "Field 'amountInVnd' must be a Decimal. Location: ['Models', 'Transaction']"}),
  currency: z.string(),
  date: z.coerce.date(),
  note: z.string().nullable(),
  categoryId: z.string().nullable(),
  budgetId: z.string().nullable(),
  walletAccountId: z.string(),
  createdByUserId: z.string(),
})

export type Transaction = z.infer<typeof TransactionSchema>

// TRANSACTION RELATION SCHEMA
//------------------------------------------------------

export type TransactionRelations = {
  category?: CategoryWithRelations | null;
  budget?: BudgetWithRelations | null;
  walletAccount: UserWalletAccountWithRelations;
  createdByUser: UserWithRelations;
};

export type TransactionWithRelations = z.infer<typeof TransactionSchema> & TransactionRelations

export const TransactionWithRelationsSchema: z.ZodType<TransactionWithRelations> = TransactionSchema.merge(z.object({
  category: z.lazy(() => CategoryWithRelationsSchema).nullable(),
  budget: z.lazy(() => BudgetWithRelationsSchema).nullable(),
  walletAccount: z.lazy(() => UserWalletAccountWithRelationsSchema),
  createdByUser: z.lazy(() => UserWithRelationsSchema),
}))

/////////////////////////////////////////
// CATEGORY SCHEMA
/////////////////////////////////////////

export const CategorySchema = z.object({
  type: CategoryTypeSchema,
  id: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  name: z.string(),
  description: z.string().nullable(),
  icon: z.string().nullable(),
  color: z.string().nullable(),
  userId: z.string(),
  parentId: z.string().nullable(),
})

export type Category = z.infer<typeof CategorySchema>

// CATEGORY RELATION SCHEMA
//------------------------------------------------------

export type CategoryRelations = {
  user: UserWithRelations;
  parent?: CategoryWithRelations | null;
  children: CategoryWithRelations[];
  transactions: TransactionWithRelations[];
};

export type CategoryWithRelations = z.infer<typeof CategorySchema> & CategoryRelations

export const CategoryWithRelationsSchema: z.ZodType<CategoryWithRelations> = CategorySchema.merge(z.object({
  user: z.lazy(() => UserWithRelationsSchema),
  parent: z.lazy(() => CategoryWithRelationsSchema).nullable(),
  children: z.lazy(() => CategoryWithRelationsSchema).array(),
  transactions: z.lazy(() => TransactionWithRelationsSchema).array(),
}))

/////////////////////////////////////////
// CACHED GPT RESPONSE SCHEMA
/////////////////////////////////////////

export const CachedGptResponseSchema = z.object({
  id: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  query: z.string(),
  response: z.string(),
})

export type CachedGptResponse = z.infer<typeof CachedGptResponseSchema>

/////////////////////////////////////////
// CURRENCY EXCHANGE RATE SCHEMA
/////////////////////////////////////////

export const CurrencyExchangeRateSchema = z.object({
  id: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  fromCurrency: z.string(),
  toCurrency: z.string(),
  rate: z.instanceof(Prisma.Decimal, { message: "Field 'rate' must be a Decimal. Location: ['Models', 'CurrencyExchangeRate']"}),
  date: z.string(),
})

export type CurrencyExchangeRate = z.infer<typeof CurrencyExchangeRateSchema>

/////////////////////////////////////////
// SELECT & INCLUDE
/////////////////////////////////////////

// USER
//------------------------------------------------------

export const UserIncludeSchema: z.ZodType<Prisma.UserInclude> = z.object({
  walletAccounts: z.union([z.boolean(),z.lazy(() => UserWalletAccountFindManyArgsSchema)]).optional(),
  budgetUsers: z.union([z.boolean(),z.lazy(() => BudgetUserFindManyArgsSchema)]).optional(),
  transactions: z.union([z.boolean(),z.lazy(() => TransactionFindManyArgsSchema)]).optional(),
  createdBudgetUserInvitations: z.union([z.boolean(),z.lazy(() => BudgetUserInvitationFindManyArgsSchema)]).optional(),
  createdFromInvitation: z.union([z.boolean(),z.lazy(() => BudgetUserInvitationResponseArgsSchema)]).optional(),
  categories: z.union([z.boolean(),z.lazy(() => CategoryFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => UserCountOutputTypeArgsSchema)]).optional(),
}).strict()

export const UserArgsSchema: z.ZodType<Prisma.UserDefaultArgs> = z.object({
  select: z.lazy(() => UserSelectSchema).optional(),
  include: z.lazy(() => UserIncludeSchema).optional(),
}).strict();

export const UserCountOutputTypeArgsSchema: z.ZodType<Prisma.UserCountOutputTypeDefaultArgs> = z.object({
  select: z.lazy(() => UserCountOutputTypeSelectSchema).nullish(),
}).strict();

export const UserCountOutputTypeSelectSchema: z.ZodType<Prisma.UserCountOutputTypeSelect> = z.object({
  walletAccounts: z.boolean().optional(),
  budgetUsers: z.boolean().optional(),
  transactions: z.boolean().optional(),
  createdBudgetUserInvitations: z.boolean().optional(),
  categories: z.boolean().optional(),
}).strict();

export const UserSelectSchema: z.ZodType<Prisma.UserSelect> = z.object({
  id: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  email: z.boolean().optional(),
  name: z.boolean().optional(),
  walletAccounts: z.union([z.boolean(),z.lazy(() => UserWalletAccountFindManyArgsSchema)]).optional(),
  budgetUsers: z.union([z.boolean(),z.lazy(() => BudgetUserFindManyArgsSchema)]).optional(),
  transactions: z.union([z.boolean(),z.lazy(() => TransactionFindManyArgsSchema)]).optional(),
  createdBudgetUserInvitations: z.union([z.boolean(),z.lazy(() => BudgetUserInvitationFindManyArgsSchema)]).optional(),
  createdFromInvitation: z.union([z.boolean(),z.lazy(() => BudgetUserInvitationResponseArgsSchema)]).optional(),
  categories: z.union([z.boolean(),z.lazy(() => CategoryFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => UserCountOutputTypeArgsSchema)]).optional(),
}).strict()

// USER WALLET ACCOUNT
//------------------------------------------------------

export const UserWalletAccountIncludeSchema: z.ZodType<Prisma.UserWalletAccountInclude> = z.object({
  user: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
  transactions: z.union([z.boolean(),z.lazy(() => TransactionFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => UserWalletAccountCountOutputTypeArgsSchema)]).optional(),
}).strict()

export const UserWalletAccountArgsSchema: z.ZodType<Prisma.UserWalletAccountDefaultArgs> = z.object({
  select: z.lazy(() => UserWalletAccountSelectSchema).optional(),
  include: z.lazy(() => UserWalletAccountIncludeSchema).optional(),
}).strict();

export const UserWalletAccountCountOutputTypeArgsSchema: z.ZodType<Prisma.UserWalletAccountCountOutputTypeDefaultArgs> = z.object({
  select: z.lazy(() => UserWalletAccountCountOutputTypeSelectSchema).nullish(),
}).strict();

export const UserWalletAccountCountOutputTypeSelectSchema: z.ZodType<Prisma.UserWalletAccountCountOutputTypeSelect> = z.object({
  transactions: z.boolean().optional(),
}).strict();

export const UserWalletAccountSelectSchema: z.ZodType<Prisma.UserWalletAccountSelect> = z.object({
  id: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  name: z.boolean().optional(),
  icon: z.boolean().optional(),
  description: z.boolean().optional(),
  lastDigits: z.boolean().optional(),
  preferredCurrency: z.boolean().optional(),
  userId: z.boolean().optional(),
  user: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
  transactions: z.union([z.boolean(),z.lazy(() => TransactionFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => UserWalletAccountCountOutputTypeArgsSchema)]).optional(),
}).strict()

// BUDGET
//------------------------------------------------------

export const BudgetIncludeSchema: z.ZodType<Prisma.BudgetInclude> = z.object({
  periodConfigs: z.union([z.boolean(),z.lazy(() => BudgetPeriodConfigFindManyArgsSchema)]).optional(),
  budgetUsers: z.union([z.boolean(),z.lazy(() => BudgetUserFindManyArgsSchema)]).optional(),
  transactions: z.union([z.boolean(),z.lazy(() => TransactionFindManyArgsSchema)]).optional(),
  invitations: z.union([z.boolean(),z.lazy(() => BudgetUserInvitationFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => BudgetCountOutputTypeArgsSchema)]).optional(),
}).strict()

export const BudgetArgsSchema: z.ZodType<Prisma.BudgetDefaultArgs> = z.object({
  select: z.lazy(() => BudgetSelectSchema).optional(),
  include: z.lazy(() => BudgetIncludeSchema).optional(),
}).strict();

export const BudgetCountOutputTypeArgsSchema: z.ZodType<Prisma.BudgetCountOutputTypeDefaultArgs> = z.object({
  select: z.lazy(() => BudgetCountOutputTypeSelectSchema).nullish(),
}).strict();

export const BudgetCountOutputTypeSelectSchema: z.ZodType<Prisma.BudgetCountOutputTypeSelect> = z.object({
  periodConfigs: z.boolean().optional(),
  budgetUsers: z.boolean().optional(),
  transactions: z.boolean().optional(),
  invitations: z.boolean().optional(),
}).strict();

export const BudgetSelectSchema: z.ZodType<Prisma.BudgetSelect> = z.object({
  id: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  name: z.boolean().optional(),
  description: z.boolean().optional(),
  preferredCurrency: z.boolean().optional(),
  type: z.boolean().optional(),
  periodConfigs: z.union([z.boolean(),z.lazy(() => BudgetPeriodConfigFindManyArgsSchema)]).optional(),
  budgetUsers: z.union([z.boolean(),z.lazy(() => BudgetUserFindManyArgsSchema)]).optional(),
  transactions: z.union([z.boolean(),z.lazy(() => TransactionFindManyArgsSchema)]).optional(),
  invitations: z.union([z.boolean(),z.lazy(() => BudgetUserInvitationFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => BudgetCountOutputTypeArgsSchema)]).optional(),
}).strict()

// BUDGET PERIOD CONFIG
//------------------------------------------------------

export const BudgetPeriodConfigIncludeSchema: z.ZodType<Prisma.BudgetPeriodConfigInclude> = z.object({
  budget: z.union([z.boolean(),z.lazy(() => BudgetArgsSchema)]).optional(),
}).strict()

export const BudgetPeriodConfigArgsSchema: z.ZodType<Prisma.BudgetPeriodConfigDefaultArgs> = z.object({
  select: z.lazy(() => BudgetPeriodConfigSelectSchema).optional(),
  include: z.lazy(() => BudgetPeriodConfigIncludeSchema).optional(),
}).strict();

export const BudgetPeriodConfigSelectSchema: z.ZodType<Prisma.BudgetPeriodConfigSelect> = z.object({
  id: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  type: z.boolean().optional(),
  amount: z.boolean().optional(),
  startDate: z.boolean().optional(),
  endDate: z.boolean().optional(),
  budgetId: z.boolean().optional(),
  budget: z.union([z.boolean(),z.lazy(() => BudgetArgsSchema)]).optional(),
}).strict()

// BUDGET USER
//------------------------------------------------------

export const BudgetUserIncludeSchema: z.ZodType<Prisma.BudgetUserInclude> = z.object({
  user: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
  budget: z.union([z.boolean(),z.lazy(() => BudgetArgsSchema)]).optional(),
}).strict()

export const BudgetUserArgsSchema: z.ZodType<Prisma.BudgetUserDefaultArgs> = z.object({
  select: z.lazy(() => BudgetUserSelectSchema).optional(),
  include: z.lazy(() => BudgetUserIncludeSchema).optional(),
}).strict();

export const BudgetUserSelectSchema: z.ZodType<Prisma.BudgetUserSelect> = z.object({
  id: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  permission: z.boolean().optional(),
  userId: z.boolean().optional(),
  budgetId: z.boolean().optional(),
  user: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
  budget: z.union([z.boolean(),z.lazy(() => BudgetArgsSchema)]).optional(),
}).strict()

// BUDGET USER INVITATION
//------------------------------------------------------

export const BudgetUserInvitationIncludeSchema: z.ZodType<Prisma.BudgetUserInvitationInclude> = z.object({
  createdByUser: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
  budget: z.union([z.boolean(),z.lazy(() => BudgetArgsSchema)]).optional(),
  responses: z.union([z.boolean(),z.lazy(() => BudgetUserInvitationResponseFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => BudgetUserInvitationCountOutputTypeArgsSchema)]).optional(),
}).strict()

export const BudgetUserInvitationArgsSchema: z.ZodType<Prisma.BudgetUserInvitationDefaultArgs> = z.object({
  select: z.lazy(() => BudgetUserInvitationSelectSchema).optional(),
  include: z.lazy(() => BudgetUserInvitationIncludeSchema).optional(),
}).strict();

export const BudgetUserInvitationCountOutputTypeArgsSchema: z.ZodType<Prisma.BudgetUserInvitationCountOutputTypeDefaultArgs> = z.object({
  select: z.lazy(() => BudgetUserInvitationCountOutputTypeSelectSchema).nullish(),
}).strict();

export const BudgetUserInvitationCountOutputTypeSelectSchema: z.ZodType<Prisma.BudgetUserInvitationCountOutputTypeSelect> = z.object({
  responses: z.boolean().optional(),
}).strict();

export const BudgetUserInvitationSelectSchema: z.ZodType<Prisma.BudgetUserInvitationSelect> = z.object({
  id: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  email: z.boolean().optional(),
  token: z.boolean().optional(),
  expiresAt: z.boolean().optional(),
  permission: z.boolean().optional(),
  createdByUserId: z.boolean().optional(),
  budgetId: z.boolean().optional(),
  createdByUser: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
  budget: z.union([z.boolean(),z.lazy(() => BudgetArgsSchema)]).optional(),
  responses: z.union([z.boolean(),z.lazy(() => BudgetUserInvitationResponseFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => BudgetUserInvitationCountOutputTypeArgsSchema)]).optional(),
}).strict()

// BUDGET USER INVITATION RESPONSE
//------------------------------------------------------

export const BudgetUserInvitationResponseIncludeSchema: z.ZodType<Prisma.BudgetUserInvitationResponseInclude> = z.object({
  invitation: z.union([z.boolean(),z.lazy(() => BudgetUserInvitationArgsSchema)]).optional(),
  createdUser: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
}).strict()

export const BudgetUserInvitationResponseArgsSchema: z.ZodType<Prisma.BudgetUserInvitationResponseDefaultArgs> = z.object({
  select: z.lazy(() => BudgetUserInvitationResponseSelectSchema).optional(),
  include: z.lazy(() => BudgetUserInvitationResponseIncludeSchema).optional(),
}).strict();

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

// TRANSACTION
//------------------------------------------------------

export const TransactionIncludeSchema: z.ZodType<Prisma.TransactionInclude> = z.object({
  category: z.union([z.boolean(),z.lazy(() => CategoryArgsSchema)]).optional(),
  budget: z.union([z.boolean(),z.lazy(() => BudgetArgsSchema)]).optional(),
  walletAccount: z.union([z.boolean(),z.lazy(() => UserWalletAccountArgsSchema)]).optional(),
  createdByUser: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
}).strict()

export const TransactionArgsSchema: z.ZodType<Prisma.TransactionDefaultArgs> = z.object({
  select: z.lazy(() => TransactionSelectSchema).optional(),
  include: z.lazy(() => TransactionIncludeSchema).optional(),
}).strict();

export const TransactionSelectSchema: z.ZodType<Prisma.TransactionSelect> = z.object({
  id: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  amount: z.boolean().optional(),
  amountInVnd: z.boolean().optional(),
  currency: z.boolean().optional(),
  date: z.boolean().optional(),
  note: z.boolean().optional(),
  categoryId: z.boolean().optional(),
  budgetId: z.boolean().optional(),
  walletAccountId: z.boolean().optional(),
  createdByUserId: z.boolean().optional(),
  category: z.union([z.boolean(),z.lazy(() => CategoryArgsSchema)]).optional(),
  budget: z.union([z.boolean(),z.lazy(() => BudgetArgsSchema)]).optional(),
  walletAccount: z.union([z.boolean(),z.lazy(() => UserWalletAccountArgsSchema)]).optional(),
  createdByUser: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
}).strict()

// CATEGORY
//------------------------------------------------------

export const CategoryIncludeSchema: z.ZodType<Prisma.CategoryInclude> = z.object({
  user: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
  parent: z.union([z.boolean(),z.lazy(() => CategoryArgsSchema)]).optional(),
  children: z.union([z.boolean(),z.lazy(() => CategoryFindManyArgsSchema)]).optional(),
  transactions: z.union([z.boolean(),z.lazy(() => TransactionFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => CategoryCountOutputTypeArgsSchema)]).optional(),
}).strict()

export const CategoryArgsSchema: z.ZodType<Prisma.CategoryDefaultArgs> = z.object({
  select: z.lazy(() => CategorySelectSchema).optional(),
  include: z.lazy(() => CategoryIncludeSchema).optional(),
}).strict();

export const CategoryCountOutputTypeArgsSchema: z.ZodType<Prisma.CategoryCountOutputTypeDefaultArgs> = z.object({
  select: z.lazy(() => CategoryCountOutputTypeSelectSchema).nullish(),
}).strict();

export const CategoryCountOutputTypeSelectSchema: z.ZodType<Prisma.CategoryCountOutputTypeSelect> = z.object({
  children: z.boolean().optional(),
  transactions: z.boolean().optional(),
}).strict();

export const CategorySelectSchema: z.ZodType<Prisma.CategorySelect> = z.object({
  id: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  type: z.boolean().optional(),
  name: z.boolean().optional(),
  description: z.boolean().optional(),
  icon: z.boolean().optional(),
  color: z.boolean().optional(),
  userId: z.boolean().optional(),
  parentId: z.boolean().optional(),
  user: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
  parent: z.union([z.boolean(),z.lazy(() => CategoryArgsSchema)]).optional(),
  children: z.union([z.boolean(),z.lazy(() => CategoryFindManyArgsSchema)]).optional(),
  transactions: z.union([z.boolean(),z.lazy(() => TransactionFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => CategoryCountOutputTypeArgsSchema)]).optional(),
}).strict()

// CACHED GPT RESPONSE
//------------------------------------------------------

export const CachedGptResponseSelectSchema: z.ZodType<Prisma.CachedGptResponseSelect> = z.object({
  id: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  query: z.boolean().optional(),
  response: z.boolean().optional(),
}).strict()

// CURRENCY EXCHANGE RATE
//------------------------------------------------------

export const CurrencyExchangeRateSelectSchema: z.ZodType<Prisma.CurrencyExchangeRateSelect> = z.object({
  id: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  fromCurrency: z.boolean().optional(),
  toCurrency: z.boolean().optional(),
  rate: z.boolean().optional(),
  date: z.boolean().optional(),
}).strict()


/////////////////////////////////////////
// INPUT TYPES
/////////////////////////////////////////

export const UserWhereInputSchema: z.ZodType<Prisma.UserWhereInput> = z.object({
  AND: z.union([ z.lazy(() => UserWhereInputSchema),z.lazy(() => UserWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => UserWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => UserWhereInputSchema),z.lazy(() => UserWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  email: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  name: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  walletAccounts: z.lazy(() => UserWalletAccountListRelationFilterSchema).optional(),
  budgetUsers: z.lazy(() => BudgetUserListRelationFilterSchema).optional(),
  transactions: z.lazy(() => TransactionListRelationFilterSchema).optional(),
  createdBudgetUserInvitations: z.lazy(() => BudgetUserInvitationListRelationFilterSchema).optional(),
  createdFromInvitation: z.union([ z.lazy(() => BudgetUserInvitationResponseNullableRelationFilterSchema),z.lazy(() => BudgetUserInvitationResponseWhereInputSchema) ]).optional().nullable(),
  categories: z.lazy(() => CategoryListRelationFilterSchema).optional()
}).strict();

export const UserOrderByWithRelationInputSchema: z.ZodType<Prisma.UserOrderByWithRelationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  email: z.lazy(() => SortOrderSchema).optional(),
  name: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  walletAccounts: z.lazy(() => UserWalletAccountOrderByRelationAggregateInputSchema).optional(),
  budgetUsers: z.lazy(() => BudgetUserOrderByRelationAggregateInputSchema).optional(),
  transactions: z.lazy(() => TransactionOrderByRelationAggregateInputSchema).optional(),
  createdBudgetUserInvitations: z.lazy(() => BudgetUserInvitationOrderByRelationAggregateInputSchema).optional(),
  createdFromInvitation: z.lazy(() => BudgetUserInvitationResponseOrderByWithRelationInputSchema).optional(),
  categories: z.lazy(() => CategoryOrderByRelationAggregateInputSchema).optional()
}).strict();

export const UserWhereUniqueInputSchema: z.ZodType<Prisma.UserWhereUniqueInput> = z.union([
  z.object({
    id: z.string(),
    email: z.string()
  }),
  z.object({
    id: z.string(),
  }),
  z.object({
    email: z.string(),
  }),
])
.and(z.object({
  id: z.string().optional(),
  email: z.string().optional(),
  AND: z.union([ z.lazy(() => UserWhereInputSchema),z.lazy(() => UserWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => UserWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => UserWhereInputSchema),z.lazy(() => UserWhereInputSchema).array() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  name: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  walletAccounts: z.lazy(() => UserWalletAccountListRelationFilterSchema).optional(),
  budgetUsers: z.lazy(() => BudgetUserListRelationFilterSchema).optional(),
  transactions: z.lazy(() => TransactionListRelationFilterSchema).optional(),
  createdBudgetUserInvitations: z.lazy(() => BudgetUserInvitationListRelationFilterSchema).optional(),
  createdFromInvitation: z.union([ z.lazy(() => BudgetUserInvitationResponseNullableRelationFilterSchema),z.lazy(() => BudgetUserInvitationResponseWhereInputSchema) ]).optional().nullable(),
  categories: z.lazy(() => CategoryListRelationFilterSchema).optional()
}).strict());

export const UserOrderByWithAggregationInputSchema: z.ZodType<Prisma.UserOrderByWithAggregationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  email: z.lazy(() => SortOrderSchema).optional(),
  name: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  _count: z.lazy(() => UserCountOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => UserMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => UserMinOrderByAggregateInputSchema).optional()
}).strict();

export const UserScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.UserScalarWhereWithAggregatesInput> = z.object({
  AND: z.union([ z.lazy(() => UserScalarWhereWithAggregatesInputSchema),z.lazy(() => UserScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => UserScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => UserScalarWhereWithAggregatesInputSchema),z.lazy(() => UserScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
  email: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  name: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema),z.string() ]).optional().nullable(),
}).strict();

export const UserWalletAccountWhereInputSchema: z.ZodType<Prisma.UserWalletAccountWhereInput> = z.object({
  AND: z.union([ z.lazy(() => UserWalletAccountWhereInputSchema),z.lazy(() => UserWalletAccountWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => UserWalletAccountWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => UserWalletAccountWhereInputSchema),z.lazy(() => UserWalletAccountWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  name: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  icon: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  description: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  lastDigits: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  preferredCurrency: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  userId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  user: z.union([ z.lazy(() => UserRelationFilterSchema),z.lazy(() => UserWhereInputSchema) ]).optional(),
  transactions: z.lazy(() => TransactionListRelationFilterSchema).optional()
}).strict();

export const UserWalletAccountOrderByWithRelationInputSchema: z.ZodType<Prisma.UserWalletAccountOrderByWithRelationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  icon: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  description: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  lastDigits: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  preferredCurrency: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  user: z.lazy(() => UserOrderByWithRelationInputSchema).optional(),
  transactions: z.lazy(() => TransactionOrderByRelationAggregateInputSchema).optional()
}).strict();

export const UserWalletAccountWhereUniqueInputSchema: z.ZodType<Prisma.UserWalletAccountWhereUniqueInput> = z.object({
  id: z.string()
})
.and(z.object({
  id: z.string().optional(),
  AND: z.union([ z.lazy(() => UserWalletAccountWhereInputSchema),z.lazy(() => UserWalletAccountWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => UserWalletAccountWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => UserWalletAccountWhereInputSchema),z.lazy(() => UserWalletAccountWhereInputSchema).array() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  name: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  icon: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  description: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  lastDigits: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  preferredCurrency: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  userId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  user: z.union([ z.lazy(() => UserRelationFilterSchema),z.lazy(() => UserWhereInputSchema) ]).optional(),
  transactions: z.lazy(() => TransactionListRelationFilterSchema).optional()
}).strict());

export const UserWalletAccountOrderByWithAggregationInputSchema: z.ZodType<Prisma.UserWalletAccountOrderByWithAggregationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  icon: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  description: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  lastDigits: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  preferredCurrency: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => UserWalletAccountCountOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => UserWalletAccountMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => UserWalletAccountMinOrderByAggregateInputSchema).optional()
}).strict();

export const UserWalletAccountScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.UserWalletAccountScalarWhereWithAggregatesInput> = z.object({
  AND: z.union([ z.lazy(() => UserWalletAccountScalarWhereWithAggregatesInputSchema),z.lazy(() => UserWalletAccountScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => UserWalletAccountScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => UserWalletAccountScalarWhereWithAggregatesInputSchema),z.lazy(() => UserWalletAccountScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
  name: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  icon: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema),z.string() ]).optional().nullable(),
  description: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema),z.string() ]).optional().nullable(),
  lastDigits: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema),z.string() ]).optional().nullable(),
  preferredCurrency: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  userId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
}).strict();

export const BudgetWhereInputSchema: z.ZodType<Prisma.BudgetWhereInput> = z.object({
  AND: z.union([ z.lazy(() => BudgetWhereInputSchema),z.lazy(() => BudgetWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => BudgetWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => BudgetWhereInputSchema),z.lazy(() => BudgetWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  name: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  description: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  preferredCurrency: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  type: z.union([ z.lazy(() => EnumBudgetTypeFilterSchema),z.lazy(() => BudgetTypeSchema) ]).optional(),
  periodConfigs: z.lazy(() => BudgetPeriodConfigListRelationFilterSchema).optional(),
  budgetUsers: z.lazy(() => BudgetUserListRelationFilterSchema).optional(),
  transactions: z.lazy(() => TransactionListRelationFilterSchema).optional(),
  invitations: z.lazy(() => BudgetUserInvitationListRelationFilterSchema).optional()
}).strict();

export const BudgetOrderByWithRelationInputSchema: z.ZodType<Prisma.BudgetOrderByWithRelationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  description: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  preferredCurrency: z.lazy(() => SortOrderSchema).optional(),
  type: z.lazy(() => SortOrderSchema).optional(),
  periodConfigs: z.lazy(() => BudgetPeriodConfigOrderByRelationAggregateInputSchema).optional(),
  budgetUsers: z.lazy(() => BudgetUserOrderByRelationAggregateInputSchema).optional(),
  transactions: z.lazy(() => TransactionOrderByRelationAggregateInputSchema).optional(),
  invitations: z.lazy(() => BudgetUserInvitationOrderByRelationAggregateInputSchema).optional()
}).strict();

export const BudgetWhereUniqueInputSchema: z.ZodType<Prisma.BudgetWhereUniqueInput> = z.object({
  id: z.string()
})
.and(z.object({
  id: z.string().optional(),
  AND: z.union([ z.lazy(() => BudgetWhereInputSchema),z.lazy(() => BudgetWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => BudgetWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => BudgetWhereInputSchema),z.lazy(() => BudgetWhereInputSchema).array() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  name: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  description: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  preferredCurrency: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  type: z.union([ z.lazy(() => EnumBudgetTypeFilterSchema),z.lazy(() => BudgetTypeSchema) ]).optional(),
  periodConfigs: z.lazy(() => BudgetPeriodConfigListRelationFilterSchema).optional(),
  budgetUsers: z.lazy(() => BudgetUserListRelationFilterSchema).optional(),
  transactions: z.lazy(() => TransactionListRelationFilterSchema).optional(),
  invitations: z.lazy(() => BudgetUserInvitationListRelationFilterSchema).optional()
}).strict());

export const BudgetOrderByWithAggregationInputSchema: z.ZodType<Prisma.BudgetOrderByWithAggregationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  description: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  preferredCurrency: z.lazy(() => SortOrderSchema).optional(),
  type: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => BudgetCountOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => BudgetMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => BudgetMinOrderByAggregateInputSchema).optional()
}).strict();

export const BudgetScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.BudgetScalarWhereWithAggregatesInput> = z.object({
  AND: z.union([ z.lazy(() => BudgetScalarWhereWithAggregatesInputSchema),z.lazy(() => BudgetScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => BudgetScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => BudgetScalarWhereWithAggregatesInputSchema),z.lazy(() => BudgetScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
  name: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  description: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema),z.string() ]).optional().nullable(),
  preferredCurrency: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  type: z.union([ z.lazy(() => EnumBudgetTypeWithAggregatesFilterSchema),z.lazy(() => BudgetTypeSchema) ]).optional(),
}).strict();

export const BudgetPeriodConfigWhereInputSchema: z.ZodType<Prisma.BudgetPeriodConfigWhereInput> = z.object({
  AND: z.union([ z.lazy(() => BudgetPeriodConfigWhereInputSchema),z.lazy(() => BudgetPeriodConfigWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => BudgetPeriodConfigWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => BudgetPeriodConfigWhereInputSchema),z.lazy(() => BudgetPeriodConfigWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  type: z.union([ z.lazy(() => EnumBudgetPeriodTypeFilterSchema),z.lazy(() => BudgetPeriodTypeSchema) ]).optional(),
  amount: z.union([ z.lazy(() => DecimalFilterSchema),z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional(),
  startDate: z.union([ z.lazy(() => DateTimeNullableFilterSchema),z.coerce.date() ]).optional().nullable(),
  endDate: z.union([ z.lazy(() => DateTimeNullableFilterSchema),z.coerce.date() ]).optional().nullable(),
  budgetId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  budget: z.union([ z.lazy(() => BudgetRelationFilterSchema),z.lazy(() => BudgetWhereInputSchema) ]).optional(),
}).strict();

export const BudgetPeriodConfigOrderByWithRelationInputSchema: z.ZodType<Prisma.BudgetPeriodConfigOrderByWithRelationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  type: z.lazy(() => SortOrderSchema).optional(),
  amount: z.lazy(() => SortOrderSchema).optional(),
  startDate: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  endDate: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  budgetId: z.lazy(() => SortOrderSchema).optional(),
  budget: z.lazy(() => BudgetOrderByWithRelationInputSchema).optional()
}).strict();

export const BudgetPeriodConfigWhereUniqueInputSchema: z.ZodType<Prisma.BudgetPeriodConfigWhereUniqueInput> = z.object({
  id: z.string()
})
.and(z.object({
  id: z.string().optional(),
  AND: z.union([ z.lazy(() => BudgetPeriodConfigWhereInputSchema),z.lazy(() => BudgetPeriodConfigWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => BudgetPeriodConfigWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => BudgetPeriodConfigWhereInputSchema),z.lazy(() => BudgetPeriodConfigWhereInputSchema).array() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  type: z.union([ z.lazy(() => EnumBudgetPeriodTypeFilterSchema),z.lazy(() => BudgetPeriodTypeSchema) ]).optional(),
  amount: z.union([ z.lazy(() => DecimalFilterSchema),z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional(),
  startDate: z.union([ z.lazy(() => DateTimeNullableFilterSchema),z.coerce.date() ]).optional().nullable(),
  endDate: z.union([ z.lazy(() => DateTimeNullableFilterSchema),z.coerce.date() ]).optional().nullable(),
  budgetId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  budget: z.union([ z.lazy(() => BudgetRelationFilterSchema),z.lazy(() => BudgetWhereInputSchema) ]).optional(),
}).strict());

export const BudgetPeriodConfigOrderByWithAggregationInputSchema: z.ZodType<Prisma.BudgetPeriodConfigOrderByWithAggregationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  type: z.lazy(() => SortOrderSchema).optional(),
  amount: z.lazy(() => SortOrderSchema).optional(),
  startDate: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  endDate: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  budgetId: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => BudgetPeriodConfigCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => BudgetPeriodConfigAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => BudgetPeriodConfigMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => BudgetPeriodConfigMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => BudgetPeriodConfigSumOrderByAggregateInputSchema).optional()
}).strict();

export const BudgetPeriodConfigScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.BudgetPeriodConfigScalarWhereWithAggregatesInput> = z.object({
  AND: z.union([ z.lazy(() => BudgetPeriodConfigScalarWhereWithAggregatesInputSchema),z.lazy(() => BudgetPeriodConfigScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => BudgetPeriodConfigScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => BudgetPeriodConfigScalarWhereWithAggregatesInputSchema),z.lazy(() => BudgetPeriodConfigScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
  type: z.union([ z.lazy(() => EnumBudgetPeriodTypeWithAggregatesFilterSchema),z.lazy(() => BudgetPeriodTypeSchema) ]).optional(),
  amount: z.union([ z.lazy(() => DecimalWithAggregatesFilterSchema),z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional(),
  startDate: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema),z.coerce.date() ]).optional().nullable(),
  endDate: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema),z.coerce.date() ]).optional().nullable(),
  budgetId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
}).strict();

export const BudgetUserWhereInputSchema: z.ZodType<Prisma.BudgetUserWhereInput> = z.object({
  AND: z.union([ z.lazy(() => BudgetUserWhereInputSchema),z.lazy(() => BudgetUserWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => BudgetUserWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => BudgetUserWhereInputSchema),z.lazy(() => BudgetUserWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  permission: z.union([ z.lazy(() => EnumBudgetUserPermissionFilterSchema),z.lazy(() => BudgetUserPermissionSchema) ]).optional(),
  userId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  budgetId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  user: z.union([ z.lazy(() => UserRelationFilterSchema),z.lazy(() => UserWhereInputSchema) ]).optional(),
  budget: z.union([ z.lazy(() => BudgetRelationFilterSchema),z.lazy(() => BudgetWhereInputSchema) ]).optional(),
}).strict();

export const BudgetUserOrderByWithRelationInputSchema: z.ZodType<Prisma.BudgetUserOrderByWithRelationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  permission: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  budgetId: z.lazy(() => SortOrderSchema).optional(),
  user: z.lazy(() => UserOrderByWithRelationInputSchema).optional(),
  budget: z.lazy(() => BudgetOrderByWithRelationInputSchema).optional()
}).strict();

export const BudgetUserWhereUniqueInputSchema: z.ZodType<Prisma.BudgetUserWhereUniqueInput> = z.union([
  z.object({
    id: z.string(),
    userId_budgetId: z.lazy(() => BudgetUserUserIdBudgetIdCompoundUniqueInputSchema)
  }),
  z.object({
    id: z.string(),
  }),
  z.object({
    userId_budgetId: z.lazy(() => BudgetUserUserIdBudgetIdCompoundUniqueInputSchema),
  }),
])
.and(z.object({
  id: z.string().optional(),
  userId_budgetId: z.lazy(() => BudgetUserUserIdBudgetIdCompoundUniqueInputSchema).optional(),
  AND: z.union([ z.lazy(() => BudgetUserWhereInputSchema),z.lazy(() => BudgetUserWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => BudgetUserWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => BudgetUserWhereInputSchema),z.lazy(() => BudgetUserWhereInputSchema).array() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  permission: z.union([ z.lazy(() => EnumBudgetUserPermissionFilterSchema),z.lazy(() => BudgetUserPermissionSchema) ]).optional(),
  userId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  budgetId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  user: z.union([ z.lazy(() => UserRelationFilterSchema),z.lazy(() => UserWhereInputSchema) ]).optional(),
  budget: z.union([ z.lazy(() => BudgetRelationFilterSchema),z.lazy(() => BudgetWhereInputSchema) ]).optional(),
}).strict());

export const BudgetUserOrderByWithAggregationInputSchema: z.ZodType<Prisma.BudgetUserOrderByWithAggregationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  permission: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  budgetId: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => BudgetUserCountOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => BudgetUserMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => BudgetUserMinOrderByAggregateInputSchema).optional()
}).strict();

export const BudgetUserScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.BudgetUserScalarWhereWithAggregatesInput> = z.object({
  AND: z.union([ z.lazy(() => BudgetUserScalarWhereWithAggregatesInputSchema),z.lazy(() => BudgetUserScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => BudgetUserScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => BudgetUserScalarWhereWithAggregatesInputSchema),z.lazy(() => BudgetUserScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
  permission: z.union([ z.lazy(() => EnumBudgetUserPermissionWithAggregatesFilterSchema),z.lazy(() => BudgetUserPermissionSchema) ]).optional(),
  userId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  budgetId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
}).strict();

export const BudgetUserInvitationWhereInputSchema: z.ZodType<Prisma.BudgetUserInvitationWhereInput> = z.object({
  AND: z.union([ z.lazy(() => BudgetUserInvitationWhereInputSchema),z.lazy(() => BudgetUserInvitationWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => BudgetUserInvitationWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => BudgetUserInvitationWhereInputSchema),z.lazy(() => BudgetUserInvitationWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  email: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  token: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  expiresAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  permission: z.union([ z.lazy(() => EnumBudgetUserPermissionNullableFilterSchema),z.lazy(() => BudgetUserPermissionSchema) ]).optional().nullable(),
  createdByUserId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  budgetId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  createdByUser: z.union([ z.lazy(() => UserRelationFilterSchema),z.lazy(() => UserWhereInputSchema) ]).optional(),
  budget: z.union([ z.lazy(() => BudgetRelationFilterSchema),z.lazy(() => BudgetWhereInputSchema) ]).optional(),
  responses: z.lazy(() => BudgetUserInvitationResponseListRelationFilterSchema).optional()
}).strict();

export const BudgetUserInvitationOrderByWithRelationInputSchema: z.ZodType<Prisma.BudgetUserInvitationOrderByWithRelationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  email: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  token: z.lazy(() => SortOrderSchema).optional(),
  expiresAt: z.lazy(() => SortOrderSchema).optional(),
  permission: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdByUserId: z.lazy(() => SortOrderSchema).optional(),
  budgetId: z.lazy(() => SortOrderSchema).optional(),
  createdByUser: z.lazy(() => UserOrderByWithRelationInputSchema).optional(),
  budget: z.lazy(() => BudgetOrderByWithRelationInputSchema).optional(),
  responses: z.lazy(() => BudgetUserInvitationResponseOrderByRelationAggregateInputSchema).optional()
}).strict();

export const BudgetUserInvitationWhereUniqueInputSchema: z.ZodType<Prisma.BudgetUserInvitationWhereUniqueInput> = z.union([
  z.object({
    id: z.string(),
    token_budgetId: z.lazy(() => BudgetUserInvitationTokenBudgetIdCompoundUniqueInputSchema),
    email_budgetId: z.lazy(() => BudgetUserInvitationEmailBudgetIdCompoundUniqueInputSchema)
  }),
  z.object({
    id: z.string(),
    token_budgetId: z.lazy(() => BudgetUserInvitationTokenBudgetIdCompoundUniqueInputSchema),
  }),
  z.object({
    id: z.string(),
    email_budgetId: z.lazy(() => BudgetUserInvitationEmailBudgetIdCompoundUniqueInputSchema),
  }),
  z.object({
    id: z.string(),
  }),
  z.object({
    token_budgetId: z.lazy(() => BudgetUserInvitationTokenBudgetIdCompoundUniqueInputSchema),
    email_budgetId: z.lazy(() => BudgetUserInvitationEmailBudgetIdCompoundUniqueInputSchema),
  }),
  z.object({
    token_budgetId: z.lazy(() => BudgetUserInvitationTokenBudgetIdCompoundUniqueInputSchema),
  }),
  z.object({
    email_budgetId: z.lazy(() => BudgetUserInvitationEmailBudgetIdCompoundUniqueInputSchema),
  }),
])
.and(z.object({
  id: z.string().optional(),
  token_budgetId: z.lazy(() => BudgetUserInvitationTokenBudgetIdCompoundUniqueInputSchema).optional(),
  email_budgetId: z.lazy(() => BudgetUserInvitationEmailBudgetIdCompoundUniqueInputSchema).optional(),
  AND: z.union([ z.lazy(() => BudgetUserInvitationWhereInputSchema),z.lazy(() => BudgetUserInvitationWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => BudgetUserInvitationWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => BudgetUserInvitationWhereInputSchema),z.lazy(() => BudgetUserInvitationWhereInputSchema).array() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  email: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  token: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  expiresAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  permission: z.union([ z.lazy(() => EnumBudgetUserPermissionNullableFilterSchema),z.lazy(() => BudgetUserPermissionSchema) ]).optional().nullable(),
  createdByUserId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  budgetId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  createdByUser: z.union([ z.lazy(() => UserRelationFilterSchema),z.lazy(() => UserWhereInputSchema) ]).optional(),
  budget: z.union([ z.lazy(() => BudgetRelationFilterSchema),z.lazy(() => BudgetWhereInputSchema) ]).optional(),
  responses: z.lazy(() => BudgetUserInvitationResponseListRelationFilterSchema).optional()
}).strict());

export const BudgetUserInvitationOrderByWithAggregationInputSchema: z.ZodType<Prisma.BudgetUserInvitationOrderByWithAggregationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  email: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  token: z.lazy(() => SortOrderSchema).optional(),
  expiresAt: z.lazy(() => SortOrderSchema).optional(),
  permission: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdByUserId: z.lazy(() => SortOrderSchema).optional(),
  budgetId: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => BudgetUserInvitationCountOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => BudgetUserInvitationMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => BudgetUserInvitationMinOrderByAggregateInputSchema).optional()
}).strict();

export const BudgetUserInvitationScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.BudgetUserInvitationScalarWhereWithAggregatesInput> = z.object({
  AND: z.union([ z.lazy(() => BudgetUserInvitationScalarWhereWithAggregatesInputSchema),z.lazy(() => BudgetUserInvitationScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => BudgetUserInvitationScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => BudgetUserInvitationScalarWhereWithAggregatesInputSchema),z.lazy(() => BudgetUserInvitationScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
  email: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema),z.string() ]).optional().nullable(),
  token: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  expiresAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
  permission: z.union([ z.lazy(() => EnumBudgetUserPermissionNullableWithAggregatesFilterSchema),z.lazy(() => BudgetUserPermissionSchema) ]).optional().nullable(),
  createdByUserId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  budgetId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
}).strict();

export const BudgetUserInvitationResponseWhereInputSchema: z.ZodType<Prisma.BudgetUserInvitationResponseWhereInput> = z.object({
  AND: z.union([ z.lazy(() => BudgetUserInvitationResponseWhereInputSchema),z.lazy(() => BudgetUserInvitationResponseWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => BudgetUserInvitationResponseWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => BudgetUserInvitationResponseWhereInputSchema),z.lazy(() => BudgetUserInvitationResponseWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  acceptedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema),z.coerce.date() ]).optional().nullable(),
  declinedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema),z.coerce.date() ]).optional().nullable(),
  invitationId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  createdUserId: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  invitation: z.union([ z.lazy(() => BudgetUserInvitationRelationFilterSchema),z.lazy(() => BudgetUserInvitationWhereInputSchema) ]).optional(),
  createdUser: z.union([ z.lazy(() => UserNullableRelationFilterSchema),z.lazy(() => UserWhereInputSchema) ]).optional().nullable(),
}).strict();

export const BudgetUserInvitationResponseOrderByWithRelationInputSchema: z.ZodType<Prisma.BudgetUserInvitationResponseOrderByWithRelationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  acceptedAt: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  declinedAt: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  invitationId: z.lazy(() => SortOrderSchema).optional(),
  createdUserId: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  invitation: z.lazy(() => BudgetUserInvitationOrderByWithRelationInputSchema).optional(),
  createdUser: z.lazy(() => UserOrderByWithRelationInputSchema).optional()
}).strict();

export const BudgetUserInvitationResponseWhereUniqueInputSchema: z.ZodType<Prisma.BudgetUserInvitationResponseWhereUniqueInput> = z.union([
  z.object({
    id: z.string(),
    createdUserId: z.string()
  }),
  z.object({
    id: z.string(),
  }),
  z.object({
    createdUserId: z.string(),
  }),
])
.and(z.object({
  id: z.string().optional(),
  createdUserId: z.string().optional(),
  AND: z.union([ z.lazy(() => BudgetUserInvitationResponseWhereInputSchema),z.lazy(() => BudgetUserInvitationResponseWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => BudgetUserInvitationResponseWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => BudgetUserInvitationResponseWhereInputSchema),z.lazy(() => BudgetUserInvitationResponseWhereInputSchema).array() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  acceptedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema),z.coerce.date() ]).optional().nullable(),
  declinedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema),z.coerce.date() ]).optional().nullable(),
  invitationId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  invitation: z.union([ z.lazy(() => BudgetUserInvitationRelationFilterSchema),z.lazy(() => BudgetUserInvitationWhereInputSchema) ]).optional(),
  createdUser: z.union([ z.lazy(() => UserNullableRelationFilterSchema),z.lazy(() => UserWhereInputSchema) ]).optional().nullable(),
}).strict());

export const BudgetUserInvitationResponseOrderByWithAggregationInputSchema: z.ZodType<Prisma.BudgetUserInvitationResponseOrderByWithAggregationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  acceptedAt: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  declinedAt: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  invitationId: z.lazy(() => SortOrderSchema).optional(),
  createdUserId: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  _count: z.lazy(() => BudgetUserInvitationResponseCountOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => BudgetUserInvitationResponseMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => BudgetUserInvitationResponseMinOrderByAggregateInputSchema).optional()
}).strict();

export const BudgetUserInvitationResponseScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.BudgetUserInvitationResponseScalarWhereWithAggregatesInput> = z.object({
  AND: z.union([ z.lazy(() => BudgetUserInvitationResponseScalarWhereWithAggregatesInputSchema),z.lazy(() => BudgetUserInvitationResponseScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => BudgetUserInvitationResponseScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => BudgetUserInvitationResponseScalarWhereWithAggregatesInputSchema),z.lazy(() => BudgetUserInvitationResponseScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
  acceptedAt: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema),z.coerce.date() ]).optional().nullable(),
  declinedAt: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema),z.coerce.date() ]).optional().nullable(),
  invitationId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  createdUserId: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema),z.string() ]).optional().nullable(),
}).strict();

export const TransactionWhereInputSchema: z.ZodType<Prisma.TransactionWhereInput> = z.object({
  AND: z.union([ z.lazy(() => TransactionWhereInputSchema),z.lazy(() => TransactionWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => TransactionWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => TransactionWhereInputSchema),z.lazy(() => TransactionWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  amount: z.union([ z.lazy(() => DecimalFilterSchema),z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional(),
  amountInVnd: z.union([ z.lazy(() => DecimalFilterSchema),z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional(),
  currency: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  date: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  note: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  categoryId: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  budgetId: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  walletAccountId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  createdByUserId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  category: z.union([ z.lazy(() => CategoryNullableRelationFilterSchema),z.lazy(() => CategoryWhereInputSchema) ]).optional().nullable(),
  budget: z.union([ z.lazy(() => BudgetNullableRelationFilterSchema),z.lazy(() => BudgetWhereInputSchema) ]).optional().nullable(),
  walletAccount: z.union([ z.lazy(() => UserWalletAccountRelationFilterSchema),z.lazy(() => UserWalletAccountWhereInputSchema) ]).optional(),
  createdByUser: z.union([ z.lazy(() => UserRelationFilterSchema),z.lazy(() => UserWhereInputSchema) ]).optional(),
}).strict();

export const TransactionOrderByWithRelationInputSchema: z.ZodType<Prisma.TransactionOrderByWithRelationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  amount: z.lazy(() => SortOrderSchema).optional(),
  amountInVnd: z.lazy(() => SortOrderSchema).optional(),
  currency: z.lazy(() => SortOrderSchema).optional(),
  date: z.lazy(() => SortOrderSchema).optional(),
  note: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  categoryId: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  budgetId: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  walletAccountId: z.lazy(() => SortOrderSchema).optional(),
  createdByUserId: z.lazy(() => SortOrderSchema).optional(),
  category: z.lazy(() => CategoryOrderByWithRelationInputSchema).optional(),
  budget: z.lazy(() => BudgetOrderByWithRelationInputSchema).optional(),
  walletAccount: z.lazy(() => UserWalletAccountOrderByWithRelationInputSchema).optional(),
  createdByUser: z.lazy(() => UserOrderByWithRelationInputSchema).optional()
}).strict();

export const TransactionWhereUniqueInputSchema: z.ZodType<Prisma.TransactionWhereUniqueInput> = z.object({
  id: z.string()
})
.and(z.object({
  id: z.string().optional(),
  AND: z.union([ z.lazy(() => TransactionWhereInputSchema),z.lazy(() => TransactionWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => TransactionWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => TransactionWhereInputSchema),z.lazy(() => TransactionWhereInputSchema).array() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  amount: z.union([ z.lazy(() => DecimalFilterSchema),z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional(),
  amountInVnd: z.union([ z.lazy(() => DecimalFilterSchema),z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional(),
  currency: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  date: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  note: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  categoryId: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  budgetId: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  walletAccountId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  createdByUserId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  category: z.union([ z.lazy(() => CategoryNullableRelationFilterSchema),z.lazy(() => CategoryWhereInputSchema) ]).optional().nullable(),
  budget: z.union([ z.lazy(() => BudgetNullableRelationFilterSchema),z.lazy(() => BudgetWhereInputSchema) ]).optional().nullable(),
  walletAccount: z.union([ z.lazy(() => UserWalletAccountRelationFilterSchema),z.lazy(() => UserWalletAccountWhereInputSchema) ]).optional(),
  createdByUser: z.union([ z.lazy(() => UserRelationFilterSchema),z.lazy(() => UserWhereInputSchema) ]).optional(),
}).strict());

export const TransactionOrderByWithAggregationInputSchema: z.ZodType<Prisma.TransactionOrderByWithAggregationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  amount: z.lazy(() => SortOrderSchema).optional(),
  amountInVnd: z.lazy(() => SortOrderSchema).optional(),
  currency: z.lazy(() => SortOrderSchema).optional(),
  date: z.lazy(() => SortOrderSchema).optional(),
  note: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  categoryId: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  budgetId: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  walletAccountId: z.lazy(() => SortOrderSchema).optional(),
  createdByUserId: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => TransactionCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => TransactionAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => TransactionMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => TransactionMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => TransactionSumOrderByAggregateInputSchema).optional()
}).strict();

export const TransactionScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.TransactionScalarWhereWithAggregatesInput> = z.object({
  AND: z.union([ z.lazy(() => TransactionScalarWhereWithAggregatesInputSchema),z.lazy(() => TransactionScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => TransactionScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => TransactionScalarWhereWithAggregatesInputSchema),z.lazy(() => TransactionScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
  amount: z.union([ z.lazy(() => DecimalWithAggregatesFilterSchema),z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional(),
  amountInVnd: z.union([ z.lazy(() => DecimalWithAggregatesFilterSchema),z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional(),
  currency: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  date: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
  note: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema),z.string() ]).optional().nullable(),
  categoryId: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema),z.string() ]).optional().nullable(),
  budgetId: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema),z.string() ]).optional().nullable(),
  walletAccountId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  createdByUserId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
}).strict();

export const CategoryWhereInputSchema: z.ZodType<Prisma.CategoryWhereInput> = z.object({
  AND: z.union([ z.lazy(() => CategoryWhereInputSchema),z.lazy(() => CategoryWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => CategoryWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => CategoryWhereInputSchema),z.lazy(() => CategoryWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  type: z.union([ z.lazy(() => EnumCategoryTypeFilterSchema),z.lazy(() => CategoryTypeSchema) ]).optional(),
  name: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  description: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  icon: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  color: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  userId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  parentId: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  user: z.union([ z.lazy(() => UserRelationFilterSchema),z.lazy(() => UserWhereInputSchema) ]).optional(),
  parent: z.union([ z.lazy(() => CategoryNullableRelationFilterSchema),z.lazy(() => CategoryWhereInputSchema) ]).optional().nullable(),
  children: z.lazy(() => CategoryListRelationFilterSchema).optional(),
  transactions: z.lazy(() => TransactionListRelationFilterSchema).optional()
}).strict();

export const CategoryOrderByWithRelationInputSchema: z.ZodType<Prisma.CategoryOrderByWithRelationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  type: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  description: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  icon: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  color: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  parentId: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  user: z.lazy(() => UserOrderByWithRelationInputSchema).optional(),
  parent: z.lazy(() => CategoryOrderByWithRelationInputSchema).optional(),
  children: z.lazy(() => CategoryOrderByRelationAggregateInputSchema).optional(),
  transactions: z.lazy(() => TransactionOrderByRelationAggregateInputSchema).optional()
}).strict();

export const CategoryWhereUniqueInputSchema: z.ZodType<Prisma.CategoryWhereUniqueInput> = z.object({
  id: z.string()
})
.and(z.object({
  id: z.string().optional(),
  AND: z.union([ z.lazy(() => CategoryWhereInputSchema),z.lazy(() => CategoryWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => CategoryWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => CategoryWhereInputSchema),z.lazy(() => CategoryWhereInputSchema).array() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  type: z.union([ z.lazy(() => EnumCategoryTypeFilterSchema),z.lazy(() => CategoryTypeSchema) ]).optional(),
  name: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  description: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  icon: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  color: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  userId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  parentId: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  user: z.union([ z.lazy(() => UserRelationFilterSchema),z.lazy(() => UserWhereInputSchema) ]).optional(),
  parent: z.union([ z.lazy(() => CategoryNullableRelationFilterSchema),z.lazy(() => CategoryWhereInputSchema) ]).optional().nullable(),
  children: z.lazy(() => CategoryListRelationFilterSchema).optional(),
  transactions: z.lazy(() => TransactionListRelationFilterSchema).optional()
}).strict());

export const CategoryOrderByWithAggregationInputSchema: z.ZodType<Prisma.CategoryOrderByWithAggregationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  type: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  description: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  icon: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  color: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  parentId: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  _count: z.lazy(() => CategoryCountOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => CategoryMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => CategoryMinOrderByAggregateInputSchema).optional()
}).strict();

export const CategoryScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.CategoryScalarWhereWithAggregatesInput> = z.object({
  AND: z.union([ z.lazy(() => CategoryScalarWhereWithAggregatesInputSchema),z.lazy(() => CategoryScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => CategoryScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => CategoryScalarWhereWithAggregatesInputSchema),z.lazy(() => CategoryScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
  type: z.union([ z.lazy(() => EnumCategoryTypeWithAggregatesFilterSchema),z.lazy(() => CategoryTypeSchema) ]).optional(),
  name: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  description: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema),z.string() ]).optional().nullable(),
  icon: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema),z.string() ]).optional().nullable(),
  color: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema),z.string() ]).optional().nullable(),
  userId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  parentId: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema),z.string() ]).optional().nullable(),
}).strict();

export const CachedGptResponseWhereInputSchema: z.ZodType<Prisma.CachedGptResponseWhereInput> = z.object({
  AND: z.union([ z.lazy(() => CachedGptResponseWhereInputSchema),z.lazy(() => CachedGptResponseWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => CachedGptResponseWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => CachedGptResponseWhereInputSchema),z.lazy(() => CachedGptResponseWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  query: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  response: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
}).strict();

export const CachedGptResponseOrderByWithRelationInputSchema: z.ZodType<Prisma.CachedGptResponseOrderByWithRelationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  query: z.lazy(() => SortOrderSchema).optional(),
  response: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const CachedGptResponseWhereUniqueInputSchema: z.ZodType<Prisma.CachedGptResponseWhereUniqueInput> = z.object({
  id: z.string()
})
.and(z.object({
  id: z.string().optional(),
  AND: z.union([ z.lazy(() => CachedGptResponseWhereInputSchema),z.lazy(() => CachedGptResponseWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => CachedGptResponseWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => CachedGptResponseWhereInputSchema),z.lazy(() => CachedGptResponseWhereInputSchema).array() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  query: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  response: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
}).strict());

export const CachedGptResponseOrderByWithAggregationInputSchema: z.ZodType<Prisma.CachedGptResponseOrderByWithAggregationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  query: z.lazy(() => SortOrderSchema).optional(),
  response: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => CachedGptResponseCountOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => CachedGptResponseMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => CachedGptResponseMinOrderByAggregateInputSchema).optional()
}).strict();

export const CachedGptResponseScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.CachedGptResponseScalarWhereWithAggregatesInput> = z.object({
  AND: z.union([ z.lazy(() => CachedGptResponseScalarWhereWithAggregatesInputSchema),z.lazy(() => CachedGptResponseScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => CachedGptResponseScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => CachedGptResponseScalarWhereWithAggregatesInputSchema),z.lazy(() => CachedGptResponseScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
  query: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  response: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
}).strict();

export const CurrencyExchangeRateWhereInputSchema: z.ZodType<Prisma.CurrencyExchangeRateWhereInput> = z.object({
  AND: z.union([ z.lazy(() => CurrencyExchangeRateWhereInputSchema),z.lazy(() => CurrencyExchangeRateWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => CurrencyExchangeRateWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => CurrencyExchangeRateWhereInputSchema),z.lazy(() => CurrencyExchangeRateWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  fromCurrency: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  toCurrency: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  rate: z.union([ z.lazy(() => DecimalFilterSchema),z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional(),
  date: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
}).strict();

export const CurrencyExchangeRateOrderByWithRelationInputSchema: z.ZodType<Prisma.CurrencyExchangeRateOrderByWithRelationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  fromCurrency: z.lazy(() => SortOrderSchema).optional(),
  toCurrency: z.lazy(() => SortOrderSchema).optional(),
  rate: z.lazy(() => SortOrderSchema).optional(),
  date: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const CurrencyExchangeRateWhereUniqueInputSchema: z.ZodType<Prisma.CurrencyExchangeRateWhereUniqueInput> = z.union([
  z.object({
    id: z.string(),
    fromCurrency_toCurrency_date: z.lazy(() => CurrencyExchangeRateFromCurrencyToCurrencyDateCompoundUniqueInputSchema)
  }),
  z.object({
    id: z.string(),
  }),
  z.object({
    fromCurrency_toCurrency_date: z.lazy(() => CurrencyExchangeRateFromCurrencyToCurrencyDateCompoundUniqueInputSchema),
  }),
])
.and(z.object({
  id: z.string().optional(),
  fromCurrency_toCurrency_date: z.lazy(() => CurrencyExchangeRateFromCurrencyToCurrencyDateCompoundUniqueInputSchema).optional(),
  AND: z.union([ z.lazy(() => CurrencyExchangeRateWhereInputSchema),z.lazy(() => CurrencyExchangeRateWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => CurrencyExchangeRateWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => CurrencyExchangeRateWhereInputSchema),z.lazy(() => CurrencyExchangeRateWhereInputSchema).array() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  fromCurrency: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  toCurrency: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  rate: z.union([ z.lazy(() => DecimalFilterSchema),z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional(),
  date: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
}).strict());

export const CurrencyExchangeRateOrderByWithAggregationInputSchema: z.ZodType<Prisma.CurrencyExchangeRateOrderByWithAggregationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  fromCurrency: z.lazy(() => SortOrderSchema).optional(),
  toCurrency: z.lazy(() => SortOrderSchema).optional(),
  rate: z.lazy(() => SortOrderSchema).optional(),
  date: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => CurrencyExchangeRateCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => CurrencyExchangeRateAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => CurrencyExchangeRateMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => CurrencyExchangeRateMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => CurrencyExchangeRateSumOrderByAggregateInputSchema).optional()
}).strict();

export const CurrencyExchangeRateScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.CurrencyExchangeRateScalarWhereWithAggregatesInput> = z.object({
  AND: z.union([ z.lazy(() => CurrencyExchangeRateScalarWhereWithAggregatesInputSchema),z.lazy(() => CurrencyExchangeRateScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => CurrencyExchangeRateScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => CurrencyExchangeRateScalarWhereWithAggregatesInputSchema),z.lazy(() => CurrencyExchangeRateScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
  fromCurrency: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  toCurrency: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  rate: z.union([ z.lazy(() => DecimalWithAggregatesFilterSchema),z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional(),
  date: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
}).strict();

export const UserCreateInputSchema: z.ZodType<Prisma.UserCreateInput> = z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  email: z.string(),
  name: z.string().optional().nullable(),
  walletAccounts: z.lazy(() => UserWalletAccountCreateNestedManyWithoutUserInputSchema).optional(),
  budgetUsers: z.lazy(() => BudgetUserCreateNestedManyWithoutUserInputSchema).optional(),
  transactions: z.lazy(() => TransactionCreateNestedManyWithoutCreatedByUserInputSchema).optional(),
  createdBudgetUserInvitations: z.lazy(() => BudgetUserInvitationCreateNestedManyWithoutCreatedByUserInputSchema).optional(),
  createdFromInvitation: z.lazy(() => BudgetUserInvitationResponseCreateNestedOneWithoutCreatedUserInputSchema).optional(),
  categories: z.lazy(() => CategoryCreateNestedManyWithoutUserInputSchema).optional()
}).strict();

export const UserUncheckedCreateInputSchema: z.ZodType<Prisma.UserUncheckedCreateInput> = z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  email: z.string(),
  name: z.string().optional().nullable(),
  walletAccounts: z.lazy(() => UserWalletAccountUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
  budgetUsers: z.lazy(() => BudgetUserUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
  transactions: z.lazy(() => TransactionUncheckedCreateNestedManyWithoutCreatedByUserInputSchema).optional(),
  createdBudgetUserInvitations: z.lazy(() => BudgetUserInvitationUncheckedCreateNestedManyWithoutCreatedByUserInputSchema).optional(),
  createdFromInvitation: z.lazy(() => BudgetUserInvitationResponseUncheckedCreateNestedOneWithoutCreatedUserInputSchema).optional(),
  categories: z.lazy(() => CategoryUncheckedCreateNestedManyWithoutUserInputSchema).optional()
}).strict();

export const UserUpdateInputSchema: z.ZodType<Prisma.UserUpdateInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  walletAccounts: z.lazy(() => UserWalletAccountUpdateManyWithoutUserNestedInputSchema).optional(),
  budgetUsers: z.lazy(() => BudgetUserUpdateManyWithoutUserNestedInputSchema).optional(),
  transactions: z.lazy(() => TransactionUpdateManyWithoutCreatedByUserNestedInputSchema).optional(),
  createdBudgetUserInvitations: z.lazy(() => BudgetUserInvitationUpdateManyWithoutCreatedByUserNestedInputSchema).optional(),
  createdFromInvitation: z.lazy(() => BudgetUserInvitationResponseUpdateOneWithoutCreatedUserNestedInputSchema).optional(),
  categories: z.lazy(() => CategoryUpdateManyWithoutUserNestedInputSchema).optional()
}).strict();

export const UserUncheckedUpdateInputSchema: z.ZodType<Prisma.UserUncheckedUpdateInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  walletAccounts: z.lazy(() => UserWalletAccountUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  budgetUsers: z.lazy(() => BudgetUserUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  transactions: z.lazy(() => TransactionUncheckedUpdateManyWithoutCreatedByUserNestedInputSchema).optional(),
  createdBudgetUserInvitations: z.lazy(() => BudgetUserInvitationUncheckedUpdateManyWithoutCreatedByUserNestedInputSchema).optional(),
  createdFromInvitation: z.lazy(() => BudgetUserInvitationResponseUncheckedUpdateOneWithoutCreatedUserNestedInputSchema).optional(),
  categories: z.lazy(() => CategoryUncheckedUpdateManyWithoutUserNestedInputSchema).optional()
}).strict();

export const UserCreateManyInputSchema: z.ZodType<Prisma.UserCreateManyInput> = z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  email: z.string(),
  name: z.string().optional().nullable()
}).strict();

export const UserUpdateManyMutationInputSchema: z.ZodType<Prisma.UserUpdateManyMutationInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
}).strict();

export const UserUncheckedUpdateManyInputSchema: z.ZodType<Prisma.UserUncheckedUpdateManyInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
}).strict();

export const UserWalletAccountCreateInputSchema: z.ZodType<Prisma.UserWalletAccountCreateInput> = z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  name: z.string(),
  icon: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  lastDigits: z.string().optional().nullable(),
  preferredCurrency: z.string(),
  user: z.lazy(() => UserCreateNestedOneWithoutWalletAccountsInputSchema),
  transactions: z.lazy(() => TransactionCreateNestedManyWithoutWalletAccountInputSchema).optional()
}).strict();

export const UserWalletAccountUncheckedCreateInputSchema: z.ZodType<Prisma.UserWalletAccountUncheckedCreateInput> = z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  name: z.string(),
  icon: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  lastDigits: z.string().optional().nullable(),
  preferredCurrency: z.string(),
  userId: z.string(),
  transactions: z.lazy(() => TransactionUncheckedCreateNestedManyWithoutWalletAccountInputSchema).optional()
}).strict();

export const UserWalletAccountUpdateInputSchema: z.ZodType<Prisma.UserWalletAccountUpdateInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  icon: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastDigits: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  preferredCurrency: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  user: z.lazy(() => UserUpdateOneRequiredWithoutWalletAccountsNestedInputSchema).optional(),
  transactions: z.lazy(() => TransactionUpdateManyWithoutWalletAccountNestedInputSchema).optional()
}).strict();

export const UserWalletAccountUncheckedUpdateInputSchema: z.ZodType<Prisma.UserWalletAccountUncheckedUpdateInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  icon: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastDigits: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  preferredCurrency: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  userId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  transactions: z.lazy(() => TransactionUncheckedUpdateManyWithoutWalletAccountNestedInputSchema).optional()
}).strict();

export const UserWalletAccountCreateManyInputSchema: z.ZodType<Prisma.UserWalletAccountCreateManyInput> = z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  name: z.string(),
  icon: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  lastDigits: z.string().optional().nullable(),
  preferredCurrency: z.string(),
  userId: z.string()
}).strict();

export const UserWalletAccountUpdateManyMutationInputSchema: z.ZodType<Prisma.UserWalletAccountUpdateManyMutationInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  icon: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastDigits: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  preferredCurrency: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const UserWalletAccountUncheckedUpdateManyInputSchema: z.ZodType<Prisma.UserWalletAccountUncheckedUpdateManyInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  icon: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastDigits: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  preferredCurrency: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  userId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const BudgetCreateInputSchema: z.ZodType<Prisma.BudgetCreateInput> = z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  name: z.string(),
  description: z.string().optional().nullable(),
  preferredCurrency: z.string(),
  type: z.lazy(() => BudgetTypeSchema).optional(),
  periodConfigs: z.lazy(() => BudgetPeriodConfigCreateNestedManyWithoutBudgetInputSchema).optional(),
  budgetUsers: z.lazy(() => BudgetUserCreateNestedManyWithoutBudgetInputSchema).optional(),
  transactions: z.lazy(() => TransactionCreateNestedManyWithoutBudgetInputSchema).optional(),
  invitations: z.lazy(() => BudgetUserInvitationCreateNestedManyWithoutBudgetInputSchema).optional()
}).strict();

export const BudgetUncheckedCreateInputSchema: z.ZodType<Prisma.BudgetUncheckedCreateInput> = z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  name: z.string(),
  description: z.string().optional().nullable(),
  preferredCurrency: z.string(),
  type: z.lazy(() => BudgetTypeSchema).optional(),
  periodConfigs: z.lazy(() => BudgetPeriodConfigUncheckedCreateNestedManyWithoutBudgetInputSchema).optional(),
  budgetUsers: z.lazy(() => BudgetUserUncheckedCreateNestedManyWithoutBudgetInputSchema).optional(),
  transactions: z.lazy(() => TransactionUncheckedCreateNestedManyWithoutBudgetInputSchema).optional(),
  invitations: z.lazy(() => BudgetUserInvitationUncheckedCreateNestedManyWithoutBudgetInputSchema).optional()
}).strict();

export const BudgetUpdateInputSchema: z.ZodType<Prisma.BudgetUpdateInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  preferredCurrency: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.lazy(() => BudgetTypeSchema),z.lazy(() => EnumBudgetTypeFieldUpdateOperationsInputSchema) ]).optional(),
  periodConfigs: z.lazy(() => BudgetPeriodConfigUpdateManyWithoutBudgetNestedInputSchema).optional(),
  budgetUsers: z.lazy(() => BudgetUserUpdateManyWithoutBudgetNestedInputSchema).optional(),
  transactions: z.lazy(() => TransactionUpdateManyWithoutBudgetNestedInputSchema).optional(),
  invitations: z.lazy(() => BudgetUserInvitationUpdateManyWithoutBudgetNestedInputSchema).optional()
}).strict();

export const BudgetUncheckedUpdateInputSchema: z.ZodType<Prisma.BudgetUncheckedUpdateInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  preferredCurrency: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.lazy(() => BudgetTypeSchema),z.lazy(() => EnumBudgetTypeFieldUpdateOperationsInputSchema) ]).optional(),
  periodConfigs: z.lazy(() => BudgetPeriodConfigUncheckedUpdateManyWithoutBudgetNestedInputSchema).optional(),
  budgetUsers: z.lazy(() => BudgetUserUncheckedUpdateManyWithoutBudgetNestedInputSchema).optional(),
  transactions: z.lazy(() => TransactionUncheckedUpdateManyWithoutBudgetNestedInputSchema).optional(),
  invitations: z.lazy(() => BudgetUserInvitationUncheckedUpdateManyWithoutBudgetNestedInputSchema).optional()
}).strict();

export const BudgetCreateManyInputSchema: z.ZodType<Prisma.BudgetCreateManyInput> = z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  name: z.string(),
  description: z.string().optional().nullable(),
  preferredCurrency: z.string(),
  type: z.lazy(() => BudgetTypeSchema).optional()
}).strict();

export const BudgetUpdateManyMutationInputSchema: z.ZodType<Prisma.BudgetUpdateManyMutationInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  preferredCurrency: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.lazy(() => BudgetTypeSchema),z.lazy(() => EnumBudgetTypeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const BudgetUncheckedUpdateManyInputSchema: z.ZodType<Prisma.BudgetUncheckedUpdateManyInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  preferredCurrency: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.lazy(() => BudgetTypeSchema),z.lazy(() => EnumBudgetTypeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const BudgetPeriodConfigCreateInputSchema: z.ZodType<Prisma.BudgetPeriodConfigCreateInput> = z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  type: z.lazy(() => BudgetPeriodTypeSchema),
  amount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),
  startDate: z.coerce.date().optional().nullable(),
  endDate: z.coerce.date().optional().nullable(),
  budget: z.lazy(() => BudgetCreateNestedOneWithoutPeriodConfigsInputSchema)
}).strict();

export const BudgetPeriodConfigUncheckedCreateInputSchema: z.ZodType<Prisma.BudgetPeriodConfigUncheckedCreateInput> = z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  type: z.lazy(() => BudgetPeriodTypeSchema),
  amount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),
  startDate: z.coerce.date().optional().nullable(),
  endDate: z.coerce.date().optional().nullable(),
  budgetId: z.string()
}).strict();

export const BudgetPeriodConfigUpdateInputSchema: z.ZodType<Prisma.BudgetPeriodConfigUpdateInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.lazy(() => BudgetPeriodTypeSchema),z.lazy(() => EnumBudgetPeriodTypeFieldUpdateOperationsInputSchema) ]).optional(),
  amount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  startDate: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  endDate: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  budget: z.lazy(() => BudgetUpdateOneRequiredWithoutPeriodConfigsNestedInputSchema).optional()
}).strict();

export const BudgetPeriodConfigUncheckedUpdateInputSchema: z.ZodType<Prisma.BudgetPeriodConfigUncheckedUpdateInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.lazy(() => BudgetPeriodTypeSchema),z.lazy(() => EnumBudgetPeriodTypeFieldUpdateOperationsInputSchema) ]).optional(),
  amount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  startDate: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  endDate: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  budgetId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const BudgetPeriodConfigCreateManyInputSchema: z.ZodType<Prisma.BudgetPeriodConfigCreateManyInput> = z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  type: z.lazy(() => BudgetPeriodTypeSchema),
  amount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),
  startDate: z.coerce.date().optional().nullable(),
  endDate: z.coerce.date().optional().nullable(),
  budgetId: z.string()
}).strict();

export const BudgetPeriodConfigUpdateManyMutationInputSchema: z.ZodType<Prisma.BudgetPeriodConfigUpdateManyMutationInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.lazy(() => BudgetPeriodTypeSchema),z.lazy(() => EnumBudgetPeriodTypeFieldUpdateOperationsInputSchema) ]).optional(),
  amount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  startDate: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  endDate: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
}).strict();

export const BudgetPeriodConfigUncheckedUpdateManyInputSchema: z.ZodType<Prisma.BudgetPeriodConfigUncheckedUpdateManyInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.lazy(() => BudgetPeriodTypeSchema),z.lazy(() => EnumBudgetPeriodTypeFieldUpdateOperationsInputSchema) ]).optional(),
  amount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  startDate: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  endDate: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  budgetId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const BudgetUserCreateInputSchema: z.ZodType<Prisma.BudgetUserCreateInput> = z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  permission: z.lazy(() => BudgetUserPermissionSchema),
  user: z.lazy(() => UserCreateNestedOneWithoutBudgetUsersInputSchema),
  budget: z.lazy(() => BudgetCreateNestedOneWithoutBudgetUsersInputSchema)
}).strict();

export const BudgetUserUncheckedCreateInputSchema: z.ZodType<Prisma.BudgetUserUncheckedCreateInput> = z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  permission: z.lazy(() => BudgetUserPermissionSchema),
  userId: z.string(),
  budgetId: z.string()
}).strict();

export const BudgetUserUpdateInputSchema: z.ZodType<Prisma.BudgetUserUpdateInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  permission: z.union([ z.lazy(() => BudgetUserPermissionSchema),z.lazy(() => EnumBudgetUserPermissionFieldUpdateOperationsInputSchema) ]).optional(),
  user: z.lazy(() => UserUpdateOneRequiredWithoutBudgetUsersNestedInputSchema).optional(),
  budget: z.lazy(() => BudgetUpdateOneRequiredWithoutBudgetUsersNestedInputSchema).optional()
}).strict();

export const BudgetUserUncheckedUpdateInputSchema: z.ZodType<Prisma.BudgetUserUncheckedUpdateInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  permission: z.union([ z.lazy(() => BudgetUserPermissionSchema),z.lazy(() => EnumBudgetUserPermissionFieldUpdateOperationsInputSchema) ]).optional(),
  userId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  budgetId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const BudgetUserCreateManyInputSchema: z.ZodType<Prisma.BudgetUserCreateManyInput> = z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  permission: z.lazy(() => BudgetUserPermissionSchema),
  userId: z.string(),
  budgetId: z.string()
}).strict();

export const BudgetUserUpdateManyMutationInputSchema: z.ZodType<Prisma.BudgetUserUpdateManyMutationInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  permission: z.union([ z.lazy(() => BudgetUserPermissionSchema),z.lazy(() => EnumBudgetUserPermissionFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const BudgetUserUncheckedUpdateManyInputSchema: z.ZodType<Prisma.BudgetUserUncheckedUpdateManyInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  permission: z.union([ z.lazy(() => BudgetUserPermissionSchema),z.lazy(() => EnumBudgetUserPermissionFieldUpdateOperationsInputSchema) ]).optional(),
  userId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  budgetId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const BudgetUserInvitationCreateInputSchema: z.ZodType<Prisma.BudgetUserInvitationCreateInput> = z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  email: z.string().optional().nullable(),
  token: z.string().optional(),
  expiresAt: z.coerce.date(),
  permission: z.lazy(() => BudgetUserPermissionSchema).optional().nullable(),
  createdByUser: z.lazy(() => UserCreateNestedOneWithoutCreatedBudgetUserInvitationsInputSchema),
  budget: z.lazy(() => BudgetCreateNestedOneWithoutInvitationsInputSchema),
  responses: z.lazy(() => BudgetUserInvitationResponseCreateNestedManyWithoutInvitationInputSchema).optional()
}).strict();

export const BudgetUserInvitationUncheckedCreateInputSchema: z.ZodType<Prisma.BudgetUserInvitationUncheckedCreateInput> = z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  email: z.string().optional().nullable(),
  token: z.string().optional(),
  expiresAt: z.coerce.date(),
  permission: z.lazy(() => BudgetUserPermissionSchema).optional().nullable(),
  createdByUserId: z.string(),
  budgetId: z.string(),
  responses: z.lazy(() => BudgetUserInvitationResponseUncheckedCreateNestedManyWithoutInvitationInputSchema).optional()
}).strict();

export const BudgetUserInvitationUpdateInputSchema: z.ZodType<Prisma.BudgetUserInvitationUpdateInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  token: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  expiresAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  permission: z.union([ z.lazy(() => BudgetUserPermissionSchema),z.lazy(() => NullableEnumBudgetUserPermissionFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdByUser: z.lazy(() => UserUpdateOneRequiredWithoutCreatedBudgetUserInvitationsNestedInputSchema).optional(),
  budget: z.lazy(() => BudgetUpdateOneRequiredWithoutInvitationsNestedInputSchema).optional(),
  responses: z.lazy(() => BudgetUserInvitationResponseUpdateManyWithoutInvitationNestedInputSchema).optional()
}).strict();

export const BudgetUserInvitationUncheckedUpdateInputSchema: z.ZodType<Prisma.BudgetUserInvitationUncheckedUpdateInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  token: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  expiresAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  permission: z.union([ z.lazy(() => BudgetUserPermissionSchema),z.lazy(() => NullableEnumBudgetUserPermissionFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdByUserId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  budgetId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  responses: z.lazy(() => BudgetUserInvitationResponseUncheckedUpdateManyWithoutInvitationNestedInputSchema).optional()
}).strict();

export const BudgetUserInvitationCreateManyInputSchema: z.ZodType<Prisma.BudgetUserInvitationCreateManyInput> = z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  email: z.string().optional().nullable(),
  token: z.string().optional(),
  expiresAt: z.coerce.date(),
  permission: z.lazy(() => BudgetUserPermissionSchema).optional().nullable(),
  createdByUserId: z.string(),
  budgetId: z.string()
}).strict();

export const BudgetUserInvitationUpdateManyMutationInputSchema: z.ZodType<Prisma.BudgetUserInvitationUpdateManyMutationInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  token: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  expiresAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  permission: z.union([ z.lazy(() => BudgetUserPermissionSchema),z.lazy(() => NullableEnumBudgetUserPermissionFieldUpdateOperationsInputSchema) ]).optional().nullable(),
}).strict();

export const BudgetUserInvitationUncheckedUpdateManyInputSchema: z.ZodType<Prisma.BudgetUserInvitationUncheckedUpdateManyInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  token: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  expiresAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  permission: z.union([ z.lazy(() => BudgetUserPermissionSchema),z.lazy(() => NullableEnumBudgetUserPermissionFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdByUserId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  budgetId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const BudgetUserInvitationResponseCreateInputSchema: z.ZodType<Prisma.BudgetUserInvitationResponseCreateInput> = z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  acceptedAt: z.coerce.date().optional().nullable(),
  declinedAt: z.coerce.date().optional().nullable(),
  invitation: z.lazy(() => BudgetUserInvitationCreateNestedOneWithoutResponsesInputSchema),
  createdUser: z.lazy(() => UserCreateNestedOneWithoutCreatedFromInvitationInputSchema).optional()
}).strict();

export const BudgetUserInvitationResponseUncheckedCreateInputSchema: z.ZodType<Prisma.BudgetUserInvitationResponseUncheckedCreateInput> = z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  acceptedAt: z.coerce.date().optional().nullable(),
  declinedAt: z.coerce.date().optional().nullable(),
  invitationId: z.string(),
  createdUserId: z.string().optional().nullable()
}).strict();

export const BudgetUserInvitationResponseUpdateInputSchema: z.ZodType<Prisma.BudgetUserInvitationResponseUpdateInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  acceptedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  declinedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  invitation: z.lazy(() => BudgetUserInvitationUpdateOneRequiredWithoutResponsesNestedInputSchema).optional(),
  createdUser: z.lazy(() => UserUpdateOneWithoutCreatedFromInvitationNestedInputSchema).optional()
}).strict();

export const BudgetUserInvitationResponseUncheckedUpdateInputSchema: z.ZodType<Prisma.BudgetUserInvitationResponseUncheckedUpdateInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  acceptedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  declinedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  invitationId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdUserId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
}).strict();

export const BudgetUserInvitationResponseCreateManyInputSchema: z.ZodType<Prisma.BudgetUserInvitationResponseCreateManyInput> = z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  acceptedAt: z.coerce.date().optional().nullable(),
  declinedAt: z.coerce.date().optional().nullable(),
  invitationId: z.string(),
  createdUserId: z.string().optional().nullable()
}).strict();

export const BudgetUserInvitationResponseUpdateManyMutationInputSchema: z.ZodType<Prisma.BudgetUserInvitationResponseUpdateManyMutationInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  acceptedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  declinedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
}).strict();

export const BudgetUserInvitationResponseUncheckedUpdateManyInputSchema: z.ZodType<Prisma.BudgetUserInvitationResponseUncheckedUpdateManyInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  acceptedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  declinedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  invitationId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdUserId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
}).strict();

export const TransactionCreateInputSchema: z.ZodType<Prisma.TransactionCreateInput> = z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  amount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),
  amountInVnd: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),
  currency: z.string(),
  date: z.coerce.date(),
  note: z.string().optional().nullable(),
  category: z.lazy(() => CategoryCreateNestedOneWithoutTransactionsInputSchema).optional(),
  budget: z.lazy(() => BudgetCreateNestedOneWithoutTransactionsInputSchema).optional(),
  walletAccount: z.lazy(() => UserWalletAccountCreateNestedOneWithoutTransactionsInputSchema),
  createdByUser: z.lazy(() => UserCreateNestedOneWithoutTransactionsInputSchema)
}).strict();

export const TransactionUncheckedCreateInputSchema: z.ZodType<Prisma.TransactionUncheckedCreateInput> = z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  amount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),
  amountInVnd: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),
  currency: z.string(),
  date: z.coerce.date(),
  note: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  budgetId: z.string().optional().nullable(),
  walletAccountId: z.string(),
  createdByUserId: z.string()
}).strict();

export const TransactionUpdateInputSchema: z.ZodType<Prisma.TransactionUpdateInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  amount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  amountInVnd: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  currency: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  date: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  note: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  category: z.lazy(() => CategoryUpdateOneWithoutTransactionsNestedInputSchema).optional(),
  budget: z.lazy(() => BudgetUpdateOneWithoutTransactionsNestedInputSchema).optional(),
  walletAccount: z.lazy(() => UserWalletAccountUpdateOneRequiredWithoutTransactionsNestedInputSchema).optional(),
  createdByUser: z.lazy(() => UserUpdateOneRequiredWithoutTransactionsNestedInputSchema).optional()
}).strict();

export const TransactionUncheckedUpdateInputSchema: z.ZodType<Prisma.TransactionUncheckedUpdateInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  amount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  amountInVnd: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  currency: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  date: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  note: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  categoryId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  budgetId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  walletAccountId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdByUserId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const TransactionCreateManyInputSchema: z.ZodType<Prisma.TransactionCreateManyInput> = z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  amount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),
  amountInVnd: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),
  currency: z.string(),
  date: z.coerce.date(),
  note: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  budgetId: z.string().optional().nullable(),
  walletAccountId: z.string(),
  createdByUserId: z.string()
}).strict();

export const TransactionUpdateManyMutationInputSchema: z.ZodType<Prisma.TransactionUpdateManyMutationInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  amount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  amountInVnd: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  currency: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  date: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  note: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
}).strict();

export const TransactionUncheckedUpdateManyInputSchema: z.ZodType<Prisma.TransactionUncheckedUpdateManyInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  amount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  amountInVnd: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  currency: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  date: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  note: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  categoryId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  budgetId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  walletAccountId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdByUserId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const CategoryCreateInputSchema: z.ZodType<Prisma.CategoryCreateInput> = z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  type: z.lazy(() => CategoryTypeSchema),
  name: z.string(),
  description: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  user: z.lazy(() => UserCreateNestedOneWithoutCategoriesInputSchema),
  parent: z.lazy(() => CategoryCreateNestedOneWithoutChildrenInputSchema).optional(),
  children: z.lazy(() => CategoryCreateNestedManyWithoutParentInputSchema).optional(),
  transactions: z.lazy(() => TransactionCreateNestedManyWithoutCategoryInputSchema).optional()
}).strict();

export const CategoryUncheckedCreateInputSchema: z.ZodType<Prisma.CategoryUncheckedCreateInput> = z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  type: z.lazy(() => CategoryTypeSchema),
  name: z.string(),
  description: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  userId: z.string(),
  parentId: z.string().optional().nullable(),
  children: z.lazy(() => CategoryUncheckedCreateNestedManyWithoutParentInputSchema).optional(),
  transactions: z.lazy(() => TransactionUncheckedCreateNestedManyWithoutCategoryInputSchema).optional()
}).strict();

export const CategoryUpdateInputSchema: z.ZodType<Prisma.CategoryUpdateInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.lazy(() => CategoryTypeSchema),z.lazy(() => EnumCategoryTypeFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  icon: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  color: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  user: z.lazy(() => UserUpdateOneRequiredWithoutCategoriesNestedInputSchema).optional(),
  parent: z.lazy(() => CategoryUpdateOneWithoutChildrenNestedInputSchema).optional(),
  children: z.lazy(() => CategoryUpdateManyWithoutParentNestedInputSchema).optional(),
  transactions: z.lazy(() => TransactionUpdateManyWithoutCategoryNestedInputSchema).optional()
}).strict();

export const CategoryUncheckedUpdateInputSchema: z.ZodType<Prisma.CategoryUncheckedUpdateInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.lazy(() => CategoryTypeSchema),z.lazy(() => EnumCategoryTypeFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  icon: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  color: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  userId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  parentId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  children: z.lazy(() => CategoryUncheckedUpdateManyWithoutParentNestedInputSchema).optional(),
  transactions: z.lazy(() => TransactionUncheckedUpdateManyWithoutCategoryNestedInputSchema).optional()
}).strict();

export const CategoryCreateManyInputSchema: z.ZodType<Prisma.CategoryCreateManyInput> = z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  type: z.lazy(() => CategoryTypeSchema),
  name: z.string(),
  description: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  userId: z.string(),
  parentId: z.string().optional().nullable()
}).strict();

export const CategoryUpdateManyMutationInputSchema: z.ZodType<Prisma.CategoryUpdateManyMutationInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.lazy(() => CategoryTypeSchema),z.lazy(() => EnumCategoryTypeFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  icon: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  color: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
}).strict();

export const CategoryUncheckedUpdateManyInputSchema: z.ZodType<Prisma.CategoryUncheckedUpdateManyInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.lazy(() => CategoryTypeSchema),z.lazy(() => EnumCategoryTypeFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  icon: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  color: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  userId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  parentId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
}).strict();

export const CachedGptResponseCreateInputSchema: z.ZodType<Prisma.CachedGptResponseCreateInput> = z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  query: z.string(),
  response: z.string()
}).strict();

export const CachedGptResponseUncheckedCreateInputSchema: z.ZodType<Prisma.CachedGptResponseUncheckedCreateInput> = z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  query: z.string(),
  response: z.string()
}).strict();

export const CachedGptResponseUpdateInputSchema: z.ZodType<Prisma.CachedGptResponseUpdateInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  query: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  response: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const CachedGptResponseUncheckedUpdateInputSchema: z.ZodType<Prisma.CachedGptResponseUncheckedUpdateInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  query: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  response: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const CachedGptResponseCreateManyInputSchema: z.ZodType<Prisma.CachedGptResponseCreateManyInput> = z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  query: z.string(),
  response: z.string()
}).strict();

export const CachedGptResponseUpdateManyMutationInputSchema: z.ZodType<Prisma.CachedGptResponseUpdateManyMutationInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  query: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  response: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const CachedGptResponseUncheckedUpdateManyInputSchema: z.ZodType<Prisma.CachedGptResponseUncheckedUpdateManyInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  query: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  response: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const CurrencyExchangeRateCreateInputSchema: z.ZodType<Prisma.CurrencyExchangeRateCreateInput> = z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  fromCurrency: z.string(),
  toCurrency: z.string(),
  rate: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),
  date: z.string()
}).strict();

export const CurrencyExchangeRateUncheckedCreateInputSchema: z.ZodType<Prisma.CurrencyExchangeRateUncheckedCreateInput> = z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  fromCurrency: z.string(),
  toCurrency: z.string(),
  rate: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),
  date: z.string()
}).strict();

export const CurrencyExchangeRateUpdateInputSchema: z.ZodType<Prisma.CurrencyExchangeRateUpdateInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  fromCurrency: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  toCurrency: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  rate: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  date: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const CurrencyExchangeRateUncheckedUpdateInputSchema: z.ZodType<Prisma.CurrencyExchangeRateUncheckedUpdateInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  fromCurrency: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  toCurrency: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  rate: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  date: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const CurrencyExchangeRateCreateManyInputSchema: z.ZodType<Prisma.CurrencyExchangeRateCreateManyInput> = z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  fromCurrency: z.string(),
  toCurrency: z.string(),
  rate: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),
  date: z.string()
}).strict();

export const CurrencyExchangeRateUpdateManyMutationInputSchema: z.ZodType<Prisma.CurrencyExchangeRateUpdateManyMutationInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  fromCurrency: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  toCurrency: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  rate: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  date: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const CurrencyExchangeRateUncheckedUpdateManyInputSchema: z.ZodType<Prisma.CurrencyExchangeRateUncheckedUpdateManyInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  fromCurrency: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  toCurrency: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  rate: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  date: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const StringFilterSchema: z.ZodType<Prisma.StringFilter> = z.object({
  equals: z.string().optional(),
  in: z.string().array().optional(),
  notIn: z.string().array().optional(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  mode: z.lazy(() => QueryModeSchema).optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringFilterSchema) ]).optional(),
}).strict();

export const DateTimeFilterSchema: z.ZodType<Prisma.DateTimeFilter> = z.object({
  equals: z.coerce.date().optional(),
  in: z.coerce.date().array().optional(),
  notIn: z.coerce.date().array().optional(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeFilterSchema) ]).optional(),
}).strict();

export const StringNullableFilterSchema: z.ZodType<Prisma.StringNullableFilter> = z.object({
  equals: z.string().optional().nullable(),
  in: z.string().array().optional().nullable(),
  notIn: z.string().array().optional().nullable(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  mode: z.lazy(() => QueryModeSchema).optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringNullableFilterSchema) ]).optional().nullable(),
}).strict();

export const UserWalletAccountListRelationFilterSchema: z.ZodType<Prisma.UserWalletAccountListRelationFilter> = z.object({
  every: z.lazy(() => UserWalletAccountWhereInputSchema).optional(),
  some: z.lazy(() => UserWalletAccountWhereInputSchema).optional(),
  none: z.lazy(() => UserWalletAccountWhereInputSchema).optional()
}).strict();

export const BudgetUserListRelationFilterSchema: z.ZodType<Prisma.BudgetUserListRelationFilter> = z.object({
  every: z.lazy(() => BudgetUserWhereInputSchema).optional(),
  some: z.lazy(() => BudgetUserWhereInputSchema).optional(),
  none: z.lazy(() => BudgetUserWhereInputSchema).optional()
}).strict();

export const TransactionListRelationFilterSchema: z.ZodType<Prisma.TransactionListRelationFilter> = z.object({
  every: z.lazy(() => TransactionWhereInputSchema).optional(),
  some: z.lazy(() => TransactionWhereInputSchema).optional(),
  none: z.lazy(() => TransactionWhereInputSchema).optional()
}).strict();

export const BudgetUserInvitationListRelationFilterSchema: z.ZodType<Prisma.BudgetUserInvitationListRelationFilter> = z.object({
  every: z.lazy(() => BudgetUserInvitationWhereInputSchema).optional(),
  some: z.lazy(() => BudgetUserInvitationWhereInputSchema).optional(),
  none: z.lazy(() => BudgetUserInvitationWhereInputSchema).optional()
}).strict();

export const BudgetUserInvitationResponseNullableRelationFilterSchema: z.ZodType<Prisma.BudgetUserInvitationResponseNullableRelationFilter> = z.object({
  is: z.lazy(() => BudgetUserInvitationResponseWhereInputSchema).optional().nullable(),
  isNot: z.lazy(() => BudgetUserInvitationResponseWhereInputSchema).optional().nullable()
}).strict();

export const CategoryListRelationFilterSchema: z.ZodType<Prisma.CategoryListRelationFilter> = z.object({
  every: z.lazy(() => CategoryWhereInputSchema).optional(),
  some: z.lazy(() => CategoryWhereInputSchema).optional(),
  none: z.lazy(() => CategoryWhereInputSchema).optional()
}).strict();

export const SortOrderInputSchema: z.ZodType<Prisma.SortOrderInput> = z.object({
  sort: z.lazy(() => SortOrderSchema),
  nulls: z.lazy(() => NullsOrderSchema).optional()
}).strict();

export const UserWalletAccountOrderByRelationAggregateInputSchema: z.ZodType<Prisma.UserWalletAccountOrderByRelationAggregateInput> = z.object({
  _count: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const BudgetUserOrderByRelationAggregateInputSchema: z.ZodType<Prisma.BudgetUserOrderByRelationAggregateInput> = z.object({
  _count: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const TransactionOrderByRelationAggregateInputSchema: z.ZodType<Prisma.TransactionOrderByRelationAggregateInput> = z.object({
  _count: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const BudgetUserInvitationOrderByRelationAggregateInputSchema: z.ZodType<Prisma.BudgetUserInvitationOrderByRelationAggregateInput> = z.object({
  _count: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const CategoryOrderByRelationAggregateInputSchema: z.ZodType<Prisma.CategoryOrderByRelationAggregateInput> = z.object({
  _count: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const UserCountOrderByAggregateInputSchema: z.ZodType<Prisma.UserCountOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  email: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const UserMaxOrderByAggregateInputSchema: z.ZodType<Prisma.UserMaxOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  email: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const UserMinOrderByAggregateInputSchema: z.ZodType<Prisma.UserMinOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  email: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const StringWithAggregatesFilterSchema: z.ZodType<Prisma.StringWithAggregatesFilter> = z.object({
  equals: z.string().optional(),
  in: z.string().array().optional(),
  notIn: z.string().array().optional(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  mode: z.lazy(() => QueryModeSchema).optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedStringFilterSchema).optional(),
  _max: z.lazy(() => NestedStringFilterSchema).optional()
}).strict();

export const DateTimeWithAggregatesFilterSchema: z.ZodType<Prisma.DateTimeWithAggregatesFilter> = z.object({
  equals: z.coerce.date().optional(),
  in: z.coerce.date().array().optional(),
  notIn: z.coerce.date().array().optional(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedDateTimeFilterSchema).optional(),
  _max: z.lazy(() => NestedDateTimeFilterSchema).optional()
}).strict();

export const StringNullableWithAggregatesFilterSchema: z.ZodType<Prisma.StringNullableWithAggregatesFilter> = z.object({
  equals: z.string().optional().nullable(),
  in: z.string().array().optional().nullable(),
  notIn: z.string().array().optional().nullable(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  mode: z.lazy(() => QueryModeSchema).optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedStringNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedStringNullableFilterSchema).optional()
}).strict();

export const UserRelationFilterSchema: z.ZodType<Prisma.UserRelationFilter> = z.object({
  is: z.lazy(() => UserWhereInputSchema).optional(),
  isNot: z.lazy(() => UserWhereInputSchema).optional()
}).strict();

export const UserWalletAccountCountOrderByAggregateInputSchema: z.ZodType<Prisma.UserWalletAccountCountOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  icon: z.lazy(() => SortOrderSchema).optional(),
  description: z.lazy(() => SortOrderSchema).optional(),
  lastDigits: z.lazy(() => SortOrderSchema).optional(),
  preferredCurrency: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const UserWalletAccountMaxOrderByAggregateInputSchema: z.ZodType<Prisma.UserWalletAccountMaxOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  icon: z.lazy(() => SortOrderSchema).optional(),
  description: z.lazy(() => SortOrderSchema).optional(),
  lastDigits: z.lazy(() => SortOrderSchema).optional(),
  preferredCurrency: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const UserWalletAccountMinOrderByAggregateInputSchema: z.ZodType<Prisma.UserWalletAccountMinOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  icon: z.lazy(() => SortOrderSchema).optional(),
  description: z.lazy(() => SortOrderSchema).optional(),
  lastDigits: z.lazy(() => SortOrderSchema).optional(),
  preferredCurrency: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const EnumBudgetTypeFilterSchema: z.ZodType<Prisma.EnumBudgetTypeFilter> = z.object({
  equals: z.lazy(() => BudgetTypeSchema).optional(),
  in: z.lazy(() => BudgetTypeSchema).array().optional(),
  notIn: z.lazy(() => BudgetTypeSchema).array().optional(),
  not: z.union([ z.lazy(() => BudgetTypeSchema),z.lazy(() => NestedEnumBudgetTypeFilterSchema) ]).optional(),
}).strict();

export const BudgetPeriodConfigListRelationFilterSchema: z.ZodType<Prisma.BudgetPeriodConfigListRelationFilter> = z.object({
  every: z.lazy(() => BudgetPeriodConfigWhereInputSchema).optional(),
  some: z.lazy(() => BudgetPeriodConfigWhereInputSchema).optional(),
  none: z.lazy(() => BudgetPeriodConfigWhereInputSchema).optional()
}).strict();

export const BudgetPeriodConfigOrderByRelationAggregateInputSchema: z.ZodType<Prisma.BudgetPeriodConfigOrderByRelationAggregateInput> = z.object({
  _count: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const BudgetCountOrderByAggregateInputSchema: z.ZodType<Prisma.BudgetCountOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  description: z.lazy(() => SortOrderSchema).optional(),
  preferredCurrency: z.lazy(() => SortOrderSchema).optional(),
  type: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const BudgetMaxOrderByAggregateInputSchema: z.ZodType<Prisma.BudgetMaxOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  description: z.lazy(() => SortOrderSchema).optional(),
  preferredCurrency: z.lazy(() => SortOrderSchema).optional(),
  type: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const BudgetMinOrderByAggregateInputSchema: z.ZodType<Prisma.BudgetMinOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  description: z.lazy(() => SortOrderSchema).optional(),
  preferredCurrency: z.lazy(() => SortOrderSchema).optional(),
  type: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const EnumBudgetTypeWithAggregatesFilterSchema: z.ZodType<Prisma.EnumBudgetTypeWithAggregatesFilter> = z.object({
  equals: z.lazy(() => BudgetTypeSchema).optional(),
  in: z.lazy(() => BudgetTypeSchema).array().optional(),
  notIn: z.lazy(() => BudgetTypeSchema).array().optional(),
  not: z.union([ z.lazy(() => BudgetTypeSchema),z.lazy(() => NestedEnumBudgetTypeWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumBudgetTypeFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumBudgetTypeFilterSchema).optional()
}).strict();

export const EnumBudgetPeriodTypeFilterSchema: z.ZodType<Prisma.EnumBudgetPeriodTypeFilter> = z.object({
  equals: z.lazy(() => BudgetPeriodTypeSchema).optional(),
  in: z.lazy(() => BudgetPeriodTypeSchema).array().optional(),
  notIn: z.lazy(() => BudgetPeriodTypeSchema).array().optional(),
  not: z.union([ z.lazy(() => BudgetPeriodTypeSchema),z.lazy(() => NestedEnumBudgetPeriodTypeFilterSchema) ]).optional(),
}).strict();

export const DecimalFilterSchema: z.ZodType<Prisma.DecimalFilter> = z.object({
  equals: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  in: z.union([z.number().array(),z.string().array(),z.instanceof(Decimal).array(),z.instanceof(Prisma.Decimal).array(),DecimalJsLikeSchema.array(),]).refine((v) => Array.isArray(v) && (v as any[]).every((v) => isValidDecimalInput(v)), { message: 'Must be a Decimal' }).optional(),
  notIn: z.union([z.number().array(),z.string().array(),z.instanceof(Decimal).array(),z.instanceof(Prisma.Decimal).array(),DecimalJsLikeSchema.array(),]).refine((v) => Array.isArray(v) && (v as any[]).every((v) => isValidDecimalInput(v)), { message: 'Must be a Decimal' }).optional(),
  lt: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  lte: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  gt: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  gte: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  not: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NestedDecimalFilterSchema) ]).optional(),
}).strict();

export const DateTimeNullableFilterSchema: z.ZodType<Prisma.DateTimeNullableFilter> = z.object({
  equals: z.coerce.date().optional().nullable(),
  in: z.coerce.date().array().optional().nullable(),
  notIn: z.coerce.date().array().optional().nullable(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeNullableFilterSchema) ]).optional().nullable(),
}).strict();

export const BudgetRelationFilterSchema: z.ZodType<Prisma.BudgetRelationFilter> = z.object({
  is: z.lazy(() => BudgetWhereInputSchema).optional(),
  isNot: z.lazy(() => BudgetWhereInputSchema).optional()
}).strict();

export const BudgetPeriodConfigCountOrderByAggregateInputSchema: z.ZodType<Prisma.BudgetPeriodConfigCountOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  type: z.lazy(() => SortOrderSchema).optional(),
  amount: z.lazy(() => SortOrderSchema).optional(),
  startDate: z.lazy(() => SortOrderSchema).optional(),
  endDate: z.lazy(() => SortOrderSchema).optional(),
  budgetId: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const BudgetPeriodConfigAvgOrderByAggregateInputSchema: z.ZodType<Prisma.BudgetPeriodConfigAvgOrderByAggregateInput> = z.object({
  amount: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const BudgetPeriodConfigMaxOrderByAggregateInputSchema: z.ZodType<Prisma.BudgetPeriodConfigMaxOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  type: z.lazy(() => SortOrderSchema).optional(),
  amount: z.lazy(() => SortOrderSchema).optional(),
  startDate: z.lazy(() => SortOrderSchema).optional(),
  endDate: z.lazy(() => SortOrderSchema).optional(),
  budgetId: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const BudgetPeriodConfigMinOrderByAggregateInputSchema: z.ZodType<Prisma.BudgetPeriodConfigMinOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  type: z.lazy(() => SortOrderSchema).optional(),
  amount: z.lazy(() => SortOrderSchema).optional(),
  startDate: z.lazy(() => SortOrderSchema).optional(),
  endDate: z.lazy(() => SortOrderSchema).optional(),
  budgetId: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const BudgetPeriodConfigSumOrderByAggregateInputSchema: z.ZodType<Prisma.BudgetPeriodConfigSumOrderByAggregateInput> = z.object({
  amount: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const EnumBudgetPeriodTypeWithAggregatesFilterSchema: z.ZodType<Prisma.EnumBudgetPeriodTypeWithAggregatesFilter> = z.object({
  equals: z.lazy(() => BudgetPeriodTypeSchema).optional(),
  in: z.lazy(() => BudgetPeriodTypeSchema).array().optional(),
  notIn: z.lazy(() => BudgetPeriodTypeSchema).array().optional(),
  not: z.union([ z.lazy(() => BudgetPeriodTypeSchema),z.lazy(() => NestedEnumBudgetPeriodTypeWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumBudgetPeriodTypeFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumBudgetPeriodTypeFilterSchema).optional()
}).strict();

export const DecimalWithAggregatesFilterSchema: z.ZodType<Prisma.DecimalWithAggregatesFilter> = z.object({
  equals: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  in: z.union([z.number().array(),z.string().array(),z.instanceof(Decimal).array(),z.instanceof(Prisma.Decimal).array(),DecimalJsLikeSchema.array(),]).refine((v) => Array.isArray(v) && (v as any[]).every((v) => isValidDecimalInput(v)), { message: 'Must be a Decimal' }).optional(),
  notIn: z.union([z.number().array(),z.string().array(),z.instanceof(Decimal).array(),z.instanceof(Prisma.Decimal).array(),DecimalJsLikeSchema.array(),]).refine((v) => Array.isArray(v) && (v as any[]).every((v) => isValidDecimalInput(v)), { message: 'Must be a Decimal' }).optional(),
  lt: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  lte: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  gt: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  gte: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  not: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NestedDecimalWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _avg: z.lazy(() => NestedDecimalFilterSchema).optional(),
  _sum: z.lazy(() => NestedDecimalFilterSchema).optional(),
  _min: z.lazy(() => NestedDecimalFilterSchema).optional(),
  _max: z.lazy(() => NestedDecimalFilterSchema).optional()
}).strict();

export const DateTimeNullableWithAggregatesFilterSchema: z.ZodType<Prisma.DateTimeNullableWithAggregatesFilter> = z.object({
  equals: z.coerce.date().optional().nullable(),
  in: z.coerce.date().array().optional().nullable(),
  notIn: z.coerce.date().array().optional().nullable(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedDateTimeNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedDateTimeNullableFilterSchema).optional()
}).strict();

export const EnumBudgetUserPermissionFilterSchema: z.ZodType<Prisma.EnumBudgetUserPermissionFilter> = z.object({
  equals: z.lazy(() => BudgetUserPermissionSchema).optional(),
  in: z.lazy(() => BudgetUserPermissionSchema).array().optional(),
  notIn: z.lazy(() => BudgetUserPermissionSchema).array().optional(),
  not: z.union([ z.lazy(() => BudgetUserPermissionSchema),z.lazy(() => NestedEnumBudgetUserPermissionFilterSchema) ]).optional(),
}).strict();

export const BudgetUserUserIdBudgetIdCompoundUniqueInputSchema: z.ZodType<Prisma.BudgetUserUserIdBudgetIdCompoundUniqueInput> = z.object({
  userId: z.string(),
  budgetId: z.string()
}).strict();

export const BudgetUserCountOrderByAggregateInputSchema: z.ZodType<Prisma.BudgetUserCountOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  permission: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  budgetId: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const BudgetUserMaxOrderByAggregateInputSchema: z.ZodType<Prisma.BudgetUserMaxOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  permission: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  budgetId: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const BudgetUserMinOrderByAggregateInputSchema: z.ZodType<Prisma.BudgetUserMinOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  permission: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  budgetId: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const EnumBudgetUserPermissionWithAggregatesFilterSchema: z.ZodType<Prisma.EnumBudgetUserPermissionWithAggregatesFilter> = z.object({
  equals: z.lazy(() => BudgetUserPermissionSchema).optional(),
  in: z.lazy(() => BudgetUserPermissionSchema).array().optional(),
  notIn: z.lazy(() => BudgetUserPermissionSchema).array().optional(),
  not: z.union([ z.lazy(() => BudgetUserPermissionSchema),z.lazy(() => NestedEnumBudgetUserPermissionWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumBudgetUserPermissionFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumBudgetUserPermissionFilterSchema).optional()
}).strict();

export const EnumBudgetUserPermissionNullableFilterSchema: z.ZodType<Prisma.EnumBudgetUserPermissionNullableFilter> = z.object({
  equals: z.lazy(() => BudgetUserPermissionSchema).optional().nullable(),
  in: z.lazy(() => BudgetUserPermissionSchema).array().optional().nullable(),
  notIn: z.lazy(() => BudgetUserPermissionSchema).array().optional().nullable(),
  not: z.union([ z.lazy(() => BudgetUserPermissionSchema),z.lazy(() => NestedEnumBudgetUserPermissionNullableFilterSchema) ]).optional().nullable(),
}).strict();

export const BudgetUserInvitationResponseListRelationFilterSchema: z.ZodType<Prisma.BudgetUserInvitationResponseListRelationFilter> = z.object({
  every: z.lazy(() => BudgetUserInvitationResponseWhereInputSchema).optional(),
  some: z.lazy(() => BudgetUserInvitationResponseWhereInputSchema).optional(),
  none: z.lazy(() => BudgetUserInvitationResponseWhereInputSchema).optional()
}).strict();

export const BudgetUserInvitationResponseOrderByRelationAggregateInputSchema: z.ZodType<Prisma.BudgetUserInvitationResponseOrderByRelationAggregateInput> = z.object({
  _count: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const BudgetUserInvitationTokenBudgetIdCompoundUniqueInputSchema: z.ZodType<Prisma.BudgetUserInvitationTokenBudgetIdCompoundUniqueInput> = z.object({
  token: z.string(),
  budgetId: z.string()
}).strict();

export const BudgetUserInvitationEmailBudgetIdCompoundUniqueInputSchema: z.ZodType<Prisma.BudgetUserInvitationEmailBudgetIdCompoundUniqueInput> = z.object({
  email: z.string(),
  budgetId: z.string()
}).strict();

export const BudgetUserInvitationCountOrderByAggregateInputSchema: z.ZodType<Prisma.BudgetUserInvitationCountOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  email: z.lazy(() => SortOrderSchema).optional(),
  token: z.lazy(() => SortOrderSchema).optional(),
  expiresAt: z.lazy(() => SortOrderSchema).optional(),
  permission: z.lazy(() => SortOrderSchema).optional(),
  createdByUserId: z.lazy(() => SortOrderSchema).optional(),
  budgetId: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const BudgetUserInvitationMaxOrderByAggregateInputSchema: z.ZodType<Prisma.BudgetUserInvitationMaxOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  email: z.lazy(() => SortOrderSchema).optional(),
  token: z.lazy(() => SortOrderSchema).optional(),
  expiresAt: z.lazy(() => SortOrderSchema).optional(),
  permission: z.lazy(() => SortOrderSchema).optional(),
  createdByUserId: z.lazy(() => SortOrderSchema).optional(),
  budgetId: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const BudgetUserInvitationMinOrderByAggregateInputSchema: z.ZodType<Prisma.BudgetUserInvitationMinOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  email: z.lazy(() => SortOrderSchema).optional(),
  token: z.lazy(() => SortOrderSchema).optional(),
  expiresAt: z.lazy(() => SortOrderSchema).optional(),
  permission: z.lazy(() => SortOrderSchema).optional(),
  createdByUserId: z.lazy(() => SortOrderSchema).optional(),
  budgetId: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const EnumBudgetUserPermissionNullableWithAggregatesFilterSchema: z.ZodType<Prisma.EnumBudgetUserPermissionNullableWithAggregatesFilter> = z.object({
  equals: z.lazy(() => BudgetUserPermissionSchema).optional().nullable(),
  in: z.lazy(() => BudgetUserPermissionSchema).array().optional().nullable(),
  notIn: z.lazy(() => BudgetUserPermissionSchema).array().optional().nullable(),
  not: z.union([ z.lazy(() => BudgetUserPermissionSchema),z.lazy(() => NestedEnumBudgetUserPermissionNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumBudgetUserPermissionNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumBudgetUserPermissionNullableFilterSchema).optional()
}).strict();

export const BudgetUserInvitationRelationFilterSchema: z.ZodType<Prisma.BudgetUserInvitationRelationFilter> = z.object({
  is: z.lazy(() => BudgetUserInvitationWhereInputSchema).optional(),
  isNot: z.lazy(() => BudgetUserInvitationWhereInputSchema).optional()
}).strict();

export const UserNullableRelationFilterSchema: z.ZodType<Prisma.UserNullableRelationFilter> = z.object({
  is: z.lazy(() => UserWhereInputSchema).optional().nullable(),
  isNot: z.lazy(() => UserWhereInputSchema).optional().nullable()
}).strict();

export const BudgetUserInvitationResponseCountOrderByAggregateInputSchema: z.ZodType<Prisma.BudgetUserInvitationResponseCountOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  acceptedAt: z.lazy(() => SortOrderSchema).optional(),
  declinedAt: z.lazy(() => SortOrderSchema).optional(),
  invitationId: z.lazy(() => SortOrderSchema).optional(),
  createdUserId: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const BudgetUserInvitationResponseMaxOrderByAggregateInputSchema: z.ZodType<Prisma.BudgetUserInvitationResponseMaxOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  acceptedAt: z.lazy(() => SortOrderSchema).optional(),
  declinedAt: z.lazy(() => SortOrderSchema).optional(),
  invitationId: z.lazy(() => SortOrderSchema).optional(),
  createdUserId: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const BudgetUserInvitationResponseMinOrderByAggregateInputSchema: z.ZodType<Prisma.BudgetUserInvitationResponseMinOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  acceptedAt: z.lazy(() => SortOrderSchema).optional(),
  declinedAt: z.lazy(() => SortOrderSchema).optional(),
  invitationId: z.lazy(() => SortOrderSchema).optional(),
  createdUserId: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const CategoryNullableRelationFilterSchema: z.ZodType<Prisma.CategoryNullableRelationFilter> = z.object({
  is: z.lazy(() => CategoryWhereInputSchema).optional().nullable(),
  isNot: z.lazy(() => CategoryWhereInputSchema).optional().nullable()
}).strict();

export const BudgetNullableRelationFilterSchema: z.ZodType<Prisma.BudgetNullableRelationFilter> = z.object({
  is: z.lazy(() => BudgetWhereInputSchema).optional().nullable(),
  isNot: z.lazy(() => BudgetWhereInputSchema).optional().nullable()
}).strict();

export const UserWalletAccountRelationFilterSchema: z.ZodType<Prisma.UserWalletAccountRelationFilter> = z.object({
  is: z.lazy(() => UserWalletAccountWhereInputSchema).optional(),
  isNot: z.lazy(() => UserWalletAccountWhereInputSchema).optional()
}).strict();

export const TransactionCountOrderByAggregateInputSchema: z.ZodType<Prisma.TransactionCountOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  amount: z.lazy(() => SortOrderSchema).optional(),
  amountInVnd: z.lazy(() => SortOrderSchema).optional(),
  currency: z.lazy(() => SortOrderSchema).optional(),
  date: z.lazy(() => SortOrderSchema).optional(),
  note: z.lazy(() => SortOrderSchema).optional(),
  categoryId: z.lazy(() => SortOrderSchema).optional(),
  budgetId: z.lazy(() => SortOrderSchema).optional(),
  walletAccountId: z.lazy(() => SortOrderSchema).optional(),
  createdByUserId: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const TransactionAvgOrderByAggregateInputSchema: z.ZodType<Prisma.TransactionAvgOrderByAggregateInput> = z.object({
  amount: z.lazy(() => SortOrderSchema).optional(),
  amountInVnd: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const TransactionMaxOrderByAggregateInputSchema: z.ZodType<Prisma.TransactionMaxOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  amount: z.lazy(() => SortOrderSchema).optional(),
  amountInVnd: z.lazy(() => SortOrderSchema).optional(),
  currency: z.lazy(() => SortOrderSchema).optional(),
  date: z.lazy(() => SortOrderSchema).optional(),
  note: z.lazy(() => SortOrderSchema).optional(),
  categoryId: z.lazy(() => SortOrderSchema).optional(),
  budgetId: z.lazy(() => SortOrderSchema).optional(),
  walletAccountId: z.lazy(() => SortOrderSchema).optional(),
  createdByUserId: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const TransactionMinOrderByAggregateInputSchema: z.ZodType<Prisma.TransactionMinOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  amount: z.lazy(() => SortOrderSchema).optional(),
  amountInVnd: z.lazy(() => SortOrderSchema).optional(),
  currency: z.lazy(() => SortOrderSchema).optional(),
  date: z.lazy(() => SortOrderSchema).optional(),
  note: z.lazy(() => SortOrderSchema).optional(),
  categoryId: z.lazy(() => SortOrderSchema).optional(),
  budgetId: z.lazy(() => SortOrderSchema).optional(),
  walletAccountId: z.lazy(() => SortOrderSchema).optional(),
  createdByUserId: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const TransactionSumOrderByAggregateInputSchema: z.ZodType<Prisma.TransactionSumOrderByAggregateInput> = z.object({
  amount: z.lazy(() => SortOrderSchema).optional(),
  amountInVnd: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const EnumCategoryTypeFilterSchema: z.ZodType<Prisma.EnumCategoryTypeFilter> = z.object({
  equals: z.lazy(() => CategoryTypeSchema).optional(),
  in: z.lazy(() => CategoryTypeSchema).array().optional(),
  notIn: z.lazy(() => CategoryTypeSchema).array().optional(),
  not: z.union([ z.lazy(() => CategoryTypeSchema),z.lazy(() => NestedEnumCategoryTypeFilterSchema) ]).optional(),
}).strict();

export const CategoryCountOrderByAggregateInputSchema: z.ZodType<Prisma.CategoryCountOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  type: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  description: z.lazy(() => SortOrderSchema).optional(),
  icon: z.lazy(() => SortOrderSchema).optional(),
  color: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  parentId: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const CategoryMaxOrderByAggregateInputSchema: z.ZodType<Prisma.CategoryMaxOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  type: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  description: z.lazy(() => SortOrderSchema).optional(),
  icon: z.lazy(() => SortOrderSchema).optional(),
  color: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  parentId: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const CategoryMinOrderByAggregateInputSchema: z.ZodType<Prisma.CategoryMinOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  type: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  description: z.lazy(() => SortOrderSchema).optional(),
  icon: z.lazy(() => SortOrderSchema).optional(),
  color: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  parentId: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const EnumCategoryTypeWithAggregatesFilterSchema: z.ZodType<Prisma.EnumCategoryTypeWithAggregatesFilter> = z.object({
  equals: z.lazy(() => CategoryTypeSchema).optional(),
  in: z.lazy(() => CategoryTypeSchema).array().optional(),
  notIn: z.lazy(() => CategoryTypeSchema).array().optional(),
  not: z.union([ z.lazy(() => CategoryTypeSchema),z.lazy(() => NestedEnumCategoryTypeWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumCategoryTypeFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumCategoryTypeFilterSchema).optional()
}).strict();

export const CachedGptResponseCountOrderByAggregateInputSchema: z.ZodType<Prisma.CachedGptResponseCountOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  query: z.lazy(() => SortOrderSchema).optional(),
  response: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const CachedGptResponseMaxOrderByAggregateInputSchema: z.ZodType<Prisma.CachedGptResponseMaxOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  query: z.lazy(() => SortOrderSchema).optional(),
  response: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const CachedGptResponseMinOrderByAggregateInputSchema: z.ZodType<Prisma.CachedGptResponseMinOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  query: z.lazy(() => SortOrderSchema).optional(),
  response: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const CurrencyExchangeRateFromCurrencyToCurrencyDateCompoundUniqueInputSchema: z.ZodType<Prisma.CurrencyExchangeRateFromCurrencyToCurrencyDateCompoundUniqueInput> = z.object({
  fromCurrency: z.string(),
  toCurrency: z.string(),
  date: z.string()
}).strict();

export const CurrencyExchangeRateCountOrderByAggregateInputSchema: z.ZodType<Prisma.CurrencyExchangeRateCountOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  fromCurrency: z.lazy(() => SortOrderSchema).optional(),
  toCurrency: z.lazy(() => SortOrderSchema).optional(),
  rate: z.lazy(() => SortOrderSchema).optional(),
  date: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const CurrencyExchangeRateAvgOrderByAggregateInputSchema: z.ZodType<Prisma.CurrencyExchangeRateAvgOrderByAggregateInput> = z.object({
  rate: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const CurrencyExchangeRateMaxOrderByAggregateInputSchema: z.ZodType<Prisma.CurrencyExchangeRateMaxOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  fromCurrency: z.lazy(() => SortOrderSchema).optional(),
  toCurrency: z.lazy(() => SortOrderSchema).optional(),
  rate: z.lazy(() => SortOrderSchema).optional(),
  date: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const CurrencyExchangeRateMinOrderByAggregateInputSchema: z.ZodType<Prisma.CurrencyExchangeRateMinOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  fromCurrency: z.lazy(() => SortOrderSchema).optional(),
  toCurrency: z.lazy(() => SortOrderSchema).optional(),
  rate: z.lazy(() => SortOrderSchema).optional(),
  date: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const CurrencyExchangeRateSumOrderByAggregateInputSchema: z.ZodType<Prisma.CurrencyExchangeRateSumOrderByAggregateInput> = z.object({
  rate: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const UserWalletAccountCreateNestedManyWithoutUserInputSchema: z.ZodType<Prisma.UserWalletAccountCreateNestedManyWithoutUserInput> = z.object({
  create: z.union([ z.lazy(() => UserWalletAccountCreateWithoutUserInputSchema),z.lazy(() => UserWalletAccountCreateWithoutUserInputSchema).array(),z.lazy(() => UserWalletAccountUncheckedCreateWithoutUserInputSchema),z.lazy(() => UserWalletAccountUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => UserWalletAccountCreateOrConnectWithoutUserInputSchema),z.lazy(() => UserWalletAccountCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => UserWalletAccountCreateManyUserInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => UserWalletAccountWhereUniqueInputSchema),z.lazy(() => UserWalletAccountWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export const BudgetUserCreateNestedManyWithoutUserInputSchema: z.ZodType<Prisma.BudgetUserCreateNestedManyWithoutUserInput> = z.object({
  create: z.union([ z.lazy(() => BudgetUserCreateWithoutUserInputSchema),z.lazy(() => BudgetUserCreateWithoutUserInputSchema).array(),z.lazy(() => BudgetUserUncheckedCreateWithoutUserInputSchema),z.lazy(() => BudgetUserUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => BudgetUserCreateOrConnectWithoutUserInputSchema),z.lazy(() => BudgetUserCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => BudgetUserCreateManyUserInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => BudgetUserWhereUniqueInputSchema),z.lazy(() => BudgetUserWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export const TransactionCreateNestedManyWithoutCreatedByUserInputSchema: z.ZodType<Prisma.TransactionCreateNestedManyWithoutCreatedByUserInput> = z.object({
  create: z.union([ z.lazy(() => TransactionCreateWithoutCreatedByUserInputSchema),z.lazy(() => TransactionCreateWithoutCreatedByUserInputSchema).array(),z.lazy(() => TransactionUncheckedCreateWithoutCreatedByUserInputSchema),z.lazy(() => TransactionUncheckedCreateWithoutCreatedByUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => TransactionCreateOrConnectWithoutCreatedByUserInputSchema),z.lazy(() => TransactionCreateOrConnectWithoutCreatedByUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => TransactionCreateManyCreatedByUserInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => TransactionWhereUniqueInputSchema),z.lazy(() => TransactionWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export const BudgetUserInvitationCreateNestedManyWithoutCreatedByUserInputSchema: z.ZodType<Prisma.BudgetUserInvitationCreateNestedManyWithoutCreatedByUserInput> = z.object({
  create: z.union([ z.lazy(() => BudgetUserInvitationCreateWithoutCreatedByUserInputSchema),z.lazy(() => BudgetUserInvitationCreateWithoutCreatedByUserInputSchema).array(),z.lazy(() => BudgetUserInvitationUncheckedCreateWithoutCreatedByUserInputSchema),z.lazy(() => BudgetUserInvitationUncheckedCreateWithoutCreatedByUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => BudgetUserInvitationCreateOrConnectWithoutCreatedByUserInputSchema),z.lazy(() => BudgetUserInvitationCreateOrConnectWithoutCreatedByUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => BudgetUserInvitationCreateManyCreatedByUserInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => BudgetUserInvitationWhereUniqueInputSchema),z.lazy(() => BudgetUserInvitationWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export const BudgetUserInvitationResponseCreateNestedOneWithoutCreatedUserInputSchema: z.ZodType<Prisma.BudgetUserInvitationResponseCreateNestedOneWithoutCreatedUserInput> = z.object({
  create: z.union([ z.lazy(() => BudgetUserInvitationResponseCreateWithoutCreatedUserInputSchema),z.lazy(() => BudgetUserInvitationResponseUncheckedCreateWithoutCreatedUserInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => BudgetUserInvitationResponseCreateOrConnectWithoutCreatedUserInputSchema).optional(),
  connect: z.lazy(() => BudgetUserInvitationResponseWhereUniqueInputSchema).optional()
}).strict();

export const CategoryCreateNestedManyWithoutUserInputSchema: z.ZodType<Prisma.CategoryCreateNestedManyWithoutUserInput> = z.object({
  create: z.union([ z.lazy(() => CategoryCreateWithoutUserInputSchema),z.lazy(() => CategoryCreateWithoutUserInputSchema).array(),z.lazy(() => CategoryUncheckedCreateWithoutUserInputSchema),z.lazy(() => CategoryUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => CategoryCreateOrConnectWithoutUserInputSchema),z.lazy(() => CategoryCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => CategoryCreateManyUserInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => CategoryWhereUniqueInputSchema),z.lazy(() => CategoryWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export const UserWalletAccountUncheckedCreateNestedManyWithoutUserInputSchema: z.ZodType<Prisma.UserWalletAccountUncheckedCreateNestedManyWithoutUserInput> = z.object({
  create: z.union([ z.lazy(() => UserWalletAccountCreateWithoutUserInputSchema),z.lazy(() => UserWalletAccountCreateWithoutUserInputSchema).array(),z.lazy(() => UserWalletAccountUncheckedCreateWithoutUserInputSchema),z.lazy(() => UserWalletAccountUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => UserWalletAccountCreateOrConnectWithoutUserInputSchema),z.lazy(() => UserWalletAccountCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => UserWalletAccountCreateManyUserInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => UserWalletAccountWhereUniqueInputSchema),z.lazy(() => UserWalletAccountWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export const BudgetUserUncheckedCreateNestedManyWithoutUserInputSchema: z.ZodType<Prisma.BudgetUserUncheckedCreateNestedManyWithoutUserInput> = z.object({
  create: z.union([ z.lazy(() => BudgetUserCreateWithoutUserInputSchema),z.lazy(() => BudgetUserCreateWithoutUserInputSchema).array(),z.lazy(() => BudgetUserUncheckedCreateWithoutUserInputSchema),z.lazy(() => BudgetUserUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => BudgetUserCreateOrConnectWithoutUserInputSchema),z.lazy(() => BudgetUserCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => BudgetUserCreateManyUserInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => BudgetUserWhereUniqueInputSchema),z.lazy(() => BudgetUserWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export const TransactionUncheckedCreateNestedManyWithoutCreatedByUserInputSchema: z.ZodType<Prisma.TransactionUncheckedCreateNestedManyWithoutCreatedByUserInput> = z.object({
  create: z.union([ z.lazy(() => TransactionCreateWithoutCreatedByUserInputSchema),z.lazy(() => TransactionCreateWithoutCreatedByUserInputSchema).array(),z.lazy(() => TransactionUncheckedCreateWithoutCreatedByUserInputSchema),z.lazy(() => TransactionUncheckedCreateWithoutCreatedByUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => TransactionCreateOrConnectWithoutCreatedByUserInputSchema),z.lazy(() => TransactionCreateOrConnectWithoutCreatedByUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => TransactionCreateManyCreatedByUserInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => TransactionWhereUniqueInputSchema),z.lazy(() => TransactionWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export const BudgetUserInvitationUncheckedCreateNestedManyWithoutCreatedByUserInputSchema: z.ZodType<Prisma.BudgetUserInvitationUncheckedCreateNestedManyWithoutCreatedByUserInput> = z.object({
  create: z.union([ z.lazy(() => BudgetUserInvitationCreateWithoutCreatedByUserInputSchema),z.lazy(() => BudgetUserInvitationCreateWithoutCreatedByUserInputSchema).array(),z.lazy(() => BudgetUserInvitationUncheckedCreateWithoutCreatedByUserInputSchema),z.lazy(() => BudgetUserInvitationUncheckedCreateWithoutCreatedByUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => BudgetUserInvitationCreateOrConnectWithoutCreatedByUserInputSchema),z.lazy(() => BudgetUserInvitationCreateOrConnectWithoutCreatedByUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => BudgetUserInvitationCreateManyCreatedByUserInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => BudgetUserInvitationWhereUniqueInputSchema),z.lazy(() => BudgetUserInvitationWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export const BudgetUserInvitationResponseUncheckedCreateNestedOneWithoutCreatedUserInputSchema: z.ZodType<Prisma.BudgetUserInvitationResponseUncheckedCreateNestedOneWithoutCreatedUserInput> = z.object({
  create: z.union([ z.lazy(() => BudgetUserInvitationResponseCreateWithoutCreatedUserInputSchema),z.lazy(() => BudgetUserInvitationResponseUncheckedCreateWithoutCreatedUserInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => BudgetUserInvitationResponseCreateOrConnectWithoutCreatedUserInputSchema).optional(),
  connect: z.lazy(() => BudgetUserInvitationResponseWhereUniqueInputSchema).optional()
}).strict();

export const CategoryUncheckedCreateNestedManyWithoutUserInputSchema: z.ZodType<Prisma.CategoryUncheckedCreateNestedManyWithoutUserInput> = z.object({
  create: z.union([ z.lazy(() => CategoryCreateWithoutUserInputSchema),z.lazy(() => CategoryCreateWithoutUserInputSchema).array(),z.lazy(() => CategoryUncheckedCreateWithoutUserInputSchema),z.lazy(() => CategoryUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => CategoryCreateOrConnectWithoutUserInputSchema),z.lazy(() => CategoryCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => CategoryCreateManyUserInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => CategoryWhereUniqueInputSchema),z.lazy(() => CategoryWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export const StringFieldUpdateOperationsInputSchema: z.ZodType<Prisma.StringFieldUpdateOperationsInput> = z.object({
  set: z.string().optional()
}).strict();

export const DateTimeFieldUpdateOperationsInputSchema: z.ZodType<Prisma.DateTimeFieldUpdateOperationsInput> = z.object({
  set: z.coerce.date().optional()
}).strict();

export const NullableStringFieldUpdateOperationsInputSchema: z.ZodType<Prisma.NullableStringFieldUpdateOperationsInput> = z.object({
  set: z.string().optional().nullable()
}).strict();

export const UserWalletAccountUpdateManyWithoutUserNestedInputSchema: z.ZodType<Prisma.UserWalletAccountUpdateManyWithoutUserNestedInput> = z.object({
  create: z.union([ z.lazy(() => UserWalletAccountCreateWithoutUserInputSchema),z.lazy(() => UserWalletAccountCreateWithoutUserInputSchema).array(),z.lazy(() => UserWalletAccountUncheckedCreateWithoutUserInputSchema),z.lazy(() => UserWalletAccountUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => UserWalletAccountCreateOrConnectWithoutUserInputSchema),z.lazy(() => UserWalletAccountCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => UserWalletAccountUpsertWithWhereUniqueWithoutUserInputSchema),z.lazy(() => UserWalletAccountUpsertWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => UserWalletAccountCreateManyUserInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => UserWalletAccountWhereUniqueInputSchema),z.lazy(() => UserWalletAccountWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => UserWalletAccountWhereUniqueInputSchema),z.lazy(() => UserWalletAccountWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => UserWalletAccountWhereUniqueInputSchema),z.lazy(() => UserWalletAccountWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => UserWalletAccountWhereUniqueInputSchema),z.lazy(() => UserWalletAccountWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => UserWalletAccountUpdateWithWhereUniqueWithoutUserInputSchema),z.lazy(() => UserWalletAccountUpdateWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => UserWalletAccountUpdateManyWithWhereWithoutUserInputSchema),z.lazy(() => UserWalletAccountUpdateManyWithWhereWithoutUserInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => UserWalletAccountScalarWhereInputSchema),z.lazy(() => UserWalletAccountScalarWhereInputSchema).array() ]).optional(),
}).strict();

export const BudgetUserUpdateManyWithoutUserNestedInputSchema: z.ZodType<Prisma.BudgetUserUpdateManyWithoutUserNestedInput> = z.object({
  create: z.union([ z.lazy(() => BudgetUserCreateWithoutUserInputSchema),z.lazy(() => BudgetUserCreateWithoutUserInputSchema).array(),z.lazy(() => BudgetUserUncheckedCreateWithoutUserInputSchema),z.lazy(() => BudgetUserUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => BudgetUserCreateOrConnectWithoutUserInputSchema),z.lazy(() => BudgetUserCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => BudgetUserUpsertWithWhereUniqueWithoutUserInputSchema),z.lazy(() => BudgetUserUpsertWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => BudgetUserCreateManyUserInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => BudgetUserWhereUniqueInputSchema),z.lazy(() => BudgetUserWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => BudgetUserWhereUniqueInputSchema),z.lazy(() => BudgetUserWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => BudgetUserWhereUniqueInputSchema),z.lazy(() => BudgetUserWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => BudgetUserWhereUniqueInputSchema),z.lazy(() => BudgetUserWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => BudgetUserUpdateWithWhereUniqueWithoutUserInputSchema),z.lazy(() => BudgetUserUpdateWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => BudgetUserUpdateManyWithWhereWithoutUserInputSchema),z.lazy(() => BudgetUserUpdateManyWithWhereWithoutUserInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => BudgetUserScalarWhereInputSchema),z.lazy(() => BudgetUserScalarWhereInputSchema).array() ]).optional(),
}).strict();

export const TransactionUpdateManyWithoutCreatedByUserNestedInputSchema: z.ZodType<Prisma.TransactionUpdateManyWithoutCreatedByUserNestedInput> = z.object({
  create: z.union([ z.lazy(() => TransactionCreateWithoutCreatedByUserInputSchema),z.lazy(() => TransactionCreateWithoutCreatedByUserInputSchema).array(),z.lazy(() => TransactionUncheckedCreateWithoutCreatedByUserInputSchema),z.lazy(() => TransactionUncheckedCreateWithoutCreatedByUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => TransactionCreateOrConnectWithoutCreatedByUserInputSchema),z.lazy(() => TransactionCreateOrConnectWithoutCreatedByUserInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => TransactionUpsertWithWhereUniqueWithoutCreatedByUserInputSchema),z.lazy(() => TransactionUpsertWithWhereUniqueWithoutCreatedByUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => TransactionCreateManyCreatedByUserInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => TransactionWhereUniqueInputSchema),z.lazy(() => TransactionWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => TransactionWhereUniqueInputSchema),z.lazy(() => TransactionWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => TransactionWhereUniqueInputSchema),z.lazy(() => TransactionWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => TransactionWhereUniqueInputSchema),z.lazy(() => TransactionWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => TransactionUpdateWithWhereUniqueWithoutCreatedByUserInputSchema),z.lazy(() => TransactionUpdateWithWhereUniqueWithoutCreatedByUserInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => TransactionUpdateManyWithWhereWithoutCreatedByUserInputSchema),z.lazy(() => TransactionUpdateManyWithWhereWithoutCreatedByUserInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => TransactionScalarWhereInputSchema),z.lazy(() => TransactionScalarWhereInputSchema).array() ]).optional(),
}).strict();

export const BudgetUserInvitationUpdateManyWithoutCreatedByUserNestedInputSchema: z.ZodType<Prisma.BudgetUserInvitationUpdateManyWithoutCreatedByUserNestedInput> = z.object({
  create: z.union([ z.lazy(() => BudgetUserInvitationCreateWithoutCreatedByUserInputSchema),z.lazy(() => BudgetUserInvitationCreateWithoutCreatedByUserInputSchema).array(),z.lazy(() => BudgetUserInvitationUncheckedCreateWithoutCreatedByUserInputSchema),z.lazy(() => BudgetUserInvitationUncheckedCreateWithoutCreatedByUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => BudgetUserInvitationCreateOrConnectWithoutCreatedByUserInputSchema),z.lazy(() => BudgetUserInvitationCreateOrConnectWithoutCreatedByUserInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => BudgetUserInvitationUpsertWithWhereUniqueWithoutCreatedByUserInputSchema),z.lazy(() => BudgetUserInvitationUpsertWithWhereUniqueWithoutCreatedByUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => BudgetUserInvitationCreateManyCreatedByUserInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => BudgetUserInvitationWhereUniqueInputSchema),z.lazy(() => BudgetUserInvitationWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => BudgetUserInvitationWhereUniqueInputSchema),z.lazy(() => BudgetUserInvitationWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => BudgetUserInvitationWhereUniqueInputSchema),z.lazy(() => BudgetUserInvitationWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => BudgetUserInvitationWhereUniqueInputSchema),z.lazy(() => BudgetUserInvitationWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => BudgetUserInvitationUpdateWithWhereUniqueWithoutCreatedByUserInputSchema),z.lazy(() => BudgetUserInvitationUpdateWithWhereUniqueWithoutCreatedByUserInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => BudgetUserInvitationUpdateManyWithWhereWithoutCreatedByUserInputSchema),z.lazy(() => BudgetUserInvitationUpdateManyWithWhereWithoutCreatedByUserInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => BudgetUserInvitationScalarWhereInputSchema),z.lazy(() => BudgetUserInvitationScalarWhereInputSchema).array() ]).optional(),
}).strict();

export const BudgetUserInvitationResponseUpdateOneWithoutCreatedUserNestedInputSchema: z.ZodType<Prisma.BudgetUserInvitationResponseUpdateOneWithoutCreatedUserNestedInput> = z.object({
  create: z.union([ z.lazy(() => BudgetUserInvitationResponseCreateWithoutCreatedUserInputSchema),z.lazy(() => BudgetUserInvitationResponseUncheckedCreateWithoutCreatedUserInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => BudgetUserInvitationResponseCreateOrConnectWithoutCreatedUserInputSchema).optional(),
  upsert: z.lazy(() => BudgetUserInvitationResponseUpsertWithoutCreatedUserInputSchema).optional(),
  disconnect: z.union([ z.boolean(),z.lazy(() => BudgetUserInvitationResponseWhereInputSchema) ]).optional(),
  delete: z.union([ z.boolean(),z.lazy(() => BudgetUserInvitationResponseWhereInputSchema) ]).optional(),
  connect: z.lazy(() => BudgetUserInvitationResponseWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => BudgetUserInvitationResponseUpdateToOneWithWhereWithoutCreatedUserInputSchema),z.lazy(() => BudgetUserInvitationResponseUpdateWithoutCreatedUserInputSchema),z.lazy(() => BudgetUserInvitationResponseUncheckedUpdateWithoutCreatedUserInputSchema) ]).optional(),
}).strict();

export const CategoryUpdateManyWithoutUserNestedInputSchema: z.ZodType<Prisma.CategoryUpdateManyWithoutUserNestedInput> = z.object({
  create: z.union([ z.lazy(() => CategoryCreateWithoutUserInputSchema),z.lazy(() => CategoryCreateWithoutUserInputSchema).array(),z.lazy(() => CategoryUncheckedCreateWithoutUserInputSchema),z.lazy(() => CategoryUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => CategoryCreateOrConnectWithoutUserInputSchema),z.lazy(() => CategoryCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => CategoryUpsertWithWhereUniqueWithoutUserInputSchema),z.lazy(() => CategoryUpsertWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => CategoryCreateManyUserInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => CategoryWhereUniqueInputSchema),z.lazy(() => CategoryWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => CategoryWhereUniqueInputSchema),z.lazy(() => CategoryWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => CategoryWhereUniqueInputSchema),z.lazy(() => CategoryWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => CategoryWhereUniqueInputSchema),z.lazy(() => CategoryWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => CategoryUpdateWithWhereUniqueWithoutUserInputSchema),z.lazy(() => CategoryUpdateWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => CategoryUpdateManyWithWhereWithoutUserInputSchema),z.lazy(() => CategoryUpdateManyWithWhereWithoutUserInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => CategoryScalarWhereInputSchema),z.lazy(() => CategoryScalarWhereInputSchema).array() ]).optional(),
}).strict();

export const UserWalletAccountUncheckedUpdateManyWithoutUserNestedInputSchema: z.ZodType<Prisma.UserWalletAccountUncheckedUpdateManyWithoutUserNestedInput> = z.object({
  create: z.union([ z.lazy(() => UserWalletAccountCreateWithoutUserInputSchema),z.lazy(() => UserWalletAccountCreateWithoutUserInputSchema).array(),z.lazy(() => UserWalletAccountUncheckedCreateWithoutUserInputSchema),z.lazy(() => UserWalletAccountUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => UserWalletAccountCreateOrConnectWithoutUserInputSchema),z.lazy(() => UserWalletAccountCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => UserWalletAccountUpsertWithWhereUniqueWithoutUserInputSchema),z.lazy(() => UserWalletAccountUpsertWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => UserWalletAccountCreateManyUserInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => UserWalletAccountWhereUniqueInputSchema),z.lazy(() => UserWalletAccountWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => UserWalletAccountWhereUniqueInputSchema),z.lazy(() => UserWalletAccountWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => UserWalletAccountWhereUniqueInputSchema),z.lazy(() => UserWalletAccountWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => UserWalletAccountWhereUniqueInputSchema),z.lazy(() => UserWalletAccountWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => UserWalletAccountUpdateWithWhereUniqueWithoutUserInputSchema),z.lazy(() => UserWalletAccountUpdateWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => UserWalletAccountUpdateManyWithWhereWithoutUserInputSchema),z.lazy(() => UserWalletAccountUpdateManyWithWhereWithoutUserInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => UserWalletAccountScalarWhereInputSchema),z.lazy(() => UserWalletAccountScalarWhereInputSchema).array() ]).optional(),
}).strict();

export const BudgetUserUncheckedUpdateManyWithoutUserNestedInputSchema: z.ZodType<Prisma.BudgetUserUncheckedUpdateManyWithoutUserNestedInput> = z.object({
  create: z.union([ z.lazy(() => BudgetUserCreateWithoutUserInputSchema),z.lazy(() => BudgetUserCreateWithoutUserInputSchema).array(),z.lazy(() => BudgetUserUncheckedCreateWithoutUserInputSchema),z.lazy(() => BudgetUserUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => BudgetUserCreateOrConnectWithoutUserInputSchema),z.lazy(() => BudgetUserCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => BudgetUserUpsertWithWhereUniqueWithoutUserInputSchema),z.lazy(() => BudgetUserUpsertWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => BudgetUserCreateManyUserInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => BudgetUserWhereUniqueInputSchema),z.lazy(() => BudgetUserWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => BudgetUserWhereUniqueInputSchema),z.lazy(() => BudgetUserWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => BudgetUserWhereUniqueInputSchema),z.lazy(() => BudgetUserWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => BudgetUserWhereUniqueInputSchema),z.lazy(() => BudgetUserWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => BudgetUserUpdateWithWhereUniqueWithoutUserInputSchema),z.lazy(() => BudgetUserUpdateWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => BudgetUserUpdateManyWithWhereWithoutUserInputSchema),z.lazy(() => BudgetUserUpdateManyWithWhereWithoutUserInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => BudgetUserScalarWhereInputSchema),z.lazy(() => BudgetUserScalarWhereInputSchema).array() ]).optional(),
}).strict();

export const TransactionUncheckedUpdateManyWithoutCreatedByUserNestedInputSchema: z.ZodType<Prisma.TransactionUncheckedUpdateManyWithoutCreatedByUserNestedInput> = z.object({
  create: z.union([ z.lazy(() => TransactionCreateWithoutCreatedByUserInputSchema),z.lazy(() => TransactionCreateWithoutCreatedByUserInputSchema).array(),z.lazy(() => TransactionUncheckedCreateWithoutCreatedByUserInputSchema),z.lazy(() => TransactionUncheckedCreateWithoutCreatedByUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => TransactionCreateOrConnectWithoutCreatedByUserInputSchema),z.lazy(() => TransactionCreateOrConnectWithoutCreatedByUserInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => TransactionUpsertWithWhereUniqueWithoutCreatedByUserInputSchema),z.lazy(() => TransactionUpsertWithWhereUniqueWithoutCreatedByUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => TransactionCreateManyCreatedByUserInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => TransactionWhereUniqueInputSchema),z.lazy(() => TransactionWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => TransactionWhereUniqueInputSchema),z.lazy(() => TransactionWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => TransactionWhereUniqueInputSchema),z.lazy(() => TransactionWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => TransactionWhereUniqueInputSchema),z.lazy(() => TransactionWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => TransactionUpdateWithWhereUniqueWithoutCreatedByUserInputSchema),z.lazy(() => TransactionUpdateWithWhereUniqueWithoutCreatedByUserInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => TransactionUpdateManyWithWhereWithoutCreatedByUserInputSchema),z.lazy(() => TransactionUpdateManyWithWhereWithoutCreatedByUserInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => TransactionScalarWhereInputSchema),z.lazy(() => TransactionScalarWhereInputSchema).array() ]).optional(),
}).strict();

export const BudgetUserInvitationUncheckedUpdateManyWithoutCreatedByUserNestedInputSchema: z.ZodType<Prisma.BudgetUserInvitationUncheckedUpdateManyWithoutCreatedByUserNestedInput> = z.object({
  create: z.union([ z.lazy(() => BudgetUserInvitationCreateWithoutCreatedByUserInputSchema),z.lazy(() => BudgetUserInvitationCreateWithoutCreatedByUserInputSchema).array(),z.lazy(() => BudgetUserInvitationUncheckedCreateWithoutCreatedByUserInputSchema),z.lazy(() => BudgetUserInvitationUncheckedCreateWithoutCreatedByUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => BudgetUserInvitationCreateOrConnectWithoutCreatedByUserInputSchema),z.lazy(() => BudgetUserInvitationCreateOrConnectWithoutCreatedByUserInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => BudgetUserInvitationUpsertWithWhereUniqueWithoutCreatedByUserInputSchema),z.lazy(() => BudgetUserInvitationUpsertWithWhereUniqueWithoutCreatedByUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => BudgetUserInvitationCreateManyCreatedByUserInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => BudgetUserInvitationWhereUniqueInputSchema),z.lazy(() => BudgetUserInvitationWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => BudgetUserInvitationWhereUniqueInputSchema),z.lazy(() => BudgetUserInvitationWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => BudgetUserInvitationWhereUniqueInputSchema),z.lazy(() => BudgetUserInvitationWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => BudgetUserInvitationWhereUniqueInputSchema),z.lazy(() => BudgetUserInvitationWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => BudgetUserInvitationUpdateWithWhereUniqueWithoutCreatedByUserInputSchema),z.lazy(() => BudgetUserInvitationUpdateWithWhereUniqueWithoutCreatedByUserInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => BudgetUserInvitationUpdateManyWithWhereWithoutCreatedByUserInputSchema),z.lazy(() => BudgetUserInvitationUpdateManyWithWhereWithoutCreatedByUserInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => BudgetUserInvitationScalarWhereInputSchema),z.lazy(() => BudgetUserInvitationScalarWhereInputSchema).array() ]).optional(),
}).strict();

export const BudgetUserInvitationResponseUncheckedUpdateOneWithoutCreatedUserNestedInputSchema: z.ZodType<Prisma.BudgetUserInvitationResponseUncheckedUpdateOneWithoutCreatedUserNestedInput> = z.object({
  create: z.union([ z.lazy(() => BudgetUserInvitationResponseCreateWithoutCreatedUserInputSchema),z.lazy(() => BudgetUserInvitationResponseUncheckedCreateWithoutCreatedUserInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => BudgetUserInvitationResponseCreateOrConnectWithoutCreatedUserInputSchema).optional(),
  upsert: z.lazy(() => BudgetUserInvitationResponseUpsertWithoutCreatedUserInputSchema).optional(),
  disconnect: z.union([ z.boolean(),z.lazy(() => BudgetUserInvitationResponseWhereInputSchema) ]).optional(),
  delete: z.union([ z.boolean(),z.lazy(() => BudgetUserInvitationResponseWhereInputSchema) ]).optional(),
  connect: z.lazy(() => BudgetUserInvitationResponseWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => BudgetUserInvitationResponseUpdateToOneWithWhereWithoutCreatedUserInputSchema),z.lazy(() => BudgetUserInvitationResponseUpdateWithoutCreatedUserInputSchema),z.lazy(() => BudgetUserInvitationResponseUncheckedUpdateWithoutCreatedUserInputSchema) ]).optional(),
}).strict();

export const CategoryUncheckedUpdateManyWithoutUserNestedInputSchema: z.ZodType<Prisma.CategoryUncheckedUpdateManyWithoutUserNestedInput> = z.object({
  create: z.union([ z.lazy(() => CategoryCreateWithoutUserInputSchema),z.lazy(() => CategoryCreateWithoutUserInputSchema).array(),z.lazy(() => CategoryUncheckedCreateWithoutUserInputSchema),z.lazy(() => CategoryUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => CategoryCreateOrConnectWithoutUserInputSchema),z.lazy(() => CategoryCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => CategoryUpsertWithWhereUniqueWithoutUserInputSchema),z.lazy(() => CategoryUpsertWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => CategoryCreateManyUserInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => CategoryWhereUniqueInputSchema),z.lazy(() => CategoryWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => CategoryWhereUniqueInputSchema),z.lazy(() => CategoryWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => CategoryWhereUniqueInputSchema),z.lazy(() => CategoryWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => CategoryWhereUniqueInputSchema),z.lazy(() => CategoryWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => CategoryUpdateWithWhereUniqueWithoutUserInputSchema),z.lazy(() => CategoryUpdateWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => CategoryUpdateManyWithWhereWithoutUserInputSchema),z.lazy(() => CategoryUpdateManyWithWhereWithoutUserInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => CategoryScalarWhereInputSchema),z.lazy(() => CategoryScalarWhereInputSchema).array() ]).optional(),
}).strict();

export const UserCreateNestedOneWithoutWalletAccountsInputSchema: z.ZodType<Prisma.UserCreateNestedOneWithoutWalletAccountsInput> = z.object({
  create: z.union([ z.lazy(() => UserCreateWithoutWalletAccountsInputSchema),z.lazy(() => UserUncheckedCreateWithoutWalletAccountsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutWalletAccountsInputSchema).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional()
}).strict();

export const TransactionCreateNestedManyWithoutWalletAccountInputSchema: z.ZodType<Prisma.TransactionCreateNestedManyWithoutWalletAccountInput> = z.object({
  create: z.union([ z.lazy(() => TransactionCreateWithoutWalletAccountInputSchema),z.lazy(() => TransactionCreateWithoutWalletAccountInputSchema).array(),z.lazy(() => TransactionUncheckedCreateWithoutWalletAccountInputSchema),z.lazy(() => TransactionUncheckedCreateWithoutWalletAccountInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => TransactionCreateOrConnectWithoutWalletAccountInputSchema),z.lazy(() => TransactionCreateOrConnectWithoutWalletAccountInputSchema).array() ]).optional(),
  createMany: z.lazy(() => TransactionCreateManyWalletAccountInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => TransactionWhereUniqueInputSchema),z.lazy(() => TransactionWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export const TransactionUncheckedCreateNestedManyWithoutWalletAccountInputSchema: z.ZodType<Prisma.TransactionUncheckedCreateNestedManyWithoutWalletAccountInput> = z.object({
  create: z.union([ z.lazy(() => TransactionCreateWithoutWalletAccountInputSchema),z.lazy(() => TransactionCreateWithoutWalletAccountInputSchema).array(),z.lazy(() => TransactionUncheckedCreateWithoutWalletAccountInputSchema),z.lazy(() => TransactionUncheckedCreateWithoutWalletAccountInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => TransactionCreateOrConnectWithoutWalletAccountInputSchema),z.lazy(() => TransactionCreateOrConnectWithoutWalletAccountInputSchema).array() ]).optional(),
  createMany: z.lazy(() => TransactionCreateManyWalletAccountInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => TransactionWhereUniqueInputSchema),z.lazy(() => TransactionWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export const UserUpdateOneRequiredWithoutWalletAccountsNestedInputSchema: z.ZodType<Prisma.UserUpdateOneRequiredWithoutWalletAccountsNestedInput> = z.object({
  create: z.union([ z.lazy(() => UserCreateWithoutWalletAccountsInputSchema),z.lazy(() => UserUncheckedCreateWithoutWalletAccountsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutWalletAccountsInputSchema).optional(),
  upsert: z.lazy(() => UserUpsertWithoutWalletAccountsInputSchema).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => UserUpdateToOneWithWhereWithoutWalletAccountsInputSchema),z.lazy(() => UserUpdateWithoutWalletAccountsInputSchema),z.lazy(() => UserUncheckedUpdateWithoutWalletAccountsInputSchema) ]).optional(),
}).strict();

export const TransactionUpdateManyWithoutWalletAccountNestedInputSchema: z.ZodType<Prisma.TransactionUpdateManyWithoutWalletAccountNestedInput> = z.object({
  create: z.union([ z.lazy(() => TransactionCreateWithoutWalletAccountInputSchema),z.lazy(() => TransactionCreateWithoutWalletAccountInputSchema).array(),z.lazy(() => TransactionUncheckedCreateWithoutWalletAccountInputSchema),z.lazy(() => TransactionUncheckedCreateWithoutWalletAccountInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => TransactionCreateOrConnectWithoutWalletAccountInputSchema),z.lazy(() => TransactionCreateOrConnectWithoutWalletAccountInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => TransactionUpsertWithWhereUniqueWithoutWalletAccountInputSchema),z.lazy(() => TransactionUpsertWithWhereUniqueWithoutWalletAccountInputSchema).array() ]).optional(),
  createMany: z.lazy(() => TransactionCreateManyWalletAccountInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => TransactionWhereUniqueInputSchema),z.lazy(() => TransactionWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => TransactionWhereUniqueInputSchema),z.lazy(() => TransactionWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => TransactionWhereUniqueInputSchema),z.lazy(() => TransactionWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => TransactionWhereUniqueInputSchema),z.lazy(() => TransactionWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => TransactionUpdateWithWhereUniqueWithoutWalletAccountInputSchema),z.lazy(() => TransactionUpdateWithWhereUniqueWithoutWalletAccountInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => TransactionUpdateManyWithWhereWithoutWalletAccountInputSchema),z.lazy(() => TransactionUpdateManyWithWhereWithoutWalletAccountInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => TransactionScalarWhereInputSchema),z.lazy(() => TransactionScalarWhereInputSchema).array() ]).optional(),
}).strict();

export const TransactionUncheckedUpdateManyWithoutWalletAccountNestedInputSchema: z.ZodType<Prisma.TransactionUncheckedUpdateManyWithoutWalletAccountNestedInput> = z.object({
  create: z.union([ z.lazy(() => TransactionCreateWithoutWalletAccountInputSchema),z.lazy(() => TransactionCreateWithoutWalletAccountInputSchema).array(),z.lazy(() => TransactionUncheckedCreateWithoutWalletAccountInputSchema),z.lazy(() => TransactionUncheckedCreateWithoutWalletAccountInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => TransactionCreateOrConnectWithoutWalletAccountInputSchema),z.lazy(() => TransactionCreateOrConnectWithoutWalletAccountInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => TransactionUpsertWithWhereUniqueWithoutWalletAccountInputSchema),z.lazy(() => TransactionUpsertWithWhereUniqueWithoutWalletAccountInputSchema).array() ]).optional(),
  createMany: z.lazy(() => TransactionCreateManyWalletAccountInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => TransactionWhereUniqueInputSchema),z.lazy(() => TransactionWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => TransactionWhereUniqueInputSchema),z.lazy(() => TransactionWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => TransactionWhereUniqueInputSchema),z.lazy(() => TransactionWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => TransactionWhereUniqueInputSchema),z.lazy(() => TransactionWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => TransactionUpdateWithWhereUniqueWithoutWalletAccountInputSchema),z.lazy(() => TransactionUpdateWithWhereUniqueWithoutWalletAccountInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => TransactionUpdateManyWithWhereWithoutWalletAccountInputSchema),z.lazy(() => TransactionUpdateManyWithWhereWithoutWalletAccountInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => TransactionScalarWhereInputSchema),z.lazy(() => TransactionScalarWhereInputSchema).array() ]).optional(),
}).strict();

export const BudgetPeriodConfigCreateNestedManyWithoutBudgetInputSchema: z.ZodType<Prisma.BudgetPeriodConfigCreateNestedManyWithoutBudgetInput> = z.object({
  create: z.union([ z.lazy(() => BudgetPeriodConfigCreateWithoutBudgetInputSchema),z.lazy(() => BudgetPeriodConfigCreateWithoutBudgetInputSchema).array(),z.lazy(() => BudgetPeriodConfigUncheckedCreateWithoutBudgetInputSchema),z.lazy(() => BudgetPeriodConfigUncheckedCreateWithoutBudgetInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => BudgetPeriodConfigCreateOrConnectWithoutBudgetInputSchema),z.lazy(() => BudgetPeriodConfigCreateOrConnectWithoutBudgetInputSchema).array() ]).optional(),
  createMany: z.lazy(() => BudgetPeriodConfigCreateManyBudgetInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => BudgetPeriodConfigWhereUniqueInputSchema),z.lazy(() => BudgetPeriodConfigWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export const BudgetUserCreateNestedManyWithoutBudgetInputSchema: z.ZodType<Prisma.BudgetUserCreateNestedManyWithoutBudgetInput> = z.object({
  create: z.union([ z.lazy(() => BudgetUserCreateWithoutBudgetInputSchema),z.lazy(() => BudgetUserCreateWithoutBudgetInputSchema).array(),z.lazy(() => BudgetUserUncheckedCreateWithoutBudgetInputSchema),z.lazy(() => BudgetUserUncheckedCreateWithoutBudgetInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => BudgetUserCreateOrConnectWithoutBudgetInputSchema),z.lazy(() => BudgetUserCreateOrConnectWithoutBudgetInputSchema).array() ]).optional(),
  createMany: z.lazy(() => BudgetUserCreateManyBudgetInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => BudgetUserWhereUniqueInputSchema),z.lazy(() => BudgetUserWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export const TransactionCreateNestedManyWithoutBudgetInputSchema: z.ZodType<Prisma.TransactionCreateNestedManyWithoutBudgetInput> = z.object({
  create: z.union([ z.lazy(() => TransactionCreateWithoutBudgetInputSchema),z.lazy(() => TransactionCreateWithoutBudgetInputSchema).array(),z.lazy(() => TransactionUncheckedCreateWithoutBudgetInputSchema),z.lazy(() => TransactionUncheckedCreateWithoutBudgetInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => TransactionCreateOrConnectWithoutBudgetInputSchema),z.lazy(() => TransactionCreateOrConnectWithoutBudgetInputSchema).array() ]).optional(),
  createMany: z.lazy(() => TransactionCreateManyBudgetInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => TransactionWhereUniqueInputSchema),z.lazy(() => TransactionWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export const BudgetUserInvitationCreateNestedManyWithoutBudgetInputSchema: z.ZodType<Prisma.BudgetUserInvitationCreateNestedManyWithoutBudgetInput> = z.object({
  create: z.union([ z.lazy(() => BudgetUserInvitationCreateWithoutBudgetInputSchema),z.lazy(() => BudgetUserInvitationCreateWithoutBudgetInputSchema).array(),z.lazy(() => BudgetUserInvitationUncheckedCreateWithoutBudgetInputSchema),z.lazy(() => BudgetUserInvitationUncheckedCreateWithoutBudgetInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => BudgetUserInvitationCreateOrConnectWithoutBudgetInputSchema),z.lazy(() => BudgetUserInvitationCreateOrConnectWithoutBudgetInputSchema).array() ]).optional(),
  createMany: z.lazy(() => BudgetUserInvitationCreateManyBudgetInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => BudgetUserInvitationWhereUniqueInputSchema),z.lazy(() => BudgetUserInvitationWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export const BudgetPeriodConfigUncheckedCreateNestedManyWithoutBudgetInputSchema: z.ZodType<Prisma.BudgetPeriodConfigUncheckedCreateNestedManyWithoutBudgetInput> = z.object({
  create: z.union([ z.lazy(() => BudgetPeriodConfigCreateWithoutBudgetInputSchema),z.lazy(() => BudgetPeriodConfigCreateWithoutBudgetInputSchema).array(),z.lazy(() => BudgetPeriodConfigUncheckedCreateWithoutBudgetInputSchema),z.lazy(() => BudgetPeriodConfigUncheckedCreateWithoutBudgetInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => BudgetPeriodConfigCreateOrConnectWithoutBudgetInputSchema),z.lazy(() => BudgetPeriodConfigCreateOrConnectWithoutBudgetInputSchema).array() ]).optional(),
  createMany: z.lazy(() => BudgetPeriodConfigCreateManyBudgetInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => BudgetPeriodConfigWhereUniqueInputSchema),z.lazy(() => BudgetPeriodConfigWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export const BudgetUserUncheckedCreateNestedManyWithoutBudgetInputSchema: z.ZodType<Prisma.BudgetUserUncheckedCreateNestedManyWithoutBudgetInput> = z.object({
  create: z.union([ z.lazy(() => BudgetUserCreateWithoutBudgetInputSchema),z.lazy(() => BudgetUserCreateWithoutBudgetInputSchema).array(),z.lazy(() => BudgetUserUncheckedCreateWithoutBudgetInputSchema),z.lazy(() => BudgetUserUncheckedCreateWithoutBudgetInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => BudgetUserCreateOrConnectWithoutBudgetInputSchema),z.lazy(() => BudgetUserCreateOrConnectWithoutBudgetInputSchema).array() ]).optional(),
  createMany: z.lazy(() => BudgetUserCreateManyBudgetInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => BudgetUserWhereUniqueInputSchema),z.lazy(() => BudgetUserWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export const TransactionUncheckedCreateNestedManyWithoutBudgetInputSchema: z.ZodType<Prisma.TransactionUncheckedCreateNestedManyWithoutBudgetInput> = z.object({
  create: z.union([ z.lazy(() => TransactionCreateWithoutBudgetInputSchema),z.lazy(() => TransactionCreateWithoutBudgetInputSchema).array(),z.lazy(() => TransactionUncheckedCreateWithoutBudgetInputSchema),z.lazy(() => TransactionUncheckedCreateWithoutBudgetInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => TransactionCreateOrConnectWithoutBudgetInputSchema),z.lazy(() => TransactionCreateOrConnectWithoutBudgetInputSchema).array() ]).optional(),
  createMany: z.lazy(() => TransactionCreateManyBudgetInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => TransactionWhereUniqueInputSchema),z.lazy(() => TransactionWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export const BudgetUserInvitationUncheckedCreateNestedManyWithoutBudgetInputSchema: z.ZodType<Prisma.BudgetUserInvitationUncheckedCreateNestedManyWithoutBudgetInput> = z.object({
  create: z.union([ z.lazy(() => BudgetUserInvitationCreateWithoutBudgetInputSchema),z.lazy(() => BudgetUserInvitationCreateWithoutBudgetInputSchema).array(),z.lazy(() => BudgetUserInvitationUncheckedCreateWithoutBudgetInputSchema),z.lazy(() => BudgetUserInvitationUncheckedCreateWithoutBudgetInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => BudgetUserInvitationCreateOrConnectWithoutBudgetInputSchema),z.lazy(() => BudgetUserInvitationCreateOrConnectWithoutBudgetInputSchema).array() ]).optional(),
  createMany: z.lazy(() => BudgetUserInvitationCreateManyBudgetInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => BudgetUserInvitationWhereUniqueInputSchema),z.lazy(() => BudgetUserInvitationWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export const EnumBudgetTypeFieldUpdateOperationsInputSchema: z.ZodType<Prisma.EnumBudgetTypeFieldUpdateOperationsInput> = z.object({
  set: z.lazy(() => BudgetTypeSchema).optional()
}).strict();

export const BudgetPeriodConfigUpdateManyWithoutBudgetNestedInputSchema: z.ZodType<Prisma.BudgetPeriodConfigUpdateManyWithoutBudgetNestedInput> = z.object({
  create: z.union([ z.lazy(() => BudgetPeriodConfigCreateWithoutBudgetInputSchema),z.lazy(() => BudgetPeriodConfigCreateWithoutBudgetInputSchema).array(),z.lazy(() => BudgetPeriodConfigUncheckedCreateWithoutBudgetInputSchema),z.lazy(() => BudgetPeriodConfigUncheckedCreateWithoutBudgetInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => BudgetPeriodConfigCreateOrConnectWithoutBudgetInputSchema),z.lazy(() => BudgetPeriodConfigCreateOrConnectWithoutBudgetInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => BudgetPeriodConfigUpsertWithWhereUniqueWithoutBudgetInputSchema),z.lazy(() => BudgetPeriodConfigUpsertWithWhereUniqueWithoutBudgetInputSchema).array() ]).optional(),
  createMany: z.lazy(() => BudgetPeriodConfigCreateManyBudgetInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => BudgetPeriodConfigWhereUniqueInputSchema),z.lazy(() => BudgetPeriodConfigWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => BudgetPeriodConfigWhereUniqueInputSchema),z.lazy(() => BudgetPeriodConfigWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => BudgetPeriodConfigWhereUniqueInputSchema),z.lazy(() => BudgetPeriodConfigWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => BudgetPeriodConfigWhereUniqueInputSchema),z.lazy(() => BudgetPeriodConfigWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => BudgetPeriodConfigUpdateWithWhereUniqueWithoutBudgetInputSchema),z.lazy(() => BudgetPeriodConfigUpdateWithWhereUniqueWithoutBudgetInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => BudgetPeriodConfigUpdateManyWithWhereWithoutBudgetInputSchema),z.lazy(() => BudgetPeriodConfigUpdateManyWithWhereWithoutBudgetInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => BudgetPeriodConfigScalarWhereInputSchema),z.lazy(() => BudgetPeriodConfigScalarWhereInputSchema).array() ]).optional(),
}).strict();

export const BudgetUserUpdateManyWithoutBudgetNestedInputSchema: z.ZodType<Prisma.BudgetUserUpdateManyWithoutBudgetNestedInput> = z.object({
  create: z.union([ z.lazy(() => BudgetUserCreateWithoutBudgetInputSchema),z.lazy(() => BudgetUserCreateWithoutBudgetInputSchema).array(),z.lazy(() => BudgetUserUncheckedCreateWithoutBudgetInputSchema),z.lazy(() => BudgetUserUncheckedCreateWithoutBudgetInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => BudgetUserCreateOrConnectWithoutBudgetInputSchema),z.lazy(() => BudgetUserCreateOrConnectWithoutBudgetInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => BudgetUserUpsertWithWhereUniqueWithoutBudgetInputSchema),z.lazy(() => BudgetUserUpsertWithWhereUniqueWithoutBudgetInputSchema).array() ]).optional(),
  createMany: z.lazy(() => BudgetUserCreateManyBudgetInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => BudgetUserWhereUniqueInputSchema),z.lazy(() => BudgetUserWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => BudgetUserWhereUniqueInputSchema),z.lazy(() => BudgetUserWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => BudgetUserWhereUniqueInputSchema),z.lazy(() => BudgetUserWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => BudgetUserWhereUniqueInputSchema),z.lazy(() => BudgetUserWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => BudgetUserUpdateWithWhereUniqueWithoutBudgetInputSchema),z.lazy(() => BudgetUserUpdateWithWhereUniqueWithoutBudgetInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => BudgetUserUpdateManyWithWhereWithoutBudgetInputSchema),z.lazy(() => BudgetUserUpdateManyWithWhereWithoutBudgetInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => BudgetUserScalarWhereInputSchema),z.lazy(() => BudgetUserScalarWhereInputSchema).array() ]).optional(),
}).strict();

export const TransactionUpdateManyWithoutBudgetNestedInputSchema: z.ZodType<Prisma.TransactionUpdateManyWithoutBudgetNestedInput> = z.object({
  create: z.union([ z.lazy(() => TransactionCreateWithoutBudgetInputSchema),z.lazy(() => TransactionCreateWithoutBudgetInputSchema).array(),z.lazy(() => TransactionUncheckedCreateWithoutBudgetInputSchema),z.lazy(() => TransactionUncheckedCreateWithoutBudgetInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => TransactionCreateOrConnectWithoutBudgetInputSchema),z.lazy(() => TransactionCreateOrConnectWithoutBudgetInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => TransactionUpsertWithWhereUniqueWithoutBudgetInputSchema),z.lazy(() => TransactionUpsertWithWhereUniqueWithoutBudgetInputSchema).array() ]).optional(),
  createMany: z.lazy(() => TransactionCreateManyBudgetInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => TransactionWhereUniqueInputSchema),z.lazy(() => TransactionWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => TransactionWhereUniqueInputSchema),z.lazy(() => TransactionWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => TransactionWhereUniqueInputSchema),z.lazy(() => TransactionWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => TransactionWhereUniqueInputSchema),z.lazy(() => TransactionWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => TransactionUpdateWithWhereUniqueWithoutBudgetInputSchema),z.lazy(() => TransactionUpdateWithWhereUniqueWithoutBudgetInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => TransactionUpdateManyWithWhereWithoutBudgetInputSchema),z.lazy(() => TransactionUpdateManyWithWhereWithoutBudgetInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => TransactionScalarWhereInputSchema),z.lazy(() => TransactionScalarWhereInputSchema).array() ]).optional(),
}).strict();

export const BudgetUserInvitationUpdateManyWithoutBudgetNestedInputSchema: z.ZodType<Prisma.BudgetUserInvitationUpdateManyWithoutBudgetNestedInput> = z.object({
  create: z.union([ z.lazy(() => BudgetUserInvitationCreateWithoutBudgetInputSchema),z.lazy(() => BudgetUserInvitationCreateWithoutBudgetInputSchema).array(),z.lazy(() => BudgetUserInvitationUncheckedCreateWithoutBudgetInputSchema),z.lazy(() => BudgetUserInvitationUncheckedCreateWithoutBudgetInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => BudgetUserInvitationCreateOrConnectWithoutBudgetInputSchema),z.lazy(() => BudgetUserInvitationCreateOrConnectWithoutBudgetInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => BudgetUserInvitationUpsertWithWhereUniqueWithoutBudgetInputSchema),z.lazy(() => BudgetUserInvitationUpsertWithWhereUniqueWithoutBudgetInputSchema).array() ]).optional(),
  createMany: z.lazy(() => BudgetUserInvitationCreateManyBudgetInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => BudgetUserInvitationWhereUniqueInputSchema),z.lazy(() => BudgetUserInvitationWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => BudgetUserInvitationWhereUniqueInputSchema),z.lazy(() => BudgetUserInvitationWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => BudgetUserInvitationWhereUniqueInputSchema),z.lazy(() => BudgetUserInvitationWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => BudgetUserInvitationWhereUniqueInputSchema),z.lazy(() => BudgetUserInvitationWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => BudgetUserInvitationUpdateWithWhereUniqueWithoutBudgetInputSchema),z.lazy(() => BudgetUserInvitationUpdateWithWhereUniqueWithoutBudgetInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => BudgetUserInvitationUpdateManyWithWhereWithoutBudgetInputSchema),z.lazy(() => BudgetUserInvitationUpdateManyWithWhereWithoutBudgetInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => BudgetUserInvitationScalarWhereInputSchema),z.lazy(() => BudgetUserInvitationScalarWhereInputSchema).array() ]).optional(),
}).strict();

export const BudgetPeriodConfigUncheckedUpdateManyWithoutBudgetNestedInputSchema: z.ZodType<Prisma.BudgetPeriodConfigUncheckedUpdateManyWithoutBudgetNestedInput> = z.object({
  create: z.union([ z.lazy(() => BudgetPeriodConfigCreateWithoutBudgetInputSchema),z.lazy(() => BudgetPeriodConfigCreateWithoutBudgetInputSchema).array(),z.lazy(() => BudgetPeriodConfigUncheckedCreateWithoutBudgetInputSchema),z.lazy(() => BudgetPeriodConfigUncheckedCreateWithoutBudgetInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => BudgetPeriodConfigCreateOrConnectWithoutBudgetInputSchema),z.lazy(() => BudgetPeriodConfigCreateOrConnectWithoutBudgetInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => BudgetPeriodConfigUpsertWithWhereUniqueWithoutBudgetInputSchema),z.lazy(() => BudgetPeriodConfigUpsertWithWhereUniqueWithoutBudgetInputSchema).array() ]).optional(),
  createMany: z.lazy(() => BudgetPeriodConfigCreateManyBudgetInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => BudgetPeriodConfigWhereUniqueInputSchema),z.lazy(() => BudgetPeriodConfigWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => BudgetPeriodConfigWhereUniqueInputSchema),z.lazy(() => BudgetPeriodConfigWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => BudgetPeriodConfigWhereUniqueInputSchema),z.lazy(() => BudgetPeriodConfigWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => BudgetPeriodConfigWhereUniqueInputSchema),z.lazy(() => BudgetPeriodConfigWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => BudgetPeriodConfigUpdateWithWhereUniqueWithoutBudgetInputSchema),z.lazy(() => BudgetPeriodConfigUpdateWithWhereUniqueWithoutBudgetInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => BudgetPeriodConfigUpdateManyWithWhereWithoutBudgetInputSchema),z.lazy(() => BudgetPeriodConfigUpdateManyWithWhereWithoutBudgetInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => BudgetPeriodConfigScalarWhereInputSchema),z.lazy(() => BudgetPeriodConfigScalarWhereInputSchema).array() ]).optional(),
}).strict();

export const BudgetUserUncheckedUpdateManyWithoutBudgetNestedInputSchema: z.ZodType<Prisma.BudgetUserUncheckedUpdateManyWithoutBudgetNestedInput> = z.object({
  create: z.union([ z.lazy(() => BudgetUserCreateWithoutBudgetInputSchema),z.lazy(() => BudgetUserCreateWithoutBudgetInputSchema).array(),z.lazy(() => BudgetUserUncheckedCreateWithoutBudgetInputSchema),z.lazy(() => BudgetUserUncheckedCreateWithoutBudgetInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => BudgetUserCreateOrConnectWithoutBudgetInputSchema),z.lazy(() => BudgetUserCreateOrConnectWithoutBudgetInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => BudgetUserUpsertWithWhereUniqueWithoutBudgetInputSchema),z.lazy(() => BudgetUserUpsertWithWhereUniqueWithoutBudgetInputSchema).array() ]).optional(),
  createMany: z.lazy(() => BudgetUserCreateManyBudgetInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => BudgetUserWhereUniqueInputSchema),z.lazy(() => BudgetUserWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => BudgetUserWhereUniqueInputSchema),z.lazy(() => BudgetUserWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => BudgetUserWhereUniqueInputSchema),z.lazy(() => BudgetUserWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => BudgetUserWhereUniqueInputSchema),z.lazy(() => BudgetUserWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => BudgetUserUpdateWithWhereUniqueWithoutBudgetInputSchema),z.lazy(() => BudgetUserUpdateWithWhereUniqueWithoutBudgetInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => BudgetUserUpdateManyWithWhereWithoutBudgetInputSchema),z.lazy(() => BudgetUserUpdateManyWithWhereWithoutBudgetInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => BudgetUserScalarWhereInputSchema),z.lazy(() => BudgetUserScalarWhereInputSchema).array() ]).optional(),
}).strict();

export const TransactionUncheckedUpdateManyWithoutBudgetNestedInputSchema: z.ZodType<Prisma.TransactionUncheckedUpdateManyWithoutBudgetNestedInput> = z.object({
  create: z.union([ z.lazy(() => TransactionCreateWithoutBudgetInputSchema),z.lazy(() => TransactionCreateWithoutBudgetInputSchema).array(),z.lazy(() => TransactionUncheckedCreateWithoutBudgetInputSchema),z.lazy(() => TransactionUncheckedCreateWithoutBudgetInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => TransactionCreateOrConnectWithoutBudgetInputSchema),z.lazy(() => TransactionCreateOrConnectWithoutBudgetInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => TransactionUpsertWithWhereUniqueWithoutBudgetInputSchema),z.lazy(() => TransactionUpsertWithWhereUniqueWithoutBudgetInputSchema).array() ]).optional(),
  createMany: z.lazy(() => TransactionCreateManyBudgetInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => TransactionWhereUniqueInputSchema),z.lazy(() => TransactionWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => TransactionWhereUniqueInputSchema),z.lazy(() => TransactionWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => TransactionWhereUniqueInputSchema),z.lazy(() => TransactionWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => TransactionWhereUniqueInputSchema),z.lazy(() => TransactionWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => TransactionUpdateWithWhereUniqueWithoutBudgetInputSchema),z.lazy(() => TransactionUpdateWithWhereUniqueWithoutBudgetInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => TransactionUpdateManyWithWhereWithoutBudgetInputSchema),z.lazy(() => TransactionUpdateManyWithWhereWithoutBudgetInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => TransactionScalarWhereInputSchema),z.lazy(() => TransactionScalarWhereInputSchema).array() ]).optional(),
}).strict();

export const BudgetUserInvitationUncheckedUpdateManyWithoutBudgetNestedInputSchema: z.ZodType<Prisma.BudgetUserInvitationUncheckedUpdateManyWithoutBudgetNestedInput> = z.object({
  create: z.union([ z.lazy(() => BudgetUserInvitationCreateWithoutBudgetInputSchema),z.lazy(() => BudgetUserInvitationCreateWithoutBudgetInputSchema).array(),z.lazy(() => BudgetUserInvitationUncheckedCreateWithoutBudgetInputSchema),z.lazy(() => BudgetUserInvitationUncheckedCreateWithoutBudgetInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => BudgetUserInvitationCreateOrConnectWithoutBudgetInputSchema),z.lazy(() => BudgetUserInvitationCreateOrConnectWithoutBudgetInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => BudgetUserInvitationUpsertWithWhereUniqueWithoutBudgetInputSchema),z.lazy(() => BudgetUserInvitationUpsertWithWhereUniqueWithoutBudgetInputSchema).array() ]).optional(),
  createMany: z.lazy(() => BudgetUserInvitationCreateManyBudgetInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => BudgetUserInvitationWhereUniqueInputSchema),z.lazy(() => BudgetUserInvitationWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => BudgetUserInvitationWhereUniqueInputSchema),z.lazy(() => BudgetUserInvitationWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => BudgetUserInvitationWhereUniqueInputSchema),z.lazy(() => BudgetUserInvitationWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => BudgetUserInvitationWhereUniqueInputSchema),z.lazy(() => BudgetUserInvitationWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => BudgetUserInvitationUpdateWithWhereUniqueWithoutBudgetInputSchema),z.lazy(() => BudgetUserInvitationUpdateWithWhereUniqueWithoutBudgetInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => BudgetUserInvitationUpdateManyWithWhereWithoutBudgetInputSchema),z.lazy(() => BudgetUserInvitationUpdateManyWithWhereWithoutBudgetInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => BudgetUserInvitationScalarWhereInputSchema),z.lazy(() => BudgetUserInvitationScalarWhereInputSchema).array() ]).optional(),
}).strict();

export const BudgetCreateNestedOneWithoutPeriodConfigsInputSchema: z.ZodType<Prisma.BudgetCreateNestedOneWithoutPeriodConfigsInput> = z.object({
  create: z.union([ z.lazy(() => BudgetCreateWithoutPeriodConfigsInputSchema),z.lazy(() => BudgetUncheckedCreateWithoutPeriodConfigsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => BudgetCreateOrConnectWithoutPeriodConfigsInputSchema).optional(),
  connect: z.lazy(() => BudgetWhereUniqueInputSchema).optional()
}).strict();

export const EnumBudgetPeriodTypeFieldUpdateOperationsInputSchema: z.ZodType<Prisma.EnumBudgetPeriodTypeFieldUpdateOperationsInput> = z.object({
  set: z.lazy(() => BudgetPeriodTypeSchema).optional()
}).strict();

export const DecimalFieldUpdateOperationsInputSchema: z.ZodType<Prisma.DecimalFieldUpdateOperationsInput> = z.object({
  set: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  increment: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  decrement: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  multiply: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  divide: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional()
}).strict();

export const NullableDateTimeFieldUpdateOperationsInputSchema: z.ZodType<Prisma.NullableDateTimeFieldUpdateOperationsInput> = z.object({
  set: z.coerce.date().optional().nullable()
}).strict();

export const BudgetUpdateOneRequiredWithoutPeriodConfigsNestedInputSchema: z.ZodType<Prisma.BudgetUpdateOneRequiredWithoutPeriodConfigsNestedInput> = z.object({
  create: z.union([ z.lazy(() => BudgetCreateWithoutPeriodConfigsInputSchema),z.lazy(() => BudgetUncheckedCreateWithoutPeriodConfigsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => BudgetCreateOrConnectWithoutPeriodConfigsInputSchema).optional(),
  upsert: z.lazy(() => BudgetUpsertWithoutPeriodConfigsInputSchema).optional(),
  connect: z.lazy(() => BudgetWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => BudgetUpdateToOneWithWhereWithoutPeriodConfigsInputSchema),z.lazy(() => BudgetUpdateWithoutPeriodConfigsInputSchema),z.lazy(() => BudgetUncheckedUpdateWithoutPeriodConfigsInputSchema) ]).optional(),
}).strict();

export const UserCreateNestedOneWithoutBudgetUsersInputSchema: z.ZodType<Prisma.UserCreateNestedOneWithoutBudgetUsersInput> = z.object({
  create: z.union([ z.lazy(() => UserCreateWithoutBudgetUsersInputSchema),z.lazy(() => UserUncheckedCreateWithoutBudgetUsersInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutBudgetUsersInputSchema).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional()
}).strict();

export const BudgetCreateNestedOneWithoutBudgetUsersInputSchema: z.ZodType<Prisma.BudgetCreateNestedOneWithoutBudgetUsersInput> = z.object({
  create: z.union([ z.lazy(() => BudgetCreateWithoutBudgetUsersInputSchema),z.lazy(() => BudgetUncheckedCreateWithoutBudgetUsersInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => BudgetCreateOrConnectWithoutBudgetUsersInputSchema).optional(),
  connect: z.lazy(() => BudgetWhereUniqueInputSchema).optional()
}).strict();

export const EnumBudgetUserPermissionFieldUpdateOperationsInputSchema: z.ZodType<Prisma.EnumBudgetUserPermissionFieldUpdateOperationsInput> = z.object({
  set: z.lazy(() => BudgetUserPermissionSchema).optional()
}).strict();

export const UserUpdateOneRequiredWithoutBudgetUsersNestedInputSchema: z.ZodType<Prisma.UserUpdateOneRequiredWithoutBudgetUsersNestedInput> = z.object({
  create: z.union([ z.lazy(() => UserCreateWithoutBudgetUsersInputSchema),z.lazy(() => UserUncheckedCreateWithoutBudgetUsersInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutBudgetUsersInputSchema).optional(),
  upsert: z.lazy(() => UserUpsertWithoutBudgetUsersInputSchema).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => UserUpdateToOneWithWhereWithoutBudgetUsersInputSchema),z.lazy(() => UserUpdateWithoutBudgetUsersInputSchema),z.lazy(() => UserUncheckedUpdateWithoutBudgetUsersInputSchema) ]).optional(),
}).strict();

export const BudgetUpdateOneRequiredWithoutBudgetUsersNestedInputSchema: z.ZodType<Prisma.BudgetUpdateOneRequiredWithoutBudgetUsersNestedInput> = z.object({
  create: z.union([ z.lazy(() => BudgetCreateWithoutBudgetUsersInputSchema),z.lazy(() => BudgetUncheckedCreateWithoutBudgetUsersInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => BudgetCreateOrConnectWithoutBudgetUsersInputSchema).optional(),
  upsert: z.lazy(() => BudgetUpsertWithoutBudgetUsersInputSchema).optional(),
  connect: z.lazy(() => BudgetWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => BudgetUpdateToOneWithWhereWithoutBudgetUsersInputSchema),z.lazy(() => BudgetUpdateWithoutBudgetUsersInputSchema),z.lazy(() => BudgetUncheckedUpdateWithoutBudgetUsersInputSchema) ]).optional(),
}).strict();

export const UserCreateNestedOneWithoutCreatedBudgetUserInvitationsInputSchema: z.ZodType<Prisma.UserCreateNestedOneWithoutCreatedBudgetUserInvitationsInput> = z.object({
  create: z.union([ z.lazy(() => UserCreateWithoutCreatedBudgetUserInvitationsInputSchema),z.lazy(() => UserUncheckedCreateWithoutCreatedBudgetUserInvitationsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutCreatedBudgetUserInvitationsInputSchema).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional()
}).strict();

export const BudgetCreateNestedOneWithoutInvitationsInputSchema: z.ZodType<Prisma.BudgetCreateNestedOneWithoutInvitationsInput> = z.object({
  create: z.union([ z.lazy(() => BudgetCreateWithoutInvitationsInputSchema),z.lazy(() => BudgetUncheckedCreateWithoutInvitationsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => BudgetCreateOrConnectWithoutInvitationsInputSchema).optional(),
  connect: z.lazy(() => BudgetWhereUniqueInputSchema).optional()
}).strict();

export const BudgetUserInvitationResponseCreateNestedManyWithoutInvitationInputSchema: z.ZodType<Prisma.BudgetUserInvitationResponseCreateNestedManyWithoutInvitationInput> = z.object({
  create: z.union([ z.lazy(() => BudgetUserInvitationResponseCreateWithoutInvitationInputSchema),z.lazy(() => BudgetUserInvitationResponseCreateWithoutInvitationInputSchema).array(),z.lazy(() => BudgetUserInvitationResponseUncheckedCreateWithoutInvitationInputSchema),z.lazy(() => BudgetUserInvitationResponseUncheckedCreateWithoutInvitationInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => BudgetUserInvitationResponseCreateOrConnectWithoutInvitationInputSchema),z.lazy(() => BudgetUserInvitationResponseCreateOrConnectWithoutInvitationInputSchema).array() ]).optional(),
  createMany: z.lazy(() => BudgetUserInvitationResponseCreateManyInvitationInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => BudgetUserInvitationResponseWhereUniqueInputSchema),z.lazy(() => BudgetUserInvitationResponseWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export const BudgetUserInvitationResponseUncheckedCreateNestedManyWithoutInvitationInputSchema: z.ZodType<Prisma.BudgetUserInvitationResponseUncheckedCreateNestedManyWithoutInvitationInput> = z.object({
  create: z.union([ z.lazy(() => BudgetUserInvitationResponseCreateWithoutInvitationInputSchema),z.lazy(() => BudgetUserInvitationResponseCreateWithoutInvitationInputSchema).array(),z.lazy(() => BudgetUserInvitationResponseUncheckedCreateWithoutInvitationInputSchema),z.lazy(() => BudgetUserInvitationResponseUncheckedCreateWithoutInvitationInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => BudgetUserInvitationResponseCreateOrConnectWithoutInvitationInputSchema),z.lazy(() => BudgetUserInvitationResponseCreateOrConnectWithoutInvitationInputSchema).array() ]).optional(),
  createMany: z.lazy(() => BudgetUserInvitationResponseCreateManyInvitationInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => BudgetUserInvitationResponseWhereUniqueInputSchema),z.lazy(() => BudgetUserInvitationResponseWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export const NullableEnumBudgetUserPermissionFieldUpdateOperationsInputSchema: z.ZodType<Prisma.NullableEnumBudgetUserPermissionFieldUpdateOperationsInput> = z.object({
  set: z.lazy(() => BudgetUserPermissionSchema).optional().nullable()
}).strict();

export const UserUpdateOneRequiredWithoutCreatedBudgetUserInvitationsNestedInputSchema: z.ZodType<Prisma.UserUpdateOneRequiredWithoutCreatedBudgetUserInvitationsNestedInput> = z.object({
  create: z.union([ z.lazy(() => UserCreateWithoutCreatedBudgetUserInvitationsInputSchema),z.lazy(() => UserUncheckedCreateWithoutCreatedBudgetUserInvitationsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutCreatedBudgetUserInvitationsInputSchema).optional(),
  upsert: z.lazy(() => UserUpsertWithoutCreatedBudgetUserInvitationsInputSchema).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => UserUpdateToOneWithWhereWithoutCreatedBudgetUserInvitationsInputSchema),z.lazy(() => UserUpdateWithoutCreatedBudgetUserInvitationsInputSchema),z.lazy(() => UserUncheckedUpdateWithoutCreatedBudgetUserInvitationsInputSchema) ]).optional(),
}).strict();

export const BudgetUpdateOneRequiredWithoutInvitationsNestedInputSchema: z.ZodType<Prisma.BudgetUpdateOneRequiredWithoutInvitationsNestedInput> = z.object({
  create: z.union([ z.lazy(() => BudgetCreateWithoutInvitationsInputSchema),z.lazy(() => BudgetUncheckedCreateWithoutInvitationsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => BudgetCreateOrConnectWithoutInvitationsInputSchema).optional(),
  upsert: z.lazy(() => BudgetUpsertWithoutInvitationsInputSchema).optional(),
  connect: z.lazy(() => BudgetWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => BudgetUpdateToOneWithWhereWithoutInvitationsInputSchema),z.lazy(() => BudgetUpdateWithoutInvitationsInputSchema),z.lazy(() => BudgetUncheckedUpdateWithoutInvitationsInputSchema) ]).optional(),
}).strict();

export const BudgetUserInvitationResponseUpdateManyWithoutInvitationNestedInputSchema: z.ZodType<Prisma.BudgetUserInvitationResponseUpdateManyWithoutInvitationNestedInput> = z.object({
  create: z.union([ z.lazy(() => BudgetUserInvitationResponseCreateWithoutInvitationInputSchema),z.lazy(() => BudgetUserInvitationResponseCreateWithoutInvitationInputSchema).array(),z.lazy(() => BudgetUserInvitationResponseUncheckedCreateWithoutInvitationInputSchema),z.lazy(() => BudgetUserInvitationResponseUncheckedCreateWithoutInvitationInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => BudgetUserInvitationResponseCreateOrConnectWithoutInvitationInputSchema),z.lazy(() => BudgetUserInvitationResponseCreateOrConnectWithoutInvitationInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => BudgetUserInvitationResponseUpsertWithWhereUniqueWithoutInvitationInputSchema),z.lazy(() => BudgetUserInvitationResponseUpsertWithWhereUniqueWithoutInvitationInputSchema).array() ]).optional(),
  createMany: z.lazy(() => BudgetUserInvitationResponseCreateManyInvitationInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => BudgetUserInvitationResponseWhereUniqueInputSchema),z.lazy(() => BudgetUserInvitationResponseWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => BudgetUserInvitationResponseWhereUniqueInputSchema),z.lazy(() => BudgetUserInvitationResponseWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => BudgetUserInvitationResponseWhereUniqueInputSchema),z.lazy(() => BudgetUserInvitationResponseWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => BudgetUserInvitationResponseWhereUniqueInputSchema),z.lazy(() => BudgetUserInvitationResponseWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => BudgetUserInvitationResponseUpdateWithWhereUniqueWithoutInvitationInputSchema),z.lazy(() => BudgetUserInvitationResponseUpdateWithWhereUniqueWithoutInvitationInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => BudgetUserInvitationResponseUpdateManyWithWhereWithoutInvitationInputSchema),z.lazy(() => BudgetUserInvitationResponseUpdateManyWithWhereWithoutInvitationInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => BudgetUserInvitationResponseScalarWhereInputSchema),z.lazy(() => BudgetUserInvitationResponseScalarWhereInputSchema).array() ]).optional(),
}).strict();

export const BudgetUserInvitationResponseUncheckedUpdateManyWithoutInvitationNestedInputSchema: z.ZodType<Prisma.BudgetUserInvitationResponseUncheckedUpdateManyWithoutInvitationNestedInput> = z.object({
  create: z.union([ z.lazy(() => BudgetUserInvitationResponseCreateWithoutInvitationInputSchema),z.lazy(() => BudgetUserInvitationResponseCreateWithoutInvitationInputSchema).array(),z.lazy(() => BudgetUserInvitationResponseUncheckedCreateWithoutInvitationInputSchema),z.lazy(() => BudgetUserInvitationResponseUncheckedCreateWithoutInvitationInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => BudgetUserInvitationResponseCreateOrConnectWithoutInvitationInputSchema),z.lazy(() => BudgetUserInvitationResponseCreateOrConnectWithoutInvitationInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => BudgetUserInvitationResponseUpsertWithWhereUniqueWithoutInvitationInputSchema),z.lazy(() => BudgetUserInvitationResponseUpsertWithWhereUniqueWithoutInvitationInputSchema).array() ]).optional(),
  createMany: z.lazy(() => BudgetUserInvitationResponseCreateManyInvitationInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => BudgetUserInvitationResponseWhereUniqueInputSchema),z.lazy(() => BudgetUserInvitationResponseWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => BudgetUserInvitationResponseWhereUniqueInputSchema),z.lazy(() => BudgetUserInvitationResponseWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => BudgetUserInvitationResponseWhereUniqueInputSchema),z.lazy(() => BudgetUserInvitationResponseWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => BudgetUserInvitationResponseWhereUniqueInputSchema),z.lazy(() => BudgetUserInvitationResponseWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => BudgetUserInvitationResponseUpdateWithWhereUniqueWithoutInvitationInputSchema),z.lazy(() => BudgetUserInvitationResponseUpdateWithWhereUniqueWithoutInvitationInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => BudgetUserInvitationResponseUpdateManyWithWhereWithoutInvitationInputSchema),z.lazy(() => BudgetUserInvitationResponseUpdateManyWithWhereWithoutInvitationInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => BudgetUserInvitationResponseScalarWhereInputSchema),z.lazy(() => BudgetUserInvitationResponseScalarWhereInputSchema).array() ]).optional(),
}).strict();

export const BudgetUserInvitationCreateNestedOneWithoutResponsesInputSchema: z.ZodType<Prisma.BudgetUserInvitationCreateNestedOneWithoutResponsesInput> = z.object({
  create: z.union([ z.lazy(() => BudgetUserInvitationCreateWithoutResponsesInputSchema),z.lazy(() => BudgetUserInvitationUncheckedCreateWithoutResponsesInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => BudgetUserInvitationCreateOrConnectWithoutResponsesInputSchema).optional(),
  connect: z.lazy(() => BudgetUserInvitationWhereUniqueInputSchema).optional()
}).strict();

export const UserCreateNestedOneWithoutCreatedFromInvitationInputSchema: z.ZodType<Prisma.UserCreateNestedOneWithoutCreatedFromInvitationInput> = z.object({
  create: z.union([ z.lazy(() => UserCreateWithoutCreatedFromInvitationInputSchema),z.lazy(() => UserUncheckedCreateWithoutCreatedFromInvitationInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutCreatedFromInvitationInputSchema).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional()
}).strict();

export const BudgetUserInvitationUpdateOneRequiredWithoutResponsesNestedInputSchema: z.ZodType<Prisma.BudgetUserInvitationUpdateOneRequiredWithoutResponsesNestedInput> = z.object({
  create: z.union([ z.lazy(() => BudgetUserInvitationCreateWithoutResponsesInputSchema),z.lazy(() => BudgetUserInvitationUncheckedCreateWithoutResponsesInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => BudgetUserInvitationCreateOrConnectWithoutResponsesInputSchema).optional(),
  upsert: z.lazy(() => BudgetUserInvitationUpsertWithoutResponsesInputSchema).optional(),
  connect: z.lazy(() => BudgetUserInvitationWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => BudgetUserInvitationUpdateToOneWithWhereWithoutResponsesInputSchema),z.lazy(() => BudgetUserInvitationUpdateWithoutResponsesInputSchema),z.lazy(() => BudgetUserInvitationUncheckedUpdateWithoutResponsesInputSchema) ]).optional(),
}).strict();

export const UserUpdateOneWithoutCreatedFromInvitationNestedInputSchema: z.ZodType<Prisma.UserUpdateOneWithoutCreatedFromInvitationNestedInput> = z.object({
  create: z.union([ z.lazy(() => UserCreateWithoutCreatedFromInvitationInputSchema),z.lazy(() => UserUncheckedCreateWithoutCreatedFromInvitationInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutCreatedFromInvitationInputSchema).optional(),
  upsert: z.lazy(() => UserUpsertWithoutCreatedFromInvitationInputSchema).optional(),
  disconnect: z.union([ z.boolean(),z.lazy(() => UserWhereInputSchema) ]).optional(),
  delete: z.union([ z.boolean(),z.lazy(() => UserWhereInputSchema) ]).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => UserUpdateToOneWithWhereWithoutCreatedFromInvitationInputSchema),z.lazy(() => UserUpdateWithoutCreatedFromInvitationInputSchema),z.lazy(() => UserUncheckedUpdateWithoutCreatedFromInvitationInputSchema) ]).optional(),
}).strict();

export const CategoryCreateNestedOneWithoutTransactionsInputSchema: z.ZodType<Prisma.CategoryCreateNestedOneWithoutTransactionsInput> = z.object({
  create: z.union([ z.lazy(() => CategoryCreateWithoutTransactionsInputSchema),z.lazy(() => CategoryUncheckedCreateWithoutTransactionsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => CategoryCreateOrConnectWithoutTransactionsInputSchema).optional(),
  connect: z.lazy(() => CategoryWhereUniqueInputSchema).optional()
}).strict();

export const BudgetCreateNestedOneWithoutTransactionsInputSchema: z.ZodType<Prisma.BudgetCreateNestedOneWithoutTransactionsInput> = z.object({
  create: z.union([ z.lazy(() => BudgetCreateWithoutTransactionsInputSchema),z.lazy(() => BudgetUncheckedCreateWithoutTransactionsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => BudgetCreateOrConnectWithoutTransactionsInputSchema).optional(),
  connect: z.lazy(() => BudgetWhereUniqueInputSchema).optional()
}).strict();

export const UserWalletAccountCreateNestedOneWithoutTransactionsInputSchema: z.ZodType<Prisma.UserWalletAccountCreateNestedOneWithoutTransactionsInput> = z.object({
  create: z.union([ z.lazy(() => UserWalletAccountCreateWithoutTransactionsInputSchema),z.lazy(() => UserWalletAccountUncheckedCreateWithoutTransactionsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserWalletAccountCreateOrConnectWithoutTransactionsInputSchema).optional(),
  connect: z.lazy(() => UserWalletAccountWhereUniqueInputSchema).optional()
}).strict();

export const UserCreateNestedOneWithoutTransactionsInputSchema: z.ZodType<Prisma.UserCreateNestedOneWithoutTransactionsInput> = z.object({
  create: z.union([ z.lazy(() => UserCreateWithoutTransactionsInputSchema),z.lazy(() => UserUncheckedCreateWithoutTransactionsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutTransactionsInputSchema).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional()
}).strict();

export const CategoryUpdateOneWithoutTransactionsNestedInputSchema: z.ZodType<Prisma.CategoryUpdateOneWithoutTransactionsNestedInput> = z.object({
  create: z.union([ z.lazy(() => CategoryCreateWithoutTransactionsInputSchema),z.lazy(() => CategoryUncheckedCreateWithoutTransactionsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => CategoryCreateOrConnectWithoutTransactionsInputSchema).optional(),
  upsert: z.lazy(() => CategoryUpsertWithoutTransactionsInputSchema).optional(),
  disconnect: z.union([ z.boolean(),z.lazy(() => CategoryWhereInputSchema) ]).optional(),
  delete: z.union([ z.boolean(),z.lazy(() => CategoryWhereInputSchema) ]).optional(),
  connect: z.lazy(() => CategoryWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => CategoryUpdateToOneWithWhereWithoutTransactionsInputSchema),z.lazy(() => CategoryUpdateWithoutTransactionsInputSchema),z.lazy(() => CategoryUncheckedUpdateWithoutTransactionsInputSchema) ]).optional(),
}).strict();

export const BudgetUpdateOneWithoutTransactionsNestedInputSchema: z.ZodType<Prisma.BudgetUpdateOneWithoutTransactionsNestedInput> = z.object({
  create: z.union([ z.lazy(() => BudgetCreateWithoutTransactionsInputSchema),z.lazy(() => BudgetUncheckedCreateWithoutTransactionsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => BudgetCreateOrConnectWithoutTransactionsInputSchema).optional(),
  upsert: z.lazy(() => BudgetUpsertWithoutTransactionsInputSchema).optional(),
  disconnect: z.union([ z.boolean(),z.lazy(() => BudgetWhereInputSchema) ]).optional(),
  delete: z.union([ z.boolean(),z.lazy(() => BudgetWhereInputSchema) ]).optional(),
  connect: z.lazy(() => BudgetWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => BudgetUpdateToOneWithWhereWithoutTransactionsInputSchema),z.lazy(() => BudgetUpdateWithoutTransactionsInputSchema),z.lazy(() => BudgetUncheckedUpdateWithoutTransactionsInputSchema) ]).optional(),
}).strict();

export const UserWalletAccountUpdateOneRequiredWithoutTransactionsNestedInputSchema: z.ZodType<Prisma.UserWalletAccountUpdateOneRequiredWithoutTransactionsNestedInput> = z.object({
  create: z.union([ z.lazy(() => UserWalletAccountCreateWithoutTransactionsInputSchema),z.lazy(() => UserWalletAccountUncheckedCreateWithoutTransactionsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserWalletAccountCreateOrConnectWithoutTransactionsInputSchema).optional(),
  upsert: z.lazy(() => UserWalletAccountUpsertWithoutTransactionsInputSchema).optional(),
  connect: z.lazy(() => UserWalletAccountWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => UserWalletAccountUpdateToOneWithWhereWithoutTransactionsInputSchema),z.lazy(() => UserWalletAccountUpdateWithoutTransactionsInputSchema),z.lazy(() => UserWalletAccountUncheckedUpdateWithoutTransactionsInputSchema) ]).optional(),
}).strict();

export const UserUpdateOneRequiredWithoutTransactionsNestedInputSchema: z.ZodType<Prisma.UserUpdateOneRequiredWithoutTransactionsNestedInput> = z.object({
  create: z.union([ z.lazy(() => UserCreateWithoutTransactionsInputSchema),z.lazy(() => UserUncheckedCreateWithoutTransactionsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutTransactionsInputSchema).optional(),
  upsert: z.lazy(() => UserUpsertWithoutTransactionsInputSchema).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => UserUpdateToOneWithWhereWithoutTransactionsInputSchema),z.lazy(() => UserUpdateWithoutTransactionsInputSchema),z.lazy(() => UserUncheckedUpdateWithoutTransactionsInputSchema) ]).optional(),
}).strict();

export const UserCreateNestedOneWithoutCategoriesInputSchema: z.ZodType<Prisma.UserCreateNestedOneWithoutCategoriesInput> = z.object({
  create: z.union([ z.lazy(() => UserCreateWithoutCategoriesInputSchema),z.lazy(() => UserUncheckedCreateWithoutCategoriesInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutCategoriesInputSchema).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional()
}).strict();

export const CategoryCreateNestedOneWithoutChildrenInputSchema: z.ZodType<Prisma.CategoryCreateNestedOneWithoutChildrenInput> = z.object({
  create: z.union([ z.lazy(() => CategoryCreateWithoutChildrenInputSchema),z.lazy(() => CategoryUncheckedCreateWithoutChildrenInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => CategoryCreateOrConnectWithoutChildrenInputSchema).optional(),
  connect: z.lazy(() => CategoryWhereUniqueInputSchema).optional()
}).strict();

export const CategoryCreateNestedManyWithoutParentInputSchema: z.ZodType<Prisma.CategoryCreateNestedManyWithoutParentInput> = z.object({
  create: z.union([ z.lazy(() => CategoryCreateWithoutParentInputSchema),z.lazy(() => CategoryCreateWithoutParentInputSchema).array(),z.lazy(() => CategoryUncheckedCreateWithoutParentInputSchema),z.lazy(() => CategoryUncheckedCreateWithoutParentInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => CategoryCreateOrConnectWithoutParentInputSchema),z.lazy(() => CategoryCreateOrConnectWithoutParentInputSchema).array() ]).optional(),
  createMany: z.lazy(() => CategoryCreateManyParentInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => CategoryWhereUniqueInputSchema),z.lazy(() => CategoryWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export const TransactionCreateNestedManyWithoutCategoryInputSchema: z.ZodType<Prisma.TransactionCreateNestedManyWithoutCategoryInput> = z.object({
  create: z.union([ z.lazy(() => TransactionCreateWithoutCategoryInputSchema),z.lazy(() => TransactionCreateWithoutCategoryInputSchema).array(),z.lazy(() => TransactionUncheckedCreateWithoutCategoryInputSchema),z.lazy(() => TransactionUncheckedCreateWithoutCategoryInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => TransactionCreateOrConnectWithoutCategoryInputSchema),z.lazy(() => TransactionCreateOrConnectWithoutCategoryInputSchema).array() ]).optional(),
  createMany: z.lazy(() => TransactionCreateManyCategoryInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => TransactionWhereUniqueInputSchema),z.lazy(() => TransactionWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export const CategoryUncheckedCreateNestedManyWithoutParentInputSchema: z.ZodType<Prisma.CategoryUncheckedCreateNestedManyWithoutParentInput> = z.object({
  create: z.union([ z.lazy(() => CategoryCreateWithoutParentInputSchema),z.lazy(() => CategoryCreateWithoutParentInputSchema).array(),z.lazy(() => CategoryUncheckedCreateWithoutParentInputSchema),z.lazy(() => CategoryUncheckedCreateWithoutParentInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => CategoryCreateOrConnectWithoutParentInputSchema),z.lazy(() => CategoryCreateOrConnectWithoutParentInputSchema).array() ]).optional(),
  createMany: z.lazy(() => CategoryCreateManyParentInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => CategoryWhereUniqueInputSchema),z.lazy(() => CategoryWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export const TransactionUncheckedCreateNestedManyWithoutCategoryInputSchema: z.ZodType<Prisma.TransactionUncheckedCreateNestedManyWithoutCategoryInput> = z.object({
  create: z.union([ z.lazy(() => TransactionCreateWithoutCategoryInputSchema),z.lazy(() => TransactionCreateWithoutCategoryInputSchema).array(),z.lazy(() => TransactionUncheckedCreateWithoutCategoryInputSchema),z.lazy(() => TransactionUncheckedCreateWithoutCategoryInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => TransactionCreateOrConnectWithoutCategoryInputSchema),z.lazy(() => TransactionCreateOrConnectWithoutCategoryInputSchema).array() ]).optional(),
  createMany: z.lazy(() => TransactionCreateManyCategoryInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => TransactionWhereUniqueInputSchema),z.lazy(() => TransactionWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export const EnumCategoryTypeFieldUpdateOperationsInputSchema: z.ZodType<Prisma.EnumCategoryTypeFieldUpdateOperationsInput> = z.object({
  set: z.lazy(() => CategoryTypeSchema).optional()
}).strict();

export const UserUpdateOneRequiredWithoutCategoriesNestedInputSchema: z.ZodType<Prisma.UserUpdateOneRequiredWithoutCategoriesNestedInput> = z.object({
  create: z.union([ z.lazy(() => UserCreateWithoutCategoriesInputSchema),z.lazy(() => UserUncheckedCreateWithoutCategoriesInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutCategoriesInputSchema).optional(),
  upsert: z.lazy(() => UserUpsertWithoutCategoriesInputSchema).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => UserUpdateToOneWithWhereWithoutCategoriesInputSchema),z.lazy(() => UserUpdateWithoutCategoriesInputSchema),z.lazy(() => UserUncheckedUpdateWithoutCategoriesInputSchema) ]).optional(),
}).strict();

export const CategoryUpdateOneWithoutChildrenNestedInputSchema: z.ZodType<Prisma.CategoryUpdateOneWithoutChildrenNestedInput> = z.object({
  create: z.union([ z.lazy(() => CategoryCreateWithoutChildrenInputSchema),z.lazy(() => CategoryUncheckedCreateWithoutChildrenInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => CategoryCreateOrConnectWithoutChildrenInputSchema).optional(),
  upsert: z.lazy(() => CategoryUpsertWithoutChildrenInputSchema).optional(),
  disconnect: z.union([ z.boolean(),z.lazy(() => CategoryWhereInputSchema) ]).optional(),
  delete: z.union([ z.boolean(),z.lazy(() => CategoryWhereInputSchema) ]).optional(),
  connect: z.lazy(() => CategoryWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => CategoryUpdateToOneWithWhereWithoutChildrenInputSchema),z.lazy(() => CategoryUpdateWithoutChildrenInputSchema),z.lazy(() => CategoryUncheckedUpdateWithoutChildrenInputSchema) ]).optional(),
}).strict();

export const CategoryUpdateManyWithoutParentNestedInputSchema: z.ZodType<Prisma.CategoryUpdateManyWithoutParentNestedInput> = z.object({
  create: z.union([ z.lazy(() => CategoryCreateWithoutParentInputSchema),z.lazy(() => CategoryCreateWithoutParentInputSchema).array(),z.lazy(() => CategoryUncheckedCreateWithoutParentInputSchema),z.lazy(() => CategoryUncheckedCreateWithoutParentInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => CategoryCreateOrConnectWithoutParentInputSchema),z.lazy(() => CategoryCreateOrConnectWithoutParentInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => CategoryUpsertWithWhereUniqueWithoutParentInputSchema),z.lazy(() => CategoryUpsertWithWhereUniqueWithoutParentInputSchema).array() ]).optional(),
  createMany: z.lazy(() => CategoryCreateManyParentInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => CategoryWhereUniqueInputSchema),z.lazy(() => CategoryWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => CategoryWhereUniqueInputSchema),z.lazy(() => CategoryWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => CategoryWhereUniqueInputSchema),z.lazy(() => CategoryWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => CategoryWhereUniqueInputSchema),z.lazy(() => CategoryWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => CategoryUpdateWithWhereUniqueWithoutParentInputSchema),z.lazy(() => CategoryUpdateWithWhereUniqueWithoutParentInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => CategoryUpdateManyWithWhereWithoutParentInputSchema),z.lazy(() => CategoryUpdateManyWithWhereWithoutParentInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => CategoryScalarWhereInputSchema),z.lazy(() => CategoryScalarWhereInputSchema).array() ]).optional(),
}).strict();

export const TransactionUpdateManyWithoutCategoryNestedInputSchema: z.ZodType<Prisma.TransactionUpdateManyWithoutCategoryNestedInput> = z.object({
  create: z.union([ z.lazy(() => TransactionCreateWithoutCategoryInputSchema),z.lazy(() => TransactionCreateWithoutCategoryInputSchema).array(),z.lazy(() => TransactionUncheckedCreateWithoutCategoryInputSchema),z.lazy(() => TransactionUncheckedCreateWithoutCategoryInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => TransactionCreateOrConnectWithoutCategoryInputSchema),z.lazy(() => TransactionCreateOrConnectWithoutCategoryInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => TransactionUpsertWithWhereUniqueWithoutCategoryInputSchema),z.lazy(() => TransactionUpsertWithWhereUniqueWithoutCategoryInputSchema).array() ]).optional(),
  createMany: z.lazy(() => TransactionCreateManyCategoryInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => TransactionWhereUniqueInputSchema),z.lazy(() => TransactionWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => TransactionWhereUniqueInputSchema),z.lazy(() => TransactionWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => TransactionWhereUniqueInputSchema),z.lazy(() => TransactionWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => TransactionWhereUniqueInputSchema),z.lazy(() => TransactionWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => TransactionUpdateWithWhereUniqueWithoutCategoryInputSchema),z.lazy(() => TransactionUpdateWithWhereUniqueWithoutCategoryInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => TransactionUpdateManyWithWhereWithoutCategoryInputSchema),z.lazy(() => TransactionUpdateManyWithWhereWithoutCategoryInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => TransactionScalarWhereInputSchema),z.lazy(() => TransactionScalarWhereInputSchema).array() ]).optional(),
}).strict();

export const CategoryUncheckedUpdateManyWithoutParentNestedInputSchema: z.ZodType<Prisma.CategoryUncheckedUpdateManyWithoutParentNestedInput> = z.object({
  create: z.union([ z.lazy(() => CategoryCreateWithoutParentInputSchema),z.lazy(() => CategoryCreateWithoutParentInputSchema).array(),z.lazy(() => CategoryUncheckedCreateWithoutParentInputSchema),z.lazy(() => CategoryUncheckedCreateWithoutParentInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => CategoryCreateOrConnectWithoutParentInputSchema),z.lazy(() => CategoryCreateOrConnectWithoutParentInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => CategoryUpsertWithWhereUniqueWithoutParentInputSchema),z.lazy(() => CategoryUpsertWithWhereUniqueWithoutParentInputSchema).array() ]).optional(),
  createMany: z.lazy(() => CategoryCreateManyParentInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => CategoryWhereUniqueInputSchema),z.lazy(() => CategoryWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => CategoryWhereUniqueInputSchema),z.lazy(() => CategoryWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => CategoryWhereUniqueInputSchema),z.lazy(() => CategoryWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => CategoryWhereUniqueInputSchema),z.lazy(() => CategoryWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => CategoryUpdateWithWhereUniqueWithoutParentInputSchema),z.lazy(() => CategoryUpdateWithWhereUniqueWithoutParentInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => CategoryUpdateManyWithWhereWithoutParentInputSchema),z.lazy(() => CategoryUpdateManyWithWhereWithoutParentInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => CategoryScalarWhereInputSchema),z.lazy(() => CategoryScalarWhereInputSchema).array() ]).optional(),
}).strict();

export const TransactionUncheckedUpdateManyWithoutCategoryNestedInputSchema: z.ZodType<Prisma.TransactionUncheckedUpdateManyWithoutCategoryNestedInput> = z.object({
  create: z.union([ z.lazy(() => TransactionCreateWithoutCategoryInputSchema),z.lazy(() => TransactionCreateWithoutCategoryInputSchema).array(),z.lazy(() => TransactionUncheckedCreateWithoutCategoryInputSchema),z.lazy(() => TransactionUncheckedCreateWithoutCategoryInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => TransactionCreateOrConnectWithoutCategoryInputSchema),z.lazy(() => TransactionCreateOrConnectWithoutCategoryInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => TransactionUpsertWithWhereUniqueWithoutCategoryInputSchema),z.lazy(() => TransactionUpsertWithWhereUniqueWithoutCategoryInputSchema).array() ]).optional(),
  createMany: z.lazy(() => TransactionCreateManyCategoryInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => TransactionWhereUniqueInputSchema),z.lazy(() => TransactionWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => TransactionWhereUniqueInputSchema),z.lazy(() => TransactionWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => TransactionWhereUniqueInputSchema),z.lazy(() => TransactionWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => TransactionWhereUniqueInputSchema),z.lazy(() => TransactionWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => TransactionUpdateWithWhereUniqueWithoutCategoryInputSchema),z.lazy(() => TransactionUpdateWithWhereUniqueWithoutCategoryInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => TransactionUpdateManyWithWhereWithoutCategoryInputSchema),z.lazy(() => TransactionUpdateManyWithWhereWithoutCategoryInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => TransactionScalarWhereInputSchema),z.lazy(() => TransactionScalarWhereInputSchema).array() ]).optional(),
}).strict();

export const NestedStringFilterSchema: z.ZodType<Prisma.NestedStringFilter> = z.object({
  equals: z.string().optional(),
  in: z.string().array().optional(),
  notIn: z.string().array().optional(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringFilterSchema) ]).optional(),
}).strict();

export const NestedDateTimeFilterSchema: z.ZodType<Prisma.NestedDateTimeFilter> = z.object({
  equals: z.coerce.date().optional(),
  in: z.coerce.date().array().optional(),
  notIn: z.coerce.date().array().optional(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeFilterSchema) ]).optional(),
}).strict();

export const NestedStringNullableFilterSchema: z.ZodType<Prisma.NestedStringNullableFilter> = z.object({
  equals: z.string().optional().nullable(),
  in: z.string().array().optional().nullable(),
  notIn: z.string().array().optional().nullable(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringNullableFilterSchema) ]).optional().nullable(),
}).strict();

export const NestedStringWithAggregatesFilterSchema: z.ZodType<Prisma.NestedStringWithAggregatesFilter> = z.object({
  equals: z.string().optional(),
  in: z.string().array().optional(),
  notIn: z.string().array().optional(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedStringFilterSchema).optional(),
  _max: z.lazy(() => NestedStringFilterSchema).optional()
}).strict();

export const NestedIntFilterSchema: z.ZodType<Prisma.NestedIntFilter> = z.object({
  equals: z.number().optional(),
  in: z.number().array().optional(),
  notIn: z.number().array().optional(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedIntFilterSchema) ]).optional(),
}).strict();

export const NestedDateTimeWithAggregatesFilterSchema: z.ZodType<Prisma.NestedDateTimeWithAggregatesFilter> = z.object({
  equals: z.coerce.date().optional(),
  in: z.coerce.date().array().optional(),
  notIn: z.coerce.date().array().optional(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedDateTimeFilterSchema).optional(),
  _max: z.lazy(() => NestedDateTimeFilterSchema).optional()
}).strict();

export const NestedStringNullableWithAggregatesFilterSchema: z.ZodType<Prisma.NestedStringNullableWithAggregatesFilter> = z.object({
  equals: z.string().optional().nullable(),
  in: z.string().array().optional().nullable(),
  notIn: z.string().array().optional().nullable(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedStringNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedStringNullableFilterSchema).optional()
}).strict();

export const NestedIntNullableFilterSchema: z.ZodType<Prisma.NestedIntNullableFilter> = z.object({
  equals: z.number().optional().nullable(),
  in: z.number().array().optional().nullable(),
  notIn: z.number().array().optional().nullable(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedIntNullableFilterSchema) ]).optional().nullable(),
}).strict();

export const NestedEnumBudgetTypeFilterSchema: z.ZodType<Prisma.NestedEnumBudgetTypeFilter> = z.object({
  equals: z.lazy(() => BudgetTypeSchema).optional(),
  in: z.lazy(() => BudgetTypeSchema).array().optional(),
  notIn: z.lazy(() => BudgetTypeSchema).array().optional(),
  not: z.union([ z.lazy(() => BudgetTypeSchema),z.lazy(() => NestedEnumBudgetTypeFilterSchema) ]).optional(),
}).strict();

export const NestedEnumBudgetTypeWithAggregatesFilterSchema: z.ZodType<Prisma.NestedEnumBudgetTypeWithAggregatesFilter> = z.object({
  equals: z.lazy(() => BudgetTypeSchema).optional(),
  in: z.lazy(() => BudgetTypeSchema).array().optional(),
  notIn: z.lazy(() => BudgetTypeSchema).array().optional(),
  not: z.union([ z.lazy(() => BudgetTypeSchema),z.lazy(() => NestedEnumBudgetTypeWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumBudgetTypeFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumBudgetTypeFilterSchema).optional()
}).strict();

export const NestedEnumBudgetPeriodTypeFilterSchema: z.ZodType<Prisma.NestedEnumBudgetPeriodTypeFilter> = z.object({
  equals: z.lazy(() => BudgetPeriodTypeSchema).optional(),
  in: z.lazy(() => BudgetPeriodTypeSchema).array().optional(),
  notIn: z.lazy(() => BudgetPeriodTypeSchema).array().optional(),
  not: z.union([ z.lazy(() => BudgetPeriodTypeSchema),z.lazy(() => NestedEnumBudgetPeriodTypeFilterSchema) ]).optional(),
}).strict();

export const NestedDecimalFilterSchema: z.ZodType<Prisma.NestedDecimalFilter> = z.object({
  equals: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  in: z.union([z.number().array(),z.string().array(),z.instanceof(Decimal).array(),z.instanceof(Prisma.Decimal).array(),DecimalJsLikeSchema.array(),]).refine((v) => Array.isArray(v) && (v as any[]).every((v) => isValidDecimalInput(v)), { message: 'Must be a Decimal' }).optional(),
  notIn: z.union([z.number().array(),z.string().array(),z.instanceof(Decimal).array(),z.instanceof(Prisma.Decimal).array(),DecimalJsLikeSchema.array(),]).refine((v) => Array.isArray(v) && (v as any[]).every((v) => isValidDecimalInput(v)), { message: 'Must be a Decimal' }).optional(),
  lt: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  lte: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  gt: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  gte: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  not: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NestedDecimalFilterSchema) ]).optional(),
}).strict();

export const NestedDateTimeNullableFilterSchema: z.ZodType<Prisma.NestedDateTimeNullableFilter> = z.object({
  equals: z.coerce.date().optional().nullable(),
  in: z.coerce.date().array().optional().nullable(),
  notIn: z.coerce.date().array().optional().nullable(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeNullableFilterSchema) ]).optional().nullable(),
}).strict();

export const NestedEnumBudgetPeriodTypeWithAggregatesFilterSchema: z.ZodType<Prisma.NestedEnumBudgetPeriodTypeWithAggregatesFilter> = z.object({
  equals: z.lazy(() => BudgetPeriodTypeSchema).optional(),
  in: z.lazy(() => BudgetPeriodTypeSchema).array().optional(),
  notIn: z.lazy(() => BudgetPeriodTypeSchema).array().optional(),
  not: z.union([ z.lazy(() => BudgetPeriodTypeSchema),z.lazy(() => NestedEnumBudgetPeriodTypeWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumBudgetPeriodTypeFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumBudgetPeriodTypeFilterSchema).optional()
}).strict();

export const NestedDecimalWithAggregatesFilterSchema: z.ZodType<Prisma.NestedDecimalWithAggregatesFilter> = z.object({
  equals: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  in: z.union([z.number().array(),z.string().array(),z.instanceof(Decimal).array(),z.instanceof(Prisma.Decimal).array(),DecimalJsLikeSchema.array(),]).refine((v) => Array.isArray(v) && (v as any[]).every((v) => isValidDecimalInput(v)), { message: 'Must be a Decimal' }).optional(),
  notIn: z.union([z.number().array(),z.string().array(),z.instanceof(Decimal).array(),z.instanceof(Prisma.Decimal).array(),DecimalJsLikeSchema.array(),]).refine((v) => Array.isArray(v) && (v as any[]).every((v) => isValidDecimalInput(v)), { message: 'Must be a Decimal' }).optional(),
  lt: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  lte: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  gt: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  gte: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }).optional(),
  not: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => NestedDecimalWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _avg: z.lazy(() => NestedDecimalFilterSchema).optional(),
  _sum: z.lazy(() => NestedDecimalFilterSchema).optional(),
  _min: z.lazy(() => NestedDecimalFilterSchema).optional(),
  _max: z.lazy(() => NestedDecimalFilterSchema).optional()
}).strict();

export const NestedDateTimeNullableWithAggregatesFilterSchema: z.ZodType<Prisma.NestedDateTimeNullableWithAggregatesFilter> = z.object({
  equals: z.coerce.date().optional().nullable(),
  in: z.coerce.date().array().optional().nullable(),
  notIn: z.coerce.date().array().optional().nullable(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedDateTimeNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedDateTimeNullableFilterSchema).optional()
}).strict();

export const NestedEnumBudgetUserPermissionFilterSchema: z.ZodType<Prisma.NestedEnumBudgetUserPermissionFilter> = z.object({
  equals: z.lazy(() => BudgetUserPermissionSchema).optional(),
  in: z.lazy(() => BudgetUserPermissionSchema).array().optional(),
  notIn: z.lazy(() => BudgetUserPermissionSchema).array().optional(),
  not: z.union([ z.lazy(() => BudgetUserPermissionSchema),z.lazy(() => NestedEnumBudgetUserPermissionFilterSchema) ]).optional(),
}).strict();

export const NestedEnumBudgetUserPermissionWithAggregatesFilterSchema: z.ZodType<Prisma.NestedEnumBudgetUserPermissionWithAggregatesFilter> = z.object({
  equals: z.lazy(() => BudgetUserPermissionSchema).optional(),
  in: z.lazy(() => BudgetUserPermissionSchema).array().optional(),
  notIn: z.lazy(() => BudgetUserPermissionSchema).array().optional(),
  not: z.union([ z.lazy(() => BudgetUserPermissionSchema),z.lazy(() => NestedEnumBudgetUserPermissionWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumBudgetUserPermissionFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumBudgetUserPermissionFilterSchema).optional()
}).strict();

export const NestedEnumBudgetUserPermissionNullableFilterSchema: z.ZodType<Prisma.NestedEnumBudgetUserPermissionNullableFilter> = z.object({
  equals: z.lazy(() => BudgetUserPermissionSchema).optional().nullable(),
  in: z.lazy(() => BudgetUserPermissionSchema).array().optional().nullable(),
  notIn: z.lazy(() => BudgetUserPermissionSchema).array().optional().nullable(),
  not: z.union([ z.lazy(() => BudgetUserPermissionSchema),z.lazy(() => NestedEnumBudgetUserPermissionNullableFilterSchema) ]).optional().nullable(),
}).strict();

export const NestedEnumBudgetUserPermissionNullableWithAggregatesFilterSchema: z.ZodType<Prisma.NestedEnumBudgetUserPermissionNullableWithAggregatesFilter> = z.object({
  equals: z.lazy(() => BudgetUserPermissionSchema).optional().nullable(),
  in: z.lazy(() => BudgetUserPermissionSchema).array().optional().nullable(),
  notIn: z.lazy(() => BudgetUserPermissionSchema).array().optional().nullable(),
  not: z.union([ z.lazy(() => BudgetUserPermissionSchema),z.lazy(() => NestedEnumBudgetUserPermissionNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumBudgetUserPermissionNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumBudgetUserPermissionNullableFilterSchema).optional()
}).strict();

export const NestedEnumCategoryTypeFilterSchema: z.ZodType<Prisma.NestedEnumCategoryTypeFilter> = z.object({
  equals: z.lazy(() => CategoryTypeSchema).optional(),
  in: z.lazy(() => CategoryTypeSchema).array().optional(),
  notIn: z.lazy(() => CategoryTypeSchema).array().optional(),
  not: z.union([ z.lazy(() => CategoryTypeSchema),z.lazy(() => NestedEnumCategoryTypeFilterSchema) ]).optional(),
}).strict();

export const NestedEnumCategoryTypeWithAggregatesFilterSchema: z.ZodType<Prisma.NestedEnumCategoryTypeWithAggregatesFilter> = z.object({
  equals: z.lazy(() => CategoryTypeSchema).optional(),
  in: z.lazy(() => CategoryTypeSchema).array().optional(),
  notIn: z.lazy(() => CategoryTypeSchema).array().optional(),
  not: z.union([ z.lazy(() => CategoryTypeSchema),z.lazy(() => NestedEnumCategoryTypeWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumCategoryTypeFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumCategoryTypeFilterSchema).optional()
}).strict();

export const UserWalletAccountCreateWithoutUserInputSchema: z.ZodType<Prisma.UserWalletAccountCreateWithoutUserInput> = z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  name: z.string(),
  icon: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  lastDigits: z.string().optional().nullable(),
  preferredCurrency: z.string(),
  transactions: z.lazy(() => TransactionCreateNestedManyWithoutWalletAccountInputSchema).optional()
}).strict();

export const UserWalletAccountUncheckedCreateWithoutUserInputSchema: z.ZodType<Prisma.UserWalletAccountUncheckedCreateWithoutUserInput> = z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  name: z.string(),
  icon: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  lastDigits: z.string().optional().nullable(),
  preferredCurrency: z.string(),
  transactions: z.lazy(() => TransactionUncheckedCreateNestedManyWithoutWalletAccountInputSchema).optional()
}).strict();

export const UserWalletAccountCreateOrConnectWithoutUserInputSchema: z.ZodType<Prisma.UserWalletAccountCreateOrConnectWithoutUserInput> = z.object({
  where: z.lazy(() => UserWalletAccountWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => UserWalletAccountCreateWithoutUserInputSchema),z.lazy(() => UserWalletAccountUncheckedCreateWithoutUserInputSchema) ]),
}).strict();

export const UserWalletAccountCreateManyUserInputEnvelopeSchema: z.ZodType<Prisma.UserWalletAccountCreateManyUserInputEnvelope> = z.object({
  data: z.union([ z.lazy(() => UserWalletAccountCreateManyUserInputSchema),z.lazy(() => UserWalletAccountCreateManyUserInputSchema).array() ]),
  skipDuplicates: z.boolean().optional()
}).strict();

export const BudgetUserCreateWithoutUserInputSchema: z.ZodType<Prisma.BudgetUserCreateWithoutUserInput> = z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  permission: z.lazy(() => BudgetUserPermissionSchema),
  budget: z.lazy(() => BudgetCreateNestedOneWithoutBudgetUsersInputSchema)
}).strict();

export const BudgetUserUncheckedCreateWithoutUserInputSchema: z.ZodType<Prisma.BudgetUserUncheckedCreateWithoutUserInput> = z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  permission: z.lazy(() => BudgetUserPermissionSchema),
  budgetId: z.string()
}).strict();

export const BudgetUserCreateOrConnectWithoutUserInputSchema: z.ZodType<Prisma.BudgetUserCreateOrConnectWithoutUserInput> = z.object({
  where: z.lazy(() => BudgetUserWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => BudgetUserCreateWithoutUserInputSchema),z.lazy(() => BudgetUserUncheckedCreateWithoutUserInputSchema) ]),
}).strict();

export const BudgetUserCreateManyUserInputEnvelopeSchema: z.ZodType<Prisma.BudgetUserCreateManyUserInputEnvelope> = z.object({
  data: z.union([ z.lazy(() => BudgetUserCreateManyUserInputSchema),z.lazy(() => BudgetUserCreateManyUserInputSchema).array() ]),
  skipDuplicates: z.boolean().optional()
}).strict();

export const TransactionCreateWithoutCreatedByUserInputSchema: z.ZodType<Prisma.TransactionCreateWithoutCreatedByUserInput> = z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  amount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),
  amountInVnd: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),
  currency: z.string(),
  date: z.coerce.date(),
  note: z.string().optional().nullable(),
  category: z.lazy(() => CategoryCreateNestedOneWithoutTransactionsInputSchema).optional(),
  budget: z.lazy(() => BudgetCreateNestedOneWithoutTransactionsInputSchema).optional(),
  walletAccount: z.lazy(() => UserWalletAccountCreateNestedOneWithoutTransactionsInputSchema)
}).strict();

export const TransactionUncheckedCreateWithoutCreatedByUserInputSchema: z.ZodType<Prisma.TransactionUncheckedCreateWithoutCreatedByUserInput> = z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  amount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),
  amountInVnd: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),
  currency: z.string(),
  date: z.coerce.date(),
  note: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  budgetId: z.string().optional().nullable(),
  walletAccountId: z.string()
}).strict();

export const TransactionCreateOrConnectWithoutCreatedByUserInputSchema: z.ZodType<Prisma.TransactionCreateOrConnectWithoutCreatedByUserInput> = z.object({
  where: z.lazy(() => TransactionWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => TransactionCreateWithoutCreatedByUserInputSchema),z.lazy(() => TransactionUncheckedCreateWithoutCreatedByUserInputSchema) ]),
}).strict();

export const TransactionCreateManyCreatedByUserInputEnvelopeSchema: z.ZodType<Prisma.TransactionCreateManyCreatedByUserInputEnvelope> = z.object({
  data: z.union([ z.lazy(() => TransactionCreateManyCreatedByUserInputSchema),z.lazy(() => TransactionCreateManyCreatedByUserInputSchema).array() ]),
  skipDuplicates: z.boolean().optional()
}).strict();

export const BudgetUserInvitationCreateWithoutCreatedByUserInputSchema: z.ZodType<Prisma.BudgetUserInvitationCreateWithoutCreatedByUserInput> = z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  email: z.string().optional().nullable(),
  token: z.string().optional(),
  expiresAt: z.coerce.date(),
  permission: z.lazy(() => BudgetUserPermissionSchema).optional().nullable(),
  budget: z.lazy(() => BudgetCreateNestedOneWithoutInvitationsInputSchema),
  responses: z.lazy(() => BudgetUserInvitationResponseCreateNestedManyWithoutInvitationInputSchema).optional()
}).strict();

export const BudgetUserInvitationUncheckedCreateWithoutCreatedByUserInputSchema: z.ZodType<Prisma.BudgetUserInvitationUncheckedCreateWithoutCreatedByUserInput> = z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  email: z.string().optional().nullable(),
  token: z.string().optional(),
  expiresAt: z.coerce.date(),
  permission: z.lazy(() => BudgetUserPermissionSchema).optional().nullable(),
  budgetId: z.string(),
  responses: z.lazy(() => BudgetUserInvitationResponseUncheckedCreateNestedManyWithoutInvitationInputSchema).optional()
}).strict();

export const BudgetUserInvitationCreateOrConnectWithoutCreatedByUserInputSchema: z.ZodType<Prisma.BudgetUserInvitationCreateOrConnectWithoutCreatedByUserInput> = z.object({
  where: z.lazy(() => BudgetUserInvitationWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => BudgetUserInvitationCreateWithoutCreatedByUserInputSchema),z.lazy(() => BudgetUserInvitationUncheckedCreateWithoutCreatedByUserInputSchema) ]),
}).strict();

export const BudgetUserInvitationCreateManyCreatedByUserInputEnvelopeSchema: z.ZodType<Prisma.BudgetUserInvitationCreateManyCreatedByUserInputEnvelope> = z.object({
  data: z.union([ z.lazy(() => BudgetUserInvitationCreateManyCreatedByUserInputSchema),z.lazy(() => BudgetUserInvitationCreateManyCreatedByUserInputSchema).array() ]),
  skipDuplicates: z.boolean().optional()
}).strict();

export const BudgetUserInvitationResponseCreateWithoutCreatedUserInputSchema: z.ZodType<Prisma.BudgetUserInvitationResponseCreateWithoutCreatedUserInput> = z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  acceptedAt: z.coerce.date().optional().nullable(),
  declinedAt: z.coerce.date().optional().nullable(),
  invitation: z.lazy(() => BudgetUserInvitationCreateNestedOneWithoutResponsesInputSchema)
}).strict();

export const BudgetUserInvitationResponseUncheckedCreateWithoutCreatedUserInputSchema: z.ZodType<Prisma.BudgetUserInvitationResponseUncheckedCreateWithoutCreatedUserInput> = z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  acceptedAt: z.coerce.date().optional().nullable(),
  declinedAt: z.coerce.date().optional().nullable(),
  invitationId: z.string()
}).strict();

export const BudgetUserInvitationResponseCreateOrConnectWithoutCreatedUserInputSchema: z.ZodType<Prisma.BudgetUserInvitationResponseCreateOrConnectWithoutCreatedUserInput> = z.object({
  where: z.lazy(() => BudgetUserInvitationResponseWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => BudgetUserInvitationResponseCreateWithoutCreatedUserInputSchema),z.lazy(() => BudgetUserInvitationResponseUncheckedCreateWithoutCreatedUserInputSchema) ]),
}).strict();

export const CategoryCreateWithoutUserInputSchema: z.ZodType<Prisma.CategoryCreateWithoutUserInput> = z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  type: z.lazy(() => CategoryTypeSchema),
  name: z.string(),
  description: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  parent: z.lazy(() => CategoryCreateNestedOneWithoutChildrenInputSchema).optional(),
  children: z.lazy(() => CategoryCreateNestedManyWithoutParentInputSchema).optional(),
  transactions: z.lazy(() => TransactionCreateNestedManyWithoutCategoryInputSchema).optional()
}).strict();

export const CategoryUncheckedCreateWithoutUserInputSchema: z.ZodType<Prisma.CategoryUncheckedCreateWithoutUserInput> = z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  type: z.lazy(() => CategoryTypeSchema),
  name: z.string(),
  description: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  parentId: z.string().optional().nullable(),
  children: z.lazy(() => CategoryUncheckedCreateNestedManyWithoutParentInputSchema).optional(),
  transactions: z.lazy(() => TransactionUncheckedCreateNestedManyWithoutCategoryInputSchema).optional()
}).strict();

export const CategoryCreateOrConnectWithoutUserInputSchema: z.ZodType<Prisma.CategoryCreateOrConnectWithoutUserInput> = z.object({
  where: z.lazy(() => CategoryWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => CategoryCreateWithoutUserInputSchema),z.lazy(() => CategoryUncheckedCreateWithoutUserInputSchema) ]),
}).strict();

export const CategoryCreateManyUserInputEnvelopeSchema: z.ZodType<Prisma.CategoryCreateManyUserInputEnvelope> = z.object({
  data: z.union([ z.lazy(() => CategoryCreateManyUserInputSchema),z.lazy(() => CategoryCreateManyUserInputSchema).array() ]),
  skipDuplicates: z.boolean().optional()
}).strict();

export const UserWalletAccountUpsertWithWhereUniqueWithoutUserInputSchema: z.ZodType<Prisma.UserWalletAccountUpsertWithWhereUniqueWithoutUserInput> = z.object({
  where: z.lazy(() => UserWalletAccountWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => UserWalletAccountUpdateWithoutUserInputSchema),z.lazy(() => UserWalletAccountUncheckedUpdateWithoutUserInputSchema) ]),
  create: z.union([ z.lazy(() => UserWalletAccountCreateWithoutUserInputSchema),z.lazy(() => UserWalletAccountUncheckedCreateWithoutUserInputSchema) ]),
}).strict();

export const UserWalletAccountUpdateWithWhereUniqueWithoutUserInputSchema: z.ZodType<Prisma.UserWalletAccountUpdateWithWhereUniqueWithoutUserInput> = z.object({
  where: z.lazy(() => UserWalletAccountWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => UserWalletAccountUpdateWithoutUserInputSchema),z.lazy(() => UserWalletAccountUncheckedUpdateWithoutUserInputSchema) ]),
}).strict();

export const UserWalletAccountUpdateManyWithWhereWithoutUserInputSchema: z.ZodType<Prisma.UserWalletAccountUpdateManyWithWhereWithoutUserInput> = z.object({
  where: z.lazy(() => UserWalletAccountScalarWhereInputSchema),
  data: z.union([ z.lazy(() => UserWalletAccountUpdateManyMutationInputSchema),z.lazy(() => UserWalletAccountUncheckedUpdateManyWithoutUserInputSchema) ]),
}).strict();

export const UserWalletAccountScalarWhereInputSchema: z.ZodType<Prisma.UserWalletAccountScalarWhereInput> = z.object({
  AND: z.union([ z.lazy(() => UserWalletAccountScalarWhereInputSchema),z.lazy(() => UserWalletAccountScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => UserWalletAccountScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => UserWalletAccountScalarWhereInputSchema),z.lazy(() => UserWalletAccountScalarWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  name: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  icon: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  description: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  lastDigits: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  preferredCurrency: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  userId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
}).strict();

export const BudgetUserUpsertWithWhereUniqueWithoutUserInputSchema: z.ZodType<Prisma.BudgetUserUpsertWithWhereUniqueWithoutUserInput> = z.object({
  where: z.lazy(() => BudgetUserWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => BudgetUserUpdateWithoutUserInputSchema),z.lazy(() => BudgetUserUncheckedUpdateWithoutUserInputSchema) ]),
  create: z.union([ z.lazy(() => BudgetUserCreateWithoutUserInputSchema),z.lazy(() => BudgetUserUncheckedCreateWithoutUserInputSchema) ]),
}).strict();

export const BudgetUserUpdateWithWhereUniqueWithoutUserInputSchema: z.ZodType<Prisma.BudgetUserUpdateWithWhereUniqueWithoutUserInput> = z.object({
  where: z.lazy(() => BudgetUserWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => BudgetUserUpdateWithoutUserInputSchema),z.lazy(() => BudgetUserUncheckedUpdateWithoutUserInputSchema) ]),
}).strict();

export const BudgetUserUpdateManyWithWhereWithoutUserInputSchema: z.ZodType<Prisma.BudgetUserUpdateManyWithWhereWithoutUserInput> = z.object({
  where: z.lazy(() => BudgetUserScalarWhereInputSchema),
  data: z.union([ z.lazy(() => BudgetUserUpdateManyMutationInputSchema),z.lazy(() => BudgetUserUncheckedUpdateManyWithoutUserInputSchema) ]),
}).strict();

export const BudgetUserScalarWhereInputSchema: z.ZodType<Prisma.BudgetUserScalarWhereInput> = z.object({
  AND: z.union([ z.lazy(() => BudgetUserScalarWhereInputSchema),z.lazy(() => BudgetUserScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => BudgetUserScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => BudgetUserScalarWhereInputSchema),z.lazy(() => BudgetUserScalarWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  permission: z.union([ z.lazy(() => EnumBudgetUserPermissionFilterSchema),z.lazy(() => BudgetUserPermissionSchema) ]).optional(),
  userId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  budgetId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
}).strict();

export const TransactionUpsertWithWhereUniqueWithoutCreatedByUserInputSchema: z.ZodType<Prisma.TransactionUpsertWithWhereUniqueWithoutCreatedByUserInput> = z.object({
  where: z.lazy(() => TransactionWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => TransactionUpdateWithoutCreatedByUserInputSchema),z.lazy(() => TransactionUncheckedUpdateWithoutCreatedByUserInputSchema) ]),
  create: z.union([ z.lazy(() => TransactionCreateWithoutCreatedByUserInputSchema),z.lazy(() => TransactionUncheckedCreateWithoutCreatedByUserInputSchema) ]),
}).strict();

export const TransactionUpdateWithWhereUniqueWithoutCreatedByUserInputSchema: z.ZodType<Prisma.TransactionUpdateWithWhereUniqueWithoutCreatedByUserInput> = z.object({
  where: z.lazy(() => TransactionWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => TransactionUpdateWithoutCreatedByUserInputSchema),z.lazy(() => TransactionUncheckedUpdateWithoutCreatedByUserInputSchema) ]),
}).strict();

export const TransactionUpdateManyWithWhereWithoutCreatedByUserInputSchema: z.ZodType<Prisma.TransactionUpdateManyWithWhereWithoutCreatedByUserInput> = z.object({
  where: z.lazy(() => TransactionScalarWhereInputSchema),
  data: z.union([ z.lazy(() => TransactionUpdateManyMutationInputSchema),z.lazy(() => TransactionUncheckedUpdateManyWithoutCreatedByUserInputSchema) ]),
}).strict();

export const TransactionScalarWhereInputSchema: z.ZodType<Prisma.TransactionScalarWhereInput> = z.object({
  AND: z.union([ z.lazy(() => TransactionScalarWhereInputSchema),z.lazy(() => TransactionScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => TransactionScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => TransactionScalarWhereInputSchema),z.lazy(() => TransactionScalarWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  amount: z.union([ z.lazy(() => DecimalFilterSchema),z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional(),
  amountInVnd: z.union([ z.lazy(() => DecimalFilterSchema),z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional(),
  currency: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  date: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  note: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  categoryId: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  budgetId: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  walletAccountId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  createdByUserId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
}).strict();

export const BudgetUserInvitationUpsertWithWhereUniqueWithoutCreatedByUserInputSchema: z.ZodType<Prisma.BudgetUserInvitationUpsertWithWhereUniqueWithoutCreatedByUserInput> = z.object({
  where: z.lazy(() => BudgetUserInvitationWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => BudgetUserInvitationUpdateWithoutCreatedByUserInputSchema),z.lazy(() => BudgetUserInvitationUncheckedUpdateWithoutCreatedByUserInputSchema) ]),
  create: z.union([ z.lazy(() => BudgetUserInvitationCreateWithoutCreatedByUserInputSchema),z.lazy(() => BudgetUserInvitationUncheckedCreateWithoutCreatedByUserInputSchema) ]),
}).strict();

export const BudgetUserInvitationUpdateWithWhereUniqueWithoutCreatedByUserInputSchema: z.ZodType<Prisma.BudgetUserInvitationUpdateWithWhereUniqueWithoutCreatedByUserInput> = z.object({
  where: z.lazy(() => BudgetUserInvitationWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => BudgetUserInvitationUpdateWithoutCreatedByUserInputSchema),z.lazy(() => BudgetUserInvitationUncheckedUpdateWithoutCreatedByUserInputSchema) ]),
}).strict();

export const BudgetUserInvitationUpdateManyWithWhereWithoutCreatedByUserInputSchema: z.ZodType<Prisma.BudgetUserInvitationUpdateManyWithWhereWithoutCreatedByUserInput> = z.object({
  where: z.lazy(() => BudgetUserInvitationScalarWhereInputSchema),
  data: z.union([ z.lazy(() => BudgetUserInvitationUpdateManyMutationInputSchema),z.lazy(() => BudgetUserInvitationUncheckedUpdateManyWithoutCreatedByUserInputSchema) ]),
}).strict();

export const BudgetUserInvitationScalarWhereInputSchema: z.ZodType<Prisma.BudgetUserInvitationScalarWhereInput> = z.object({
  AND: z.union([ z.lazy(() => BudgetUserInvitationScalarWhereInputSchema),z.lazy(() => BudgetUserInvitationScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => BudgetUserInvitationScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => BudgetUserInvitationScalarWhereInputSchema),z.lazy(() => BudgetUserInvitationScalarWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  email: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  token: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  expiresAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  permission: z.union([ z.lazy(() => EnumBudgetUserPermissionNullableFilterSchema),z.lazy(() => BudgetUserPermissionSchema) ]).optional().nullable(),
  createdByUserId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  budgetId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
}).strict();

export const BudgetUserInvitationResponseUpsertWithoutCreatedUserInputSchema: z.ZodType<Prisma.BudgetUserInvitationResponseUpsertWithoutCreatedUserInput> = z.object({
  update: z.union([ z.lazy(() => BudgetUserInvitationResponseUpdateWithoutCreatedUserInputSchema),z.lazy(() => BudgetUserInvitationResponseUncheckedUpdateWithoutCreatedUserInputSchema) ]),
  create: z.union([ z.lazy(() => BudgetUserInvitationResponseCreateWithoutCreatedUserInputSchema),z.lazy(() => BudgetUserInvitationResponseUncheckedCreateWithoutCreatedUserInputSchema) ]),
  where: z.lazy(() => BudgetUserInvitationResponseWhereInputSchema).optional()
}).strict();

export const BudgetUserInvitationResponseUpdateToOneWithWhereWithoutCreatedUserInputSchema: z.ZodType<Prisma.BudgetUserInvitationResponseUpdateToOneWithWhereWithoutCreatedUserInput> = z.object({
  where: z.lazy(() => BudgetUserInvitationResponseWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => BudgetUserInvitationResponseUpdateWithoutCreatedUserInputSchema),z.lazy(() => BudgetUserInvitationResponseUncheckedUpdateWithoutCreatedUserInputSchema) ]),
}).strict();

export const BudgetUserInvitationResponseUpdateWithoutCreatedUserInputSchema: z.ZodType<Prisma.BudgetUserInvitationResponseUpdateWithoutCreatedUserInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  acceptedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  declinedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  invitation: z.lazy(() => BudgetUserInvitationUpdateOneRequiredWithoutResponsesNestedInputSchema).optional()
}).strict();

export const BudgetUserInvitationResponseUncheckedUpdateWithoutCreatedUserInputSchema: z.ZodType<Prisma.BudgetUserInvitationResponseUncheckedUpdateWithoutCreatedUserInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  acceptedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  declinedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  invitationId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const CategoryUpsertWithWhereUniqueWithoutUserInputSchema: z.ZodType<Prisma.CategoryUpsertWithWhereUniqueWithoutUserInput> = z.object({
  where: z.lazy(() => CategoryWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => CategoryUpdateWithoutUserInputSchema),z.lazy(() => CategoryUncheckedUpdateWithoutUserInputSchema) ]),
  create: z.union([ z.lazy(() => CategoryCreateWithoutUserInputSchema),z.lazy(() => CategoryUncheckedCreateWithoutUserInputSchema) ]),
}).strict();

export const CategoryUpdateWithWhereUniqueWithoutUserInputSchema: z.ZodType<Prisma.CategoryUpdateWithWhereUniqueWithoutUserInput> = z.object({
  where: z.lazy(() => CategoryWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => CategoryUpdateWithoutUserInputSchema),z.lazy(() => CategoryUncheckedUpdateWithoutUserInputSchema) ]),
}).strict();

export const CategoryUpdateManyWithWhereWithoutUserInputSchema: z.ZodType<Prisma.CategoryUpdateManyWithWhereWithoutUserInput> = z.object({
  where: z.lazy(() => CategoryScalarWhereInputSchema),
  data: z.union([ z.lazy(() => CategoryUpdateManyMutationInputSchema),z.lazy(() => CategoryUncheckedUpdateManyWithoutUserInputSchema) ]),
}).strict();

export const CategoryScalarWhereInputSchema: z.ZodType<Prisma.CategoryScalarWhereInput> = z.object({
  AND: z.union([ z.lazy(() => CategoryScalarWhereInputSchema),z.lazy(() => CategoryScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => CategoryScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => CategoryScalarWhereInputSchema),z.lazy(() => CategoryScalarWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  type: z.union([ z.lazy(() => EnumCategoryTypeFilterSchema),z.lazy(() => CategoryTypeSchema) ]).optional(),
  name: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  description: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  icon: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  color: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  userId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  parentId: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
}).strict();

export const UserCreateWithoutWalletAccountsInputSchema: z.ZodType<Prisma.UserCreateWithoutWalletAccountsInput> = z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  email: z.string(),
  name: z.string().optional().nullable(),
  budgetUsers: z.lazy(() => BudgetUserCreateNestedManyWithoutUserInputSchema).optional(),
  transactions: z.lazy(() => TransactionCreateNestedManyWithoutCreatedByUserInputSchema).optional(),
  createdBudgetUserInvitations: z.lazy(() => BudgetUserInvitationCreateNestedManyWithoutCreatedByUserInputSchema).optional(),
  createdFromInvitation: z.lazy(() => BudgetUserInvitationResponseCreateNestedOneWithoutCreatedUserInputSchema).optional(),
  categories: z.lazy(() => CategoryCreateNestedManyWithoutUserInputSchema).optional()
}).strict();

export const UserUncheckedCreateWithoutWalletAccountsInputSchema: z.ZodType<Prisma.UserUncheckedCreateWithoutWalletAccountsInput> = z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  email: z.string(),
  name: z.string().optional().nullable(),
  budgetUsers: z.lazy(() => BudgetUserUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
  transactions: z.lazy(() => TransactionUncheckedCreateNestedManyWithoutCreatedByUserInputSchema).optional(),
  createdBudgetUserInvitations: z.lazy(() => BudgetUserInvitationUncheckedCreateNestedManyWithoutCreatedByUserInputSchema).optional(),
  createdFromInvitation: z.lazy(() => BudgetUserInvitationResponseUncheckedCreateNestedOneWithoutCreatedUserInputSchema).optional(),
  categories: z.lazy(() => CategoryUncheckedCreateNestedManyWithoutUserInputSchema).optional()
}).strict();

export const UserCreateOrConnectWithoutWalletAccountsInputSchema: z.ZodType<Prisma.UserCreateOrConnectWithoutWalletAccountsInput> = z.object({
  where: z.lazy(() => UserWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => UserCreateWithoutWalletAccountsInputSchema),z.lazy(() => UserUncheckedCreateWithoutWalletAccountsInputSchema) ]),
}).strict();

export const TransactionCreateWithoutWalletAccountInputSchema: z.ZodType<Prisma.TransactionCreateWithoutWalletAccountInput> = z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  amount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),
  amountInVnd: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),
  currency: z.string(),
  date: z.coerce.date(),
  note: z.string().optional().nullable(),
  category: z.lazy(() => CategoryCreateNestedOneWithoutTransactionsInputSchema).optional(),
  budget: z.lazy(() => BudgetCreateNestedOneWithoutTransactionsInputSchema).optional(),
  createdByUser: z.lazy(() => UserCreateNestedOneWithoutTransactionsInputSchema)
}).strict();

export const TransactionUncheckedCreateWithoutWalletAccountInputSchema: z.ZodType<Prisma.TransactionUncheckedCreateWithoutWalletAccountInput> = z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  amount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),
  amountInVnd: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),
  currency: z.string(),
  date: z.coerce.date(),
  note: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  budgetId: z.string().optional().nullable(),
  createdByUserId: z.string()
}).strict();

export const TransactionCreateOrConnectWithoutWalletAccountInputSchema: z.ZodType<Prisma.TransactionCreateOrConnectWithoutWalletAccountInput> = z.object({
  where: z.lazy(() => TransactionWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => TransactionCreateWithoutWalletAccountInputSchema),z.lazy(() => TransactionUncheckedCreateWithoutWalletAccountInputSchema) ]),
}).strict();

export const TransactionCreateManyWalletAccountInputEnvelopeSchema: z.ZodType<Prisma.TransactionCreateManyWalletAccountInputEnvelope> = z.object({
  data: z.union([ z.lazy(() => TransactionCreateManyWalletAccountInputSchema),z.lazy(() => TransactionCreateManyWalletAccountInputSchema).array() ]),
  skipDuplicates: z.boolean().optional()
}).strict();

export const UserUpsertWithoutWalletAccountsInputSchema: z.ZodType<Prisma.UserUpsertWithoutWalletAccountsInput> = z.object({
  update: z.union([ z.lazy(() => UserUpdateWithoutWalletAccountsInputSchema),z.lazy(() => UserUncheckedUpdateWithoutWalletAccountsInputSchema) ]),
  create: z.union([ z.lazy(() => UserCreateWithoutWalletAccountsInputSchema),z.lazy(() => UserUncheckedCreateWithoutWalletAccountsInputSchema) ]),
  where: z.lazy(() => UserWhereInputSchema).optional()
}).strict();

export const UserUpdateToOneWithWhereWithoutWalletAccountsInputSchema: z.ZodType<Prisma.UserUpdateToOneWithWhereWithoutWalletAccountsInput> = z.object({
  where: z.lazy(() => UserWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => UserUpdateWithoutWalletAccountsInputSchema),z.lazy(() => UserUncheckedUpdateWithoutWalletAccountsInputSchema) ]),
}).strict();

export const UserUpdateWithoutWalletAccountsInputSchema: z.ZodType<Prisma.UserUpdateWithoutWalletAccountsInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  budgetUsers: z.lazy(() => BudgetUserUpdateManyWithoutUserNestedInputSchema).optional(),
  transactions: z.lazy(() => TransactionUpdateManyWithoutCreatedByUserNestedInputSchema).optional(),
  createdBudgetUserInvitations: z.lazy(() => BudgetUserInvitationUpdateManyWithoutCreatedByUserNestedInputSchema).optional(),
  createdFromInvitation: z.lazy(() => BudgetUserInvitationResponseUpdateOneWithoutCreatedUserNestedInputSchema).optional(),
  categories: z.lazy(() => CategoryUpdateManyWithoutUserNestedInputSchema).optional()
}).strict();

export const UserUncheckedUpdateWithoutWalletAccountsInputSchema: z.ZodType<Prisma.UserUncheckedUpdateWithoutWalletAccountsInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  budgetUsers: z.lazy(() => BudgetUserUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  transactions: z.lazy(() => TransactionUncheckedUpdateManyWithoutCreatedByUserNestedInputSchema).optional(),
  createdBudgetUserInvitations: z.lazy(() => BudgetUserInvitationUncheckedUpdateManyWithoutCreatedByUserNestedInputSchema).optional(),
  createdFromInvitation: z.lazy(() => BudgetUserInvitationResponseUncheckedUpdateOneWithoutCreatedUserNestedInputSchema).optional(),
  categories: z.lazy(() => CategoryUncheckedUpdateManyWithoutUserNestedInputSchema).optional()
}).strict();

export const TransactionUpsertWithWhereUniqueWithoutWalletAccountInputSchema: z.ZodType<Prisma.TransactionUpsertWithWhereUniqueWithoutWalletAccountInput> = z.object({
  where: z.lazy(() => TransactionWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => TransactionUpdateWithoutWalletAccountInputSchema),z.lazy(() => TransactionUncheckedUpdateWithoutWalletAccountInputSchema) ]),
  create: z.union([ z.lazy(() => TransactionCreateWithoutWalletAccountInputSchema),z.lazy(() => TransactionUncheckedCreateWithoutWalletAccountInputSchema) ]),
}).strict();

export const TransactionUpdateWithWhereUniqueWithoutWalletAccountInputSchema: z.ZodType<Prisma.TransactionUpdateWithWhereUniqueWithoutWalletAccountInput> = z.object({
  where: z.lazy(() => TransactionWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => TransactionUpdateWithoutWalletAccountInputSchema),z.lazy(() => TransactionUncheckedUpdateWithoutWalletAccountInputSchema) ]),
}).strict();

export const TransactionUpdateManyWithWhereWithoutWalletAccountInputSchema: z.ZodType<Prisma.TransactionUpdateManyWithWhereWithoutWalletAccountInput> = z.object({
  where: z.lazy(() => TransactionScalarWhereInputSchema),
  data: z.union([ z.lazy(() => TransactionUpdateManyMutationInputSchema),z.lazy(() => TransactionUncheckedUpdateManyWithoutWalletAccountInputSchema) ]),
}).strict();

export const BudgetPeriodConfigCreateWithoutBudgetInputSchema: z.ZodType<Prisma.BudgetPeriodConfigCreateWithoutBudgetInput> = z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  type: z.lazy(() => BudgetPeriodTypeSchema),
  amount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),
  startDate: z.coerce.date().optional().nullable(),
  endDate: z.coerce.date().optional().nullable()
}).strict();

export const BudgetPeriodConfigUncheckedCreateWithoutBudgetInputSchema: z.ZodType<Prisma.BudgetPeriodConfigUncheckedCreateWithoutBudgetInput> = z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  type: z.lazy(() => BudgetPeriodTypeSchema),
  amount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),
  startDate: z.coerce.date().optional().nullable(),
  endDate: z.coerce.date().optional().nullable()
}).strict();

export const BudgetPeriodConfigCreateOrConnectWithoutBudgetInputSchema: z.ZodType<Prisma.BudgetPeriodConfigCreateOrConnectWithoutBudgetInput> = z.object({
  where: z.lazy(() => BudgetPeriodConfigWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => BudgetPeriodConfigCreateWithoutBudgetInputSchema),z.lazy(() => BudgetPeriodConfigUncheckedCreateWithoutBudgetInputSchema) ]),
}).strict();

export const BudgetPeriodConfigCreateManyBudgetInputEnvelopeSchema: z.ZodType<Prisma.BudgetPeriodConfigCreateManyBudgetInputEnvelope> = z.object({
  data: z.union([ z.lazy(() => BudgetPeriodConfigCreateManyBudgetInputSchema),z.lazy(() => BudgetPeriodConfigCreateManyBudgetInputSchema).array() ]),
  skipDuplicates: z.boolean().optional()
}).strict();

export const BudgetUserCreateWithoutBudgetInputSchema: z.ZodType<Prisma.BudgetUserCreateWithoutBudgetInput> = z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  permission: z.lazy(() => BudgetUserPermissionSchema),
  user: z.lazy(() => UserCreateNestedOneWithoutBudgetUsersInputSchema)
}).strict();

export const BudgetUserUncheckedCreateWithoutBudgetInputSchema: z.ZodType<Prisma.BudgetUserUncheckedCreateWithoutBudgetInput> = z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  permission: z.lazy(() => BudgetUserPermissionSchema),
  userId: z.string()
}).strict();

export const BudgetUserCreateOrConnectWithoutBudgetInputSchema: z.ZodType<Prisma.BudgetUserCreateOrConnectWithoutBudgetInput> = z.object({
  where: z.lazy(() => BudgetUserWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => BudgetUserCreateWithoutBudgetInputSchema),z.lazy(() => BudgetUserUncheckedCreateWithoutBudgetInputSchema) ]),
}).strict();

export const BudgetUserCreateManyBudgetInputEnvelopeSchema: z.ZodType<Prisma.BudgetUserCreateManyBudgetInputEnvelope> = z.object({
  data: z.union([ z.lazy(() => BudgetUserCreateManyBudgetInputSchema),z.lazy(() => BudgetUserCreateManyBudgetInputSchema).array() ]),
  skipDuplicates: z.boolean().optional()
}).strict();

export const TransactionCreateWithoutBudgetInputSchema: z.ZodType<Prisma.TransactionCreateWithoutBudgetInput> = z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  amount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),
  amountInVnd: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),
  currency: z.string(),
  date: z.coerce.date(),
  note: z.string().optional().nullable(),
  category: z.lazy(() => CategoryCreateNestedOneWithoutTransactionsInputSchema).optional(),
  walletAccount: z.lazy(() => UserWalletAccountCreateNestedOneWithoutTransactionsInputSchema),
  createdByUser: z.lazy(() => UserCreateNestedOneWithoutTransactionsInputSchema)
}).strict();

export const TransactionUncheckedCreateWithoutBudgetInputSchema: z.ZodType<Prisma.TransactionUncheckedCreateWithoutBudgetInput> = z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  amount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),
  amountInVnd: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),
  currency: z.string(),
  date: z.coerce.date(),
  note: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  walletAccountId: z.string(),
  createdByUserId: z.string()
}).strict();

export const TransactionCreateOrConnectWithoutBudgetInputSchema: z.ZodType<Prisma.TransactionCreateOrConnectWithoutBudgetInput> = z.object({
  where: z.lazy(() => TransactionWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => TransactionCreateWithoutBudgetInputSchema),z.lazy(() => TransactionUncheckedCreateWithoutBudgetInputSchema) ]),
}).strict();

export const TransactionCreateManyBudgetInputEnvelopeSchema: z.ZodType<Prisma.TransactionCreateManyBudgetInputEnvelope> = z.object({
  data: z.union([ z.lazy(() => TransactionCreateManyBudgetInputSchema),z.lazy(() => TransactionCreateManyBudgetInputSchema).array() ]),
  skipDuplicates: z.boolean().optional()
}).strict();

export const BudgetUserInvitationCreateWithoutBudgetInputSchema: z.ZodType<Prisma.BudgetUserInvitationCreateWithoutBudgetInput> = z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  email: z.string().optional().nullable(),
  token: z.string().optional(),
  expiresAt: z.coerce.date(),
  permission: z.lazy(() => BudgetUserPermissionSchema).optional().nullable(),
  createdByUser: z.lazy(() => UserCreateNestedOneWithoutCreatedBudgetUserInvitationsInputSchema),
  responses: z.lazy(() => BudgetUserInvitationResponseCreateNestedManyWithoutInvitationInputSchema).optional()
}).strict();

export const BudgetUserInvitationUncheckedCreateWithoutBudgetInputSchema: z.ZodType<Prisma.BudgetUserInvitationUncheckedCreateWithoutBudgetInput> = z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  email: z.string().optional().nullable(),
  token: z.string().optional(),
  expiresAt: z.coerce.date(),
  permission: z.lazy(() => BudgetUserPermissionSchema).optional().nullable(),
  createdByUserId: z.string(),
  responses: z.lazy(() => BudgetUserInvitationResponseUncheckedCreateNestedManyWithoutInvitationInputSchema).optional()
}).strict();

export const BudgetUserInvitationCreateOrConnectWithoutBudgetInputSchema: z.ZodType<Prisma.BudgetUserInvitationCreateOrConnectWithoutBudgetInput> = z.object({
  where: z.lazy(() => BudgetUserInvitationWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => BudgetUserInvitationCreateWithoutBudgetInputSchema),z.lazy(() => BudgetUserInvitationUncheckedCreateWithoutBudgetInputSchema) ]),
}).strict();

export const BudgetUserInvitationCreateManyBudgetInputEnvelopeSchema: z.ZodType<Prisma.BudgetUserInvitationCreateManyBudgetInputEnvelope> = z.object({
  data: z.union([ z.lazy(() => BudgetUserInvitationCreateManyBudgetInputSchema),z.lazy(() => BudgetUserInvitationCreateManyBudgetInputSchema).array() ]),
  skipDuplicates: z.boolean().optional()
}).strict();

export const BudgetPeriodConfigUpsertWithWhereUniqueWithoutBudgetInputSchema: z.ZodType<Prisma.BudgetPeriodConfigUpsertWithWhereUniqueWithoutBudgetInput> = z.object({
  where: z.lazy(() => BudgetPeriodConfigWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => BudgetPeriodConfigUpdateWithoutBudgetInputSchema),z.lazy(() => BudgetPeriodConfigUncheckedUpdateWithoutBudgetInputSchema) ]),
  create: z.union([ z.lazy(() => BudgetPeriodConfigCreateWithoutBudgetInputSchema),z.lazy(() => BudgetPeriodConfigUncheckedCreateWithoutBudgetInputSchema) ]),
}).strict();

export const BudgetPeriodConfigUpdateWithWhereUniqueWithoutBudgetInputSchema: z.ZodType<Prisma.BudgetPeriodConfigUpdateWithWhereUniqueWithoutBudgetInput> = z.object({
  where: z.lazy(() => BudgetPeriodConfigWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => BudgetPeriodConfigUpdateWithoutBudgetInputSchema),z.lazy(() => BudgetPeriodConfigUncheckedUpdateWithoutBudgetInputSchema) ]),
}).strict();

export const BudgetPeriodConfigUpdateManyWithWhereWithoutBudgetInputSchema: z.ZodType<Prisma.BudgetPeriodConfigUpdateManyWithWhereWithoutBudgetInput> = z.object({
  where: z.lazy(() => BudgetPeriodConfigScalarWhereInputSchema),
  data: z.union([ z.lazy(() => BudgetPeriodConfigUpdateManyMutationInputSchema),z.lazy(() => BudgetPeriodConfigUncheckedUpdateManyWithoutBudgetInputSchema) ]),
}).strict();

export const BudgetPeriodConfigScalarWhereInputSchema: z.ZodType<Prisma.BudgetPeriodConfigScalarWhereInput> = z.object({
  AND: z.union([ z.lazy(() => BudgetPeriodConfigScalarWhereInputSchema),z.lazy(() => BudgetPeriodConfigScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => BudgetPeriodConfigScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => BudgetPeriodConfigScalarWhereInputSchema),z.lazy(() => BudgetPeriodConfigScalarWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  type: z.union([ z.lazy(() => EnumBudgetPeriodTypeFilterSchema),z.lazy(() => BudgetPeriodTypeSchema) ]).optional(),
  amount: z.union([ z.lazy(() => DecimalFilterSchema),z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }) ]).optional(),
  startDate: z.union([ z.lazy(() => DateTimeNullableFilterSchema),z.coerce.date() ]).optional().nullable(),
  endDate: z.union([ z.lazy(() => DateTimeNullableFilterSchema),z.coerce.date() ]).optional().nullable(),
  budgetId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
}).strict();

export const BudgetUserUpsertWithWhereUniqueWithoutBudgetInputSchema: z.ZodType<Prisma.BudgetUserUpsertWithWhereUniqueWithoutBudgetInput> = z.object({
  where: z.lazy(() => BudgetUserWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => BudgetUserUpdateWithoutBudgetInputSchema),z.lazy(() => BudgetUserUncheckedUpdateWithoutBudgetInputSchema) ]),
  create: z.union([ z.lazy(() => BudgetUserCreateWithoutBudgetInputSchema),z.lazy(() => BudgetUserUncheckedCreateWithoutBudgetInputSchema) ]),
}).strict();

export const BudgetUserUpdateWithWhereUniqueWithoutBudgetInputSchema: z.ZodType<Prisma.BudgetUserUpdateWithWhereUniqueWithoutBudgetInput> = z.object({
  where: z.lazy(() => BudgetUserWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => BudgetUserUpdateWithoutBudgetInputSchema),z.lazy(() => BudgetUserUncheckedUpdateWithoutBudgetInputSchema) ]),
}).strict();

export const BudgetUserUpdateManyWithWhereWithoutBudgetInputSchema: z.ZodType<Prisma.BudgetUserUpdateManyWithWhereWithoutBudgetInput> = z.object({
  where: z.lazy(() => BudgetUserScalarWhereInputSchema),
  data: z.union([ z.lazy(() => BudgetUserUpdateManyMutationInputSchema),z.lazy(() => BudgetUserUncheckedUpdateManyWithoutBudgetInputSchema) ]),
}).strict();

export const TransactionUpsertWithWhereUniqueWithoutBudgetInputSchema: z.ZodType<Prisma.TransactionUpsertWithWhereUniqueWithoutBudgetInput> = z.object({
  where: z.lazy(() => TransactionWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => TransactionUpdateWithoutBudgetInputSchema),z.lazy(() => TransactionUncheckedUpdateWithoutBudgetInputSchema) ]),
  create: z.union([ z.lazy(() => TransactionCreateWithoutBudgetInputSchema),z.lazy(() => TransactionUncheckedCreateWithoutBudgetInputSchema) ]),
}).strict();

export const TransactionUpdateWithWhereUniqueWithoutBudgetInputSchema: z.ZodType<Prisma.TransactionUpdateWithWhereUniqueWithoutBudgetInput> = z.object({
  where: z.lazy(() => TransactionWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => TransactionUpdateWithoutBudgetInputSchema),z.lazy(() => TransactionUncheckedUpdateWithoutBudgetInputSchema) ]),
}).strict();

export const TransactionUpdateManyWithWhereWithoutBudgetInputSchema: z.ZodType<Prisma.TransactionUpdateManyWithWhereWithoutBudgetInput> = z.object({
  where: z.lazy(() => TransactionScalarWhereInputSchema),
  data: z.union([ z.lazy(() => TransactionUpdateManyMutationInputSchema),z.lazy(() => TransactionUncheckedUpdateManyWithoutBudgetInputSchema) ]),
}).strict();

export const BudgetUserInvitationUpsertWithWhereUniqueWithoutBudgetInputSchema: z.ZodType<Prisma.BudgetUserInvitationUpsertWithWhereUniqueWithoutBudgetInput> = z.object({
  where: z.lazy(() => BudgetUserInvitationWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => BudgetUserInvitationUpdateWithoutBudgetInputSchema),z.lazy(() => BudgetUserInvitationUncheckedUpdateWithoutBudgetInputSchema) ]),
  create: z.union([ z.lazy(() => BudgetUserInvitationCreateWithoutBudgetInputSchema),z.lazy(() => BudgetUserInvitationUncheckedCreateWithoutBudgetInputSchema) ]),
}).strict();

export const BudgetUserInvitationUpdateWithWhereUniqueWithoutBudgetInputSchema: z.ZodType<Prisma.BudgetUserInvitationUpdateWithWhereUniqueWithoutBudgetInput> = z.object({
  where: z.lazy(() => BudgetUserInvitationWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => BudgetUserInvitationUpdateWithoutBudgetInputSchema),z.lazy(() => BudgetUserInvitationUncheckedUpdateWithoutBudgetInputSchema) ]),
}).strict();

export const BudgetUserInvitationUpdateManyWithWhereWithoutBudgetInputSchema: z.ZodType<Prisma.BudgetUserInvitationUpdateManyWithWhereWithoutBudgetInput> = z.object({
  where: z.lazy(() => BudgetUserInvitationScalarWhereInputSchema),
  data: z.union([ z.lazy(() => BudgetUserInvitationUpdateManyMutationInputSchema),z.lazy(() => BudgetUserInvitationUncheckedUpdateManyWithoutBudgetInputSchema) ]),
}).strict();

export const BudgetCreateWithoutPeriodConfigsInputSchema: z.ZodType<Prisma.BudgetCreateWithoutPeriodConfigsInput> = z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  name: z.string(),
  description: z.string().optional().nullable(),
  preferredCurrency: z.string(),
  type: z.lazy(() => BudgetTypeSchema).optional(),
  budgetUsers: z.lazy(() => BudgetUserCreateNestedManyWithoutBudgetInputSchema).optional(),
  transactions: z.lazy(() => TransactionCreateNestedManyWithoutBudgetInputSchema).optional(),
  invitations: z.lazy(() => BudgetUserInvitationCreateNestedManyWithoutBudgetInputSchema).optional()
}).strict();

export const BudgetUncheckedCreateWithoutPeriodConfigsInputSchema: z.ZodType<Prisma.BudgetUncheckedCreateWithoutPeriodConfigsInput> = z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  name: z.string(),
  description: z.string().optional().nullable(),
  preferredCurrency: z.string(),
  type: z.lazy(() => BudgetTypeSchema).optional(),
  budgetUsers: z.lazy(() => BudgetUserUncheckedCreateNestedManyWithoutBudgetInputSchema).optional(),
  transactions: z.lazy(() => TransactionUncheckedCreateNestedManyWithoutBudgetInputSchema).optional(),
  invitations: z.lazy(() => BudgetUserInvitationUncheckedCreateNestedManyWithoutBudgetInputSchema).optional()
}).strict();

export const BudgetCreateOrConnectWithoutPeriodConfigsInputSchema: z.ZodType<Prisma.BudgetCreateOrConnectWithoutPeriodConfigsInput> = z.object({
  where: z.lazy(() => BudgetWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => BudgetCreateWithoutPeriodConfigsInputSchema),z.lazy(() => BudgetUncheckedCreateWithoutPeriodConfigsInputSchema) ]),
}).strict();

export const BudgetUpsertWithoutPeriodConfigsInputSchema: z.ZodType<Prisma.BudgetUpsertWithoutPeriodConfigsInput> = z.object({
  update: z.union([ z.lazy(() => BudgetUpdateWithoutPeriodConfigsInputSchema),z.lazy(() => BudgetUncheckedUpdateWithoutPeriodConfigsInputSchema) ]),
  create: z.union([ z.lazy(() => BudgetCreateWithoutPeriodConfigsInputSchema),z.lazy(() => BudgetUncheckedCreateWithoutPeriodConfigsInputSchema) ]),
  where: z.lazy(() => BudgetWhereInputSchema).optional()
}).strict();

export const BudgetUpdateToOneWithWhereWithoutPeriodConfigsInputSchema: z.ZodType<Prisma.BudgetUpdateToOneWithWhereWithoutPeriodConfigsInput> = z.object({
  where: z.lazy(() => BudgetWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => BudgetUpdateWithoutPeriodConfigsInputSchema),z.lazy(() => BudgetUncheckedUpdateWithoutPeriodConfigsInputSchema) ]),
}).strict();

export const BudgetUpdateWithoutPeriodConfigsInputSchema: z.ZodType<Prisma.BudgetUpdateWithoutPeriodConfigsInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  preferredCurrency: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.lazy(() => BudgetTypeSchema),z.lazy(() => EnumBudgetTypeFieldUpdateOperationsInputSchema) ]).optional(),
  budgetUsers: z.lazy(() => BudgetUserUpdateManyWithoutBudgetNestedInputSchema).optional(),
  transactions: z.lazy(() => TransactionUpdateManyWithoutBudgetNestedInputSchema).optional(),
  invitations: z.lazy(() => BudgetUserInvitationUpdateManyWithoutBudgetNestedInputSchema).optional()
}).strict();

export const BudgetUncheckedUpdateWithoutPeriodConfigsInputSchema: z.ZodType<Prisma.BudgetUncheckedUpdateWithoutPeriodConfigsInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  preferredCurrency: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.lazy(() => BudgetTypeSchema),z.lazy(() => EnumBudgetTypeFieldUpdateOperationsInputSchema) ]).optional(),
  budgetUsers: z.lazy(() => BudgetUserUncheckedUpdateManyWithoutBudgetNestedInputSchema).optional(),
  transactions: z.lazy(() => TransactionUncheckedUpdateManyWithoutBudgetNestedInputSchema).optional(),
  invitations: z.lazy(() => BudgetUserInvitationUncheckedUpdateManyWithoutBudgetNestedInputSchema).optional()
}).strict();

export const UserCreateWithoutBudgetUsersInputSchema: z.ZodType<Prisma.UserCreateWithoutBudgetUsersInput> = z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  email: z.string(),
  name: z.string().optional().nullable(),
  walletAccounts: z.lazy(() => UserWalletAccountCreateNestedManyWithoutUserInputSchema).optional(),
  transactions: z.lazy(() => TransactionCreateNestedManyWithoutCreatedByUserInputSchema).optional(),
  createdBudgetUserInvitations: z.lazy(() => BudgetUserInvitationCreateNestedManyWithoutCreatedByUserInputSchema).optional(),
  createdFromInvitation: z.lazy(() => BudgetUserInvitationResponseCreateNestedOneWithoutCreatedUserInputSchema).optional(),
  categories: z.lazy(() => CategoryCreateNestedManyWithoutUserInputSchema).optional()
}).strict();

export const UserUncheckedCreateWithoutBudgetUsersInputSchema: z.ZodType<Prisma.UserUncheckedCreateWithoutBudgetUsersInput> = z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  email: z.string(),
  name: z.string().optional().nullable(),
  walletAccounts: z.lazy(() => UserWalletAccountUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
  transactions: z.lazy(() => TransactionUncheckedCreateNestedManyWithoutCreatedByUserInputSchema).optional(),
  createdBudgetUserInvitations: z.lazy(() => BudgetUserInvitationUncheckedCreateNestedManyWithoutCreatedByUserInputSchema).optional(),
  createdFromInvitation: z.lazy(() => BudgetUserInvitationResponseUncheckedCreateNestedOneWithoutCreatedUserInputSchema).optional(),
  categories: z.lazy(() => CategoryUncheckedCreateNestedManyWithoutUserInputSchema).optional()
}).strict();

export const UserCreateOrConnectWithoutBudgetUsersInputSchema: z.ZodType<Prisma.UserCreateOrConnectWithoutBudgetUsersInput> = z.object({
  where: z.lazy(() => UserWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => UserCreateWithoutBudgetUsersInputSchema),z.lazy(() => UserUncheckedCreateWithoutBudgetUsersInputSchema) ]),
}).strict();

export const BudgetCreateWithoutBudgetUsersInputSchema: z.ZodType<Prisma.BudgetCreateWithoutBudgetUsersInput> = z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  name: z.string(),
  description: z.string().optional().nullable(),
  preferredCurrency: z.string(),
  type: z.lazy(() => BudgetTypeSchema).optional(),
  periodConfigs: z.lazy(() => BudgetPeriodConfigCreateNestedManyWithoutBudgetInputSchema).optional(),
  transactions: z.lazy(() => TransactionCreateNestedManyWithoutBudgetInputSchema).optional(),
  invitations: z.lazy(() => BudgetUserInvitationCreateNestedManyWithoutBudgetInputSchema).optional()
}).strict();

export const BudgetUncheckedCreateWithoutBudgetUsersInputSchema: z.ZodType<Prisma.BudgetUncheckedCreateWithoutBudgetUsersInput> = z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  name: z.string(),
  description: z.string().optional().nullable(),
  preferredCurrency: z.string(),
  type: z.lazy(() => BudgetTypeSchema).optional(),
  periodConfigs: z.lazy(() => BudgetPeriodConfigUncheckedCreateNestedManyWithoutBudgetInputSchema).optional(),
  transactions: z.lazy(() => TransactionUncheckedCreateNestedManyWithoutBudgetInputSchema).optional(),
  invitations: z.lazy(() => BudgetUserInvitationUncheckedCreateNestedManyWithoutBudgetInputSchema).optional()
}).strict();

export const BudgetCreateOrConnectWithoutBudgetUsersInputSchema: z.ZodType<Prisma.BudgetCreateOrConnectWithoutBudgetUsersInput> = z.object({
  where: z.lazy(() => BudgetWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => BudgetCreateWithoutBudgetUsersInputSchema),z.lazy(() => BudgetUncheckedCreateWithoutBudgetUsersInputSchema) ]),
}).strict();

export const UserUpsertWithoutBudgetUsersInputSchema: z.ZodType<Prisma.UserUpsertWithoutBudgetUsersInput> = z.object({
  update: z.union([ z.lazy(() => UserUpdateWithoutBudgetUsersInputSchema),z.lazy(() => UserUncheckedUpdateWithoutBudgetUsersInputSchema) ]),
  create: z.union([ z.lazy(() => UserCreateWithoutBudgetUsersInputSchema),z.lazy(() => UserUncheckedCreateWithoutBudgetUsersInputSchema) ]),
  where: z.lazy(() => UserWhereInputSchema).optional()
}).strict();

export const UserUpdateToOneWithWhereWithoutBudgetUsersInputSchema: z.ZodType<Prisma.UserUpdateToOneWithWhereWithoutBudgetUsersInput> = z.object({
  where: z.lazy(() => UserWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => UserUpdateWithoutBudgetUsersInputSchema),z.lazy(() => UserUncheckedUpdateWithoutBudgetUsersInputSchema) ]),
}).strict();

export const UserUpdateWithoutBudgetUsersInputSchema: z.ZodType<Prisma.UserUpdateWithoutBudgetUsersInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  walletAccounts: z.lazy(() => UserWalletAccountUpdateManyWithoutUserNestedInputSchema).optional(),
  transactions: z.lazy(() => TransactionUpdateManyWithoutCreatedByUserNestedInputSchema).optional(),
  createdBudgetUserInvitations: z.lazy(() => BudgetUserInvitationUpdateManyWithoutCreatedByUserNestedInputSchema).optional(),
  createdFromInvitation: z.lazy(() => BudgetUserInvitationResponseUpdateOneWithoutCreatedUserNestedInputSchema).optional(),
  categories: z.lazy(() => CategoryUpdateManyWithoutUserNestedInputSchema).optional()
}).strict();

export const UserUncheckedUpdateWithoutBudgetUsersInputSchema: z.ZodType<Prisma.UserUncheckedUpdateWithoutBudgetUsersInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  walletAccounts: z.lazy(() => UserWalletAccountUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  transactions: z.lazy(() => TransactionUncheckedUpdateManyWithoutCreatedByUserNestedInputSchema).optional(),
  createdBudgetUserInvitations: z.lazy(() => BudgetUserInvitationUncheckedUpdateManyWithoutCreatedByUserNestedInputSchema).optional(),
  createdFromInvitation: z.lazy(() => BudgetUserInvitationResponseUncheckedUpdateOneWithoutCreatedUserNestedInputSchema).optional(),
  categories: z.lazy(() => CategoryUncheckedUpdateManyWithoutUserNestedInputSchema).optional()
}).strict();

export const BudgetUpsertWithoutBudgetUsersInputSchema: z.ZodType<Prisma.BudgetUpsertWithoutBudgetUsersInput> = z.object({
  update: z.union([ z.lazy(() => BudgetUpdateWithoutBudgetUsersInputSchema),z.lazy(() => BudgetUncheckedUpdateWithoutBudgetUsersInputSchema) ]),
  create: z.union([ z.lazy(() => BudgetCreateWithoutBudgetUsersInputSchema),z.lazy(() => BudgetUncheckedCreateWithoutBudgetUsersInputSchema) ]),
  where: z.lazy(() => BudgetWhereInputSchema).optional()
}).strict();

export const BudgetUpdateToOneWithWhereWithoutBudgetUsersInputSchema: z.ZodType<Prisma.BudgetUpdateToOneWithWhereWithoutBudgetUsersInput> = z.object({
  where: z.lazy(() => BudgetWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => BudgetUpdateWithoutBudgetUsersInputSchema),z.lazy(() => BudgetUncheckedUpdateWithoutBudgetUsersInputSchema) ]),
}).strict();

export const BudgetUpdateWithoutBudgetUsersInputSchema: z.ZodType<Prisma.BudgetUpdateWithoutBudgetUsersInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  preferredCurrency: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.lazy(() => BudgetTypeSchema),z.lazy(() => EnumBudgetTypeFieldUpdateOperationsInputSchema) ]).optional(),
  periodConfigs: z.lazy(() => BudgetPeriodConfigUpdateManyWithoutBudgetNestedInputSchema).optional(),
  transactions: z.lazy(() => TransactionUpdateManyWithoutBudgetNestedInputSchema).optional(),
  invitations: z.lazy(() => BudgetUserInvitationUpdateManyWithoutBudgetNestedInputSchema).optional()
}).strict();

export const BudgetUncheckedUpdateWithoutBudgetUsersInputSchema: z.ZodType<Prisma.BudgetUncheckedUpdateWithoutBudgetUsersInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  preferredCurrency: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.lazy(() => BudgetTypeSchema),z.lazy(() => EnumBudgetTypeFieldUpdateOperationsInputSchema) ]).optional(),
  periodConfigs: z.lazy(() => BudgetPeriodConfigUncheckedUpdateManyWithoutBudgetNestedInputSchema).optional(),
  transactions: z.lazy(() => TransactionUncheckedUpdateManyWithoutBudgetNestedInputSchema).optional(),
  invitations: z.lazy(() => BudgetUserInvitationUncheckedUpdateManyWithoutBudgetNestedInputSchema).optional()
}).strict();

export const UserCreateWithoutCreatedBudgetUserInvitationsInputSchema: z.ZodType<Prisma.UserCreateWithoutCreatedBudgetUserInvitationsInput> = z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  email: z.string(),
  name: z.string().optional().nullable(),
  walletAccounts: z.lazy(() => UserWalletAccountCreateNestedManyWithoutUserInputSchema).optional(),
  budgetUsers: z.lazy(() => BudgetUserCreateNestedManyWithoutUserInputSchema).optional(),
  transactions: z.lazy(() => TransactionCreateNestedManyWithoutCreatedByUserInputSchema).optional(),
  createdFromInvitation: z.lazy(() => BudgetUserInvitationResponseCreateNestedOneWithoutCreatedUserInputSchema).optional(),
  categories: z.lazy(() => CategoryCreateNestedManyWithoutUserInputSchema).optional()
}).strict();

export const UserUncheckedCreateWithoutCreatedBudgetUserInvitationsInputSchema: z.ZodType<Prisma.UserUncheckedCreateWithoutCreatedBudgetUserInvitationsInput> = z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  email: z.string(),
  name: z.string().optional().nullable(),
  walletAccounts: z.lazy(() => UserWalletAccountUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
  budgetUsers: z.lazy(() => BudgetUserUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
  transactions: z.lazy(() => TransactionUncheckedCreateNestedManyWithoutCreatedByUserInputSchema).optional(),
  createdFromInvitation: z.lazy(() => BudgetUserInvitationResponseUncheckedCreateNestedOneWithoutCreatedUserInputSchema).optional(),
  categories: z.lazy(() => CategoryUncheckedCreateNestedManyWithoutUserInputSchema).optional()
}).strict();

export const UserCreateOrConnectWithoutCreatedBudgetUserInvitationsInputSchema: z.ZodType<Prisma.UserCreateOrConnectWithoutCreatedBudgetUserInvitationsInput> = z.object({
  where: z.lazy(() => UserWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => UserCreateWithoutCreatedBudgetUserInvitationsInputSchema),z.lazy(() => UserUncheckedCreateWithoutCreatedBudgetUserInvitationsInputSchema) ]),
}).strict();

export const BudgetCreateWithoutInvitationsInputSchema: z.ZodType<Prisma.BudgetCreateWithoutInvitationsInput> = z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  name: z.string(),
  description: z.string().optional().nullable(),
  preferredCurrency: z.string(),
  type: z.lazy(() => BudgetTypeSchema).optional(),
  periodConfigs: z.lazy(() => BudgetPeriodConfigCreateNestedManyWithoutBudgetInputSchema).optional(),
  budgetUsers: z.lazy(() => BudgetUserCreateNestedManyWithoutBudgetInputSchema).optional(),
  transactions: z.lazy(() => TransactionCreateNestedManyWithoutBudgetInputSchema).optional()
}).strict();

export const BudgetUncheckedCreateWithoutInvitationsInputSchema: z.ZodType<Prisma.BudgetUncheckedCreateWithoutInvitationsInput> = z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  name: z.string(),
  description: z.string().optional().nullable(),
  preferredCurrency: z.string(),
  type: z.lazy(() => BudgetTypeSchema).optional(),
  periodConfigs: z.lazy(() => BudgetPeriodConfigUncheckedCreateNestedManyWithoutBudgetInputSchema).optional(),
  budgetUsers: z.lazy(() => BudgetUserUncheckedCreateNestedManyWithoutBudgetInputSchema).optional(),
  transactions: z.lazy(() => TransactionUncheckedCreateNestedManyWithoutBudgetInputSchema).optional()
}).strict();

export const BudgetCreateOrConnectWithoutInvitationsInputSchema: z.ZodType<Prisma.BudgetCreateOrConnectWithoutInvitationsInput> = z.object({
  where: z.lazy(() => BudgetWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => BudgetCreateWithoutInvitationsInputSchema),z.lazy(() => BudgetUncheckedCreateWithoutInvitationsInputSchema) ]),
}).strict();

export const BudgetUserInvitationResponseCreateWithoutInvitationInputSchema: z.ZodType<Prisma.BudgetUserInvitationResponseCreateWithoutInvitationInput> = z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  acceptedAt: z.coerce.date().optional().nullable(),
  declinedAt: z.coerce.date().optional().nullable(),
  createdUser: z.lazy(() => UserCreateNestedOneWithoutCreatedFromInvitationInputSchema).optional()
}).strict();

export const BudgetUserInvitationResponseUncheckedCreateWithoutInvitationInputSchema: z.ZodType<Prisma.BudgetUserInvitationResponseUncheckedCreateWithoutInvitationInput> = z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  acceptedAt: z.coerce.date().optional().nullable(),
  declinedAt: z.coerce.date().optional().nullable(),
  createdUserId: z.string().optional().nullable()
}).strict();

export const BudgetUserInvitationResponseCreateOrConnectWithoutInvitationInputSchema: z.ZodType<Prisma.BudgetUserInvitationResponseCreateOrConnectWithoutInvitationInput> = z.object({
  where: z.lazy(() => BudgetUserInvitationResponseWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => BudgetUserInvitationResponseCreateWithoutInvitationInputSchema),z.lazy(() => BudgetUserInvitationResponseUncheckedCreateWithoutInvitationInputSchema) ]),
}).strict();

export const BudgetUserInvitationResponseCreateManyInvitationInputEnvelopeSchema: z.ZodType<Prisma.BudgetUserInvitationResponseCreateManyInvitationInputEnvelope> = z.object({
  data: z.union([ z.lazy(() => BudgetUserInvitationResponseCreateManyInvitationInputSchema),z.lazy(() => BudgetUserInvitationResponseCreateManyInvitationInputSchema).array() ]),
  skipDuplicates: z.boolean().optional()
}).strict();

export const UserUpsertWithoutCreatedBudgetUserInvitationsInputSchema: z.ZodType<Prisma.UserUpsertWithoutCreatedBudgetUserInvitationsInput> = z.object({
  update: z.union([ z.lazy(() => UserUpdateWithoutCreatedBudgetUserInvitationsInputSchema),z.lazy(() => UserUncheckedUpdateWithoutCreatedBudgetUserInvitationsInputSchema) ]),
  create: z.union([ z.lazy(() => UserCreateWithoutCreatedBudgetUserInvitationsInputSchema),z.lazy(() => UserUncheckedCreateWithoutCreatedBudgetUserInvitationsInputSchema) ]),
  where: z.lazy(() => UserWhereInputSchema).optional()
}).strict();

export const UserUpdateToOneWithWhereWithoutCreatedBudgetUserInvitationsInputSchema: z.ZodType<Prisma.UserUpdateToOneWithWhereWithoutCreatedBudgetUserInvitationsInput> = z.object({
  where: z.lazy(() => UserWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => UserUpdateWithoutCreatedBudgetUserInvitationsInputSchema),z.lazy(() => UserUncheckedUpdateWithoutCreatedBudgetUserInvitationsInputSchema) ]),
}).strict();

export const UserUpdateWithoutCreatedBudgetUserInvitationsInputSchema: z.ZodType<Prisma.UserUpdateWithoutCreatedBudgetUserInvitationsInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  walletAccounts: z.lazy(() => UserWalletAccountUpdateManyWithoutUserNestedInputSchema).optional(),
  budgetUsers: z.lazy(() => BudgetUserUpdateManyWithoutUserNestedInputSchema).optional(),
  transactions: z.lazy(() => TransactionUpdateManyWithoutCreatedByUserNestedInputSchema).optional(),
  createdFromInvitation: z.lazy(() => BudgetUserInvitationResponseUpdateOneWithoutCreatedUserNestedInputSchema).optional(),
  categories: z.lazy(() => CategoryUpdateManyWithoutUserNestedInputSchema).optional()
}).strict();

export const UserUncheckedUpdateWithoutCreatedBudgetUserInvitationsInputSchema: z.ZodType<Prisma.UserUncheckedUpdateWithoutCreatedBudgetUserInvitationsInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  walletAccounts: z.lazy(() => UserWalletAccountUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  budgetUsers: z.lazy(() => BudgetUserUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  transactions: z.lazy(() => TransactionUncheckedUpdateManyWithoutCreatedByUserNestedInputSchema).optional(),
  createdFromInvitation: z.lazy(() => BudgetUserInvitationResponseUncheckedUpdateOneWithoutCreatedUserNestedInputSchema).optional(),
  categories: z.lazy(() => CategoryUncheckedUpdateManyWithoutUserNestedInputSchema).optional()
}).strict();

export const BudgetUpsertWithoutInvitationsInputSchema: z.ZodType<Prisma.BudgetUpsertWithoutInvitationsInput> = z.object({
  update: z.union([ z.lazy(() => BudgetUpdateWithoutInvitationsInputSchema),z.lazy(() => BudgetUncheckedUpdateWithoutInvitationsInputSchema) ]),
  create: z.union([ z.lazy(() => BudgetCreateWithoutInvitationsInputSchema),z.lazy(() => BudgetUncheckedCreateWithoutInvitationsInputSchema) ]),
  where: z.lazy(() => BudgetWhereInputSchema).optional()
}).strict();

export const BudgetUpdateToOneWithWhereWithoutInvitationsInputSchema: z.ZodType<Prisma.BudgetUpdateToOneWithWhereWithoutInvitationsInput> = z.object({
  where: z.lazy(() => BudgetWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => BudgetUpdateWithoutInvitationsInputSchema),z.lazy(() => BudgetUncheckedUpdateWithoutInvitationsInputSchema) ]),
}).strict();

export const BudgetUpdateWithoutInvitationsInputSchema: z.ZodType<Prisma.BudgetUpdateWithoutInvitationsInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  preferredCurrency: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.lazy(() => BudgetTypeSchema),z.lazy(() => EnumBudgetTypeFieldUpdateOperationsInputSchema) ]).optional(),
  periodConfigs: z.lazy(() => BudgetPeriodConfigUpdateManyWithoutBudgetNestedInputSchema).optional(),
  budgetUsers: z.lazy(() => BudgetUserUpdateManyWithoutBudgetNestedInputSchema).optional(),
  transactions: z.lazy(() => TransactionUpdateManyWithoutBudgetNestedInputSchema).optional()
}).strict();

export const BudgetUncheckedUpdateWithoutInvitationsInputSchema: z.ZodType<Prisma.BudgetUncheckedUpdateWithoutInvitationsInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  preferredCurrency: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.lazy(() => BudgetTypeSchema),z.lazy(() => EnumBudgetTypeFieldUpdateOperationsInputSchema) ]).optional(),
  periodConfigs: z.lazy(() => BudgetPeriodConfigUncheckedUpdateManyWithoutBudgetNestedInputSchema).optional(),
  budgetUsers: z.lazy(() => BudgetUserUncheckedUpdateManyWithoutBudgetNestedInputSchema).optional(),
  transactions: z.lazy(() => TransactionUncheckedUpdateManyWithoutBudgetNestedInputSchema).optional()
}).strict();

export const BudgetUserInvitationResponseUpsertWithWhereUniqueWithoutInvitationInputSchema: z.ZodType<Prisma.BudgetUserInvitationResponseUpsertWithWhereUniqueWithoutInvitationInput> = z.object({
  where: z.lazy(() => BudgetUserInvitationResponseWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => BudgetUserInvitationResponseUpdateWithoutInvitationInputSchema),z.lazy(() => BudgetUserInvitationResponseUncheckedUpdateWithoutInvitationInputSchema) ]),
  create: z.union([ z.lazy(() => BudgetUserInvitationResponseCreateWithoutInvitationInputSchema),z.lazy(() => BudgetUserInvitationResponseUncheckedCreateWithoutInvitationInputSchema) ]),
}).strict();

export const BudgetUserInvitationResponseUpdateWithWhereUniqueWithoutInvitationInputSchema: z.ZodType<Prisma.BudgetUserInvitationResponseUpdateWithWhereUniqueWithoutInvitationInput> = z.object({
  where: z.lazy(() => BudgetUserInvitationResponseWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => BudgetUserInvitationResponseUpdateWithoutInvitationInputSchema),z.lazy(() => BudgetUserInvitationResponseUncheckedUpdateWithoutInvitationInputSchema) ]),
}).strict();

export const BudgetUserInvitationResponseUpdateManyWithWhereWithoutInvitationInputSchema: z.ZodType<Prisma.BudgetUserInvitationResponseUpdateManyWithWhereWithoutInvitationInput> = z.object({
  where: z.lazy(() => BudgetUserInvitationResponseScalarWhereInputSchema),
  data: z.union([ z.lazy(() => BudgetUserInvitationResponseUpdateManyMutationInputSchema),z.lazy(() => BudgetUserInvitationResponseUncheckedUpdateManyWithoutInvitationInputSchema) ]),
}).strict();

export const BudgetUserInvitationResponseScalarWhereInputSchema: z.ZodType<Prisma.BudgetUserInvitationResponseScalarWhereInput> = z.object({
  AND: z.union([ z.lazy(() => BudgetUserInvitationResponseScalarWhereInputSchema),z.lazy(() => BudgetUserInvitationResponseScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => BudgetUserInvitationResponseScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => BudgetUserInvitationResponseScalarWhereInputSchema),z.lazy(() => BudgetUserInvitationResponseScalarWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  acceptedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema),z.coerce.date() ]).optional().nullable(),
  declinedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema),z.coerce.date() ]).optional().nullable(),
  invitationId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  createdUserId: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
}).strict();

export const BudgetUserInvitationCreateWithoutResponsesInputSchema: z.ZodType<Prisma.BudgetUserInvitationCreateWithoutResponsesInput> = z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  email: z.string().optional().nullable(),
  token: z.string().optional(),
  expiresAt: z.coerce.date(),
  permission: z.lazy(() => BudgetUserPermissionSchema).optional().nullable(),
  createdByUser: z.lazy(() => UserCreateNestedOneWithoutCreatedBudgetUserInvitationsInputSchema),
  budget: z.lazy(() => BudgetCreateNestedOneWithoutInvitationsInputSchema)
}).strict();

export const BudgetUserInvitationUncheckedCreateWithoutResponsesInputSchema: z.ZodType<Prisma.BudgetUserInvitationUncheckedCreateWithoutResponsesInput> = z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  email: z.string().optional().nullable(),
  token: z.string().optional(),
  expiresAt: z.coerce.date(),
  permission: z.lazy(() => BudgetUserPermissionSchema).optional().nullable(),
  createdByUserId: z.string(),
  budgetId: z.string()
}).strict();

export const BudgetUserInvitationCreateOrConnectWithoutResponsesInputSchema: z.ZodType<Prisma.BudgetUserInvitationCreateOrConnectWithoutResponsesInput> = z.object({
  where: z.lazy(() => BudgetUserInvitationWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => BudgetUserInvitationCreateWithoutResponsesInputSchema),z.lazy(() => BudgetUserInvitationUncheckedCreateWithoutResponsesInputSchema) ]),
}).strict();

export const UserCreateWithoutCreatedFromInvitationInputSchema: z.ZodType<Prisma.UserCreateWithoutCreatedFromInvitationInput> = z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  email: z.string(),
  name: z.string().optional().nullable(),
  walletAccounts: z.lazy(() => UserWalletAccountCreateNestedManyWithoutUserInputSchema).optional(),
  budgetUsers: z.lazy(() => BudgetUserCreateNestedManyWithoutUserInputSchema).optional(),
  transactions: z.lazy(() => TransactionCreateNestedManyWithoutCreatedByUserInputSchema).optional(),
  createdBudgetUserInvitations: z.lazy(() => BudgetUserInvitationCreateNestedManyWithoutCreatedByUserInputSchema).optional(),
  categories: z.lazy(() => CategoryCreateNestedManyWithoutUserInputSchema).optional()
}).strict();

export const UserUncheckedCreateWithoutCreatedFromInvitationInputSchema: z.ZodType<Prisma.UserUncheckedCreateWithoutCreatedFromInvitationInput> = z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  email: z.string(),
  name: z.string().optional().nullable(),
  walletAccounts: z.lazy(() => UserWalletAccountUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
  budgetUsers: z.lazy(() => BudgetUserUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
  transactions: z.lazy(() => TransactionUncheckedCreateNestedManyWithoutCreatedByUserInputSchema).optional(),
  createdBudgetUserInvitations: z.lazy(() => BudgetUserInvitationUncheckedCreateNestedManyWithoutCreatedByUserInputSchema).optional(),
  categories: z.lazy(() => CategoryUncheckedCreateNestedManyWithoutUserInputSchema).optional()
}).strict();

export const UserCreateOrConnectWithoutCreatedFromInvitationInputSchema: z.ZodType<Prisma.UserCreateOrConnectWithoutCreatedFromInvitationInput> = z.object({
  where: z.lazy(() => UserWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => UserCreateWithoutCreatedFromInvitationInputSchema),z.lazy(() => UserUncheckedCreateWithoutCreatedFromInvitationInputSchema) ]),
}).strict();

export const BudgetUserInvitationUpsertWithoutResponsesInputSchema: z.ZodType<Prisma.BudgetUserInvitationUpsertWithoutResponsesInput> = z.object({
  update: z.union([ z.lazy(() => BudgetUserInvitationUpdateWithoutResponsesInputSchema),z.lazy(() => BudgetUserInvitationUncheckedUpdateWithoutResponsesInputSchema) ]),
  create: z.union([ z.lazy(() => BudgetUserInvitationCreateWithoutResponsesInputSchema),z.lazy(() => BudgetUserInvitationUncheckedCreateWithoutResponsesInputSchema) ]),
  where: z.lazy(() => BudgetUserInvitationWhereInputSchema).optional()
}).strict();

export const BudgetUserInvitationUpdateToOneWithWhereWithoutResponsesInputSchema: z.ZodType<Prisma.BudgetUserInvitationUpdateToOneWithWhereWithoutResponsesInput> = z.object({
  where: z.lazy(() => BudgetUserInvitationWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => BudgetUserInvitationUpdateWithoutResponsesInputSchema),z.lazy(() => BudgetUserInvitationUncheckedUpdateWithoutResponsesInputSchema) ]),
}).strict();

export const BudgetUserInvitationUpdateWithoutResponsesInputSchema: z.ZodType<Prisma.BudgetUserInvitationUpdateWithoutResponsesInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  token: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  expiresAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  permission: z.union([ z.lazy(() => BudgetUserPermissionSchema),z.lazy(() => NullableEnumBudgetUserPermissionFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdByUser: z.lazy(() => UserUpdateOneRequiredWithoutCreatedBudgetUserInvitationsNestedInputSchema).optional(),
  budget: z.lazy(() => BudgetUpdateOneRequiredWithoutInvitationsNestedInputSchema).optional()
}).strict();

export const BudgetUserInvitationUncheckedUpdateWithoutResponsesInputSchema: z.ZodType<Prisma.BudgetUserInvitationUncheckedUpdateWithoutResponsesInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  token: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  expiresAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  permission: z.union([ z.lazy(() => BudgetUserPermissionSchema),z.lazy(() => NullableEnumBudgetUserPermissionFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdByUserId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  budgetId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const UserUpsertWithoutCreatedFromInvitationInputSchema: z.ZodType<Prisma.UserUpsertWithoutCreatedFromInvitationInput> = z.object({
  update: z.union([ z.lazy(() => UserUpdateWithoutCreatedFromInvitationInputSchema),z.lazy(() => UserUncheckedUpdateWithoutCreatedFromInvitationInputSchema) ]),
  create: z.union([ z.lazy(() => UserCreateWithoutCreatedFromInvitationInputSchema),z.lazy(() => UserUncheckedCreateWithoutCreatedFromInvitationInputSchema) ]),
  where: z.lazy(() => UserWhereInputSchema).optional()
}).strict();

export const UserUpdateToOneWithWhereWithoutCreatedFromInvitationInputSchema: z.ZodType<Prisma.UserUpdateToOneWithWhereWithoutCreatedFromInvitationInput> = z.object({
  where: z.lazy(() => UserWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => UserUpdateWithoutCreatedFromInvitationInputSchema),z.lazy(() => UserUncheckedUpdateWithoutCreatedFromInvitationInputSchema) ]),
}).strict();

export const UserUpdateWithoutCreatedFromInvitationInputSchema: z.ZodType<Prisma.UserUpdateWithoutCreatedFromInvitationInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  walletAccounts: z.lazy(() => UserWalletAccountUpdateManyWithoutUserNestedInputSchema).optional(),
  budgetUsers: z.lazy(() => BudgetUserUpdateManyWithoutUserNestedInputSchema).optional(),
  transactions: z.lazy(() => TransactionUpdateManyWithoutCreatedByUserNestedInputSchema).optional(),
  createdBudgetUserInvitations: z.lazy(() => BudgetUserInvitationUpdateManyWithoutCreatedByUserNestedInputSchema).optional(),
  categories: z.lazy(() => CategoryUpdateManyWithoutUserNestedInputSchema).optional()
}).strict();

export const UserUncheckedUpdateWithoutCreatedFromInvitationInputSchema: z.ZodType<Prisma.UserUncheckedUpdateWithoutCreatedFromInvitationInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  walletAccounts: z.lazy(() => UserWalletAccountUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  budgetUsers: z.lazy(() => BudgetUserUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  transactions: z.lazy(() => TransactionUncheckedUpdateManyWithoutCreatedByUserNestedInputSchema).optional(),
  createdBudgetUserInvitations: z.lazy(() => BudgetUserInvitationUncheckedUpdateManyWithoutCreatedByUserNestedInputSchema).optional(),
  categories: z.lazy(() => CategoryUncheckedUpdateManyWithoutUserNestedInputSchema).optional()
}).strict();

export const CategoryCreateWithoutTransactionsInputSchema: z.ZodType<Prisma.CategoryCreateWithoutTransactionsInput> = z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  type: z.lazy(() => CategoryTypeSchema),
  name: z.string(),
  description: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  user: z.lazy(() => UserCreateNestedOneWithoutCategoriesInputSchema),
  parent: z.lazy(() => CategoryCreateNestedOneWithoutChildrenInputSchema).optional(),
  children: z.lazy(() => CategoryCreateNestedManyWithoutParentInputSchema).optional()
}).strict();

export const CategoryUncheckedCreateWithoutTransactionsInputSchema: z.ZodType<Prisma.CategoryUncheckedCreateWithoutTransactionsInput> = z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  type: z.lazy(() => CategoryTypeSchema),
  name: z.string(),
  description: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  userId: z.string(),
  parentId: z.string().optional().nullable(),
  children: z.lazy(() => CategoryUncheckedCreateNestedManyWithoutParentInputSchema).optional()
}).strict();

export const CategoryCreateOrConnectWithoutTransactionsInputSchema: z.ZodType<Prisma.CategoryCreateOrConnectWithoutTransactionsInput> = z.object({
  where: z.lazy(() => CategoryWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => CategoryCreateWithoutTransactionsInputSchema),z.lazy(() => CategoryUncheckedCreateWithoutTransactionsInputSchema) ]),
}).strict();

export const BudgetCreateWithoutTransactionsInputSchema: z.ZodType<Prisma.BudgetCreateWithoutTransactionsInput> = z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  name: z.string(),
  description: z.string().optional().nullable(),
  preferredCurrency: z.string(),
  type: z.lazy(() => BudgetTypeSchema).optional(),
  periodConfigs: z.lazy(() => BudgetPeriodConfigCreateNestedManyWithoutBudgetInputSchema).optional(),
  budgetUsers: z.lazy(() => BudgetUserCreateNestedManyWithoutBudgetInputSchema).optional(),
  invitations: z.lazy(() => BudgetUserInvitationCreateNestedManyWithoutBudgetInputSchema).optional()
}).strict();

export const BudgetUncheckedCreateWithoutTransactionsInputSchema: z.ZodType<Prisma.BudgetUncheckedCreateWithoutTransactionsInput> = z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  name: z.string(),
  description: z.string().optional().nullable(),
  preferredCurrency: z.string(),
  type: z.lazy(() => BudgetTypeSchema).optional(),
  periodConfigs: z.lazy(() => BudgetPeriodConfigUncheckedCreateNestedManyWithoutBudgetInputSchema).optional(),
  budgetUsers: z.lazy(() => BudgetUserUncheckedCreateNestedManyWithoutBudgetInputSchema).optional(),
  invitations: z.lazy(() => BudgetUserInvitationUncheckedCreateNestedManyWithoutBudgetInputSchema).optional()
}).strict();

export const BudgetCreateOrConnectWithoutTransactionsInputSchema: z.ZodType<Prisma.BudgetCreateOrConnectWithoutTransactionsInput> = z.object({
  where: z.lazy(() => BudgetWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => BudgetCreateWithoutTransactionsInputSchema),z.lazy(() => BudgetUncheckedCreateWithoutTransactionsInputSchema) ]),
}).strict();

export const UserWalletAccountCreateWithoutTransactionsInputSchema: z.ZodType<Prisma.UserWalletAccountCreateWithoutTransactionsInput> = z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  name: z.string(),
  icon: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  lastDigits: z.string().optional().nullable(),
  preferredCurrency: z.string(),
  user: z.lazy(() => UserCreateNestedOneWithoutWalletAccountsInputSchema)
}).strict();

export const UserWalletAccountUncheckedCreateWithoutTransactionsInputSchema: z.ZodType<Prisma.UserWalletAccountUncheckedCreateWithoutTransactionsInput> = z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  name: z.string(),
  icon: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  lastDigits: z.string().optional().nullable(),
  preferredCurrency: z.string(),
  userId: z.string()
}).strict();

export const UserWalletAccountCreateOrConnectWithoutTransactionsInputSchema: z.ZodType<Prisma.UserWalletAccountCreateOrConnectWithoutTransactionsInput> = z.object({
  where: z.lazy(() => UserWalletAccountWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => UserWalletAccountCreateWithoutTransactionsInputSchema),z.lazy(() => UserWalletAccountUncheckedCreateWithoutTransactionsInputSchema) ]),
}).strict();

export const UserCreateWithoutTransactionsInputSchema: z.ZodType<Prisma.UserCreateWithoutTransactionsInput> = z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  email: z.string(),
  name: z.string().optional().nullable(),
  walletAccounts: z.lazy(() => UserWalletAccountCreateNestedManyWithoutUserInputSchema).optional(),
  budgetUsers: z.lazy(() => BudgetUserCreateNestedManyWithoutUserInputSchema).optional(),
  createdBudgetUserInvitations: z.lazy(() => BudgetUserInvitationCreateNestedManyWithoutCreatedByUserInputSchema).optional(),
  createdFromInvitation: z.lazy(() => BudgetUserInvitationResponseCreateNestedOneWithoutCreatedUserInputSchema).optional(),
  categories: z.lazy(() => CategoryCreateNestedManyWithoutUserInputSchema).optional()
}).strict();

export const UserUncheckedCreateWithoutTransactionsInputSchema: z.ZodType<Prisma.UserUncheckedCreateWithoutTransactionsInput> = z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  email: z.string(),
  name: z.string().optional().nullable(),
  walletAccounts: z.lazy(() => UserWalletAccountUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
  budgetUsers: z.lazy(() => BudgetUserUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
  createdBudgetUserInvitations: z.lazy(() => BudgetUserInvitationUncheckedCreateNestedManyWithoutCreatedByUserInputSchema).optional(),
  createdFromInvitation: z.lazy(() => BudgetUserInvitationResponseUncheckedCreateNestedOneWithoutCreatedUserInputSchema).optional(),
  categories: z.lazy(() => CategoryUncheckedCreateNestedManyWithoutUserInputSchema).optional()
}).strict();

export const UserCreateOrConnectWithoutTransactionsInputSchema: z.ZodType<Prisma.UserCreateOrConnectWithoutTransactionsInput> = z.object({
  where: z.lazy(() => UserWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => UserCreateWithoutTransactionsInputSchema),z.lazy(() => UserUncheckedCreateWithoutTransactionsInputSchema) ]),
}).strict();

export const CategoryUpsertWithoutTransactionsInputSchema: z.ZodType<Prisma.CategoryUpsertWithoutTransactionsInput> = z.object({
  update: z.union([ z.lazy(() => CategoryUpdateWithoutTransactionsInputSchema),z.lazy(() => CategoryUncheckedUpdateWithoutTransactionsInputSchema) ]),
  create: z.union([ z.lazy(() => CategoryCreateWithoutTransactionsInputSchema),z.lazy(() => CategoryUncheckedCreateWithoutTransactionsInputSchema) ]),
  where: z.lazy(() => CategoryWhereInputSchema).optional()
}).strict();

export const CategoryUpdateToOneWithWhereWithoutTransactionsInputSchema: z.ZodType<Prisma.CategoryUpdateToOneWithWhereWithoutTransactionsInput> = z.object({
  where: z.lazy(() => CategoryWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => CategoryUpdateWithoutTransactionsInputSchema),z.lazy(() => CategoryUncheckedUpdateWithoutTransactionsInputSchema) ]),
}).strict();

export const CategoryUpdateWithoutTransactionsInputSchema: z.ZodType<Prisma.CategoryUpdateWithoutTransactionsInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.lazy(() => CategoryTypeSchema),z.lazy(() => EnumCategoryTypeFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  icon: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  color: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  user: z.lazy(() => UserUpdateOneRequiredWithoutCategoriesNestedInputSchema).optional(),
  parent: z.lazy(() => CategoryUpdateOneWithoutChildrenNestedInputSchema).optional(),
  children: z.lazy(() => CategoryUpdateManyWithoutParentNestedInputSchema).optional()
}).strict();

export const CategoryUncheckedUpdateWithoutTransactionsInputSchema: z.ZodType<Prisma.CategoryUncheckedUpdateWithoutTransactionsInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.lazy(() => CategoryTypeSchema),z.lazy(() => EnumCategoryTypeFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  icon: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  color: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  userId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  parentId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  children: z.lazy(() => CategoryUncheckedUpdateManyWithoutParentNestedInputSchema).optional()
}).strict();

export const BudgetUpsertWithoutTransactionsInputSchema: z.ZodType<Prisma.BudgetUpsertWithoutTransactionsInput> = z.object({
  update: z.union([ z.lazy(() => BudgetUpdateWithoutTransactionsInputSchema),z.lazy(() => BudgetUncheckedUpdateWithoutTransactionsInputSchema) ]),
  create: z.union([ z.lazy(() => BudgetCreateWithoutTransactionsInputSchema),z.lazy(() => BudgetUncheckedCreateWithoutTransactionsInputSchema) ]),
  where: z.lazy(() => BudgetWhereInputSchema).optional()
}).strict();

export const BudgetUpdateToOneWithWhereWithoutTransactionsInputSchema: z.ZodType<Prisma.BudgetUpdateToOneWithWhereWithoutTransactionsInput> = z.object({
  where: z.lazy(() => BudgetWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => BudgetUpdateWithoutTransactionsInputSchema),z.lazy(() => BudgetUncheckedUpdateWithoutTransactionsInputSchema) ]),
}).strict();

export const BudgetUpdateWithoutTransactionsInputSchema: z.ZodType<Prisma.BudgetUpdateWithoutTransactionsInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  preferredCurrency: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.lazy(() => BudgetTypeSchema),z.lazy(() => EnumBudgetTypeFieldUpdateOperationsInputSchema) ]).optional(),
  periodConfigs: z.lazy(() => BudgetPeriodConfigUpdateManyWithoutBudgetNestedInputSchema).optional(),
  budgetUsers: z.lazy(() => BudgetUserUpdateManyWithoutBudgetNestedInputSchema).optional(),
  invitations: z.lazy(() => BudgetUserInvitationUpdateManyWithoutBudgetNestedInputSchema).optional()
}).strict();

export const BudgetUncheckedUpdateWithoutTransactionsInputSchema: z.ZodType<Prisma.BudgetUncheckedUpdateWithoutTransactionsInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  preferredCurrency: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.lazy(() => BudgetTypeSchema),z.lazy(() => EnumBudgetTypeFieldUpdateOperationsInputSchema) ]).optional(),
  periodConfigs: z.lazy(() => BudgetPeriodConfigUncheckedUpdateManyWithoutBudgetNestedInputSchema).optional(),
  budgetUsers: z.lazy(() => BudgetUserUncheckedUpdateManyWithoutBudgetNestedInputSchema).optional(),
  invitations: z.lazy(() => BudgetUserInvitationUncheckedUpdateManyWithoutBudgetNestedInputSchema).optional()
}).strict();

export const UserWalletAccountUpsertWithoutTransactionsInputSchema: z.ZodType<Prisma.UserWalletAccountUpsertWithoutTransactionsInput> = z.object({
  update: z.union([ z.lazy(() => UserWalletAccountUpdateWithoutTransactionsInputSchema),z.lazy(() => UserWalletAccountUncheckedUpdateWithoutTransactionsInputSchema) ]),
  create: z.union([ z.lazy(() => UserWalletAccountCreateWithoutTransactionsInputSchema),z.lazy(() => UserWalletAccountUncheckedCreateWithoutTransactionsInputSchema) ]),
  where: z.lazy(() => UserWalletAccountWhereInputSchema).optional()
}).strict();

export const UserWalletAccountUpdateToOneWithWhereWithoutTransactionsInputSchema: z.ZodType<Prisma.UserWalletAccountUpdateToOneWithWhereWithoutTransactionsInput> = z.object({
  where: z.lazy(() => UserWalletAccountWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => UserWalletAccountUpdateWithoutTransactionsInputSchema),z.lazy(() => UserWalletAccountUncheckedUpdateWithoutTransactionsInputSchema) ]),
}).strict();

export const UserWalletAccountUpdateWithoutTransactionsInputSchema: z.ZodType<Prisma.UserWalletAccountUpdateWithoutTransactionsInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  icon: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastDigits: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  preferredCurrency: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  user: z.lazy(() => UserUpdateOneRequiredWithoutWalletAccountsNestedInputSchema).optional()
}).strict();

export const UserWalletAccountUncheckedUpdateWithoutTransactionsInputSchema: z.ZodType<Prisma.UserWalletAccountUncheckedUpdateWithoutTransactionsInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  icon: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastDigits: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  preferredCurrency: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  userId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const UserUpsertWithoutTransactionsInputSchema: z.ZodType<Prisma.UserUpsertWithoutTransactionsInput> = z.object({
  update: z.union([ z.lazy(() => UserUpdateWithoutTransactionsInputSchema),z.lazy(() => UserUncheckedUpdateWithoutTransactionsInputSchema) ]),
  create: z.union([ z.lazy(() => UserCreateWithoutTransactionsInputSchema),z.lazy(() => UserUncheckedCreateWithoutTransactionsInputSchema) ]),
  where: z.lazy(() => UserWhereInputSchema).optional()
}).strict();

export const UserUpdateToOneWithWhereWithoutTransactionsInputSchema: z.ZodType<Prisma.UserUpdateToOneWithWhereWithoutTransactionsInput> = z.object({
  where: z.lazy(() => UserWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => UserUpdateWithoutTransactionsInputSchema),z.lazy(() => UserUncheckedUpdateWithoutTransactionsInputSchema) ]),
}).strict();

export const UserUpdateWithoutTransactionsInputSchema: z.ZodType<Prisma.UserUpdateWithoutTransactionsInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  walletAccounts: z.lazy(() => UserWalletAccountUpdateManyWithoutUserNestedInputSchema).optional(),
  budgetUsers: z.lazy(() => BudgetUserUpdateManyWithoutUserNestedInputSchema).optional(),
  createdBudgetUserInvitations: z.lazy(() => BudgetUserInvitationUpdateManyWithoutCreatedByUserNestedInputSchema).optional(),
  createdFromInvitation: z.lazy(() => BudgetUserInvitationResponseUpdateOneWithoutCreatedUserNestedInputSchema).optional(),
  categories: z.lazy(() => CategoryUpdateManyWithoutUserNestedInputSchema).optional()
}).strict();

export const UserUncheckedUpdateWithoutTransactionsInputSchema: z.ZodType<Prisma.UserUncheckedUpdateWithoutTransactionsInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  walletAccounts: z.lazy(() => UserWalletAccountUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  budgetUsers: z.lazy(() => BudgetUserUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  createdBudgetUserInvitations: z.lazy(() => BudgetUserInvitationUncheckedUpdateManyWithoutCreatedByUserNestedInputSchema).optional(),
  createdFromInvitation: z.lazy(() => BudgetUserInvitationResponseUncheckedUpdateOneWithoutCreatedUserNestedInputSchema).optional(),
  categories: z.lazy(() => CategoryUncheckedUpdateManyWithoutUserNestedInputSchema).optional()
}).strict();

export const UserCreateWithoutCategoriesInputSchema: z.ZodType<Prisma.UserCreateWithoutCategoriesInput> = z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  email: z.string(),
  name: z.string().optional().nullable(),
  walletAccounts: z.lazy(() => UserWalletAccountCreateNestedManyWithoutUserInputSchema).optional(),
  budgetUsers: z.lazy(() => BudgetUserCreateNestedManyWithoutUserInputSchema).optional(),
  transactions: z.lazy(() => TransactionCreateNestedManyWithoutCreatedByUserInputSchema).optional(),
  createdBudgetUserInvitations: z.lazy(() => BudgetUserInvitationCreateNestedManyWithoutCreatedByUserInputSchema).optional(),
  createdFromInvitation: z.lazy(() => BudgetUserInvitationResponseCreateNestedOneWithoutCreatedUserInputSchema).optional()
}).strict();

export const UserUncheckedCreateWithoutCategoriesInputSchema: z.ZodType<Prisma.UserUncheckedCreateWithoutCategoriesInput> = z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  email: z.string(),
  name: z.string().optional().nullable(),
  walletAccounts: z.lazy(() => UserWalletAccountUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
  budgetUsers: z.lazy(() => BudgetUserUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
  transactions: z.lazy(() => TransactionUncheckedCreateNestedManyWithoutCreatedByUserInputSchema).optional(),
  createdBudgetUserInvitations: z.lazy(() => BudgetUserInvitationUncheckedCreateNestedManyWithoutCreatedByUserInputSchema).optional(),
  createdFromInvitation: z.lazy(() => BudgetUserInvitationResponseUncheckedCreateNestedOneWithoutCreatedUserInputSchema).optional()
}).strict();

export const UserCreateOrConnectWithoutCategoriesInputSchema: z.ZodType<Prisma.UserCreateOrConnectWithoutCategoriesInput> = z.object({
  where: z.lazy(() => UserWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => UserCreateWithoutCategoriesInputSchema),z.lazy(() => UserUncheckedCreateWithoutCategoriesInputSchema) ]),
}).strict();

export const CategoryCreateWithoutChildrenInputSchema: z.ZodType<Prisma.CategoryCreateWithoutChildrenInput> = z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  type: z.lazy(() => CategoryTypeSchema),
  name: z.string(),
  description: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  user: z.lazy(() => UserCreateNestedOneWithoutCategoriesInputSchema),
  parent: z.lazy(() => CategoryCreateNestedOneWithoutChildrenInputSchema).optional(),
  transactions: z.lazy(() => TransactionCreateNestedManyWithoutCategoryInputSchema).optional()
}).strict();

export const CategoryUncheckedCreateWithoutChildrenInputSchema: z.ZodType<Prisma.CategoryUncheckedCreateWithoutChildrenInput> = z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  type: z.lazy(() => CategoryTypeSchema),
  name: z.string(),
  description: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  userId: z.string(),
  parentId: z.string().optional().nullable(),
  transactions: z.lazy(() => TransactionUncheckedCreateNestedManyWithoutCategoryInputSchema).optional()
}).strict();

export const CategoryCreateOrConnectWithoutChildrenInputSchema: z.ZodType<Prisma.CategoryCreateOrConnectWithoutChildrenInput> = z.object({
  where: z.lazy(() => CategoryWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => CategoryCreateWithoutChildrenInputSchema),z.lazy(() => CategoryUncheckedCreateWithoutChildrenInputSchema) ]),
}).strict();

export const CategoryCreateWithoutParentInputSchema: z.ZodType<Prisma.CategoryCreateWithoutParentInput> = z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  type: z.lazy(() => CategoryTypeSchema),
  name: z.string(),
  description: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  user: z.lazy(() => UserCreateNestedOneWithoutCategoriesInputSchema),
  children: z.lazy(() => CategoryCreateNestedManyWithoutParentInputSchema).optional(),
  transactions: z.lazy(() => TransactionCreateNestedManyWithoutCategoryInputSchema).optional()
}).strict();

export const CategoryUncheckedCreateWithoutParentInputSchema: z.ZodType<Prisma.CategoryUncheckedCreateWithoutParentInput> = z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  type: z.lazy(() => CategoryTypeSchema),
  name: z.string(),
  description: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  userId: z.string(),
  children: z.lazy(() => CategoryUncheckedCreateNestedManyWithoutParentInputSchema).optional(),
  transactions: z.lazy(() => TransactionUncheckedCreateNestedManyWithoutCategoryInputSchema).optional()
}).strict();

export const CategoryCreateOrConnectWithoutParentInputSchema: z.ZodType<Prisma.CategoryCreateOrConnectWithoutParentInput> = z.object({
  where: z.lazy(() => CategoryWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => CategoryCreateWithoutParentInputSchema),z.lazy(() => CategoryUncheckedCreateWithoutParentInputSchema) ]),
}).strict();

export const CategoryCreateManyParentInputEnvelopeSchema: z.ZodType<Prisma.CategoryCreateManyParentInputEnvelope> = z.object({
  data: z.union([ z.lazy(() => CategoryCreateManyParentInputSchema),z.lazy(() => CategoryCreateManyParentInputSchema).array() ]),
  skipDuplicates: z.boolean().optional()
}).strict();

export const TransactionCreateWithoutCategoryInputSchema: z.ZodType<Prisma.TransactionCreateWithoutCategoryInput> = z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  amount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),
  amountInVnd: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),
  currency: z.string(),
  date: z.coerce.date(),
  note: z.string().optional().nullable(),
  budget: z.lazy(() => BudgetCreateNestedOneWithoutTransactionsInputSchema).optional(),
  walletAccount: z.lazy(() => UserWalletAccountCreateNestedOneWithoutTransactionsInputSchema),
  createdByUser: z.lazy(() => UserCreateNestedOneWithoutTransactionsInputSchema)
}).strict();

export const TransactionUncheckedCreateWithoutCategoryInputSchema: z.ZodType<Prisma.TransactionUncheckedCreateWithoutCategoryInput> = z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  amount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),
  amountInVnd: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),
  currency: z.string(),
  date: z.coerce.date(),
  note: z.string().optional().nullable(),
  budgetId: z.string().optional().nullable(),
  walletAccountId: z.string(),
  createdByUserId: z.string()
}).strict();

export const TransactionCreateOrConnectWithoutCategoryInputSchema: z.ZodType<Prisma.TransactionCreateOrConnectWithoutCategoryInput> = z.object({
  where: z.lazy(() => TransactionWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => TransactionCreateWithoutCategoryInputSchema),z.lazy(() => TransactionUncheckedCreateWithoutCategoryInputSchema) ]),
}).strict();

export const TransactionCreateManyCategoryInputEnvelopeSchema: z.ZodType<Prisma.TransactionCreateManyCategoryInputEnvelope> = z.object({
  data: z.union([ z.lazy(() => TransactionCreateManyCategoryInputSchema),z.lazy(() => TransactionCreateManyCategoryInputSchema).array() ]),
  skipDuplicates: z.boolean().optional()
}).strict();

export const UserUpsertWithoutCategoriesInputSchema: z.ZodType<Prisma.UserUpsertWithoutCategoriesInput> = z.object({
  update: z.union([ z.lazy(() => UserUpdateWithoutCategoriesInputSchema),z.lazy(() => UserUncheckedUpdateWithoutCategoriesInputSchema) ]),
  create: z.union([ z.lazy(() => UserCreateWithoutCategoriesInputSchema),z.lazy(() => UserUncheckedCreateWithoutCategoriesInputSchema) ]),
  where: z.lazy(() => UserWhereInputSchema).optional()
}).strict();

export const UserUpdateToOneWithWhereWithoutCategoriesInputSchema: z.ZodType<Prisma.UserUpdateToOneWithWhereWithoutCategoriesInput> = z.object({
  where: z.lazy(() => UserWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => UserUpdateWithoutCategoriesInputSchema),z.lazy(() => UserUncheckedUpdateWithoutCategoriesInputSchema) ]),
}).strict();

export const UserUpdateWithoutCategoriesInputSchema: z.ZodType<Prisma.UserUpdateWithoutCategoriesInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  walletAccounts: z.lazy(() => UserWalletAccountUpdateManyWithoutUserNestedInputSchema).optional(),
  budgetUsers: z.lazy(() => BudgetUserUpdateManyWithoutUserNestedInputSchema).optional(),
  transactions: z.lazy(() => TransactionUpdateManyWithoutCreatedByUserNestedInputSchema).optional(),
  createdBudgetUserInvitations: z.lazy(() => BudgetUserInvitationUpdateManyWithoutCreatedByUserNestedInputSchema).optional(),
  createdFromInvitation: z.lazy(() => BudgetUserInvitationResponseUpdateOneWithoutCreatedUserNestedInputSchema).optional()
}).strict();

export const UserUncheckedUpdateWithoutCategoriesInputSchema: z.ZodType<Prisma.UserUncheckedUpdateWithoutCategoriesInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  walletAccounts: z.lazy(() => UserWalletAccountUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  budgetUsers: z.lazy(() => BudgetUserUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  transactions: z.lazy(() => TransactionUncheckedUpdateManyWithoutCreatedByUserNestedInputSchema).optional(),
  createdBudgetUserInvitations: z.lazy(() => BudgetUserInvitationUncheckedUpdateManyWithoutCreatedByUserNestedInputSchema).optional(),
  createdFromInvitation: z.lazy(() => BudgetUserInvitationResponseUncheckedUpdateOneWithoutCreatedUserNestedInputSchema).optional()
}).strict();

export const CategoryUpsertWithoutChildrenInputSchema: z.ZodType<Prisma.CategoryUpsertWithoutChildrenInput> = z.object({
  update: z.union([ z.lazy(() => CategoryUpdateWithoutChildrenInputSchema),z.lazy(() => CategoryUncheckedUpdateWithoutChildrenInputSchema) ]),
  create: z.union([ z.lazy(() => CategoryCreateWithoutChildrenInputSchema),z.lazy(() => CategoryUncheckedCreateWithoutChildrenInputSchema) ]),
  where: z.lazy(() => CategoryWhereInputSchema).optional()
}).strict();

export const CategoryUpdateToOneWithWhereWithoutChildrenInputSchema: z.ZodType<Prisma.CategoryUpdateToOneWithWhereWithoutChildrenInput> = z.object({
  where: z.lazy(() => CategoryWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => CategoryUpdateWithoutChildrenInputSchema),z.lazy(() => CategoryUncheckedUpdateWithoutChildrenInputSchema) ]),
}).strict();

export const CategoryUpdateWithoutChildrenInputSchema: z.ZodType<Prisma.CategoryUpdateWithoutChildrenInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.lazy(() => CategoryTypeSchema),z.lazy(() => EnumCategoryTypeFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  icon: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  color: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  user: z.lazy(() => UserUpdateOneRequiredWithoutCategoriesNestedInputSchema).optional(),
  parent: z.lazy(() => CategoryUpdateOneWithoutChildrenNestedInputSchema).optional(),
  transactions: z.lazy(() => TransactionUpdateManyWithoutCategoryNestedInputSchema).optional()
}).strict();

export const CategoryUncheckedUpdateWithoutChildrenInputSchema: z.ZodType<Prisma.CategoryUncheckedUpdateWithoutChildrenInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.lazy(() => CategoryTypeSchema),z.lazy(() => EnumCategoryTypeFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  icon: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  color: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  userId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  parentId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  transactions: z.lazy(() => TransactionUncheckedUpdateManyWithoutCategoryNestedInputSchema).optional()
}).strict();

export const CategoryUpsertWithWhereUniqueWithoutParentInputSchema: z.ZodType<Prisma.CategoryUpsertWithWhereUniqueWithoutParentInput> = z.object({
  where: z.lazy(() => CategoryWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => CategoryUpdateWithoutParentInputSchema),z.lazy(() => CategoryUncheckedUpdateWithoutParentInputSchema) ]),
  create: z.union([ z.lazy(() => CategoryCreateWithoutParentInputSchema),z.lazy(() => CategoryUncheckedCreateWithoutParentInputSchema) ]),
}).strict();

export const CategoryUpdateWithWhereUniqueWithoutParentInputSchema: z.ZodType<Prisma.CategoryUpdateWithWhereUniqueWithoutParentInput> = z.object({
  where: z.lazy(() => CategoryWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => CategoryUpdateWithoutParentInputSchema),z.lazy(() => CategoryUncheckedUpdateWithoutParentInputSchema) ]),
}).strict();

export const CategoryUpdateManyWithWhereWithoutParentInputSchema: z.ZodType<Prisma.CategoryUpdateManyWithWhereWithoutParentInput> = z.object({
  where: z.lazy(() => CategoryScalarWhereInputSchema),
  data: z.union([ z.lazy(() => CategoryUpdateManyMutationInputSchema),z.lazy(() => CategoryUncheckedUpdateManyWithoutParentInputSchema) ]),
}).strict();

export const TransactionUpsertWithWhereUniqueWithoutCategoryInputSchema: z.ZodType<Prisma.TransactionUpsertWithWhereUniqueWithoutCategoryInput> = z.object({
  where: z.lazy(() => TransactionWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => TransactionUpdateWithoutCategoryInputSchema),z.lazy(() => TransactionUncheckedUpdateWithoutCategoryInputSchema) ]),
  create: z.union([ z.lazy(() => TransactionCreateWithoutCategoryInputSchema),z.lazy(() => TransactionUncheckedCreateWithoutCategoryInputSchema) ]),
}).strict();

export const TransactionUpdateWithWhereUniqueWithoutCategoryInputSchema: z.ZodType<Prisma.TransactionUpdateWithWhereUniqueWithoutCategoryInput> = z.object({
  where: z.lazy(() => TransactionWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => TransactionUpdateWithoutCategoryInputSchema),z.lazy(() => TransactionUncheckedUpdateWithoutCategoryInputSchema) ]),
}).strict();

export const TransactionUpdateManyWithWhereWithoutCategoryInputSchema: z.ZodType<Prisma.TransactionUpdateManyWithWhereWithoutCategoryInput> = z.object({
  where: z.lazy(() => TransactionScalarWhereInputSchema),
  data: z.union([ z.lazy(() => TransactionUpdateManyMutationInputSchema),z.lazy(() => TransactionUncheckedUpdateManyWithoutCategoryInputSchema) ]),
}).strict();

export const UserWalletAccountCreateManyUserInputSchema: z.ZodType<Prisma.UserWalletAccountCreateManyUserInput> = z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  name: z.string(),
  icon: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  lastDigits: z.string().optional().nullable(),
  preferredCurrency: z.string()
}).strict();

export const BudgetUserCreateManyUserInputSchema: z.ZodType<Prisma.BudgetUserCreateManyUserInput> = z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  permission: z.lazy(() => BudgetUserPermissionSchema),
  budgetId: z.string()
}).strict();

export const TransactionCreateManyCreatedByUserInputSchema: z.ZodType<Prisma.TransactionCreateManyCreatedByUserInput> = z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  amount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),
  amountInVnd: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),
  currency: z.string(),
  date: z.coerce.date(),
  note: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  budgetId: z.string().optional().nullable(),
  walletAccountId: z.string()
}).strict();

export const BudgetUserInvitationCreateManyCreatedByUserInputSchema: z.ZodType<Prisma.BudgetUserInvitationCreateManyCreatedByUserInput> = z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  email: z.string().optional().nullable(),
  token: z.string().optional(),
  expiresAt: z.coerce.date(),
  permission: z.lazy(() => BudgetUserPermissionSchema).optional().nullable(),
  budgetId: z.string()
}).strict();

export const CategoryCreateManyUserInputSchema: z.ZodType<Prisma.CategoryCreateManyUserInput> = z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  type: z.lazy(() => CategoryTypeSchema),
  name: z.string(),
  description: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  parentId: z.string().optional().nullable()
}).strict();

export const UserWalletAccountUpdateWithoutUserInputSchema: z.ZodType<Prisma.UserWalletAccountUpdateWithoutUserInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  icon: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastDigits: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  preferredCurrency: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  transactions: z.lazy(() => TransactionUpdateManyWithoutWalletAccountNestedInputSchema).optional()
}).strict();

export const UserWalletAccountUncheckedUpdateWithoutUserInputSchema: z.ZodType<Prisma.UserWalletAccountUncheckedUpdateWithoutUserInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  icon: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastDigits: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  preferredCurrency: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  transactions: z.lazy(() => TransactionUncheckedUpdateManyWithoutWalletAccountNestedInputSchema).optional()
}).strict();

export const UserWalletAccountUncheckedUpdateManyWithoutUserInputSchema: z.ZodType<Prisma.UserWalletAccountUncheckedUpdateManyWithoutUserInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  icon: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastDigits: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  preferredCurrency: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const BudgetUserUpdateWithoutUserInputSchema: z.ZodType<Prisma.BudgetUserUpdateWithoutUserInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  permission: z.union([ z.lazy(() => BudgetUserPermissionSchema),z.lazy(() => EnumBudgetUserPermissionFieldUpdateOperationsInputSchema) ]).optional(),
  budget: z.lazy(() => BudgetUpdateOneRequiredWithoutBudgetUsersNestedInputSchema).optional()
}).strict();

export const BudgetUserUncheckedUpdateWithoutUserInputSchema: z.ZodType<Prisma.BudgetUserUncheckedUpdateWithoutUserInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  permission: z.union([ z.lazy(() => BudgetUserPermissionSchema),z.lazy(() => EnumBudgetUserPermissionFieldUpdateOperationsInputSchema) ]).optional(),
  budgetId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const BudgetUserUncheckedUpdateManyWithoutUserInputSchema: z.ZodType<Prisma.BudgetUserUncheckedUpdateManyWithoutUserInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  permission: z.union([ z.lazy(() => BudgetUserPermissionSchema),z.lazy(() => EnumBudgetUserPermissionFieldUpdateOperationsInputSchema) ]).optional(),
  budgetId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const TransactionUpdateWithoutCreatedByUserInputSchema: z.ZodType<Prisma.TransactionUpdateWithoutCreatedByUserInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  amount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  amountInVnd: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  currency: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  date: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  note: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  category: z.lazy(() => CategoryUpdateOneWithoutTransactionsNestedInputSchema).optional(),
  budget: z.lazy(() => BudgetUpdateOneWithoutTransactionsNestedInputSchema).optional(),
  walletAccount: z.lazy(() => UserWalletAccountUpdateOneRequiredWithoutTransactionsNestedInputSchema).optional()
}).strict();

export const TransactionUncheckedUpdateWithoutCreatedByUserInputSchema: z.ZodType<Prisma.TransactionUncheckedUpdateWithoutCreatedByUserInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  amount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  amountInVnd: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  currency: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  date: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  note: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  categoryId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  budgetId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  walletAccountId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const TransactionUncheckedUpdateManyWithoutCreatedByUserInputSchema: z.ZodType<Prisma.TransactionUncheckedUpdateManyWithoutCreatedByUserInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  amount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  amountInVnd: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  currency: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  date: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  note: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  categoryId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  budgetId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  walletAccountId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const BudgetUserInvitationUpdateWithoutCreatedByUserInputSchema: z.ZodType<Prisma.BudgetUserInvitationUpdateWithoutCreatedByUserInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  token: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  expiresAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  permission: z.union([ z.lazy(() => BudgetUserPermissionSchema),z.lazy(() => NullableEnumBudgetUserPermissionFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  budget: z.lazy(() => BudgetUpdateOneRequiredWithoutInvitationsNestedInputSchema).optional(),
  responses: z.lazy(() => BudgetUserInvitationResponseUpdateManyWithoutInvitationNestedInputSchema).optional()
}).strict();

export const BudgetUserInvitationUncheckedUpdateWithoutCreatedByUserInputSchema: z.ZodType<Prisma.BudgetUserInvitationUncheckedUpdateWithoutCreatedByUserInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  token: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  expiresAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  permission: z.union([ z.lazy(() => BudgetUserPermissionSchema),z.lazy(() => NullableEnumBudgetUserPermissionFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  budgetId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  responses: z.lazy(() => BudgetUserInvitationResponseUncheckedUpdateManyWithoutInvitationNestedInputSchema).optional()
}).strict();

export const BudgetUserInvitationUncheckedUpdateManyWithoutCreatedByUserInputSchema: z.ZodType<Prisma.BudgetUserInvitationUncheckedUpdateManyWithoutCreatedByUserInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  token: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  expiresAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  permission: z.union([ z.lazy(() => BudgetUserPermissionSchema),z.lazy(() => NullableEnumBudgetUserPermissionFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  budgetId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const CategoryUpdateWithoutUserInputSchema: z.ZodType<Prisma.CategoryUpdateWithoutUserInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.lazy(() => CategoryTypeSchema),z.lazy(() => EnumCategoryTypeFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  icon: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  color: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  parent: z.lazy(() => CategoryUpdateOneWithoutChildrenNestedInputSchema).optional(),
  children: z.lazy(() => CategoryUpdateManyWithoutParentNestedInputSchema).optional(),
  transactions: z.lazy(() => TransactionUpdateManyWithoutCategoryNestedInputSchema).optional()
}).strict();

export const CategoryUncheckedUpdateWithoutUserInputSchema: z.ZodType<Prisma.CategoryUncheckedUpdateWithoutUserInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.lazy(() => CategoryTypeSchema),z.lazy(() => EnumCategoryTypeFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  icon: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  color: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  parentId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  children: z.lazy(() => CategoryUncheckedUpdateManyWithoutParentNestedInputSchema).optional(),
  transactions: z.lazy(() => TransactionUncheckedUpdateManyWithoutCategoryNestedInputSchema).optional()
}).strict();

export const CategoryUncheckedUpdateManyWithoutUserInputSchema: z.ZodType<Prisma.CategoryUncheckedUpdateManyWithoutUserInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.lazy(() => CategoryTypeSchema),z.lazy(() => EnumCategoryTypeFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  icon: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  color: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  parentId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
}).strict();

export const TransactionCreateManyWalletAccountInputSchema: z.ZodType<Prisma.TransactionCreateManyWalletAccountInput> = z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  amount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),
  amountInVnd: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),
  currency: z.string(),
  date: z.coerce.date(),
  note: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  budgetId: z.string().optional().nullable(),
  createdByUserId: z.string()
}).strict();

export const TransactionUpdateWithoutWalletAccountInputSchema: z.ZodType<Prisma.TransactionUpdateWithoutWalletAccountInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  amount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  amountInVnd: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  currency: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  date: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  note: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  category: z.lazy(() => CategoryUpdateOneWithoutTransactionsNestedInputSchema).optional(),
  budget: z.lazy(() => BudgetUpdateOneWithoutTransactionsNestedInputSchema).optional(),
  createdByUser: z.lazy(() => UserUpdateOneRequiredWithoutTransactionsNestedInputSchema).optional()
}).strict();

export const TransactionUncheckedUpdateWithoutWalletAccountInputSchema: z.ZodType<Prisma.TransactionUncheckedUpdateWithoutWalletAccountInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  amount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  amountInVnd: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  currency: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  date: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  note: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  categoryId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  budgetId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdByUserId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const TransactionUncheckedUpdateManyWithoutWalletAccountInputSchema: z.ZodType<Prisma.TransactionUncheckedUpdateManyWithoutWalletAccountInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  amount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  amountInVnd: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  currency: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  date: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  note: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  categoryId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  budgetId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdByUserId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const BudgetPeriodConfigCreateManyBudgetInputSchema: z.ZodType<Prisma.BudgetPeriodConfigCreateManyBudgetInput> = z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  type: z.lazy(() => BudgetPeriodTypeSchema),
  amount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),
  startDate: z.coerce.date().optional().nullable(),
  endDate: z.coerce.date().optional().nullable()
}).strict();

export const BudgetUserCreateManyBudgetInputSchema: z.ZodType<Prisma.BudgetUserCreateManyBudgetInput> = z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  permission: z.lazy(() => BudgetUserPermissionSchema),
  userId: z.string()
}).strict();

export const TransactionCreateManyBudgetInputSchema: z.ZodType<Prisma.TransactionCreateManyBudgetInput> = z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  amount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),
  amountInVnd: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),
  currency: z.string(),
  date: z.coerce.date(),
  note: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  walletAccountId: z.string(),
  createdByUserId: z.string()
}).strict();

export const BudgetUserInvitationCreateManyBudgetInputSchema: z.ZodType<Prisma.BudgetUserInvitationCreateManyBudgetInput> = z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  email: z.string().optional().nullable(),
  token: z.string().optional(),
  expiresAt: z.coerce.date(),
  permission: z.lazy(() => BudgetUserPermissionSchema).optional().nullable(),
  createdByUserId: z.string()
}).strict();

export const BudgetPeriodConfigUpdateWithoutBudgetInputSchema: z.ZodType<Prisma.BudgetPeriodConfigUpdateWithoutBudgetInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.lazy(() => BudgetPeriodTypeSchema),z.lazy(() => EnumBudgetPeriodTypeFieldUpdateOperationsInputSchema) ]).optional(),
  amount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  startDate: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  endDate: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
}).strict();

export const BudgetPeriodConfigUncheckedUpdateWithoutBudgetInputSchema: z.ZodType<Prisma.BudgetPeriodConfigUncheckedUpdateWithoutBudgetInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.lazy(() => BudgetPeriodTypeSchema),z.lazy(() => EnumBudgetPeriodTypeFieldUpdateOperationsInputSchema) ]).optional(),
  amount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  startDate: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  endDate: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
}).strict();

export const BudgetPeriodConfigUncheckedUpdateManyWithoutBudgetInputSchema: z.ZodType<Prisma.BudgetPeriodConfigUncheckedUpdateManyWithoutBudgetInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.lazy(() => BudgetPeriodTypeSchema),z.lazy(() => EnumBudgetPeriodTypeFieldUpdateOperationsInputSchema) ]).optional(),
  amount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  startDate: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  endDate: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
}).strict();

export const BudgetUserUpdateWithoutBudgetInputSchema: z.ZodType<Prisma.BudgetUserUpdateWithoutBudgetInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  permission: z.union([ z.lazy(() => BudgetUserPermissionSchema),z.lazy(() => EnumBudgetUserPermissionFieldUpdateOperationsInputSchema) ]).optional(),
  user: z.lazy(() => UserUpdateOneRequiredWithoutBudgetUsersNestedInputSchema).optional()
}).strict();

export const BudgetUserUncheckedUpdateWithoutBudgetInputSchema: z.ZodType<Prisma.BudgetUserUncheckedUpdateWithoutBudgetInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  permission: z.union([ z.lazy(() => BudgetUserPermissionSchema),z.lazy(() => EnumBudgetUserPermissionFieldUpdateOperationsInputSchema) ]).optional(),
  userId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const BudgetUserUncheckedUpdateManyWithoutBudgetInputSchema: z.ZodType<Prisma.BudgetUserUncheckedUpdateManyWithoutBudgetInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  permission: z.union([ z.lazy(() => BudgetUserPermissionSchema),z.lazy(() => EnumBudgetUserPermissionFieldUpdateOperationsInputSchema) ]).optional(),
  userId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const TransactionUpdateWithoutBudgetInputSchema: z.ZodType<Prisma.TransactionUpdateWithoutBudgetInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  amount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  amountInVnd: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  currency: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  date: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  note: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  category: z.lazy(() => CategoryUpdateOneWithoutTransactionsNestedInputSchema).optional(),
  walletAccount: z.lazy(() => UserWalletAccountUpdateOneRequiredWithoutTransactionsNestedInputSchema).optional(),
  createdByUser: z.lazy(() => UserUpdateOneRequiredWithoutTransactionsNestedInputSchema).optional()
}).strict();

export const TransactionUncheckedUpdateWithoutBudgetInputSchema: z.ZodType<Prisma.TransactionUncheckedUpdateWithoutBudgetInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  amount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  amountInVnd: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  currency: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  date: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  note: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  categoryId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  walletAccountId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdByUserId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const TransactionUncheckedUpdateManyWithoutBudgetInputSchema: z.ZodType<Prisma.TransactionUncheckedUpdateManyWithoutBudgetInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  amount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  amountInVnd: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  currency: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  date: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  note: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  categoryId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  walletAccountId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdByUserId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const BudgetUserInvitationUpdateWithoutBudgetInputSchema: z.ZodType<Prisma.BudgetUserInvitationUpdateWithoutBudgetInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  token: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  expiresAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  permission: z.union([ z.lazy(() => BudgetUserPermissionSchema),z.lazy(() => NullableEnumBudgetUserPermissionFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdByUser: z.lazy(() => UserUpdateOneRequiredWithoutCreatedBudgetUserInvitationsNestedInputSchema).optional(),
  responses: z.lazy(() => BudgetUserInvitationResponseUpdateManyWithoutInvitationNestedInputSchema).optional()
}).strict();

export const BudgetUserInvitationUncheckedUpdateWithoutBudgetInputSchema: z.ZodType<Prisma.BudgetUserInvitationUncheckedUpdateWithoutBudgetInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  token: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  expiresAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  permission: z.union([ z.lazy(() => BudgetUserPermissionSchema),z.lazy(() => NullableEnumBudgetUserPermissionFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdByUserId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  responses: z.lazy(() => BudgetUserInvitationResponseUncheckedUpdateManyWithoutInvitationNestedInputSchema).optional()
}).strict();

export const BudgetUserInvitationUncheckedUpdateManyWithoutBudgetInputSchema: z.ZodType<Prisma.BudgetUserInvitationUncheckedUpdateManyWithoutBudgetInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  token: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  expiresAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  permission: z.union([ z.lazy(() => BudgetUserPermissionSchema),z.lazy(() => NullableEnumBudgetUserPermissionFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdByUserId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const BudgetUserInvitationResponseCreateManyInvitationInputSchema: z.ZodType<Prisma.BudgetUserInvitationResponseCreateManyInvitationInput> = z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  acceptedAt: z.coerce.date().optional().nullable(),
  declinedAt: z.coerce.date().optional().nullable(),
  createdUserId: z.string().optional().nullable()
}).strict();

export const BudgetUserInvitationResponseUpdateWithoutInvitationInputSchema: z.ZodType<Prisma.BudgetUserInvitationResponseUpdateWithoutInvitationInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  acceptedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  declinedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdUser: z.lazy(() => UserUpdateOneWithoutCreatedFromInvitationNestedInputSchema).optional()
}).strict();

export const BudgetUserInvitationResponseUncheckedUpdateWithoutInvitationInputSchema: z.ZodType<Prisma.BudgetUserInvitationResponseUncheckedUpdateWithoutInvitationInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  acceptedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  declinedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdUserId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
}).strict();

export const BudgetUserInvitationResponseUncheckedUpdateManyWithoutInvitationInputSchema: z.ZodType<Prisma.BudgetUserInvitationResponseUncheckedUpdateManyWithoutInvitationInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  acceptedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  declinedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdUserId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
}).strict();

export const CategoryCreateManyParentInputSchema: z.ZodType<Prisma.CategoryCreateManyParentInput> = z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  type: z.lazy(() => CategoryTypeSchema),
  name: z.string(),
  description: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  userId: z.string()
}).strict();

export const TransactionCreateManyCategoryInputSchema: z.ZodType<Prisma.TransactionCreateManyCategoryInput> = z.object({
  id: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  amount: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),
  amountInVnd: z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),
  currency: z.string(),
  date: z.coerce.date(),
  note: z.string().optional().nullable(),
  budgetId: z.string().optional().nullable(),
  walletAccountId: z.string(),
  createdByUserId: z.string()
}).strict();

export const CategoryUpdateWithoutParentInputSchema: z.ZodType<Prisma.CategoryUpdateWithoutParentInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.lazy(() => CategoryTypeSchema),z.lazy(() => EnumCategoryTypeFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  icon: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  color: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  user: z.lazy(() => UserUpdateOneRequiredWithoutCategoriesNestedInputSchema).optional(),
  children: z.lazy(() => CategoryUpdateManyWithoutParentNestedInputSchema).optional(),
  transactions: z.lazy(() => TransactionUpdateManyWithoutCategoryNestedInputSchema).optional()
}).strict();

export const CategoryUncheckedUpdateWithoutParentInputSchema: z.ZodType<Prisma.CategoryUncheckedUpdateWithoutParentInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.lazy(() => CategoryTypeSchema),z.lazy(() => EnumCategoryTypeFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  icon: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  color: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  userId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  children: z.lazy(() => CategoryUncheckedUpdateManyWithoutParentNestedInputSchema).optional(),
  transactions: z.lazy(() => TransactionUncheckedUpdateManyWithoutCategoryNestedInputSchema).optional()
}).strict();

export const CategoryUncheckedUpdateManyWithoutParentInputSchema: z.ZodType<Prisma.CategoryUncheckedUpdateManyWithoutParentInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.lazy(() => CategoryTypeSchema),z.lazy(() => EnumCategoryTypeFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  icon: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  color: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  userId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const TransactionUpdateWithoutCategoryInputSchema: z.ZodType<Prisma.TransactionUpdateWithoutCategoryInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  amount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  amountInVnd: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  currency: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  date: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  note: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  budget: z.lazy(() => BudgetUpdateOneWithoutTransactionsNestedInputSchema).optional(),
  walletAccount: z.lazy(() => UserWalletAccountUpdateOneRequiredWithoutTransactionsNestedInputSchema).optional(),
  createdByUser: z.lazy(() => UserUpdateOneRequiredWithoutTransactionsNestedInputSchema).optional()
}).strict();

export const TransactionUncheckedUpdateWithoutCategoryInputSchema: z.ZodType<Prisma.TransactionUncheckedUpdateWithoutCategoryInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  amount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  amountInVnd: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  currency: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  date: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  note: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  budgetId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  walletAccountId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdByUserId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const TransactionUncheckedUpdateManyWithoutCategoryInputSchema: z.ZodType<Prisma.TransactionUncheckedUpdateManyWithoutCategoryInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  amount: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  amountInVnd: z.union([ z.union([z.number(),z.string(),z.instanceof(Decimal),z.instanceof(Prisma.Decimal),DecimalJsLikeSchema,]).refine((v) => isValidDecimalInput(v), { message: 'Must be a Decimal' }),z.lazy(() => DecimalFieldUpdateOperationsInputSchema) ]).optional(),
  currency: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  date: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  note: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  budgetId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  walletAccountId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdByUserId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

/////////////////////////////////////////
// ARGS
/////////////////////////////////////////

export const UserFindFirstArgsSchema: z.ZodType<Prisma.UserFindFirstArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  where: UserWhereInputSchema.optional(),
  orderBy: z.union([ UserOrderByWithRelationInputSchema.array(),UserOrderByWithRelationInputSchema ]).optional(),
  cursor: UserWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ UserScalarFieldEnumSchema,UserScalarFieldEnumSchema.array() ]).optional(),
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export const UserFindFirstOrThrowArgsSchema: z.ZodType<Prisma.UserFindFirstOrThrowArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  where: UserWhereInputSchema.optional(),
  orderBy: z.union([ UserOrderByWithRelationInputSchema.array(),UserOrderByWithRelationInputSchema ]).optional(),
  cursor: UserWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ UserScalarFieldEnumSchema,UserScalarFieldEnumSchema.array() ]).optional(),
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export const UserFindManyArgsSchema: z.ZodType<Prisma.UserFindManyArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  where: UserWhereInputSchema.optional(),
  orderBy: z.union([ UserOrderByWithRelationInputSchema.array(),UserOrderByWithRelationInputSchema ]).optional(),
  cursor: UserWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ UserScalarFieldEnumSchema,UserScalarFieldEnumSchema.array() ]).optional(),
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export const UserAggregateArgsSchema: z.ZodType<Prisma.UserAggregateArgs> = z.object({
  where: UserWhereInputSchema.optional(),
  orderBy: z.union([ UserOrderByWithRelationInputSchema.array(),UserOrderByWithRelationInputSchema ]).optional(),
  cursor: UserWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const UserGroupByArgsSchema: z.ZodType<Prisma.UserGroupByArgs> = z.object({
  where: UserWhereInputSchema.optional(),
  orderBy: z.union([ UserOrderByWithAggregationInputSchema.array(),UserOrderByWithAggregationInputSchema ]).optional(),
  by: UserScalarFieldEnumSchema.array(),
  having: UserScalarWhereWithAggregatesInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const UserFindUniqueArgsSchema: z.ZodType<Prisma.UserFindUniqueArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  where: UserWhereUniqueInputSchema,
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export const UserFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.UserFindUniqueOrThrowArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  where: UserWhereUniqueInputSchema,
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export const UserWalletAccountFindFirstArgsSchema: z.ZodType<Prisma.UserWalletAccountFindFirstArgs> = z.object({
  select: UserWalletAccountSelectSchema.optional(),
  include: UserWalletAccountIncludeSchema.optional(),
  where: UserWalletAccountWhereInputSchema.optional(),
  orderBy: z.union([ UserWalletAccountOrderByWithRelationInputSchema.array(),UserWalletAccountOrderByWithRelationInputSchema ]).optional(),
  cursor: UserWalletAccountWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ UserWalletAccountScalarFieldEnumSchema,UserWalletAccountScalarFieldEnumSchema.array() ]).optional(),
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export const UserWalletAccountFindFirstOrThrowArgsSchema: z.ZodType<Prisma.UserWalletAccountFindFirstOrThrowArgs> = z.object({
  select: UserWalletAccountSelectSchema.optional(),
  include: UserWalletAccountIncludeSchema.optional(),
  where: UserWalletAccountWhereInputSchema.optional(),
  orderBy: z.union([ UserWalletAccountOrderByWithRelationInputSchema.array(),UserWalletAccountOrderByWithRelationInputSchema ]).optional(),
  cursor: UserWalletAccountWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ UserWalletAccountScalarFieldEnumSchema,UserWalletAccountScalarFieldEnumSchema.array() ]).optional(),
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export const UserWalletAccountFindManyArgsSchema: z.ZodType<Prisma.UserWalletAccountFindManyArgs> = z.object({
  select: UserWalletAccountSelectSchema.optional(),
  include: UserWalletAccountIncludeSchema.optional(),
  where: UserWalletAccountWhereInputSchema.optional(),
  orderBy: z.union([ UserWalletAccountOrderByWithRelationInputSchema.array(),UserWalletAccountOrderByWithRelationInputSchema ]).optional(),
  cursor: UserWalletAccountWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ UserWalletAccountScalarFieldEnumSchema,UserWalletAccountScalarFieldEnumSchema.array() ]).optional(),
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export const UserWalletAccountAggregateArgsSchema: z.ZodType<Prisma.UserWalletAccountAggregateArgs> = z.object({
  where: UserWalletAccountWhereInputSchema.optional(),
  orderBy: z.union([ UserWalletAccountOrderByWithRelationInputSchema.array(),UserWalletAccountOrderByWithRelationInputSchema ]).optional(),
  cursor: UserWalletAccountWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const UserWalletAccountGroupByArgsSchema: z.ZodType<Prisma.UserWalletAccountGroupByArgs> = z.object({
  where: UserWalletAccountWhereInputSchema.optional(),
  orderBy: z.union([ UserWalletAccountOrderByWithAggregationInputSchema.array(),UserWalletAccountOrderByWithAggregationInputSchema ]).optional(),
  by: UserWalletAccountScalarFieldEnumSchema.array(),
  having: UserWalletAccountScalarWhereWithAggregatesInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const UserWalletAccountFindUniqueArgsSchema: z.ZodType<Prisma.UserWalletAccountFindUniqueArgs> = z.object({
  select: UserWalletAccountSelectSchema.optional(),
  include: UserWalletAccountIncludeSchema.optional(),
  where: UserWalletAccountWhereUniqueInputSchema,
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export const UserWalletAccountFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.UserWalletAccountFindUniqueOrThrowArgs> = z.object({
  select: UserWalletAccountSelectSchema.optional(),
  include: UserWalletAccountIncludeSchema.optional(),
  where: UserWalletAccountWhereUniqueInputSchema,
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export const BudgetFindFirstArgsSchema: z.ZodType<Prisma.BudgetFindFirstArgs> = z.object({
  select: BudgetSelectSchema.optional(),
  include: BudgetIncludeSchema.optional(),
  where: BudgetWhereInputSchema.optional(),
  orderBy: z.union([ BudgetOrderByWithRelationInputSchema.array(),BudgetOrderByWithRelationInputSchema ]).optional(),
  cursor: BudgetWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ BudgetScalarFieldEnumSchema,BudgetScalarFieldEnumSchema.array() ]).optional(),
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export const BudgetFindFirstOrThrowArgsSchema: z.ZodType<Prisma.BudgetFindFirstOrThrowArgs> = z.object({
  select: BudgetSelectSchema.optional(),
  include: BudgetIncludeSchema.optional(),
  where: BudgetWhereInputSchema.optional(),
  orderBy: z.union([ BudgetOrderByWithRelationInputSchema.array(),BudgetOrderByWithRelationInputSchema ]).optional(),
  cursor: BudgetWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ BudgetScalarFieldEnumSchema,BudgetScalarFieldEnumSchema.array() ]).optional(),
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export const BudgetFindManyArgsSchema: z.ZodType<Prisma.BudgetFindManyArgs> = z.object({
  select: BudgetSelectSchema.optional(),
  include: BudgetIncludeSchema.optional(),
  where: BudgetWhereInputSchema.optional(),
  orderBy: z.union([ BudgetOrderByWithRelationInputSchema.array(),BudgetOrderByWithRelationInputSchema ]).optional(),
  cursor: BudgetWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ BudgetScalarFieldEnumSchema,BudgetScalarFieldEnumSchema.array() ]).optional(),
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export const BudgetAggregateArgsSchema: z.ZodType<Prisma.BudgetAggregateArgs> = z.object({
  where: BudgetWhereInputSchema.optional(),
  orderBy: z.union([ BudgetOrderByWithRelationInputSchema.array(),BudgetOrderByWithRelationInputSchema ]).optional(),
  cursor: BudgetWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const BudgetGroupByArgsSchema: z.ZodType<Prisma.BudgetGroupByArgs> = z.object({
  where: BudgetWhereInputSchema.optional(),
  orderBy: z.union([ BudgetOrderByWithAggregationInputSchema.array(),BudgetOrderByWithAggregationInputSchema ]).optional(),
  by: BudgetScalarFieldEnumSchema.array(),
  having: BudgetScalarWhereWithAggregatesInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const BudgetFindUniqueArgsSchema: z.ZodType<Prisma.BudgetFindUniqueArgs> = z.object({
  select: BudgetSelectSchema.optional(),
  include: BudgetIncludeSchema.optional(),
  where: BudgetWhereUniqueInputSchema,
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export const BudgetFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.BudgetFindUniqueOrThrowArgs> = z.object({
  select: BudgetSelectSchema.optional(),
  include: BudgetIncludeSchema.optional(),
  where: BudgetWhereUniqueInputSchema,
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export const BudgetPeriodConfigFindFirstArgsSchema: z.ZodType<Prisma.BudgetPeriodConfigFindFirstArgs> = z.object({
  select: BudgetPeriodConfigSelectSchema.optional(),
  include: BudgetPeriodConfigIncludeSchema.optional(),
  where: BudgetPeriodConfigWhereInputSchema.optional(),
  orderBy: z.union([ BudgetPeriodConfigOrderByWithRelationInputSchema.array(),BudgetPeriodConfigOrderByWithRelationInputSchema ]).optional(),
  cursor: BudgetPeriodConfigWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ BudgetPeriodConfigScalarFieldEnumSchema,BudgetPeriodConfigScalarFieldEnumSchema.array() ]).optional(),
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export const BudgetPeriodConfigFindFirstOrThrowArgsSchema: z.ZodType<Prisma.BudgetPeriodConfigFindFirstOrThrowArgs> = z.object({
  select: BudgetPeriodConfigSelectSchema.optional(),
  include: BudgetPeriodConfigIncludeSchema.optional(),
  where: BudgetPeriodConfigWhereInputSchema.optional(),
  orderBy: z.union([ BudgetPeriodConfigOrderByWithRelationInputSchema.array(),BudgetPeriodConfigOrderByWithRelationInputSchema ]).optional(),
  cursor: BudgetPeriodConfigWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ BudgetPeriodConfigScalarFieldEnumSchema,BudgetPeriodConfigScalarFieldEnumSchema.array() ]).optional(),
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export const BudgetPeriodConfigFindManyArgsSchema: z.ZodType<Prisma.BudgetPeriodConfigFindManyArgs> = z.object({
  select: BudgetPeriodConfigSelectSchema.optional(),
  include: BudgetPeriodConfigIncludeSchema.optional(),
  where: BudgetPeriodConfigWhereInputSchema.optional(),
  orderBy: z.union([ BudgetPeriodConfigOrderByWithRelationInputSchema.array(),BudgetPeriodConfigOrderByWithRelationInputSchema ]).optional(),
  cursor: BudgetPeriodConfigWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ BudgetPeriodConfigScalarFieldEnumSchema,BudgetPeriodConfigScalarFieldEnumSchema.array() ]).optional(),
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export const BudgetPeriodConfigAggregateArgsSchema: z.ZodType<Prisma.BudgetPeriodConfigAggregateArgs> = z.object({
  where: BudgetPeriodConfigWhereInputSchema.optional(),
  orderBy: z.union([ BudgetPeriodConfigOrderByWithRelationInputSchema.array(),BudgetPeriodConfigOrderByWithRelationInputSchema ]).optional(),
  cursor: BudgetPeriodConfigWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const BudgetPeriodConfigGroupByArgsSchema: z.ZodType<Prisma.BudgetPeriodConfigGroupByArgs> = z.object({
  where: BudgetPeriodConfigWhereInputSchema.optional(),
  orderBy: z.union([ BudgetPeriodConfigOrderByWithAggregationInputSchema.array(),BudgetPeriodConfigOrderByWithAggregationInputSchema ]).optional(),
  by: BudgetPeriodConfigScalarFieldEnumSchema.array(),
  having: BudgetPeriodConfigScalarWhereWithAggregatesInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const BudgetPeriodConfigFindUniqueArgsSchema: z.ZodType<Prisma.BudgetPeriodConfigFindUniqueArgs> = z.object({
  select: BudgetPeriodConfigSelectSchema.optional(),
  include: BudgetPeriodConfigIncludeSchema.optional(),
  where: BudgetPeriodConfigWhereUniqueInputSchema,
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export const BudgetPeriodConfigFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.BudgetPeriodConfigFindUniqueOrThrowArgs> = z.object({
  select: BudgetPeriodConfigSelectSchema.optional(),
  include: BudgetPeriodConfigIncludeSchema.optional(),
  where: BudgetPeriodConfigWhereUniqueInputSchema,
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export const BudgetUserFindFirstArgsSchema: z.ZodType<Prisma.BudgetUserFindFirstArgs> = z.object({
  select: BudgetUserSelectSchema.optional(),
  include: BudgetUserIncludeSchema.optional(),
  where: BudgetUserWhereInputSchema.optional(),
  orderBy: z.union([ BudgetUserOrderByWithRelationInputSchema.array(),BudgetUserOrderByWithRelationInputSchema ]).optional(),
  cursor: BudgetUserWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ BudgetUserScalarFieldEnumSchema,BudgetUserScalarFieldEnumSchema.array() ]).optional(),
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export const BudgetUserFindFirstOrThrowArgsSchema: z.ZodType<Prisma.BudgetUserFindFirstOrThrowArgs> = z.object({
  select: BudgetUserSelectSchema.optional(),
  include: BudgetUserIncludeSchema.optional(),
  where: BudgetUserWhereInputSchema.optional(),
  orderBy: z.union([ BudgetUserOrderByWithRelationInputSchema.array(),BudgetUserOrderByWithRelationInputSchema ]).optional(),
  cursor: BudgetUserWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ BudgetUserScalarFieldEnumSchema,BudgetUserScalarFieldEnumSchema.array() ]).optional(),
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export const BudgetUserFindManyArgsSchema: z.ZodType<Prisma.BudgetUserFindManyArgs> = z.object({
  select: BudgetUserSelectSchema.optional(),
  include: BudgetUserIncludeSchema.optional(),
  where: BudgetUserWhereInputSchema.optional(),
  orderBy: z.union([ BudgetUserOrderByWithRelationInputSchema.array(),BudgetUserOrderByWithRelationInputSchema ]).optional(),
  cursor: BudgetUserWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ BudgetUserScalarFieldEnumSchema,BudgetUserScalarFieldEnumSchema.array() ]).optional(),
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export const BudgetUserAggregateArgsSchema: z.ZodType<Prisma.BudgetUserAggregateArgs> = z.object({
  where: BudgetUserWhereInputSchema.optional(),
  orderBy: z.union([ BudgetUserOrderByWithRelationInputSchema.array(),BudgetUserOrderByWithRelationInputSchema ]).optional(),
  cursor: BudgetUserWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const BudgetUserGroupByArgsSchema: z.ZodType<Prisma.BudgetUserGroupByArgs> = z.object({
  where: BudgetUserWhereInputSchema.optional(),
  orderBy: z.union([ BudgetUserOrderByWithAggregationInputSchema.array(),BudgetUserOrderByWithAggregationInputSchema ]).optional(),
  by: BudgetUserScalarFieldEnumSchema.array(),
  having: BudgetUserScalarWhereWithAggregatesInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const BudgetUserFindUniqueArgsSchema: z.ZodType<Prisma.BudgetUserFindUniqueArgs> = z.object({
  select: BudgetUserSelectSchema.optional(),
  include: BudgetUserIncludeSchema.optional(),
  where: BudgetUserWhereUniqueInputSchema,
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export const BudgetUserFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.BudgetUserFindUniqueOrThrowArgs> = z.object({
  select: BudgetUserSelectSchema.optional(),
  include: BudgetUserIncludeSchema.optional(),
  where: BudgetUserWhereUniqueInputSchema,
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export const BudgetUserInvitationFindFirstArgsSchema: z.ZodType<Prisma.BudgetUserInvitationFindFirstArgs> = z.object({
  select: BudgetUserInvitationSelectSchema.optional(),
  include: BudgetUserInvitationIncludeSchema.optional(),
  where: BudgetUserInvitationWhereInputSchema.optional(),
  orderBy: z.union([ BudgetUserInvitationOrderByWithRelationInputSchema.array(),BudgetUserInvitationOrderByWithRelationInputSchema ]).optional(),
  cursor: BudgetUserInvitationWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ BudgetUserInvitationScalarFieldEnumSchema,BudgetUserInvitationScalarFieldEnumSchema.array() ]).optional(),
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export const BudgetUserInvitationFindFirstOrThrowArgsSchema: z.ZodType<Prisma.BudgetUserInvitationFindFirstOrThrowArgs> = z.object({
  select: BudgetUserInvitationSelectSchema.optional(),
  include: BudgetUserInvitationIncludeSchema.optional(),
  where: BudgetUserInvitationWhereInputSchema.optional(),
  orderBy: z.union([ BudgetUserInvitationOrderByWithRelationInputSchema.array(),BudgetUserInvitationOrderByWithRelationInputSchema ]).optional(),
  cursor: BudgetUserInvitationWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ BudgetUserInvitationScalarFieldEnumSchema,BudgetUserInvitationScalarFieldEnumSchema.array() ]).optional(),
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export const BudgetUserInvitationFindManyArgsSchema: z.ZodType<Prisma.BudgetUserInvitationFindManyArgs> = z.object({
  select: BudgetUserInvitationSelectSchema.optional(),
  include: BudgetUserInvitationIncludeSchema.optional(),
  where: BudgetUserInvitationWhereInputSchema.optional(),
  orderBy: z.union([ BudgetUserInvitationOrderByWithRelationInputSchema.array(),BudgetUserInvitationOrderByWithRelationInputSchema ]).optional(),
  cursor: BudgetUserInvitationWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ BudgetUserInvitationScalarFieldEnumSchema,BudgetUserInvitationScalarFieldEnumSchema.array() ]).optional(),
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export const BudgetUserInvitationAggregateArgsSchema: z.ZodType<Prisma.BudgetUserInvitationAggregateArgs> = z.object({
  where: BudgetUserInvitationWhereInputSchema.optional(),
  orderBy: z.union([ BudgetUserInvitationOrderByWithRelationInputSchema.array(),BudgetUserInvitationOrderByWithRelationInputSchema ]).optional(),
  cursor: BudgetUserInvitationWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const BudgetUserInvitationGroupByArgsSchema: z.ZodType<Prisma.BudgetUserInvitationGroupByArgs> = z.object({
  where: BudgetUserInvitationWhereInputSchema.optional(),
  orderBy: z.union([ BudgetUserInvitationOrderByWithAggregationInputSchema.array(),BudgetUserInvitationOrderByWithAggregationInputSchema ]).optional(),
  by: BudgetUserInvitationScalarFieldEnumSchema.array(),
  having: BudgetUserInvitationScalarWhereWithAggregatesInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const BudgetUserInvitationFindUniqueArgsSchema: z.ZodType<Prisma.BudgetUserInvitationFindUniqueArgs> = z.object({
  select: BudgetUserInvitationSelectSchema.optional(),
  include: BudgetUserInvitationIncludeSchema.optional(),
  where: BudgetUserInvitationWhereUniqueInputSchema,
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export const BudgetUserInvitationFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.BudgetUserInvitationFindUniqueOrThrowArgs> = z.object({
  select: BudgetUserInvitationSelectSchema.optional(),
  include: BudgetUserInvitationIncludeSchema.optional(),
  where: BudgetUserInvitationWhereUniqueInputSchema,
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export const BudgetUserInvitationResponseFindFirstArgsSchema: z.ZodType<Prisma.BudgetUserInvitationResponseFindFirstArgs> = z.object({
  select: BudgetUserInvitationResponseSelectSchema.optional(),
  include: BudgetUserInvitationResponseIncludeSchema.optional(),
  where: BudgetUserInvitationResponseWhereInputSchema.optional(),
  orderBy: z.union([ BudgetUserInvitationResponseOrderByWithRelationInputSchema.array(),BudgetUserInvitationResponseOrderByWithRelationInputSchema ]).optional(),
  cursor: BudgetUserInvitationResponseWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ BudgetUserInvitationResponseScalarFieldEnumSchema,BudgetUserInvitationResponseScalarFieldEnumSchema.array() ]).optional(),
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export const BudgetUserInvitationResponseFindFirstOrThrowArgsSchema: z.ZodType<Prisma.BudgetUserInvitationResponseFindFirstOrThrowArgs> = z.object({
  select: BudgetUserInvitationResponseSelectSchema.optional(),
  include: BudgetUserInvitationResponseIncludeSchema.optional(),
  where: BudgetUserInvitationResponseWhereInputSchema.optional(),
  orderBy: z.union([ BudgetUserInvitationResponseOrderByWithRelationInputSchema.array(),BudgetUserInvitationResponseOrderByWithRelationInputSchema ]).optional(),
  cursor: BudgetUserInvitationResponseWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ BudgetUserInvitationResponseScalarFieldEnumSchema,BudgetUserInvitationResponseScalarFieldEnumSchema.array() ]).optional(),
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export const BudgetUserInvitationResponseFindManyArgsSchema: z.ZodType<Prisma.BudgetUserInvitationResponseFindManyArgs> = z.object({
  select: BudgetUserInvitationResponseSelectSchema.optional(),
  include: BudgetUserInvitationResponseIncludeSchema.optional(),
  where: BudgetUserInvitationResponseWhereInputSchema.optional(),
  orderBy: z.union([ BudgetUserInvitationResponseOrderByWithRelationInputSchema.array(),BudgetUserInvitationResponseOrderByWithRelationInputSchema ]).optional(),
  cursor: BudgetUserInvitationResponseWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ BudgetUserInvitationResponseScalarFieldEnumSchema,BudgetUserInvitationResponseScalarFieldEnumSchema.array() ]).optional(),
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export const BudgetUserInvitationResponseAggregateArgsSchema: z.ZodType<Prisma.BudgetUserInvitationResponseAggregateArgs> = z.object({
  where: BudgetUserInvitationResponseWhereInputSchema.optional(),
  orderBy: z.union([ BudgetUserInvitationResponseOrderByWithRelationInputSchema.array(),BudgetUserInvitationResponseOrderByWithRelationInputSchema ]).optional(),
  cursor: BudgetUserInvitationResponseWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const BudgetUserInvitationResponseGroupByArgsSchema: z.ZodType<Prisma.BudgetUserInvitationResponseGroupByArgs> = z.object({
  where: BudgetUserInvitationResponseWhereInputSchema.optional(),
  orderBy: z.union([ BudgetUserInvitationResponseOrderByWithAggregationInputSchema.array(),BudgetUserInvitationResponseOrderByWithAggregationInputSchema ]).optional(),
  by: BudgetUserInvitationResponseScalarFieldEnumSchema.array(),
  having: BudgetUserInvitationResponseScalarWhereWithAggregatesInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const BudgetUserInvitationResponseFindUniqueArgsSchema: z.ZodType<Prisma.BudgetUserInvitationResponseFindUniqueArgs> = z.object({
  select: BudgetUserInvitationResponseSelectSchema.optional(),
  include: BudgetUserInvitationResponseIncludeSchema.optional(),
  where: BudgetUserInvitationResponseWhereUniqueInputSchema,
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export const BudgetUserInvitationResponseFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.BudgetUserInvitationResponseFindUniqueOrThrowArgs> = z.object({
  select: BudgetUserInvitationResponseSelectSchema.optional(),
  include: BudgetUserInvitationResponseIncludeSchema.optional(),
  where: BudgetUserInvitationResponseWhereUniqueInputSchema,
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export const TransactionFindFirstArgsSchema: z.ZodType<Prisma.TransactionFindFirstArgs> = z.object({
  select: TransactionSelectSchema.optional(),
  include: TransactionIncludeSchema.optional(),
  where: TransactionWhereInputSchema.optional(),
  orderBy: z.union([ TransactionOrderByWithRelationInputSchema.array(),TransactionOrderByWithRelationInputSchema ]).optional(),
  cursor: TransactionWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ TransactionScalarFieldEnumSchema,TransactionScalarFieldEnumSchema.array() ]).optional(),
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export const TransactionFindFirstOrThrowArgsSchema: z.ZodType<Prisma.TransactionFindFirstOrThrowArgs> = z.object({
  select: TransactionSelectSchema.optional(),
  include: TransactionIncludeSchema.optional(),
  where: TransactionWhereInputSchema.optional(),
  orderBy: z.union([ TransactionOrderByWithRelationInputSchema.array(),TransactionOrderByWithRelationInputSchema ]).optional(),
  cursor: TransactionWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ TransactionScalarFieldEnumSchema,TransactionScalarFieldEnumSchema.array() ]).optional(),
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export const TransactionFindManyArgsSchema: z.ZodType<Prisma.TransactionFindManyArgs> = z.object({
  select: TransactionSelectSchema.optional(),
  include: TransactionIncludeSchema.optional(),
  where: TransactionWhereInputSchema.optional(),
  orderBy: z.union([ TransactionOrderByWithRelationInputSchema.array(),TransactionOrderByWithRelationInputSchema ]).optional(),
  cursor: TransactionWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ TransactionScalarFieldEnumSchema,TransactionScalarFieldEnumSchema.array() ]).optional(),
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export const TransactionAggregateArgsSchema: z.ZodType<Prisma.TransactionAggregateArgs> = z.object({
  where: TransactionWhereInputSchema.optional(),
  orderBy: z.union([ TransactionOrderByWithRelationInputSchema.array(),TransactionOrderByWithRelationInputSchema ]).optional(),
  cursor: TransactionWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const TransactionGroupByArgsSchema: z.ZodType<Prisma.TransactionGroupByArgs> = z.object({
  where: TransactionWhereInputSchema.optional(),
  orderBy: z.union([ TransactionOrderByWithAggregationInputSchema.array(),TransactionOrderByWithAggregationInputSchema ]).optional(),
  by: TransactionScalarFieldEnumSchema.array(),
  having: TransactionScalarWhereWithAggregatesInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const TransactionFindUniqueArgsSchema: z.ZodType<Prisma.TransactionFindUniqueArgs> = z.object({
  select: TransactionSelectSchema.optional(),
  include: TransactionIncludeSchema.optional(),
  where: TransactionWhereUniqueInputSchema,
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export const TransactionFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.TransactionFindUniqueOrThrowArgs> = z.object({
  select: TransactionSelectSchema.optional(),
  include: TransactionIncludeSchema.optional(),
  where: TransactionWhereUniqueInputSchema,
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export const CategoryFindFirstArgsSchema: z.ZodType<Prisma.CategoryFindFirstArgs> = z.object({
  select: CategorySelectSchema.optional(),
  include: CategoryIncludeSchema.optional(),
  where: CategoryWhereInputSchema.optional(),
  orderBy: z.union([ CategoryOrderByWithRelationInputSchema.array(),CategoryOrderByWithRelationInputSchema ]).optional(),
  cursor: CategoryWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ CategoryScalarFieldEnumSchema,CategoryScalarFieldEnumSchema.array() ]).optional(),
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export const CategoryFindFirstOrThrowArgsSchema: z.ZodType<Prisma.CategoryFindFirstOrThrowArgs> = z.object({
  select: CategorySelectSchema.optional(),
  include: CategoryIncludeSchema.optional(),
  where: CategoryWhereInputSchema.optional(),
  orderBy: z.union([ CategoryOrderByWithRelationInputSchema.array(),CategoryOrderByWithRelationInputSchema ]).optional(),
  cursor: CategoryWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ CategoryScalarFieldEnumSchema,CategoryScalarFieldEnumSchema.array() ]).optional(),
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export const CategoryFindManyArgsSchema: z.ZodType<Prisma.CategoryFindManyArgs> = z.object({
  select: CategorySelectSchema.optional(),
  include: CategoryIncludeSchema.optional(),
  where: CategoryWhereInputSchema.optional(),
  orderBy: z.union([ CategoryOrderByWithRelationInputSchema.array(),CategoryOrderByWithRelationInputSchema ]).optional(),
  cursor: CategoryWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ CategoryScalarFieldEnumSchema,CategoryScalarFieldEnumSchema.array() ]).optional(),
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export const CategoryAggregateArgsSchema: z.ZodType<Prisma.CategoryAggregateArgs> = z.object({
  where: CategoryWhereInputSchema.optional(),
  orderBy: z.union([ CategoryOrderByWithRelationInputSchema.array(),CategoryOrderByWithRelationInputSchema ]).optional(),
  cursor: CategoryWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const CategoryGroupByArgsSchema: z.ZodType<Prisma.CategoryGroupByArgs> = z.object({
  where: CategoryWhereInputSchema.optional(),
  orderBy: z.union([ CategoryOrderByWithAggregationInputSchema.array(),CategoryOrderByWithAggregationInputSchema ]).optional(),
  by: CategoryScalarFieldEnumSchema.array(),
  having: CategoryScalarWhereWithAggregatesInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const CategoryFindUniqueArgsSchema: z.ZodType<Prisma.CategoryFindUniqueArgs> = z.object({
  select: CategorySelectSchema.optional(),
  include: CategoryIncludeSchema.optional(),
  where: CategoryWhereUniqueInputSchema,
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export const CategoryFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.CategoryFindUniqueOrThrowArgs> = z.object({
  select: CategorySelectSchema.optional(),
  include: CategoryIncludeSchema.optional(),
  where: CategoryWhereUniqueInputSchema,
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export const CachedGptResponseFindFirstArgsSchema: z.ZodType<Prisma.CachedGptResponseFindFirstArgs> = z.object({
  select: CachedGptResponseSelectSchema.optional(),
  where: CachedGptResponseWhereInputSchema.optional(),
  orderBy: z.union([ CachedGptResponseOrderByWithRelationInputSchema.array(),CachedGptResponseOrderByWithRelationInputSchema ]).optional(),
  cursor: CachedGptResponseWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ CachedGptResponseScalarFieldEnumSchema,CachedGptResponseScalarFieldEnumSchema.array() ]).optional(),
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export const CachedGptResponseFindFirstOrThrowArgsSchema: z.ZodType<Prisma.CachedGptResponseFindFirstOrThrowArgs> = z.object({
  select: CachedGptResponseSelectSchema.optional(),
  where: CachedGptResponseWhereInputSchema.optional(),
  orderBy: z.union([ CachedGptResponseOrderByWithRelationInputSchema.array(),CachedGptResponseOrderByWithRelationInputSchema ]).optional(),
  cursor: CachedGptResponseWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ CachedGptResponseScalarFieldEnumSchema,CachedGptResponseScalarFieldEnumSchema.array() ]).optional(),
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export const CachedGptResponseFindManyArgsSchema: z.ZodType<Prisma.CachedGptResponseFindManyArgs> = z.object({
  select: CachedGptResponseSelectSchema.optional(),
  where: CachedGptResponseWhereInputSchema.optional(),
  orderBy: z.union([ CachedGptResponseOrderByWithRelationInputSchema.array(),CachedGptResponseOrderByWithRelationInputSchema ]).optional(),
  cursor: CachedGptResponseWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ CachedGptResponseScalarFieldEnumSchema,CachedGptResponseScalarFieldEnumSchema.array() ]).optional(),
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export const CachedGptResponseAggregateArgsSchema: z.ZodType<Prisma.CachedGptResponseAggregateArgs> = z.object({
  where: CachedGptResponseWhereInputSchema.optional(),
  orderBy: z.union([ CachedGptResponseOrderByWithRelationInputSchema.array(),CachedGptResponseOrderByWithRelationInputSchema ]).optional(),
  cursor: CachedGptResponseWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const CachedGptResponseGroupByArgsSchema: z.ZodType<Prisma.CachedGptResponseGroupByArgs> = z.object({
  where: CachedGptResponseWhereInputSchema.optional(),
  orderBy: z.union([ CachedGptResponseOrderByWithAggregationInputSchema.array(),CachedGptResponseOrderByWithAggregationInputSchema ]).optional(),
  by: CachedGptResponseScalarFieldEnumSchema.array(),
  having: CachedGptResponseScalarWhereWithAggregatesInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const CachedGptResponseFindUniqueArgsSchema: z.ZodType<Prisma.CachedGptResponseFindUniqueArgs> = z.object({
  select: CachedGptResponseSelectSchema.optional(),
  where: CachedGptResponseWhereUniqueInputSchema,
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export const CachedGptResponseFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.CachedGptResponseFindUniqueOrThrowArgs> = z.object({
  select: CachedGptResponseSelectSchema.optional(),
  where: CachedGptResponseWhereUniqueInputSchema,
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export const CurrencyExchangeRateFindFirstArgsSchema: z.ZodType<Prisma.CurrencyExchangeRateFindFirstArgs> = z.object({
  select: CurrencyExchangeRateSelectSchema.optional(),
  where: CurrencyExchangeRateWhereInputSchema.optional(),
  orderBy: z.union([ CurrencyExchangeRateOrderByWithRelationInputSchema.array(),CurrencyExchangeRateOrderByWithRelationInputSchema ]).optional(),
  cursor: CurrencyExchangeRateWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ CurrencyExchangeRateScalarFieldEnumSchema,CurrencyExchangeRateScalarFieldEnumSchema.array() ]).optional(),
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export const CurrencyExchangeRateFindFirstOrThrowArgsSchema: z.ZodType<Prisma.CurrencyExchangeRateFindFirstOrThrowArgs> = z.object({
  select: CurrencyExchangeRateSelectSchema.optional(),
  where: CurrencyExchangeRateWhereInputSchema.optional(),
  orderBy: z.union([ CurrencyExchangeRateOrderByWithRelationInputSchema.array(),CurrencyExchangeRateOrderByWithRelationInputSchema ]).optional(),
  cursor: CurrencyExchangeRateWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ CurrencyExchangeRateScalarFieldEnumSchema,CurrencyExchangeRateScalarFieldEnumSchema.array() ]).optional(),
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export const CurrencyExchangeRateFindManyArgsSchema: z.ZodType<Prisma.CurrencyExchangeRateFindManyArgs> = z.object({
  select: CurrencyExchangeRateSelectSchema.optional(),
  where: CurrencyExchangeRateWhereInputSchema.optional(),
  orderBy: z.union([ CurrencyExchangeRateOrderByWithRelationInputSchema.array(),CurrencyExchangeRateOrderByWithRelationInputSchema ]).optional(),
  cursor: CurrencyExchangeRateWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ CurrencyExchangeRateScalarFieldEnumSchema,CurrencyExchangeRateScalarFieldEnumSchema.array() ]).optional(),
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export const CurrencyExchangeRateAggregateArgsSchema: z.ZodType<Prisma.CurrencyExchangeRateAggregateArgs> = z.object({
  where: CurrencyExchangeRateWhereInputSchema.optional(),
  orderBy: z.union([ CurrencyExchangeRateOrderByWithRelationInputSchema.array(),CurrencyExchangeRateOrderByWithRelationInputSchema ]).optional(),
  cursor: CurrencyExchangeRateWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const CurrencyExchangeRateGroupByArgsSchema: z.ZodType<Prisma.CurrencyExchangeRateGroupByArgs> = z.object({
  where: CurrencyExchangeRateWhereInputSchema.optional(),
  orderBy: z.union([ CurrencyExchangeRateOrderByWithAggregationInputSchema.array(),CurrencyExchangeRateOrderByWithAggregationInputSchema ]).optional(),
  by: CurrencyExchangeRateScalarFieldEnumSchema.array(),
  having: CurrencyExchangeRateScalarWhereWithAggregatesInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const CurrencyExchangeRateFindUniqueArgsSchema: z.ZodType<Prisma.CurrencyExchangeRateFindUniqueArgs> = z.object({
  select: CurrencyExchangeRateSelectSchema.optional(),
  where: CurrencyExchangeRateWhereUniqueInputSchema,
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export const CurrencyExchangeRateFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.CurrencyExchangeRateFindUniqueOrThrowArgs> = z.object({
  select: CurrencyExchangeRateSelectSchema.optional(),
  where: CurrencyExchangeRateWhereUniqueInputSchema,
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export const UserCreateArgsSchema: z.ZodType<Prisma.UserCreateArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  data: z.union([ UserCreateInputSchema,UserUncheckedCreateInputSchema ]),
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export const UserUpsertArgsSchema: z.ZodType<Prisma.UserUpsertArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  where: UserWhereUniqueInputSchema,
  create: z.union([ UserCreateInputSchema,UserUncheckedCreateInputSchema ]),
  update: z.union([ UserUpdateInputSchema,UserUncheckedUpdateInputSchema ]),
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export const UserCreateManyArgsSchema: z.ZodType<Prisma.UserCreateManyArgs> = z.object({
  data: z.union([ UserCreateManyInputSchema,UserCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export const UserCreateManyAndReturnArgsSchema: z.ZodType<Prisma.UserCreateManyAndReturnArgs> = z.object({
  data: z.union([ UserCreateManyInputSchema,UserCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export const UserDeleteArgsSchema: z.ZodType<Prisma.UserDeleteArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  where: UserWhereUniqueInputSchema,
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export const UserUpdateArgsSchema: z.ZodType<Prisma.UserUpdateArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  data: z.union([ UserUpdateInputSchema,UserUncheckedUpdateInputSchema ]),
  where: UserWhereUniqueInputSchema,
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export const UserUpdateManyArgsSchema: z.ZodType<Prisma.UserUpdateManyArgs> = z.object({
  data: z.union([ UserUpdateManyMutationInputSchema,UserUncheckedUpdateManyInputSchema ]),
  where: UserWhereInputSchema.optional(),
}).strict() ;

export const UserDeleteManyArgsSchema: z.ZodType<Prisma.UserDeleteManyArgs> = z.object({
  where: UserWhereInputSchema.optional(),
}).strict() ;

export const UserWalletAccountCreateArgsSchema: z.ZodType<Prisma.UserWalletAccountCreateArgs> = z.object({
  select: UserWalletAccountSelectSchema.optional(),
  include: UserWalletAccountIncludeSchema.optional(),
  data: z.union([ UserWalletAccountCreateInputSchema,UserWalletAccountUncheckedCreateInputSchema ]),
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export const UserWalletAccountUpsertArgsSchema: z.ZodType<Prisma.UserWalletAccountUpsertArgs> = z.object({
  select: UserWalletAccountSelectSchema.optional(),
  include: UserWalletAccountIncludeSchema.optional(),
  where: UserWalletAccountWhereUniqueInputSchema,
  create: z.union([ UserWalletAccountCreateInputSchema,UserWalletAccountUncheckedCreateInputSchema ]),
  update: z.union([ UserWalletAccountUpdateInputSchema,UserWalletAccountUncheckedUpdateInputSchema ]),
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export const UserWalletAccountCreateManyArgsSchema: z.ZodType<Prisma.UserWalletAccountCreateManyArgs> = z.object({
  data: z.union([ UserWalletAccountCreateManyInputSchema,UserWalletAccountCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export const UserWalletAccountCreateManyAndReturnArgsSchema: z.ZodType<Prisma.UserWalletAccountCreateManyAndReturnArgs> = z.object({
  data: z.union([ UserWalletAccountCreateManyInputSchema,UserWalletAccountCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export const UserWalletAccountDeleteArgsSchema: z.ZodType<Prisma.UserWalletAccountDeleteArgs> = z.object({
  select: UserWalletAccountSelectSchema.optional(),
  include: UserWalletAccountIncludeSchema.optional(),
  where: UserWalletAccountWhereUniqueInputSchema,
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export const UserWalletAccountUpdateArgsSchema: z.ZodType<Prisma.UserWalletAccountUpdateArgs> = z.object({
  select: UserWalletAccountSelectSchema.optional(),
  include: UserWalletAccountIncludeSchema.optional(),
  data: z.union([ UserWalletAccountUpdateInputSchema,UserWalletAccountUncheckedUpdateInputSchema ]),
  where: UserWalletAccountWhereUniqueInputSchema,
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export const UserWalletAccountUpdateManyArgsSchema: z.ZodType<Prisma.UserWalletAccountUpdateManyArgs> = z.object({
  data: z.union([ UserWalletAccountUpdateManyMutationInputSchema,UserWalletAccountUncheckedUpdateManyInputSchema ]),
  where: UserWalletAccountWhereInputSchema.optional(),
}).strict() ;

export const UserWalletAccountDeleteManyArgsSchema: z.ZodType<Prisma.UserWalletAccountDeleteManyArgs> = z.object({
  where: UserWalletAccountWhereInputSchema.optional(),
}).strict() ;

export const BudgetCreateArgsSchema: z.ZodType<Prisma.BudgetCreateArgs> = z.object({
  select: BudgetSelectSchema.optional(),
  include: BudgetIncludeSchema.optional(),
  data: z.union([ BudgetCreateInputSchema,BudgetUncheckedCreateInputSchema ]),
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export const BudgetUpsertArgsSchema: z.ZodType<Prisma.BudgetUpsertArgs> = z.object({
  select: BudgetSelectSchema.optional(),
  include: BudgetIncludeSchema.optional(),
  where: BudgetWhereUniqueInputSchema,
  create: z.union([ BudgetCreateInputSchema,BudgetUncheckedCreateInputSchema ]),
  update: z.union([ BudgetUpdateInputSchema,BudgetUncheckedUpdateInputSchema ]),
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export const BudgetCreateManyArgsSchema: z.ZodType<Prisma.BudgetCreateManyArgs> = z.object({
  data: z.union([ BudgetCreateManyInputSchema,BudgetCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export const BudgetCreateManyAndReturnArgsSchema: z.ZodType<Prisma.BudgetCreateManyAndReturnArgs> = z.object({
  data: z.union([ BudgetCreateManyInputSchema,BudgetCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export const BudgetDeleteArgsSchema: z.ZodType<Prisma.BudgetDeleteArgs> = z.object({
  select: BudgetSelectSchema.optional(),
  include: BudgetIncludeSchema.optional(),
  where: BudgetWhereUniqueInputSchema,
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export const BudgetUpdateArgsSchema: z.ZodType<Prisma.BudgetUpdateArgs> = z.object({
  select: BudgetSelectSchema.optional(),
  include: BudgetIncludeSchema.optional(),
  data: z.union([ BudgetUpdateInputSchema,BudgetUncheckedUpdateInputSchema ]),
  where: BudgetWhereUniqueInputSchema,
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export const BudgetUpdateManyArgsSchema: z.ZodType<Prisma.BudgetUpdateManyArgs> = z.object({
  data: z.union([ BudgetUpdateManyMutationInputSchema,BudgetUncheckedUpdateManyInputSchema ]),
  where: BudgetWhereInputSchema.optional(),
}).strict() ;

export const BudgetDeleteManyArgsSchema: z.ZodType<Prisma.BudgetDeleteManyArgs> = z.object({
  where: BudgetWhereInputSchema.optional(),
}).strict() ;

export const BudgetPeriodConfigCreateArgsSchema: z.ZodType<Prisma.BudgetPeriodConfigCreateArgs> = z.object({
  select: BudgetPeriodConfigSelectSchema.optional(),
  include: BudgetPeriodConfigIncludeSchema.optional(),
  data: z.union([ BudgetPeriodConfigCreateInputSchema,BudgetPeriodConfigUncheckedCreateInputSchema ]),
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export const BudgetPeriodConfigUpsertArgsSchema: z.ZodType<Prisma.BudgetPeriodConfigUpsertArgs> = z.object({
  select: BudgetPeriodConfigSelectSchema.optional(),
  include: BudgetPeriodConfigIncludeSchema.optional(),
  where: BudgetPeriodConfigWhereUniqueInputSchema,
  create: z.union([ BudgetPeriodConfigCreateInputSchema,BudgetPeriodConfigUncheckedCreateInputSchema ]),
  update: z.union([ BudgetPeriodConfigUpdateInputSchema,BudgetPeriodConfigUncheckedUpdateInputSchema ]),
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export const BudgetPeriodConfigCreateManyArgsSchema: z.ZodType<Prisma.BudgetPeriodConfigCreateManyArgs> = z.object({
  data: z.union([ BudgetPeriodConfigCreateManyInputSchema,BudgetPeriodConfigCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export const BudgetPeriodConfigCreateManyAndReturnArgsSchema: z.ZodType<Prisma.BudgetPeriodConfigCreateManyAndReturnArgs> = z.object({
  data: z.union([ BudgetPeriodConfigCreateManyInputSchema,BudgetPeriodConfigCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export const BudgetPeriodConfigDeleteArgsSchema: z.ZodType<Prisma.BudgetPeriodConfigDeleteArgs> = z.object({
  select: BudgetPeriodConfigSelectSchema.optional(),
  include: BudgetPeriodConfigIncludeSchema.optional(),
  where: BudgetPeriodConfigWhereUniqueInputSchema,
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export const BudgetPeriodConfigUpdateArgsSchema: z.ZodType<Prisma.BudgetPeriodConfigUpdateArgs> = z.object({
  select: BudgetPeriodConfigSelectSchema.optional(),
  include: BudgetPeriodConfigIncludeSchema.optional(),
  data: z.union([ BudgetPeriodConfigUpdateInputSchema,BudgetPeriodConfigUncheckedUpdateInputSchema ]),
  where: BudgetPeriodConfigWhereUniqueInputSchema,
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export const BudgetPeriodConfigUpdateManyArgsSchema: z.ZodType<Prisma.BudgetPeriodConfigUpdateManyArgs> = z.object({
  data: z.union([ BudgetPeriodConfigUpdateManyMutationInputSchema,BudgetPeriodConfigUncheckedUpdateManyInputSchema ]),
  where: BudgetPeriodConfigWhereInputSchema.optional(),
}).strict() ;

export const BudgetPeriodConfigDeleteManyArgsSchema: z.ZodType<Prisma.BudgetPeriodConfigDeleteManyArgs> = z.object({
  where: BudgetPeriodConfigWhereInputSchema.optional(),
}).strict() ;

export const BudgetUserCreateArgsSchema: z.ZodType<Prisma.BudgetUserCreateArgs> = z.object({
  select: BudgetUserSelectSchema.optional(),
  include: BudgetUserIncludeSchema.optional(),
  data: z.union([ BudgetUserCreateInputSchema,BudgetUserUncheckedCreateInputSchema ]),
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export const BudgetUserUpsertArgsSchema: z.ZodType<Prisma.BudgetUserUpsertArgs> = z.object({
  select: BudgetUserSelectSchema.optional(),
  include: BudgetUserIncludeSchema.optional(),
  where: BudgetUserWhereUniqueInputSchema,
  create: z.union([ BudgetUserCreateInputSchema,BudgetUserUncheckedCreateInputSchema ]),
  update: z.union([ BudgetUserUpdateInputSchema,BudgetUserUncheckedUpdateInputSchema ]),
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export const BudgetUserCreateManyArgsSchema: z.ZodType<Prisma.BudgetUserCreateManyArgs> = z.object({
  data: z.union([ BudgetUserCreateManyInputSchema,BudgetUserCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export const BudgetUserCreateManyAndReturnArgsSchema: z.ZodType<Prisma.BudgetUserCreateManyAndReturnArgs> = z.object({
  data: z.union([ BudgetUserCreateManyInputSchema,BudgetUserCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export const BudgetUserDeleteArgsSchema: z.ZodType<Prisma.BudgetUserDeleteArgs> = z.object({
  select: BudgetUserSelectSchema.optional(),
  include: BudgetUserIncludeSchema.optional(),
  where: BudgetUserWhereUniqueInputSchema,
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export const BudgetUserUpdateArgsSchema: z.ZodType<Prisma.BudgetUserUpdateArgs> = z.object({
  select: BudgetUserSelectSchema.optional(),
  include: BudgetUserIncludeSchema.optional(),
  data: z.union([ BudgetUserUpdateInputSchema,BudgetUserUncheckedUpdateInputSchema ]),
  where: BudgetUserWhereUniqueInputSchema,
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export const BudgetUserUpdateManyArgsSchema: z.ZodType<Prisma.BudgetUserUpdateManyArgs> = z.object({
  data: z.union([ BudgetUserUpdateManyMutationInputSchema,BudgetUserUncheckedUpdateManyInputSchema ]),
  where: BudgetUserWhereInputSchema.optional(),
}).strict() ;

export const BudgetUserDeleteManyArgsSchema: z.ZodType<Prisma.BudgetUserDeleteManyArgs> = z.object({
  where: BudgetUserWhereInputSchema.optional(),
}).strict() ;

export const BudgetUserInvitationCreateArgsSchema: z.ZodType<Prisma.BudgetUserInvitationCreateArgs> = z.object({
  select: BudgetUserInvitationSelectSchema.optional(),
  include: BudgetUserInvitationIncludeSchema.optional(),
  data: z.union([ BudgetUserInvitationCreateInputSchema,BudgetUserInvitationUncheckedCreateInputSchema ]),
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export const BudgetUserInvitationUpsertArgsSchema: z.ZodType<Prisma.BudgetUserInvitationUpsertArgs> = z.object({
  select: BudgetUserInvitationSelectSchema.optional(),
  include: BudgetUserInvitationIncludeSchema.optional(),
  where: BudgetUserInvitationWhereUniqueInputSchema,
  create: z.union([ BudgetUserInvitationCreateInputSchema,BudgetUserInvitationUncheckedCreateInputSchema ]),
  update: z.union([ BudgetUserInvitationUpdateInputSchema,BudgetUserInvitationUncheckedUpdateInputSchema ]),
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export const BudgetUserInvitationCreateManyArgsSchema: z.ZodType<Prisma.BudgetUserInvitationCreateManyArgs> = z.object({
  data: z.union([ BudgetUserInvitationCreateManyInputSchema,BudgetUserInvitationCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export const BudgetUserInvitationCreateManyAndReturnArgsSchema: z.ZodType<Prisma.BudgetUserInvitationCreateManyAndReturnArgs> = z.object({
  data: z.union([ BudgetUserInvitationCreateManyInputSchema,BudgetUserInvitationCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export const BudgetUserInvitationDeleteArgsSchema: z.ZodType<Prisma.BudgetUserInvitationDeleteArgs> = z.object({
  select: BudgetUserInvitationSelectSchema.optional(),
  include: BudgetUserInvitationIncludeSchema.optional(),
  where: BudgetUserInvitationWhereUniqueInputSchema,
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export const BudgetUserInvitationUpdateArgsSchema: z.ZodType<Prisma.BudgetUserInvitationUpdateArgs> = z.object({
  select: BudgetUserInvitationSelectSchema.optional(),
  include: BudgetUserInvitationIncludeSchema.optional(),
  data: z.union([ BudgetUserInvitationUpdateInputSchema,BudgetUserInvitationUncheckedUpdateInputSchema ]),
  where: BudgetUserInvitationWhereUniqueInputSchema,
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export const BudgetUserInvitationUpdateManyArgsSchema: z.ZodType<Prisma.BudgetUserInvitationUpdateManyArgs> = z.object({
  data: z.union([ BudgetUserInvitationUpdateManyMutationInputSchema,BudgetUserInvitationUncheckedUpdateManyInputSchema ]),
  where: BudgetUserInvitationWhereInputSchema.optional(),
}).strict() ;

export const BudgetUserInvitationDeleteManyArgsSchema: z.ZodType<Prisma.BudgetUserInvitationDeleteManyArgs> = z.object({
  where: BudgetUserInvitationWhereInputSchema.optional(),
}).strict() ;

export const BudgetUserInvitationResponseCreateArgsSchema: z.ZodType<Prisma.BudgetUserInvitationResponseCreateArgs> = z.object({
  select: BudgetUserInvitationResponseSelectSchema.optional(),
  include: BudgetUserInvitationResponseIncludeSchema.optional(),
  data: z.union([ BudgetUserInvitationResponseCreateInputSchema,BudgetUserInvitationResponseUncheckedCreateInputSchema ]),
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export const BudgetUserInvitationResponseUpsertArgsSchema: z.ZodType<Prisma.BudgetUserInvitationResponseUpsertArgs> = z.object({
  select: BudgetUserInvitationResponseSelectSchema.optional(),
  include: BudgetUserInvitationResponseIncludeSchema.optional(),
  where: BudgetUserInvitationResponseWhereUniqueInputSchema,
  create: z.union([ BudgetUserInvitationResponseCreateInputSchema,BudgetUserInvitationResponseUncheckedCreateInputSchema ]),
  update: z.union([ BudgetUserInvitationResponseUpdateInputSchema,BudgetUserInvitationResponseUncheckedUpdateInputSchema ]),
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export const BudgetUserInvitationResponseCreateManyArgsSchema: z.ZodType<Prisma.BudgetUserInvitationResponseCreateManyArgs> = z.object({
  data: z.union([ BudgetUserInvitationResponseCreateManyInputSchema,BudgetUserInvitationResponseCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export const BudgetUserInvitationResponseCreateManyAndReturnArgsSchema: z.ZodType<Prisma.BudgetUserInvitationResponseCreateManyAndReturnArgs> = z.object({
  data: z.union([ BudgetUserInvitationResponseCreateManyInputSchema,BudgetUserInvitationResponseCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export const BudgetUserInvitationResponseDeleteArgsSchema: z.ZodType<Prisma.BudgetUserInvitationResponseDeleteArgs> = z.object({
  select: BudgetUserInvitationResponseSelectSchema.optional(),
  include: BudgetUserInvitationResponseIncludeSchema.optional(),
  where: BudgetUserInvitationResponseWhereUniqueInputSchema,
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export const BudgetUserInvitationResponseUpdateArgsSchema: z.ZodType<Prisma.BudgetUserInvitationResponseUpdateArgs> = z.object({
  select: BudgetUserInvitationResponseSelectSchema.optional(),
  include: BudgetUserInvitationResponseIncludeSchema.optional(),
  data: z.union([ BudgetUserInvitationResponseUpdateInputSchema,BudgetUserInvitationResponseUncheckedUpdateInputSchema ]),
  where: BudgetUserInvitationResponseWhereUniqueInputSchema,
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export const BudgetUserInvitationResponseUpdateManyArgsSchema: z.ZodType<Prisma.BudgetUserInvitationResponseUpdateManyArgs> = z.object({
  data: z.union([ BudgetUserInvitationResponseUpdateManyMutationInputSchema,BudgetUserInvitationResponseUncheckedUpdateManyInputSchema ]),
  where: BudgetUserInvitationResponseWhereInputSchema.optional(),
}).strict() ;

export const BudgetUserInvitationResponseDeleteManyArgsSchema: z.ZodType<Prisma.BudgetUserInvitationResponseDeleteManyArgs> = z.object({
  where: BudgetUserInvitationResponseWhereInputSchema.optional(),
}).strict() ;

export const TransactionCreateArgsSchema: z.ZodType<Prisma.TransactionCreateArgs> = z.object({
  select: TransactionSelectSchema.optional(),
  include: TransactionIncludeSchema.optional(),
  data: z.union([ TransactionCreateInputSchema,TransactionUncheckedCreateInputSchema ]),
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export const TransactionUpsertArgsSchema: z.ZodType<Prisma.TransactionUpsertArgs> = z.object({
  select: TransactionSelectSchema.optional(),
  include: TransactionIncludeSchema.optional(),
  where: TransactionWhereUniqueInputSchema,
  create: z.union([ TransactionCreateInputSchema,TransactionUncheckedCreateInputSchema ]),
  update: z.union([ TransactionUpdateInputSchema,TransactionUncheckedUpdateInputSchema ]),
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export const TransactionCreateManyArgsSchema: z.ZodType<Prisma.TransactionCreateManyArgs> = z.object({
  data: z.union([ TransactionCreateManyInputSchema,TransactionCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export const TransactionCreateManyAndReturnArgsSchema: z.ZodType<Prisma.TransactionCreateManyAndReturnArgs> = z.object({
  data: z.union([ TransactionCreateManyInputSchema,TransactionCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export const TransactionDeleteArgsSchema: z.ZodType<Prisma.TransactionDeleteArgs> = z.object({
  select: TransactionSelectSchema.optional(),
  include: TransactionIncludeSchema.optional(),
  where: TransactionWhereUniqueInputSchema,
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export const TransactionUpdateArgsSchema: z.ZodType<Prisma.TransactionUpdateArgs> = z.object({
  select: TransactionSelectSchema.optional(),
  include: TransactionIncludeSchema.optional(),
  data: z.union([ TransactionUpdateInputSchema,TransactionUncheckedUpdateInputSchema ]),
  where: TransactionWhereUniqueInputSchema,
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export const TransactionUpdateManyArgsSchema: z.ZodType<Prisma.TransactionUpdateManyArgs> = z.object({
  data: z.union([ TransactionUpdateManyMutationInputSchema,TransactionUncheckedUpdateManyInputSchema ]),
  where: TransactionWhereInputSchema.optional(),
}).strict() ;

export const TransactionDeleteManyArgsSchema: z.ZodType<Prisma.TransactionDeleteManyArgs> = z.object({
  where: TransactionWhereInputSchema.optional(),
}).strict() ;

export const CategoryCreateArgsSchema: z.ZodType<Prisma.CategoryCreateArgs> = z.object({
  select: CategorySelectSchema.optional(),
  include: CategoryIncludeSchema.optional(),
  data: z.union([ CategoryCreateInputSchema,CategoryUncheckedCreateInputSchema ]),
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export const CategoryUpsertArgsSchema: z.ZodType<Prisma.CategoryUpsertArgs> = z.object({
  select: CategorySelectSchema.optional(),
  include: CategoryIncludeSchema.optional(),
  where: CategoryWhereUniqueInputSchema,
  create: z.union([ CategoryCreateInputSchema,CategoryUncheckedCreateInputSchema ]),
  update: z.union([ CategoryUpdateInputSchema,CategoryUncheckedUpdateInputSchema ]),
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export const CategoryCreateManyArgsSchema: z.ZodType<Prisma.CategoryCreateManyArgs> = z.object({
  data: z.union([ CategoryCreateManyInputSchema,CategoryCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export const CategoryCreateManyAndReturnArgsSchema: z.ZodType<Prisma.CategoryCreateManyAndReturnArgs> = z.object({
  data: z.union([ CategoryCreateManyInputSchema,CategoryCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export const CategoryDeleteArgsSchema: z.ZodType<Prisma.CategoryDeleteArgs> = z.object({
  select: CategorySelectSchema.optional(),
  include: CategoryIncludeSchema.optional(),
  where: CategoryWhereUniqueInputSchema,
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export const CategoryUpdateArgsSchema: z.ZodType<Prisma.CategoryUpdateArgs> = z.object({
  select: CategorySelectSchema.optional(),
  include: CategoryIncludeSchema.optional(),
  data: z.union([ CategoryUpdateInputSchema,CategoryUncheckedUpdateInputSchema ]),
  where: CategoryWhereUniqueInputSchema,
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export const CategoryUpdateManyArgsSchema: z.ZodType<Prisma.CategoryUpdateManyArgs> = z.object({
  data: z.union([ CategoryUpdateManyMutationInputSchema,CategoryUncheckedUpdateManyInputSchema ]),
  where: CategoryWhereInputSchema.optional(),
}).strict() ;

export const CategoryDeleteManyArgsSchema: z.ZodType<Prisma.CategoryDeleteManyArgs> = z.object({
  where: CategoryWhereInputSchema.optional(),
}).strict() ;

export const CachedGptResponseCreateArgsSchema: z.ZodType<Prisma.CachedGptResponseCreateArgs> = z.object({
  select: CachedGptResponseSelectSchema.optional(),
  data: z.union([ CachedGptResponseCreateInputSchema,CachedGptResponseUncheckedCreateInputSchema ]),
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export const CachedGptResponseUpsertArgsSchema: z.ZodType<Prisma.CachedGptResponseUpsertArgs> = z.object({
  select: CachedGptResponseSelectSchema.optional(),
  where: CachedGptResponseWhereUniqueInputSchema,
  create: z.union([ CachedGptResponseCreateInputSchema,CachedGptResponseUncheckedCreateInputSchema ]),
  update: z.union([ CachedGptResponseUpdateInputSchema,CachedGptResponseUncheckedUpdateInputSchema ]),
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export const CachedGptResponseCreateManyArgsSchema: z.ZodType<Prisma.CachedGptResponseCreateManyArgs> = z.object({
  data: z.union([ CachedGptResponseCreateManyInputSchema,CachedGptResponseCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export const CachedGptResponseCreateManyAndReturnArgsSchema: z.ZodType<Prisma.CachedGptResponseCreateManyAndReturnArgs> = z.object({
  data: z.union([ CachedGptResponseCreateManyInputSchema,CachedGptResponseCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export const CachedGptResponseDeleteArgsSchema: z.ZodType<Prisma.CachedGptResponseDeleteArgs> = z.object({
  select: CachedGptResponseSelectSchema.optional(),
  where: CachedGptResponseWhereUniqueInputSchema,
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export const CachedGptResponseUpdateArgsSchema: z.ZodType<Prisma.CachedGptResponseUpdateArgs> = z.object({
  select: CachedGptResponseSelectSchema.optional(),
  data: z.union([ CachedGptResponseUpdateInputSchema,CachedGptResponseUncheckedUpdateInputSchema ]),
  where: CachedGptResponseWhereUniqueInputSchema,
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export const CachedGptResponseUpdateManyArgsSchema: z.ZodType<Prisma.CachedGptResponseUpdateManyArgs> = z.object({
  data: z.union([ CachedGptResponseUpdateManyMutationInputSchema,CachedGptResponseUncheckedUpdateManyInputSchema ]),
  where: CachedGptResponseWhereInputSchema.optional(),
}).strict() ;

export const CachedGptResponseDeleteManyArgsSchema: z.ZodType<Prisma.CachedGptResponseDeleteManyArgs> = z.object({
  where: CachedGptResponseWhereInputSchema.optional(),
}).strict() ;

export const CurrencyExchangeRateCreateArgsSchema: z.ZodType<Prisma.CurrencyExchangeRateCreateArgs> = z.object({
  select: CurrencyExchangeRateSelectSchema.optional(),
  data: z.union([ CurrencyExchangeRateCreateInputSchema,CurrencyExchangeRateUncheckedCreateInputSchema ]),
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export const CurrencyExchangeRateUpsertArgsSchema: z.ZodType<Prisma.CurrencyExchangeRateUpsertArgs> = z.object({
  select: CurrencyExchangeRateSelectSchema.optional(),
  where: CurrencyExchangeRateWhereUniqueInputSchema,
  create: z.union([ CurrencyExchangeRateCreateInputSchema,CurrencyExchangeRateUncheckedCreateInputSchema ]),
  update: z.union([ CurrencyExchangeRateUpdateInputSchema,CurrencyExchangeRateUncheckedUpdateInputSchema ]),
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export const CurrencyExchangeRateCreateManyArgsSchema: z.ZodType<Prisma.CurrencyExchangeRateCreateManyArgs> = z.object({
  data: z.union([ CurrencyExchangeRateCreateManyInputSchema,CurrencyExchangeRateCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export const CurrencyExchangeRateCreateManyAndReturnArgsSchema: z.ZodType<Prisma.CurrencyExchangeRateCreateManyAndReturnArgs> = z.object({
  data: z.union([ CurrencyExchangeRateCreateManyInputSchema,CurrencyExchangeRateCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export const CurrencyExchangeRateDeleteArgsSchema: z.ZodType<Prisma.CurrencyExchangeRateDeleteArgs> = z.object({
  select: CurrencyExchangeRateSelectSchema.optional(),
  where: CurrencyExchangeRateWhereUniqueInputSchema,
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export const CurrencyExchangeRateUpdateArgsSchema: z.ZodType<Prisma.CurrencyExchangeRateUpdateArgs> = z.object({
  select: CurrencyExchangeRateSelectSchema.optional(),
  data: z.union([ CurrencyExchangeRateUpdateInputSchema,CurrencyExchangeRateUncheckedUpdateInputSchema ]),
  where: CurrencyExchangeRateWhereUniqueInputSchema,
  relationLoadStrategy: RelationLoadStrategySchema.optional(),
}).strict() ;

export const CurrencyExchangeRateUpdateManyArgsSchema: z.ZodType<Prisma.CurrencyExchangeRateUpdateManyArgs> = z.object({
  data: z.union([ CurrencyExchangeRateUpdateManyMutationInputSchema,CurrencyExchangeRateUncheckedUpdateManyInputSchema ]),
  where: CurrencyExchangeRateWhereInputSchema.optional(),
}).strict() ;

export const CurrencyExchangeRateDeleteManyArgsSchema: z.ZodType<Prisma.CurrencyExchangeRateDeleteManyArgs> = z.object({
  where: CurrencyExchangeRateWhereInputSchema.optional(),
}).strict() ;