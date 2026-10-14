import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { build, type Plugin } from 'esbuild';

/**
 * The app's Skia drawing code, run in Node: React Native Skia's web implementation over
 * CanvasKit, the same Skia the phone draws with. Bundling swaps `@shopify/react-native-skia` for
 * that implementation, so the companion's worklets run here unchanged.
 */

const here = path.dirname(fileURLToPath(import.meta.url));
export const repoRoot = path.resolve(here, '../..');
const skiaRoot = path.join(repoRoot, 'apps/mobile/node_modules/@shopify/react-native-skia');
const skiaRequire = createRequire(path.join(skiaRoot, 'package.json'));

interface SkiaHolder {
  __nodeSkia?: unknown;
  CanvasKit?: unknown;
}

/** Loads CanvasKit once and makes `Skia` available to bundles built with `skiaAlias`. */
export async function loadSkia(): Promise<void> {
  const holder = globalThis as SkiaHolder;
  if (holder.__nodeSkia) return;
  const init = skiaRequire('canvaskit-wasm') as () => Promise<unknown>;
  const canvasKit = await init();
  holder.CanvasKit = canvasKit;
  const web = skiaRequire('./lib/commonjs/skia/web') as { JsiSkApi: (ck: unknown) => unknown };
  holder.__nodeSkia = web.JsiSkApi(canvasKit);
}

const SHIM = `
const types = require(${JSON.stringify(path.join(skiaRoot, 'lib/commonjs/skia/types'))});
module.exports = { ...types };
Object.defineProperty(module.exports, 'Skia', { get: () => globalThis.__nodeSkia });
`;

/** Points `@shopify/react-native-skia` at the Node implementation. */
const skiaAlias: Plugin = {
  name: 'skia-node',
  setup(b) {
    b.onResolve({ filter: /^@shopify\/react-native-skia$/ }, () => ({
      path: 'skia-node-shim',
      namespace: 'skia-node',
    }));
    b.onLoad({ filter: /.*/, namespace: 'skia-node' }, () => ({
      contents: SHIM,
      loader: 'js',
      resolveDir: skiaRoot,
    }));
  },
};

/** Bundles `entry` (TypeScript using the app's drawing code) and imports it. */
export async function importWithSkia<T>(entry: string): Promise<T> {
  const out = path.join(repoRoot, 'node_modules/.cache/skia-node', `${path.basename(entry)}.cjs`);
  await build({
    entryPoints: [entry],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    outfile: out,
    plugins: [skiaAlias],
    logLevel: 'error',
  });
  const load = createRequire(import.meta.url);
  return load(out) as T;
}
