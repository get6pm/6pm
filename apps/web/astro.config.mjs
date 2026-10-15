import { defineConfig } from 'astro/config';

// A static site: every page is built ahead of time and served by a Worker's static assets
// (`wrangler.jsonc`). The API Worker owns `<host>/api/*` on the same host, so the waitlist form
// posts to its own origin.
export default defineConfig({
  site: 'https://at6pm.app',
  output: 'static',
  // Its CSS goes inline so first paint waits on no stylesheet request.
  // `file` writes `privacy.html`, so `/privacy` (the link the app opens) is served without a redirect.
  build: { inlineStylesheets: 'always', format: 'file' },
  // `astro dev` hands `/api` to a local API (`pnpm --filter @6pm/api dev`), as the routes do deployed.
  vite: { server: { proxy: { '/api': 'http://127.0.0.1:8787' } } },
});
