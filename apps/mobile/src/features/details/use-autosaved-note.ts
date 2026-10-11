import { useEffect, useRef, useState } from 'react';

import { useMoneyActions } from '../../data/money-provider';
import { useRunAction } from '../companion/use-run-action';
import { createAutosave } from './autosave';

/**
 * A spend's note, saved while it is typed and once more when the sheet goes away however it goes
 * (the field loses focus, the sheet is dragged down with the keyboard up), so it is never lost.
 */
export function useAutosavedNote(spendId: string | undefined, initial: string | null) {
  const actions = useMoneyActions();
  const run = useRunAction();
  const target = useRef({ spendId, actions, run });
  useEffect(() => {
    target.current = { spendId, actions, run };
  });
  const [autosave] = useState(() =>
    createAutosave(initial, (value) => {
      const { spendId: id, actions: write, run: guarded } = target.current;
      if (id) void guarded(() => write.update(id, { note: value }));
    }),
  );
  useEffect(() => autosave.flush, [autosave]);
  return autosave;
}
