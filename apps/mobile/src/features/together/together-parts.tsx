import * as AppleAuthentication from 'expo-apple-authentication';
import { Text, View } from 'react-native';

import { sharedPotProgress, type SharedPot } from '@6pm/domain';

import { useI18n } from '../../i18n/i18n';
import { CategoryTile } from '../../ui/category-tile';
import { haptics } from '../../ui/haptics';
import { isSymbolName, Symbol } from '../../ui/icons/symbol';
import { PressScale } from '../../ui/primitives/press-scale';
import { useTheme } from '../../ui/theme/theme';
import { body } from '../../ui/type/fonts';
import { usePotMoney } from './pot-money';

/**
 * Apple's own Sign in with Apple button, as Apple requires, sized and rounded like the sheet's
 * buttons: black on a light sheet, white on a dark one.
 */
export function AppleButton({
  onPress,
  disabled = false,
  join = false,
}: {
  readonly onPress: () => void;
  readonly disabled?: boolean;
  /** "Continue with Apple" for joining; "Sign in with Apple" to start. */
  readonly join?: boolean;
}) {
  const { palette } = useTheme();
  return (
    <View
      pointerEvents={disabled ? 'none' : 'auto'}
      style={{ height: 50, opacity: disabled ? 0.55 : 1 }}
    >
      <AppleAuthentication.AppleAuthenticationButton
        buttonType={
          join
            ? AppleAuthentication.AppleAuthenticationButtonType.CONTINUE
            : AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN
        }
        buttonStyle={
          palette.dark
            ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
            : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
        }
        cornerRadius={18}
        onPress={onPress}
        style={{ height: 50 }}
      />
    </View>
  );
}

/** A group of rows on one card, as Settings groups its rows. */
export function RowCard({ children }: { readonly children: React.ReactNode }) {
  const { palette } = useTheme();
  return (
    <View
      style={{
        borderRadius: 26,
        backgroundColor: palette.cell,
        boxShadow: palette.cardShadow,
        overflow: 'hidden',
      }}
    >
      {children}
    </View>
  );
}

/** One shared pot in the Budget together sheet: its tile, name and how full it is. */
export function SharedPotRow({
  pot,
  first,
  onPress,
}: {
  readonly pot: SharedPot;
  readonly first: boolean;
  readonly onPress: () => void;
}) {
  const { palette } = useTheme();
  const { t } = useI18n();
  const { money } = usePotMoney(pot.currency);
  const { saved } = sharedPotProgress(pot.goal, pot.contributions);
  return (
    <PressScale
      highlight
      accessibilityRole="button"
      onPress={() => {
        haptics.tick();
        onPress();
      }}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14 }}
    >
      <CategoryTile
        icon={isSymbolName(pot.icon) ? pot.icon : 'group'}
        hue={pot.hue}
        size={32}
        radius={10}
        glyph={19}
      />
      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          paddingVertical: 13,
          borderTopWidth: 0.5,
          borderTopColor: first ? 'transparent' : palette.hair,
        }}
      >
        <Text numberOfLines={1} style={{ flex: 1, ...body(16), color: palette.ink }}>
          {pot.name}
        </Text>
        <Text style={{ ...body(15), color: palette.inkSoft, fontVariant: ['tabular-nums'] }}>
          {`${money.short(saved)} ${t('plan.occasions.of', { amount: money.short(pot.goal) })}`}
        </Text>
        <Symbol name="chevron_right" size={20} color={palette.ink} style={{ opacity: 0.35 }} />
      </View>
    </PressScale>
  );
}

/** A plain row with an icon that does one thing (new shared pot). */
export function ActionRow({
  icon,
  label,
  first,
  onPress,
}: {
  readonly icon: 'add' | 'edit' | 'ios_share';
  readonly label: string;
  readonly first: boolean;
  readonly onPress: () => void;
}) {
  const { palette } = useTheme();
  return (
    <PressScale
      highlight
      accessibilityRole="button"
      onPress={onPress}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14 }}
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          backgroundColor: palette.chipBg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Symbol name={icon} size={19} color={palette.ink} />
      </View>
      <View
        style={{
          flex: 1,
          paddingVertical: 13,
          borderTopWidth: 0.5,
          borderTopColor: first ? 'transparent' : palette.hair,
        }}
      >
        <Text style={{ ...body(16), color: palette.ink }}>{label}</Text>
      </View>
    </PressScale>
  );
}
