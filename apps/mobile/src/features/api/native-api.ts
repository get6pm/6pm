import Constants from 'expo-constants';
import { useMemo, useRef } from 'react';

import { useI18n } from '../../i18n/i18n';
import { createApiClient, type ApiClient } from './api-client';
import { ApiRequestError } from './api-error';
import { secureDeviceTokenStore } from './device-token-store';

/** The API of this build's environment: `extra.apiBase` is set per variant in the app config. */
function apiBase(): string | null {
  const baseUrl: unknown = Constants.expoConfig?.extra?.['apiBase'];
  return typeof baseUrl === 'string' && baseUrl !== '' ? baseUrl : null;
}

/** A build with no server address reaches nothing: every call fails like a dead connection. */
const unreachable: ApiClient = {
  request: () =>
    Promise.reject(new ApiRequestError('network', 'The app config has no apiBase', false)),
};

/** The server client for this phone, registering it on first use. Registers in the app's language. */
export function useApi(): ApiClient {
  const { language } = useI18n();
  const languageRef = useRef(language);
  languageRef.current = language;
  return useMemo(() => {
    const baseUrl = apiBase();
    return baseUrl === null
      ? unreachable
      : createApiClient({
          baseUrl,
          fetch: globalThis.fetch.bind(globalThis),
          tokens: secureDeviceTokenStore,
          language: () => languageRef.current,
        });
  }, []);
}
