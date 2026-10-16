/**
 * What the home page asks visitors to do: join the launch list until the app is out, then download
 * it. Flip to `store` (and set the App Store link) on launch day and redeploy.
 */
export const ctaMode: 'waitlist' | 'store' = 'waitlist';

/** The App Store page, once the app has one. */
export const appStoreUrl = '#';

export const repoUrl = 'https://github.com/at6pm/6pm';
export const studioUrl = 'https://oddeggs.studio';

/** The page's background, also the browser chrome colour. */
export const siteBackground = '#8fd0c6';

/**
 * 6pm Max as the App Store sells it: Vietnam in đồng for the Vietnamese page, the US in dollars for
 * the English one. The app reads its prices from the store; these are the tiers configured there.
 */
export const maxPrices = {
  en: { month: 4.99, year: 34.99 },
  vi: { month: 99_000, year: 799_000 },
} as const;
