/** Shortcuts: "Log in 6pm" for Siri and the Wallet automation, without starting the app. */
/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = (config) => ({
  type: 'app-intent',
  bundleIdentifier: '.intents',
  deploymentTarget: '17.0',
  frameworks: ['AppIntents', 'JavaScriptCore', 'SwiftUI'],
  entitlements: {
    'com.apple.security.application-groups':
      config.ios.entitlements['com.apple.security.application-groups'],
  },
});
