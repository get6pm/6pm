import type { ReactNode } from 'react';

import { SheetFrame } from '../../ui/navigation/sheet-frame';
import { MAX_PAGE } from './max-colours';

/**
 * The Max sheet's own frame: the native sheet like every other (58 pt from the top, 40 pt
 * corners, dragged or pulled down from the top of its scroll to dismiss), painted the Max sheet's
 * dark page colour whatever the look (prototype `App:1005-1006`).
 */
export function MaxSheetFrame({ children }: { readonly children: ReactNode }) {
  return <SheetFrame background={MAX_PAGE}>{children}</SheetFrame>;
}
