import { Text, View } from 'react-native';

import { SPLIT_MOST } from '@6pm/domain';

import { useI18n } from '../../i18n/i18n';
import { CategoryTile } from '../../ui/category-tile';
import { haptics } from '../../ui/haptics';
import { isSymbolName } from '../../ui/icons/symbol';
import { PressScale } from '../../ui/primitives/press-scale';
import { body, tabular } from '../../ui/type/fonts';
import { scanColours as c } from './scan-colours';

/**
 * A paper bill's chip: "Pays your Power & water" for a plan bill it matched, or "Add Power & water
 * to bills" for the kind of bill it reads as. Outlined in ink while on, as a picked category is.
 */
export function BillChip({
  label,
  icon,
  hue,
  on,
  onPress,
}: {
  readonly label: string;
  readonly icon: string;
  readonly hue: number;
  readonly on: boolean;
  readonly onPress: () => void;
}) {
  return (
    <PressScale
      accessibilityRole="checkbox"
      accessibilityState={{ checked: on }}
      accessibilityLabel={label}
      onPress={() => {
        haptics.tick();
        onPress();
      }}
      style={{
        alignSelf: 'flex-start',
        maxWidth: '100%',
        height: 44,
        paddingLeft: 6,
        paddingRight: 14,
        borderRadius: 99,
        borderWidth: 1.5,
        borderColor: on ? c.cardInk : c.walletBorder,
        backgroundColor: on ? c.walletPicked : 'transparent',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <CategoryTile
        icon={isSymbolName(icon) ? icon : 'receipt_long'}
        hue={hue}
        size={30}
        radius={99}
        glyph={17}
      />
      <Text numberOfLines={1} style={{ ...body(14, 600), color: c.cardInk, flexShrink: 1 }}>
        {label}
      </Text>
    </PressScale>
  );
}

/** A round − or + on the paper card. */
function StepButton({
  glyph,
  label,
  enabled,
  onPress,
}: {
  readonly glyph: string;
  readonly label: string;
  readonly enabled: boolean;
  readonly onPress: () => void;
}) {
  return (
    <PressScale
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !enabled }}
      onPress={() => {
        if (!enabled) return;
        haptics.tick();
        onPress();
      }}
      style={{
        width: 40,
        height: 40,
        borderRadius: 99,
        borderWidth: 1.5,
        borderColor: c.cardOutline,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: enabled ? 1 : 0.4,
      }}
    >
      <Text style={{ ...body(20, 600), color: c.cardInk }}>{glyph}</Text>
    </PressScale>
  );
}

/** How many people a big bill is split between, one to `SPLIT_MOST`: "Split · − 4 people +". */
export function SplitRow({
  people,
  onChange,
}: {
  readonly people: number;
  readonly onChange: (people: number) => void;
}) {
  const { t } = useI18n();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <Text style={{ ...body(14, 600), color: c.cardSoft, flex: 1 }}>
        {t('scan.receipt.split')}
      </Text>
      <StepButton
        glyph="−"
        label={t('scan.receipt.splitFewer')}
        enabled={people > 1}
        onPress={() => onChange(people - 1)}
      />
      <Text
        accessibilityLiveRegion="polite"
        style={{
          ...body(15, 600),
          ...tabular,
          color: c.cardInk,
          minWidth: 76,
          textAlign: 'center',
        }}
      >
        {t('scan.receipt.splitPeople', { count: people })}
      </Text>
      <StepButton
        glyph="+"
        label={t('scan.receipt.splitMore')}
        enabled={people < SPLIT_MOST}
        onPress={() => onChange(people + 1)}
      />
    </View>
  );
}
