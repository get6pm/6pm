import type { ReactNode } from 'react';
import { View } from 'react-native';

import type { Page } from '../../ui/layout/fold-form';

/** Space each page keeps from the fold. */
const FROM_FOLD = 24;

/**
 * The Close as an open book on the iPhone Duo: the step on the left page, the ledger on the right,
 * neither reaching into the fold. `inset` is how far the screen's own padding already moved the
 * pages in from the left edge.
 */
export function CloseBook({
  left,
  right,
  leftPage,
  rightPage,
  inset,
}: {
  readonly left: ReactNode;
  readonly right: ReactNode;
  readonly leftPage: Page;
  readonly rightPage: Page;
  readonly inset: number;
}) {
  const leftWidth = leftPage.width - inset - FROM_FOLD;
  return (
    <View style={{ flex: 1, flexDirection: 'row' }}>
      <View style={{ width: leftWidth }}>{left}</View>
      <View style={{ flex: 1, marginLeft: rightPage.x + FROM_FOLD - inset - leftWidth }}>
        {right}
      </View>
    </View>
  );
}
