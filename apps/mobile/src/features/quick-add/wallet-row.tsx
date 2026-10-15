import { ScrollView, Text, View } from 'react-native';

import { BankLogo } from '../../ui/bank-logo/bank-logo';
import { haptics } from '../../ui/haptics';
import { Symbol } from '../../ui/icons/symbol';
import { PressScale } from '../../ui/primitives/press-scale';
import { useTheme } from '../../ui/theme/theme';
import { body } from '../../ui/type/fonts';
import type { WalletOption } from './wallet-options';

/** Which wallet paid: up to three share the row, more scroll sideways. */
export function WalletRow({
  options,
  value,
  onChange,
}: {
  readonly options: readonly WalletOption[];
  readonly value: string;
  readonly onChange: (value: string) => void;
}) {
  const { palette } = useTheme();
  const scrolls = options.length > 3;
  const chips = options.map((w) => {
    const on = w.value === value;
    return (
      <PressScale
        key={w.value}
        accessibilityRole="button"
        accessibilityState={{ selected: on }}
        onPress={() => {
          haptics.tick();
          onChange(w.value);
        }}
        style={{
          flex: scrolls ? undefined : 1,
          minWidth: scrolls ? 104 : undefined,
          paddingHorizontal: scrolls ? 14 : 0,
          height: 38,
          borderRadius: 12,
          backgroundColor: on ? palette.btnBg : palette.chipBg,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 5,
        }}
      >
        {w.bankId ? (
          <BankLogo
            id={w.bankId}
            size={17}
            radius={5}
            neutral={palette.ink}
            neutralInk={palette.cell}
          />
        ) : (
          <Symbol name={w.icon} size={17} color={on ? palette.btnFg : palette.ink} />
        )}
        <Text
          numberOfLines={1}
          style={{ ...body(13, 650), color: on ? palette.btnFg : palette.ink }}
        >
          {w.label}
        </Text>
      </PressScale>
    );
  });
  return scrolls ? (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ marginHorizontal: -16, flexGrow: 0 }}
      contentContainerStyle={{ gap: 6, paddingHorizontal: 16 }}
    >
      {chips}
    </ScrollView>
  ) : (
    <View style={{ flexDirection: 'row', gap: 6 }}>{chips}</View>
  );
}
