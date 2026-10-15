import type { ApiLanguage } from '@6pm/domain';
import type { RequestIdVariables } from 'hono/request-id';

/**
 * Secrets the Worker expects, by name. Values live in Wrangler secrets (deployed) or `.dev.vars`
 * (local, ignored by git); `.dev.vars.example` lists the same names.
 */
export const secretNames = [
  'DEEPSEEK_API_KEY',
  /** Anthropic: the vision model that reads a receipt photo the phone could not read. */
  'ANTHROPIC_API_KEY',
  'TYPESAFE_API_KEY',
  'REVENUECAT_API_V2_KEY',
  'REVENUECAT_WEBHOOK_AUTH',
  /** Seals receipts read from email while they wait for their phone: 32 characters or more. */
  'EMAIL_SEAL_KEY',
  /** Budget together: the Sign in with Apple key (`.p8` text) and its key id, for revoking. */
  'APPLE_SIGN_IN_KEY',
  'APPLE_SIGN_IN_KEY_ID',
] as const;
export type SecretName = (typeof secretNames)[number];

/** A secret is absent until it has been set for the environment, so readers must handle that. */
export type Secrets = { readonly [K in SecretName]?: string };

export type EnvironmentName = 'dev' | 'prd';

/** Everything `wrangler.jsonc` binds for an environment, plus the secrets. */
export type Bindings = Secrets & {
  readonly DB: D1Database;
  readonly FILES: R2Bucket;
  readonly IP_RATE_LIMIT: RateLimit;
  readonly DEVICE_RATE_LIMIT: RateLimit;
  readonly BACKUP_RATE_LIMIT: RateLimit;
  readonly EMAIL_RATE_LIMIT: RateLimit;
  readonly RECEIPT_READ_RATE_LIMIT: RateLimit;
  readonly ENVIRONMENT: EnvironmentName;
  readonly COMMIT_SHA: string;
};

/** The device behind a request, set once its bearer token has been recognised. */
export type Device = {
  /** SHA-256 of the token, hex. The token itself is never kept. */
  readonly hash: string;
  readonly language: ApiLanguage;
};

export type AppEnv = {
  Bindings: Bindings;
  Variables: RequestIdVariables & {
    device: Device;
    /** SHA-256 of the backup token, hex, set once a backup request's header has been checked. */
    backupHash: string;
  };
};
