import type { RouteDefinition } from '../route';
import { issueNonce } from '../together/nonces';

/**
 * A single-use nonce for the next Sign in with Apple from this phone. The phone gives Apple its
 * SHA-256 and sends the nonce back with the identity token, so a token taken from elsewhere, or
 * used once already, is refused.
 */
export const togetherNonceRoute: RouteDefinition = {
  method: 'POST',
  path: '/v1/together/nonce',
  access: 'device',
  handle: async (c) => {
    const nonce = await issueNonce(c.env.DB, c.var.device.hash);
    c.header('Cache-Control', 'no-store');
    return c.json({ nonce });
  },
};
