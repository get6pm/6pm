import { useCallback } from 'react';

import { useMoney } from '../../data/money-provider';
import { useI18n } from '../../i18n/i18n';
import { useToast } from '../../ui/toast/toast-host';
import { useTheme } from '../../ui/theme/theme';

/** Events the companion has a line for in every voice: `companion.<event>.<persona|plain>`. */
export type CompanionEvent =
  | 'capture'
  | 'catSaved'
  | 'copied'
  | 'export'
  | 'lateClose'
  | 'lookNew'
  | 'lookSet'
  | 'nudge'
  | 'pinned'
  | 'potFull'
  | 'potMade'
  | 'restored'
  | 'ruleSaved'
  | 'save'
  | 'share'
  | 'walletOn'
  | 'widgets'
  | 'yearBook';

/** Says an event's line in the island, in the chosen persona (plain words in serious mode). */
export function useCompanionToast() {
  const toast = useToast();
  const { t } = useI18n();
  const { serious } = useTheme();
  const persona = useMoney().plan?.persona ?? 'cheeky';
  // Every voice of an event takes the same params ({day} for save and lateClose), so the key is
  // built at run time and looked up untyped.
  const say = t as (key: string, params?: Readonly<Record<string, string>>) => string;
  return useCallback(
    (
      event: CompanionEvent,
      params?: Readonly<Record<string, string>>,
      options?: { readonly plain?: boolean },
    ) => toast(say(`companion.${event}.${serious || options?.plain ? 'plain' : persona}`, params)),
    [toast, say, serious, persona],
  );
}
