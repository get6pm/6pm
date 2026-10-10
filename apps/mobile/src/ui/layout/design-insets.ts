import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** The prototype is drawn on a 402×874 iPhone whose safe area is 62 pt on top, 34 at the bottom. */
const DESIGN_TOP = 62;
const DESIGN_BOTTOM = 34;

/**
 * Converts the prototype's offsets from the screen edge into this phone's: exact on the design
 * device, shifted by the difference in safe area on every other.
 */
export function useDesignInsets() {
  const insets = useSafeAreaInsets();
  return {
    top: (designPx: number) => designPx + insets.top - DESIGN_TOP,
    bottom: (designPx: number) => designPx + insets.bottom - DESIGN_BOTTOM,
    insets,
  };
}
