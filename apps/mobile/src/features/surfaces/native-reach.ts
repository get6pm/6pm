import { Platform } from 'react-native';

import { scanCamera } from '../../../modules/scan-camera';
import { surfaces } from '../../../modules/surfaces';

/**
 * What this phone's native side can do. The iPhone build carries every surface; a build without
 * one (Android) hides the way in rather than offering a screen or a button that cannot work.
 */
export interface NativeReach {
  /** Scan's live camera and reader. */
  readonly scan: boolean;
  /** 6pm in the share sheet: the iOS share extension. */
  readonly share: boolean;
  /** The Wallet automation, set up in Shortcuts. */
  readonly wallet: boolean;
  /** Home and Lock Screen widgets, controls and Live Activities. */
  readonly widgets: boolean;
  /** Sign in with Apple, which Budget together pairs with. */
  readonly appleSignIn: boolean;
}

const ios = Platform.OS === 'ios';

export const nativeReach: NativeReach = {
  scan: scanCamera !== null,
  share: ios,
  wallet: ios,
  widgets: surfaces !== null,
  appleSignIn: ios,
};
