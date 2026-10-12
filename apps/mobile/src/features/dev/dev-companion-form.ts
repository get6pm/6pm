import { useSyncExternalStore } from 'react';

import type { CompanionForm } from '../../ui/companion/companion-mood';

/**
 * A developer build's stand-in for membership where the companion is concerned: purchases are
 * unavailable without a store key, so a dev command can show the Max form. Release builds never
 * read it.
 */
let pinned: CompanionForm | null = null;
const listeners = new Set<() => void>();

export function pinCompanionForm(form: CompanionForm | null) {
  pinned = form;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const read = () => pinned;

export function usePinnedCompanionForm(): CompanionForm | null {
  return useSyncExternalStore(subscribe, read, read);
}
