import { useEffect } from 'react';
import { AppState } from 'react-native';

import { useCompanionSettings } from '../companion/companion-settings-provider';
import { appIconCompanion } from '../purchases/entitlement';
import { useEntitlement } from '../purchases/purchases-provider';
import { applyAppIcon } from './app-icon';

/**
 * Keeps the Home Screen icon on the companion it should show: at launch, whenever the pick or
 * Max changes, and each time the app comes back. When Max has ended under a Max-only pick it goes
 * back to the app's own icon. iOS changes icons only while the app is in front.
 */
export function AppIconSync() {
  const settings = useCompanionSettings();
  const { customer } = useEntitlement();
  const form = appIconCompanion(settings, customer);

  useEffect(() => {
    const apply = () => {
      applyAppIcon(form).catch((error: unknown) => console.warn('Changing the icon failed', error));
    };
    if (AppState.currentState === 'active') apply();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') apply();
    });
    return () => subscription.remove();
  }, [form]);

  return null;
}
