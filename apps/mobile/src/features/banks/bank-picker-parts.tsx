import { Canvas, Path } from '@shopify/react-native-skia';
import { Text, TextInput, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useReducedMotion,
  withTiming,
} from 'react-native-reanimated';

import { BankLogo } from '../../ui/bank-logo/bank-logo';
import { Symbol } from '../../ui/icons/symbol';
import { PressScale } from '../../ui/primitives/press-scale';
import { body } from '../../ui/type/fonts';
import { popEntering } from '../onboarding/onboarding-motion';

/** The inks the picker draws with, from whichever screen hosts it. */
export interface PickerInks {
  readonly ink: string;
  readonly inkSoft: string;
  readonly cell: string;
  readonly cardShadow: string;
  readonly chipBg: string;
  readonly hair: string;
  /** A picked tile's outline and a picked row's check. */
  readonly accent: string;
  /** The accent at zero alpha, so an outline fades in without passing through grey. */
  readonly accentClear: string;
  readonly onAccent: string;
}

/** Material's rounded "search" glyph, which the app's icon font does not carry. */
const SEARCH_PATH =
  'M15.5 14h-.79l-.28-.27c1.2-1.4 1.82-3.31 1.48-5.34-.47-2.78-2.79-5-5.59-5.34-4.23-.52-7.79 3.04-7.27 7.27.34 2.8 2.56 5.12 5.34 5.59 2.03.34 3.94-.28 5.34-1.48l.27.28v.79l4.25 4.25c.41.41 1.08.41 1.49 0 .41-.41.41-1.08 0-1.49L15.5 14zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z';

function SearchGlyph({ size, color }: { readonly size: number; readonly color: string }) {
  return (
    <Canvas style={{ width: size, height: size }}>
      <Path path={SEARCH_PATH} color={color} transform={[{ scale: size / 24 }]} />
    </Canvas>
  );
}

/** The search field: a magnifier, the query, and a clear button once there is one. */
export function SearchField({
  inks,
  value,
  placeholder,
  clearLabel,
  onChange,
}: {
  readonly inks: PickerInks;
  readonly value: string;
  readonly placeholder: string;
  readonly clearLabel: string;
  readonly onChange: (value: string) => void;
}) {
  return (
    <View
      style={{
        height: 44,
        borderRadius: 14,
        backgroundColor: inks.chipBg,
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: 12,
        paddingRight: 6,
        gap: 8,
      }}
    >
      <SearchGlyph size={20} color={inks.inkSoft} />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={inks.inkSoft}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
        enterKeyHint="search"
        accessibilityRole="search"
        style={{ flex: 1, minWidth: 0, height: 44, padding: 0, fontSize: 16, color: inks.ink }}
      />
      {value !== '' ? (
        <Animated.View entering={FadeIn.duration(150)} exiting={FadeOut.duration(120)}>
          <PressScale
            accessibilityRole="button"
            accessibilityLabel={clearLabel}
            hitSlop={8}
            onPress={() => onChange('')}
            style={{ padding: 4 }}
          >
            <Symbol name="cancel" size={20} fill={1} color={inks.inkSoft} />
          </PressScale>
        </Animated.View>
      ) : null}
    </View>
  );
}

/** "SUGGESTED FOR YOU" over a group. */
export function PickerLabel({ inks, text }: { readonly inks: PickerInks; readonly text: string }) {
  return (
    <Text
      accessibilityRole="header"
      style={{
        ...body(13, 600, 0.04),
        textTransform: 'uppercase',
        color: inks.inkSoft,
        paddingHorizontal: 6,
      }}
    >
      {text}
    </Text>
  );
}

/** The check badge on a picked tile, popping in as the prototype's does. */
function TileBadge({ inks }: { readonly inks: PickerInks }) {
  const reduceMotion = useReducedMotion();
  return (
    <Animated.View
      entering={popEntering(350, 0, reduceMotion)}
      style={{
        position: 'absolute',
        top: -6,
        right: -6,
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: inks.accent,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Symbol name="check" size={15} color={inks.onAccent} />
    </Animated.View>
  );
}

/** A quick-pick tile: the logo over the name, outlined and badged when picked. */
export function QuickTile({
  id,
  label,
  on,
  inks,
  onPress,
}: {
  readonly id: string;
  readonly label: string;
  readonly on: boolean;
  readonly inks: PickerInks;
  readonly onPress: () => void;
}) {
  const border = useAnimatedStyle(() => ({
    borderColor: withTiming(on ? inks.accent : inks.accentClear, { duration: 200 }),
  }));
  return (
    <PressScale
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: on }}
      accessibilityLabel={label}
    >
      <Animated.View
        style={[
          {
            height: 92,
            borderRadius: 22,
            borderWidth: 2,
            backgroundColor: inks.cell,
            boxShadow: inks.cardShadow,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            paddingHorizontal: 6,
          },
          border,
        ]}
      >
        <BankLogo
          id={id}
          size={34}
          radius={11}
          neutral={inks.ink}
          neutralInk={inks.cell}
          edge={inks.hair}
        />
        <Text numberOfLines={1} style={{ ...body(13, 650), color: inks.ink }}>
          {label}
        </Text>
      </Animated.View>
      {on ? <TileBadge inks={inks} /> : null}
    </PressScale>
  );
}

/** A row's round check: an empty ring that fills with the accent when picked. */
function RowCheck({ on, inks }: { readonly on: boolean; readonly inks: PickerInks }) {
  const ring = useAnimatedStyle(() => ({
    backgroundColor: withTiming(on ? inks.accent : inks.accentClear, { duration: 180 }),
    borderColor: withTiming(on ? inks.accent : inks.hair, { duration: 180 }),
  }));
  const tick = useAnimatedStyle(() => ({
    opacity: withTiming(on ? 1 : 0, { duration: 140 }),
    transform: [{ scale: withTiming(on ? 1 : 0.5, { duration: 180 }) }],
  }));
  return (
    <Animated.View
      style={[
        {
          width: 24,
          height: 24,
          borderRadius: 12,
          borderWidth: 1.5,
          alignItems: 'center',
          justifyContent: 'center',
        },
        ring,
      ]}
    >
      <Animated.View style={tick}>
        <Symbol name="check" size={16} weight={600} color={inks.onAccent} />
      </Animated.View>
    </Animated.View>
  );
}

/** One bank in a list: logo, short name over the registered name, and its check. */
export function BankRow({
  id,
  label,
  sub,
  on,
  first,
  inks,
  onPress,
}: {
  readonly id: string;
  readonly label: string;
  readonly sub: string;
  readonly on: boolean;
  readonly first: boolean;
  readonly inks: PickerInks;
  readonly onPress: () => void;
}) {
  return (
    <PressScale
      highlight
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: on }}
      accessibilityLabel={label}
      accessibilityHint={sub}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14 }}
    >
      <BankLogo
        id={id}
        size={32}
        radius={10}
        neutral={inks.ink}
        neutralInk={inks.cell}
        edge={inks.hair}
      />
      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          paddingVertical: 11,
          borderTopWidth: 0.5,
          borderTopColor: first ? 'transparent' : inks.hair,
        }}
      >
        <View style={{ flex: 1, gap: 2 }}>
          <Text numberOfLines={1} style={{ ...body(16), color: inks.ink }}>
            {label}
          </Text>
          <Text numberOfLines={1} style={{ ...body(12.5), color: inks.inkSoft }}>
            {sub}
          </Text>
        </View>
        <RowCheck on={on} inks={inks} />
      </View>
    </PressScale>
  );
}
