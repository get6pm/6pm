import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { useI18n } from '../../i18n/i18n';
import { PressScale } from '../primitives/press-scale';
import { useTheme } from '../theme/theme';
import { body } from '../type/fonts';
import { SheetFrame } from './sheet-frame';

/**
 * The prototype's sheet: a grabber, a centred title with Done on the right, and a scrolling body
 * on the solid sheet colour. The native sheet underneath gives the drag-to-dismiss and dimming.
 */
export function SheetScreen({
  title,
  children,
  footer,
}: {
  readonly title: string;
  readonly children?: ReactNode;
  /** Pinned under the scroll area (e.g. "Confirm all"). */
  readonly footer?: ReactNode;
}) {
  const { palette } = useTheme();
  const { t } = useI18n();
  const router = useRouter();
  const header = (
    <View style={{ paddingTop: 8, paddingHorizontal: 18, paddingBottom: 6, gap: 6 }}>
      <View
        style={{
          alignSelf: 'center',
          width: 36,
          height: 5,
          borderRadius: 9,
          backgroundColor: palette.inkSoft,
          opacity: 0.35,
        }}
      />
      <View style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ ...body(17, 650), color: palette.ink }}>{title}</Text>
        <PressScale
          accessibilityRole="button"
          onPress={() => router.back()}
          hitSlop={8}
          style={{ position: 'absolute', right: 0, paddingVertical: 8, paddingHorizontal: 2 }}
        >
          <Text style={{ ...body(17, 650), color: palette.ink }}>{t('common.done')}</Text>
        </PressScale>
      </View>
    </View>
  );
  return (
    <SheetFrame header={header}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: 6, paddingHorizontal: 16, paddingBottom: 44, gap: 22 }}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
      {footer}
    </SheetFrame>
  );
}
