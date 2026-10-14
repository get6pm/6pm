import { requireOptionalNativeModule } from 'expo';

interface AppIconNative {
  supportsAlternateIcons(): Promise<boolean>;
  /** The alternate icon showing, or null for the app's own. */
  alternateIconName(): Promise<string | null>;
  setAlternateIconName(name: string | null): Promise<void>;
}

/**
 * The Home Screen icon switcher (`modules/app-icon/ios`), or null where it is not built in:
 * tests, and other platforms.
 */
export const appIcon = requireOptionalNativeModule<AppIconNative>('AppIcon');
