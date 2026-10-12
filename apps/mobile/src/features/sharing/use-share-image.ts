import type { SkImage } from '@shopify/react-native-skia';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Linking } from 'react-native';

import { useI18n } from '../../i18n/i18n';
import { haptics } from '../../ui/haptics';
import { useToast } from '../../ui/toast/toast-host';
import { canSaveImages, saveImage, shareImage } from './share-image';

/** Draws the image to send, only once it is asked for. */
export type MakeImage = () => Promise<SkImage>;

/**
 * Share and Save image for a view drawn as a PNG. A press gives a light tap at once; one image is
 * made at a time, so a second press while the first is on its way does nothing. A cancelled share
 * says nothing; a saved image gets the success haptic and a line. When Photos access is off, a
 * line says so and Save image turns into Open Settings until access comes back.
 */
export function useShareImage() {
  const { t } = useI18n();
  const toast = useToast();
  const busy = useRef(false);
  const [photosOff, setPhotosOff] = useState(false);

  useEffect(() => {
    if (!photosOff) return;
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      canSaveImages()
        .then((on) => on && setPhotosOff(false))
        .catch(() => undefined);
    });
    return () => subscription.remove();
  }, [photosOff]);

  const once = useCallback(
    async (work: () => Promise<void>) => {
      haptics.tap();
      if (busy.current) return;
      busy.current = true;
      try {
        await work();
      } catch {
        toast(t('sharing.failed'));
      } finally {
        busy.current = false;
      }
    },
    [t, toast],
  );

  const share = useCallback(
    (name: string, make: MakeImage) => once(async () => shareImage(await make(), name)),
    [once],
  );

  const save = useCallback(
    (name: string, make: MakeImage) => {
      if (photosOff) {
        haptics.tap();
        void Linking.openSettings();
        return Promise.resolve();
      }
      return once(async () => {
        if ((await saveImage(make, name)) === 'denied') {
          setPhotosOff(true);
          toast(t('sharing.photosOff'));
          return;
        }
        haptics.success();
        toast(t('sharing.saved'));
      });
    },
    [once, photosOff, t, toast],
  );

  return { share, save, photosOff };
}
