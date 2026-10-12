/** The share extension: a bank receipt (image, PDF or text) shared from any app. */
/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = (config) => ({
  type: 'share',
  bundleIdentifier: '.share',
  displayName: '6pm',
  deploymentTarget: '17.0',
  frameworks: ['Vision', 'PDFKit', 'JavaScriptCore', 'UniformTypeIdentifiers', 'SwiftUI'],
  entitlements: {
    'com.apple.security.application-groups':
      config.ios.entitlements['com.apple.security.application-groups'],
  },
});
