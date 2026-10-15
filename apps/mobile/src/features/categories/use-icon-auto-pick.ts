import { useEffect, useMemo, useRef } from 'react';

import { suggestCategoryIcon, type CategoryIcon } from '@6pm/domain';

import { useApi } from '../api/native-api';
import { useEntitlement } from '../purchases/purchases-provider';
import { askCategoryIcon, ICON_ASK_PAUSE_MS, usableIcons } from './icon-suggestion';

/**
 * Chooses the icon while a category is being named. The phone's own word match answers at once,
 * offline too; when it finds nothing, the server is asked once the typing rests. Only icons the
 * person may use are chosen. An answer for a name that has since changed is dropped.
 */
export function useIconAutoPick({
  name,
  enabled,
  onPick,
}: {
  readonly name: string;
  /** False once the person picked an icon themselves. */
  readonly enabled: boolean;
  readonly onPick: (icon: CategoryIcon) => void;
}) {
  const api = useApi();
  const { max } = useEntitlement();
  const icons = useMemo(() => usableIcons(max), [max]);
  const pick = useRef(onPick);
  pick.current = onPick;

  useEffect(() => {
    const trimmed = name.trim();
    if (!enabled || trimmed === '') return;
    const local = suggestCategoryIcon(trimmed, icons);
    if (local) {
      pick.current(local);
      return;
    }
    if (trimmed.length < 2) return;
    let current = true;
    const timer = setTimeout(() => {
      void askCategoryIcon((request) => api.request(request), trimmed, icons).then((icon) => {
        if (current && icon) pick.current(icon);
      });
    }, ICON_ASK_PAUSE_MS);
    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [api, enabled, icons, name]);
}
