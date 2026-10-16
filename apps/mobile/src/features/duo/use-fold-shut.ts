import { useEffect, useRef } from 'react';

import { useFold } from '../../ui/layout/fold';

/**
 * Calls `onShut` when the iPhone Duo is folded shut from open or part way open, while `enabled`.
 * Read through a ref, so the latest `onShut` runs.
 */
export function useFoldShut(onShut: () => void, enabled: boolean) {
  const { snapshot } = useFold();
  const latest = useRef(onShut);
  useEffect(() => {
    latest.current = onShut;
  });
  const was = useRef(snapshot.hinge);
  useEffect(() => {
    const before = was.current;
    was.current = snapshot.hinge;
    if (enabled && snapshot.hinge === 'closed' && (before === 'partial' || before === 'open')) {
      latest.current();
    }
  }, [snapshot.hinge, enabled]);
}
