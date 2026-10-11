import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { useI18n } from '../../i18n/i18n';
import { haptics } from '../../ui/haptics';
import { PressScale } from '../../ui/primitives/press-scale';
import { useTheme } from '../../ui/theme/theme';
import { body, display, tabular } from '../../ui/type/fonts';
import { RoundButton } from './new-pot-picker';

/** A row of a settings card: a label, then controls. */
export const potRow = {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 12,
  paddingHorizontal: 16,
  minHeight: 58,
} as const;

/** The card the rows sit on. */
export function PotCard({ children }: { readonly children: ReactNode }) {
  const { palette } = useTheme();
  return (
    <View
      style={{
        borderRadius: 22,
        backgroundColor: palette.cell,
        boxShadow: palette.cardShadow,
        overflow: 'hidden',
      }}
    >
      {children}
    </View>
  );
}

/** A "label  −  value  +" row. */
export function StepperRow({
  label,
  value,
  lessLabel,
  moreLabel,
  dimLess,
  dimMore,
  onStep,
  width,
  first,
}: {
  readonly label: string;
  readonly value: string;
  readonly lessLabel: string;
  readonly moreLabel: string;
  readonly dimLess?: boolean;
  readonly dimMore?: boolean;
  readonly onStep: (by: 1 | -1) => void;
  readonly width: number;
  readonly first?: boolean;
}) {
  const { palette } = useTheme();
  return (
    <View style={[potRow, first ? null : { borderTopWidth: 0.5, borderColor: palette.hair }]}>
      <Text style={{ ...body(16), flex: 1, color: palette.ink }}>{label}</Text>
      <RoundButton
        icon="remove"
        filled
        dim={dimLess ?? false}
        label={lessLabel}
        onPress={() => {
          haptics.tick();
          onStep(-1);
        }}
      />
      <Text
        style={{
          ...display(22, 500),
          ...tabular,
          minWidth: width,
          textAlign: 'center',
          color: palette.ink,
        }}
      >
        {value}
      </Text>
      <RoundButton
        icon="add"
        filled
        dim={dimMore ?? false}
        label={moreLabel}
        onPress={() => {
          haptics.tick();
          onStep(1);
        }}
      />
    </View>
  );
}

/** The top of an edit sheet: the grabber, Cancel and the title. */
export function SheetHeader({ title }: { readonly title: string }) {
  const router = useRouter();
  const { palette } = useTheme();
  const { t } = useI18n();
  return (
    <View style={{ paddingTop: 8, paddingHorizontal: 18, gap: 6 }}>
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
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <PressScale onPress={() => router.back()} style={{ width: 70, paddingVertical: 6 }}>
          <Text style={{ ...body(16), color: palette.inkSoft }}>{t('quick.cancel')}</Text>
        </PressScale>
        <Text style={{ ...body(17, 650), color: palette.ink }}>{title}</Text>
        <View style={{ width: 70 }} />
      </View>
    </View>
  );
}
