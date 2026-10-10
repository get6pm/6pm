import { defineConfig } from 'vitest/config';

// Workspace test projects; each package may add its own vitest.config.ts.
export default defineConfig({
  test: {
    projects: ['packages/*', 'tools/*'],
  },
});
