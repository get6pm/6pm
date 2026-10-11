import Constants from 'expo-constants';

import { createBackupApi, type BackupApi } from './backup-api';

/** The API of this build's environment: `extra.apiBase` is set per variant in the app config. */
export function nativeBackupApi(): BackupApi {
  const baseUrl: unknown = Constants.expoConfig?.extra?.['apiBase'];
  if (typeof baseUrl !== 'string' || baseUrl === '') {
    throw new Error('The app config has no apiBase');
  }
  return createBackupApi({ baseUrl, fetch: globalThis.fetch.bind(globalThis) });
}
