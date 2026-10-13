import { useEffect, useRef, useState } from 'react';

import { haptics } from '../../ui/haptics';

/** How long a destructive button stays armed for its second tap, as in Backup. */
const ARM_MS = 3000;

/**
 * Tap twice to do something that cannot be undone: the first tap arms one button (its label
 * asks again), the second within three seconds does it.
 */
export function useArmed<K extends string>() {
  const [armed, setArmed] = useState<K | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  return {
    armed,
    /** True when this tap is the second: go ahead. */
    confirm: (what: K): boolean => {
      clearTimeout(timer.current);
      if (armed === what) {
        setArmed(null);
        return true;
      }
      haptics.tap();
      setArmed(what);
      timer.current = setTimeout(() => setArmed(null), ARM_MS);
      return false;
    },
  };
}
