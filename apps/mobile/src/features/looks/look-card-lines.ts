import { useMemo } from 'react';

import { configFor } from '@6pm/theme';

import { useI18n } from '../../i18n/i18n';
import { resolveLook } from '../purchases/entitlement';
import { useEntitlement } from '../purchases/purchases-provider';
import { shopSub } from './look-catalogue';
import { lookCopy } from './look-copy';
import { useLookSettings } from './look-settings-provider';

/**
 * What Settings' Look card says: the look worn, and "Saigon · 7 more in the shop" under it
 * (prototype `App:794-810`).
 */
export function useLookCardLines(): { readonly name: string; readonly line: string } {
  const { t } = useI18n();
  const { customer } = useEntitlement();
  const { look, config } = useLookSettings();
  const copy = useMemo(() => lookCopy(t), [t]);
  const worn = resolveLook(look, customer);
  const sub = shopSub(customer);
  const shop =
    sub.kind === 'max'
      ? t('looks.shopSub.max')
      : sub.kind === 'all'
        ? t('looks.shopSub.all')
        : t('looks.shopSub.more', { count: sub.count });
  return {
    name: copy.name(worn),
    line: `${copy.variant(worn, configFor(worn, config[worn]).v)} · ${shop}`,
  };
}
