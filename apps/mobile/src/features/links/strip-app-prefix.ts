const WEB_APP_PREFIX = /^(?:https?:\/\/[^/?#]+)?\/app(?=[/?#]|$)/i;

/**
 * Universal links reach the app as `https://<host>/app/...`: the website serves the app's links
 * under `/app`, but the app's own routes start at the root. Strips that prefix, and leaves any
 * other link alone.
 */
export function stripAppPrefix(path: string): string {
  if (!WEB_APP_PREFIX.test(path)) return path;
  const rest = path.replace(WEB_APP_PREFIX, '');
  // `/app` and `/app?x=1` become the home route.
  return rest === '' || rest.startsWith('?') || rest.startsWith('#') ? `/${rest}` : rest;
}
