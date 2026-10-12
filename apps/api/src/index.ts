import { createApp } from './app';
import type { Bindings } from './env';
import { receiveEmail } from './receipt-email/receive';
import * as routes from './routes/index.generated';

const app = createApp(Object.values(routes));

export default {
  fetch: app.fetch,
  // Receipt email: Email Routing hands every message to `<handle>@<host>` to this.
  email: async (message, env) => {
    await receiveEmail(message, env);
  },
} satisfies ExportedHandler<Bindings>;
