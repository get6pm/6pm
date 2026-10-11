import { Image } from 'react-native';

// A small copy of the home-screen icon, so pictures of it inside the app always match it.
import ICON from '../../assets/icon/icon-in-app.png';

/** The app's own icon at a size, with the corner radius iOS would mask it to. */
export function AppIconImage({ size, radius }: { readonly size: number; readonly radius: number }) {
  return (
    <Image
      source={ICON}
      accessibilityIgnoresInvertColors
      style={{ width: size, height: size, borderRadius: radius }}
    />
  );
}
