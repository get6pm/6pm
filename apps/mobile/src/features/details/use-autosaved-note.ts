import { useEffect, useRef, useState } from 'react';

import { useMoneyActions } from '../../data/money-provider';
import { useRunAction } from '../companion/use-run-action';
import { createAutosave } from './autosave';

/**
 * A spend's text field (its note, or the shop's name), saved while it is typed and once more when
 * the sheet goes away however it goes (the field loses focus, the sheet is dragged down with the
 * keyboard up), so it is never lost. A shop is never saved blank: clearing it keeps the old name.
 */
export function useAutosavedText(
  spendId: string | undefined,
  initial: string | null,
  field: 'note' | 'merchant',
) {
  const actions = useMoneyActions();
  const run = useRunAction();
  const target = useRef({ spendId, actions, run });
  useEffect(() => {
    target.current = { spendId, actions, run };
  });
  const [autosave] = useState(() =>
    createAutosave(initial, async (value) => {
      const { spendId: id, actions: write, run: guarded } = target.current;
      if (!id) return;
      if (field === 'merchant' && value === null) return;
      const patch = field === 'merchant' ? { merchant: value ?? '' } : { note: value };
      // `run` has already told the user it did not save; rejecting leaves the text unsaved so the
      // next flush tries again.
      if (!(await guarded(() => write.update(id, patch)))) {
        throw new Error('The text did not save');
      }
    }),
  );
  useEffect(
    () => () => {
      void autosave.flush();
    },
    [autosave],
  );
  return autosave;
}

/** A spend's note, saved as it is typed. */
export function useAutosavedNote(spendId: string | undefined, initial: string | null) {
  return useAutosavedText(spendId, initial, 'note');
}
