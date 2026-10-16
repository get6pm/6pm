import { createContext, use } from 'react';

import type { DayReceiptView } from '../diary/day-receipt';

/** The closed day the Diary has chosen, and the steps to the closed days either side of it. */
export interface DiaryDayView {
  readonly receipt: DayReceiptView;
  readonly onPrevious: (() => void) | null;
  readonly onNext: (() => void) | null;
}

const DiaryBridgeContext = createContext<((view: DiaryDayView | null) => void) | null>(null);

/**
 * Hands the Diary's chosen day to the right page when the iPhone Duo is opened beside it. Home
 * provides it only then; the Diary keeps the receipt under its calendar everywhere else.
 */
export const DiaryBridgeProvider = DiaryBridgeContext.Provider;

export function useDiaryBridge(): ((view: DiaryDayView | null) => void) | null {
  return use(DiaryBridgeContext);
}
