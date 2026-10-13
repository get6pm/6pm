import * as AppleAuthentication from 'expo-apple-authentication';

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

/**
 * Apple's sign-in sheet. Only the name is asked for, never the email: Budget together shows it
 * to the partner and needs nothing else. Apple gives the name the first time only.
 */
export async function signInWithApple(): Promise<AppleCredential> {
  let credential: AppleAuthentication.AppleAuthenticationCredential;
  try {
    credential = await AppleAuthentication.signInAsync({
      requestedScopes: [AppleAuthentication.AppleAuthenticationScope.FULL_NAME],
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
