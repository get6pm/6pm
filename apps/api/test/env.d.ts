import type { D1Migration } from 'cloudflare:test';

import type { Bindings } from '../src/env';

// Types the `env` that `cloudflare:workers` exports inside the test runtime.
declare global {
  namespace Cloudflare {
    interface Env extends Bindings {
      /** The migration files, read by `vitest.config.ts`. */
      readonly TEST_MIGRATIONS: D1Migration[];
    }
  }
}
