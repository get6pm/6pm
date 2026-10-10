import type { Stack } from 'expo-router';
import type { ComponentProps } from 'react';

type ScreenOptions = Extract<
  NonNullable<ComponentProps<typeof Stack.Screen>['options']>,
  Record<string, unknown>
>;

/** The prototype's sheets start 58 pt below the top of an 874 pt screen, with 40 pt corners. */
export const SHEET_DETENT = (874 - 58) / 874;

/**
 * Sheets draw themselves (`SheetFrame`): the prototype's 58 pt top, 40 pt corners and drag physics,
 * over a transparent modal that keeps the page underneath visible.
 */
export const sheet: ScreenOptions = {
  presentation: 'transparentModal',
  animation: 'none',
  headerShown: false,
  contentStyle: { backgroundColor: 'transparent' },
};

/** Full-screen moments that own the whole display: the 6pm Close, Scan, Ask, Max welcome. */
export const takeover: ScreenOptions = {
  presentation: 'fullScreenModal',
  animation: 'fade_from_bottom',
  headerShown: false,
};
