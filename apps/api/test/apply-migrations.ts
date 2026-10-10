import { applyD1Migrations } from 'cloudflare:test';
import { env } from 'cloudflare:workers';

// Each test file starts from an empty local database with every migration applied, the same way
// `wrangler d1 migrations apply` does it. Applying twice is a no-op.
await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
