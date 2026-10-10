// Metro loads this file with Node's CommonJS loader, so it uses require and module.exports.
// eslint-disable-next-line @typescript-eslint/no-require-imports -- CommonJS, see above
const { getDefaultConfig } = require('expo/metro-config');

module.exports = getDefaultConfig(__dirname);
