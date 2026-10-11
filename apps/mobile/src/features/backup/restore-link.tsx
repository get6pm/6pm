import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { useI18n } from '../../i18n/i18n';
import { haptics } from '../../ui/haptics';
import { PressScale } from '../../ui/primitives/press-scale';
import { body } from '../../ui/type/fonts';
import { useBackupService } from './use-backup';

/**
 * "Restore from backup", shown under the welcome step's button, and only when this iPhone holds a
 * key in iCloud Keychain whose backup is waiting on the server (a new iPhone, or a reinstall).
 * Shows nothing otherwise, and nothing while it checks: it fades in when there is a backup.
 */
export function RestoreFromBackupLink({ color }: { readonly color: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const service = useBackupService();
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    let live = true;
    service.hasUnclaimedBackup().then(
      (found) => live && setAvailable(found),
      () => undefined,
    );
    return () => {
      live = false;
    };
  }, [service]);

  if (!available) return null;
  return (
    <Animated.View entering={FadeIn.duration(350)} style={{ alignItems: 'center' }}>
      <PressScale
        accessibilityRole="button"
        hitSlop={10}
        onPress={() => {
          haptics.tap();
          router.push({ pathname: '/backup', params: { restore: '1' } });
        }}
        style={{ paddingVertical: 12, paddingHorizontal: 16 }}
      >
        <Text style={{ ...body(16, 600), color }}>{t('backup.restore.link')}</Text>
      </PressScale>
    </Animated.View>
  );
}
