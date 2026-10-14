import { useEffect, useState } from 'react';

import { appIcon } from '../../../modules/app-icon';
import type { CompanionForm } from '../../ui/companion/companion-mood';

/**
 * Each companion's alternate icon, as `app.config.ts` names them for the asset catalogue. The sun
 * is the app's own icon.
 */
export const APP_ICON_NAMES: Readonly<Record<Exclude<CompanionForm, 'sun'>, string>> = {
  max: 'CompanionMax',
  nhang: 'CompanionNhang',
  banhbao: 'CompanionBanhBao',
  giot: 'CompanionGiot',
  hac: 'CompanionHac',
};

/** The alternate icon name for a companion, or null for the app's own icon. */
export function appIconName(form: CompanionForm | null): string | null {
  return form === null || form === 'sun' ? null : APP_ICON_NAMES[form];
}

/**
 * Shows `form`'s icon on the Home Screen unless it already shows. Resolves true when it changed;
 * rejects when iOS refused.
 */
export async function applyAppIcon(form: CompanionForm | null): Promise<boolean> {
  const native = appIcon;
  if (!native || !(await native.supportsAlternateIcons())) return false;
  const name = appIconName(form);
  if ((await native.alternateIconName()) === name) return false;
  await native.setAlternateIconName(name);
  return true;
}

/** Whether this iPhone can change the app's icon; false until it has said so. */
export function useAppIconSupported(): boolean {
  const [supported, setSupported] = useState(false);
  useEffect(() => {
    let live = true;
    appIcon
      ?.supportsAlternateIcons()
      .then((yes) => {
        if (live) setSupported(yes);
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, []);
  return supported;
}
