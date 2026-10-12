/**
 * What the extensions' JavaScriptCore sees of the domain, bundled to `targets/_shared/
 * domain-native.js` as the global `SixpmDomain`. Every function takes JSON and returns JSON, so
 * Swift never does money maths and never formats a number itself. Raise the version when a
 * function's input or output changes shape: the extension checks it before calling anything.
 */
export const NATIVE_API_VERSION = 1;
