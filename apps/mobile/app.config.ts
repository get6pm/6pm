import { readFileSync } from 'node:fs';
import { join } from 'node:path';

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

/**
 * The permission prompts in English, written from `@6pm/i18n` (`native.permission.*`) by
 * `tools/scripts/generate-native.ts`, which this config cannot import. The plugins below take
 * them so no plugin writes its own default; each language's file then localises them.
 */
const PERMISSION = JSON.parse(readFileSync(join(__dirname, 'locales/en.json'), 'utf8')) as Record<
  | 'NSCameraUsageDescription'
  | 'NSMicrophoneUsageDescription'
  | 'NSSpeechRecognitionUsageDescription'
  | 'NSPhotoLibraryUsageDescription'
  | 'NSPhotoLibraryAddUsageDescription'
  | 'NSLocationWhenInUseUsageDescription',
  string
>;

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
  // The looks' display faces.
  'BarlowCondensed-Medium',
  'BarlowCondensed-SemiBold',
  'Baloo2-Variable',
  'Lora-Variable',
  'PlayfairDisplay-Variable',
  'CormorantGaramond-Variable',
  'Unbounded-Variable',
].map((name) => `./assets/fonts/${name}.ttf`);

/**
 * The bank apps Scan hands a payment to, as `canOpenURL` must be told in advance. Mirrors the iOS
 * schemes in the VietQR bank catalogue (`@6pm/domain`), which this config cannot import.
 */
const BANK_SCHEMES = [
  'mbbank',
  'vietcombankmobile',
  'tcb',
  'vpbankneo',
  'acbone',
  'bidv.smartbanking.partner',
  'vietinbankipay',
  'agribankmobile',
  'hydro',
  'myvib2',
  'shbmobile',
  'newomni-app',
  'seamobile',
  'hdbankmobile',
  'cake.vn',
  'plus',
];

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: variant.name,
  owner: 'sixpm',
  slug: '6pm',
  scheme: variant.scheme,
  version: '2.0.0',
  orientation: 'portrait',
  // The companion as the setting sun, half-sunk on a calm horizon: six o'clock without words.
  icon: './assets/icon/icon.png',
  userInterfaceStyle: 'automatic',
  backgroundColor: LAUNCH_BACKGROUND,
  // A build only takes updates made from the same native code; v1's fixed runtime is never reused.
  // EXPO_LOCAL_RUNTIME is for the simulator harness only: the dev server re-hashes the native
  // fingerprint on every manifest request, which can outlast the dev client's 10 s timeout on a
  // busy machine. The dev client never checks the runtime against Metro, so a fixed one is safe there.
  runtimeVersion: process.env.EXPO_LOCAL_RUNTIME ? 'local' : { policy: 'fingerprint' },
  updates: variant.updates
    ? { url: `https://u.expo.dev/${EAS_PROJECT_ID}` }
    : { enabled: false, checkAutomatically: 'NEVER' },
  ios: {
    bundleIdentifier: variant.bundleIdentifier,
    // iOS 18+ home-screen appearances: the same sunset on a night sea, and a grey glyph to tint.
    icon: {
      light: './assets/icon/icon.png',
      dark: './assets/icon/icon-dark.png',
      tinted: './assets/icon/icon-tinted.png',
    },
    appleTeamId: APPLE_TEAM_ID,
    deploymentTarget: IOS_DEPLOYMENT_TARGET,
    // v1 shipped on iPad, and an App Store update may not drop a device family it supported.
    supportsTablet: true,
    associatedDomains: [`applinks:${variant.host}`, `webcredentials:${variant.host}`],
    usesAppleSignIn: true,
    // The App Group is how the app and its widgets, share extension and shortcuts reach each
    // other; the targets in ./targets copy it. Each group is registered by hand on the Apple
    // developer site, which App Store Connect's API cannot do.
    entitlements: {
      'com.apple.security.application-groups': [variant.appGroup],
      'com.apple.developer.usernotifications.time-sensitive': true,
    },
    config: { usesNonExemptEncryption: false },
    infoPlist: {
      CFBundleAllowMixedLocalizations: true,
      LSApplicationQueriesSchemes: BANK_SCHEMES,
      NSSupportsLiveActivities: true,
    },
  },
  android: {
    package: variant.bundleIdentifier,
  },
  // Permission prompts in each language, generated from `@6pm/i18n`.
  locales: { en: './locales/en.json', vi: './locales/vi.json' },
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
    // Scan reads VietQR codes and never records; the microphone is voice's, and both plugins
    // write the same prompt so neither replaces the other's.
    [
      'expo-camera',
      {
        cameraPermission: PERMISSION.NSCameraUsageDescription,
        microphonePermission: PERMISSION.NSMicrophoneUsageDescription,
        recordAudioAndroid: false,
      },
    ],
    // Saying a spend, understood on the phone.
    [
      'expo-speech-recognition',
      {
        microphonePermission: PERMISSION.NSMicrophoneUsageDescription,
        speechRecognitionPermission: PERMISSION.NSSpeechRecognitionUsageDescription,
      },
    ],
    // The close receipt and the money diary are saved to Photos; 6pm never reads the library and
    // never asks to. The library's code still references reading, so App Store Connect rejects a
    // build without the read prompt's text (ITMS-90683): it says plainly that nothing is read.
    [
      'expo-media-library',
      {
        photosPermission: PERMISSION.NSPhotoLibraryUsageDescription,
        savePhotosPermission: PERMISSION.NSPhotoLibraryAddUsageDescription,
      },
    ],
    // Travel mode turns on abroad: the country, while the app is open, never in the background.
    [
      'expo-location',
      {
        locationWhenInUsePermission: PERMISSION.NSLocationWhenInUseUsageDescription,
        locationAlwaysAndWhenInUsePermission: false,
        locationAlwaysPermission: false,
        isIosBackgroundLocationEnabled: false,
        isAndroidBackgroundLocationEnabled: false,
      },
    ],
    // Budget together pairs two people with Sign in with Apple.
    'expo-apple-authentication',
    // Widgets, the Live Activity, controls, the share extension and the shortcuts: ./targets.
    ['@bacons/apple-targets', { appleTeamId: APPLE_TEAM_ID }],
    // Crash reports. Source maps and debug symbols upload only when the build has a Sentry token.
    [
      '@sentry/react-native/expo',
      {
        organization: 'quocs',
        project: '6pm',
        url: 'https://sentry.io/',
        disableAutoUpload: !process.env['SENTRY_AUTH_TOKEN'],
      },
    ],
    // Local reminders only (the close at six); no remote push yet.
    ['expo-notifications', { enableBackgroundRemoteNotifications: false }],
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
