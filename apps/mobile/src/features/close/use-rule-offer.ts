import { useEffect, useState } from 'react';

import type { CloseStep } from '@6pm/domain';

import type { MoneyActions } from '../../data/money-actions';

const OFFER_MS = 7000;

export interface RuleOffer {
  readonly merchant: string;
  readonly categoryId: string;
}

/**
 * Teaching 6pm a merchant from an edit in the close: changing a card's category offers "Always
 * file X as Y", unless that rule already exists. The offer goes away by itself, and with the
 * cards it belonged to.
 */
export function useRuleOffer(actions: MoneyActions, step: CloseStep) {
  const [offer, setOffer] = useState<RuleOffer | null>(null);
  useEffect(() => {
    if (offer === null) return;
    const timer = setTimeout(() => setOffer(null), OFFER_MS);
    return () => clearTimeout(timer);
  }, [offer]);
  useEffect(() => {
    if (step !== 'cards' && step !== 'sorted') setOffer(null);
  }, [step]);

  return {
    offer,
    dismiss: () => setOffer(null),
    /** A card's category was changed from `from` to `to`. */
    changed: (merchant: string, from: string, to: string) => {
      if (from === to) return;
      void actions.ruleCategory(merchant).then(
        (known) => {
          if (known !== to) setOffer({ merchant, categoryId: to });
        },
        () => undefined,
      );
    },
  };
}
