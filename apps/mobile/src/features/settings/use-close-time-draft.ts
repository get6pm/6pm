import { useCallback, useEffect, useRef, useState } from 'react';

/** How long the wheels rest before the close time is saved: one write per pick, not per row. */
const SETTLE_MS = 450;

/**
 * The close time as the wheels show it. It follows the wheels at once and is saved once they
 * rest, or when the picker goes away, so closing the sheet mid-spin never loses the pick.
 */
export function useCloseTimeDraft(saved: string, save: (closeAt: string) => void) {
  const [value, setValue] = useState(saved);
  const pending = useRef<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const latestSave = useRef(save);
  latestSave.current = save;

  const flush = useCallback(() => {
    clearTimeout(timer.current);
    const next = pending.current;
    pending.current = null;
    if (next !== null) latestSave.current(next);
  }, []);
  useEffect(() => flush, [flush]);

  const set = useCallback(
    (next: string) => {
      setValue(next);
      pending.current = next;
      clearTimeout(timer.current);
      timer.current = setTimeout(flush, SETTLE_MS);
    },
    [flush],
  );
  /** Drops a pick that has not been saved yet (the data it would belong to is being deleted). */
  const discard = useCallback(() => {
    clearTimeout(timer.current);
    pending.current = null;
  }, []);
  return { value, set, discard };
}
