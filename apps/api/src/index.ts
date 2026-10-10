import { createApp } from './app';
import type { Bindings } from './env';
import * as routes from './routes/index.generated';

const app = createApp(Object.values(routes));

export default {
  fetch: app.fetch,
} satisfies ExportedHandler<Bindings>;
