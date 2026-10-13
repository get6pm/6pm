import { Easing } from 'react-native-reanimated';

/** Strong ease-out for anything entering, leaving or answering a press without a finger on it. */
export const easeOut = Easing.bezier(0.23, 1, 0.32, 1);
/** Something moving across the screen (a tab pill, a page). */
export const easeInOut = Easing.bezier(0.77, 0, 0.175, 1);
