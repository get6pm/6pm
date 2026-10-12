/** Widgets, the Live Activity and the Control Center controls. */
/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = (config) => ({
  type: 'widget',
  bundleIdentifier: '.widgets',
  deploymentTarget: '17.0',
  frameworks: ['WidgetKit', 'SwiftUI', 'ActivityKit', 'AppIntents'],
  entitlements: {
    'com.apple.security.application-groups':
      config.ios.entitlements['com.apple.security.application-groups'],
  },
});
