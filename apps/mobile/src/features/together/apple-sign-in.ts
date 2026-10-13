import * as AppleAuthentication from 'expo-apple-authentication';
import { CryptoDigestAlgorithm, CryptoEncoding, digestStringAsync } from 'expo-crypto';

import type { AppleCredential } from './together-api';

/** The person closed Apple's sheet: not an error, nothing to say. */
export class SignInCancelled extends Error {
  constructor() {
    super('Sign in with Apple was cancelled');
    this.name = 'SignInCancelled';
  }
}

export function appleSignInAvailable(): Promise<boolean> {
  return AppleAuthentication.isAvailableAsync().catch(() => false);
}

/** SHA-256 of a text, lowercase hex: what Apple is given in place of the raw nonce. */
export function sha256Hex(text: string): Promise<string> {
  return digestStringAsync(CryptoDigestAlgorithm.SHA256, text, { encoding: CryptoEncoding.HEX });
}

/**
 * Apple's sign-in sheet. Only the name is asked for, never the email: Budget together shows it
 * to the partner and needs nothing else. Apple gives the name the first time only. `nonceHash`
 * is the SHA-256 of the server's nonce, which Apple signs into the token.
 */
export async function signInWithApple(nonceHash: string): Promise<AppleCredential> {
  let credential: AppleAuthentication.AppleAuthenticationCredential;
  try {
    credential = await AppleAuthentication.signInAsync({
      requestedScopes: [AppleAuthentication.AppleAuthenticationScope.FULL_NAME],
      nonce: nonceHash,
    });
  } catch (error) {
    if ((error as { code?: unknown } | null)?.code === 'ERR_REQUEST_CANCELED') {
      throw new SignInCancelled();
    }
    throw error;
  }
  if (credential.identityToken === null) throw new Error('Apple gave no identity token');
  const given = credential.fullName?.givenName?.trim() ?? '';
  return {
    identityToken: credential.identityToken,
    authorizationCode: credential.authorizationCode,
    name: given === '' ? null : given.slice(0, 40),
  };
}
