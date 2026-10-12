import { createApp } from './app';
import type { Bindings } from './env';
import { createD1FxSnapshotWriter, ingestFxSnapshots } from './fx/ingest';
import { receiveEmail } from './receipt-email/receive';
import * as routes from './routes/index.generated';

const app = createApp(Object.values(routes));

export default {
  fetch: app.fetch,
  // Receipt email: Email Routing hands every message to `receipts+<handle>@<host>` to this.
  email: async (message, env) => {
    await receiveEmail(message, env);
  },
  // The cron in `wrangler.jsonc`: the day's exchange rates for Travel mode. Counts only are logged.
  scheduled: (_controller, env, ctx) => {
    ctx.waitUntil(
      ingestFxSnapshots(createD1FxSnapshotWriter(env.DB)).then((result) => {
        const { fetched, inserted, skipped, rejected, latestAsOf, stale } = result;
        const log = rejected.length > 0 || stale ? console.warn : console.log;
        log('fx ingest', { fetched, inserted, skipped, rejected, latestAsOf, stale });
      }),
    );
  },
} satisfies ExportedHandler<Bindings>;
