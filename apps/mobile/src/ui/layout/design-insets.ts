import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** The prototype is drawn on a 402×874 iPhone whose safe area is 62 pt on top, 34 at the bottom. */
const DESIGN_TOP = 62;
const DESIGN_BOTTOM = 34;

/**
 * On the iPhone Duo the status bar and island run down the right edge: iOS reports a right inset
 * and none on top. The top then keeps only the screen corner's margin, which puts Today's date
 * 26 pt from the top edge as the Duo design draws it.
 */
const SIDE_STATUS_TOP = 28;

/**
 * Converts the prototype's offsets from the screen edge into this phone's: exact on the design
 * device, shifted by the difference in safe area on every other. `rail` is the width of the
 * status column down the right edge on the iPhone Duo, 0 on every other iPhone.
 */
export function useDesignInsets() {
  const insets = useSafeAreaInsets();
  const rail = insets.top === 0 && insets.right > 0 ? insets.right : 0;
  const topInset = rail > 0 ? SIDE_STATUS_TOP : insets.top;
  return {
    top: (designPx: number) => designPx + topInset - DESIGN_TOP,
    bottom: (designPx: number) => designPx + insets.bottom - DESIGN_BOTTOM,
    rail,
    insets,
  };
}
