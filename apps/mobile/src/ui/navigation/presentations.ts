import type { Stack } from 'expo-router';
import type { ComponentProps } from 'react';

type ScreenOptions = Extract<
  NonNullable<ComponentProps<typeof Stack.Screen>['options']>,
  Record<string, unknown>
>;

/**
 * Sheets are the real iOS sheet: dragged down anywhere, or pulled down from the top of their
 * scroll, they follow the finger and leave with its velocity, and `router.back()` slides them away.
 * The one detent is the tallest iOS allows: its top edge sits on the safe area, 62 pt down the
 * prototype's 874 pt screen, 4 pt below the prototype's 58 (iOS will not raise a sheet higher).
 * iOS dims the page behind without shrinking it, so the sky stays above the sheet. Each sheet paints its own colour
 * (`SheetFrame`), and draws the prototype's grabber instead of the system one.
 */
export const sheet: ScreenOptions = {
  presentation: 'formSheet',
  sheetAllowedDetents: [1],
  sheetCornerRadius: 40,
  sheetGrabberVisible: false,
  headerShown: false,
  contentStyle: { backgroundColor: 'transparent' },
};

/**
 * The iOS page sheet (`UIModalPresentationPageSheet`), for a screen that is a place of its own
 * rather than a step off the page: the page behind scales back into a card under the dim, as Mail
 * and Messages do when they compose. It sits at the system's large detent, a few points lower
 * than `sheet`, and drags and dismisses with the same physics. iOS draws its corners and offers no
 * grabber or corner options here (react-native-screens applies `sheetCornerRadius` and
 * `sheetGrabberVisible` to form sheets only), so the screen paints its own colour and grabber.
 */
export const pageSheet: ScreenOptions = {
  presentation: 'pageSheet',
  headerShown: false,
  contentStyle: { backgroundColor: 'transparent' },
};

/**
 * Sheets the native sheet cannot draw, which draw themselves over a transparent modal: the
 * floating card (`CardSheet`, inset from the edges and as tall as its content) and the look
 * detail (lower on the screen, over the undimmed page wearing the look). Below the tallest detent
 * iOS floats its sheet inset from the edges, so neither shape can be native.
 */
export const drawnSheet: ScreenOptions = {
  presentation: 'transparentModal',
  animation: 'none',
  headerShown: false,
  contentStyle: { backgroundColor: 'transparent' },
};

/** Full-screen moments that own the whole display: the 6pm Close, Scan, Max welcome. */
export const takeover: ScreenOptions = {
  presentation: 'fullScreenModal',
  animation: 'fade_from_bottom',
  headerShown: false,
};
