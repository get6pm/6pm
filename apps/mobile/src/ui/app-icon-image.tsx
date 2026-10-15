import { Image, type ImageSourcePropType } from 'react-native';

import { useAppIconCompanion } from '../features/app-icon/app-icon-sync';
import type { CompanionForm } from './companion/companion-mood';

// Small copies of the Home Screen icons, so pictures of the icon inside the app always match it.
import SUN from '../../assets/icon/icon-in-app.png';
import BANHBAO from '../../assets/icon/banhbao/icon-in-app.png';
import GIOT from '../../assets/icon/giot/icon-in-app.png';
import HAC from '../../assets/icon/hac/icon-in-app.png';
import MAX from '../../assets/icon/max/icon-in-app.png';
import NHANG from '../../assets/icon/nhang/icon-in-app.png';

const ICONS: Readonly<Record<CompanionForm, ImageSourcePropType>> = {
  sun: SUN,
  max: MAX,
  nhang: NHANG,
  banhbao: BANHBAO,
  giot: GIOT,
  hac: HAC,
};

/**
 * The icon on the Home Screen (the companion's while the icon follows it) at a size, with the
 * corner radius iOS would mask it to.
 */
export function AppIconImage({ size, radius }: { readonly size: number; readonly radius: number }) {
  const form = useAppIconCompanion();
  return (
    <Image
      source={ICONS[form ?? 'sun']}
      accessibilityIgnoresInvertColors
      style={{ width: size, height: size, borderRadius: radius }}
    />
  );
}
