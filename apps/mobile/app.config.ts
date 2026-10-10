import type { ConfigContext, ExpoConfig } from 'expo/config';

/** Two environments, dev and prd. `e2e-test` is the dev app as device runs install it. */
type AppVariant = 'dev' | 'prd' | 'e2e-test';

interface VariantConfig {
  name: string;
  bundleIdentifier: string;
  /** Shared by the app and its extensions (widgets, share, Live Activity). */
  appGroup: string;
  scheme: string;
  /** Hosts universal links and the API: one host per environment on oddeggs.studio. */
  host: string;
  /** Over-the-air updates. Off for device runs, which swap in the commit's own bundle. */
  updates: boolean;
}

/** The v1 project on the `sixpm` Expo account: v2 ships as an update to the same store app. */
const EAS_PROJECT_ID = '5853e031-3bfb-41fe-bfb6-c49f746c4adc';
const APPLE_TEAM_ID = 'YFND2EEW8S';
const IOS_DEPLOYMENT_TARGET = '17.0';

const DEV: VariantConfig = {
  name: '6pm Dev',
  bundleIdentifier: 'ai.sixpm.app.dev',
  appGroup: 'group.ai.sixpm.app.dev',
  scheme: 'sixpm-dev',
  host: '6pm-dev.oddeggs.studio',
  updates: true,
};

const VARIANTS: Record<AppVariant, VariantConfig> = {
  dev: DEV,
  'e2e-test': { ...DEV, updates: false },
  prd: {
    name: '6pm',
    bundleIdentifier: 'ai.sixpm.app',
    appGroup: 'group.ai.sixpm.app',
    scheme: 'sixpm',
    host: '6pm.oddeggs.studio',
    updates: true,
  },
};

/** Unset means dev, for local work; every EAS profile names its variant in eas.json. */
function resolveVariant(): AppVariant {
  const raw = process.env['APP_VARIANT'];
  if (raw === undefined || raw === '') return 'dev';
  if (raw === 'dev' || raw === 'prd' || raw === 'e2e-test') return raw;
  throw new Error(`APP_VARIANT must be dev, prd or e2e-test, not "${raw}"`);
}

const appVariant = resolveVariant();
const variant = VARIANTS[appVariant];

/** The page colour behind the first frame: the Golden Hour night sheet, so launch never flashes. */
const LAUNCH_BACKGROUND = '#1a0f1c';

/** Every font file in assets/fonts, embedded natively so the first frame already has them. */
const FONTS = [
  'BricolageGrotesque-Variable',
  'BeVietnamPro-Regular',
  'BeVietnamPro-Medium',
  'BeVietnamPro-SemiBold',
  'BeVietnamPro-Bold',
  'IBMPlexMono-Regular',
  'IBMPlexMono-Medium',
  'IBMPlexMono-SemiBold',
  'PatrickHand-Regular',
  'MaterialSymbolsRounded-Variable',
].map((name) => `./assets/fonts/${name}.ttf`);

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: variant.name,
  owner: 'sixpm',
  slug: '6pm',
  scheme: variant.scheme,
  version: '2.0.0',
  orientation: 'portrait',
  // The companion on the Golden Hour sky, rendered from the prototype's own drawing.
  icon: './assets/icon/icon.png',
  userInterfaceStyle: 'automatic',
  backgroundColor: LAUNCH_BACKGROUND,
  // A build only takes updates made from the same native code; v1's fixed runtime is never reused.
  runtimeVersion: { policy: 'fingerprint' },
  updates: variant.updates
    ? { url: `https://u.expo.dev/${EAS_PROJECT_ID}` }
    : { enabled: false, checkAutomatically: 'NEVER' },
  ios: {
    bundleIdentifier: variant.bundleIdentifier,
    appleTeamId: APPLE_TEAM_ID,
    deploymentTarget: IOS_DEPLOYMENT_TARGET,
    supportsTablet: false,
    associatedDomains: [`applinks:${variant.host}`, `webcredentials:${variant.host}`],
    config: { usesNonExemptEncryption: false },
    infoPlist: {
      CFBundleAllowMixedLocalizations: true,
    },
    // The App Group (shared with widgets and the share extension) is declared with those targets:
    // App Store Connect's API cannot register app groups, so they arrive in that native batch.
  },
  android: {
    package: variant.bundleIdentifier,
  },
  plugins: [
    'expo-router',
    ['expo-sqlite', { useSQLCipher: true }],
    ['expo-font', { fonts: FONTS }],
    [
      'expo-splash-screen',
      { backgroundColor: LAUNCH_BACKGROUND, dark: { backgroundColor: LAUNCH_BACKGROUND } },
    ],
    ['expo-build-properties', { android: { compileSdkVersion: 37, targetSdkVersion: 36 } }],
    ['expo-localization', { supportedLocales: ['en', 'vi'] }],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    ...config.extra,
    appVariant,
    apiBase: `https://${variant.host}/api`,
    eas: { projectId: EAS_PROJECT_ID },
  },
});
