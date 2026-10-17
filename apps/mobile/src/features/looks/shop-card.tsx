import { memo, useEffect, useRef } from 'react';
import { StyleSheet, Text, useWindowDimensions, View, type HostInstance } from 'react-native';

import { useSharedValue } from 'react-native-reanimated';

import { clockOf } from '@6pm/domain';
import { configFor, lookById, swatchesFor, type LookConfig, type LookId } from '@6pm/theme';

import { useI18n } from '../../i18n/i18n';
import { Symbol } from '../../ui/icons/symbol';
import { PressScale } from '../../ui/primitives/press-scale';
import { Sky } from '../../ui/sky/sky';
import { useClock } from '../../ui/theme/clock';
import { body, display, leading, mono } from '../../ui/type/fonts';
import { useLookPreview } from './look-preview';
import { isScene, type CardBadge } from './look-catalogue';
import type { LookCopy } from './look-copy';

/** A card's place on the screen, for the sky that grows out of it. */
export interface CardRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/** The prototype's badge colours: white for the look in use, dark for one that is yours, the look's accent otherwise. */
function badgeColours(badge: CardBadge, accent: string) {
  if (badge === 'inUse') return { bg: '#ffffff', fg: '#16131c' };
  if (badge === 'price') return { bg: accent, fg: '#1d1220' };
  return { bg: 'rgba(10,8,16,.55)', fg: '#ffffff' };
}

/**
 * One look in the shop's pager (prototype `App:886-903`): the look's real sky at the shop's hour,
 * as Today would draw it, cut to the card, with the date and the clock on it; its badge; and a
 * cell in the look's own colours with its name, tag, palette and what tapping it does. Only the
 * card in front runs its sky's clock; the ones beside it hold still.
 */
export const ShopCard = memo(function ShopCard({
  look,
  width,
  height,
  hour,
  config,
  focused,
  badge,
  badgeText,
  cta,
  copy,
  onOpen,
}: {
  readonly look: LookId;
  readonly width: number;
  readonly height: number;
  readonly hour: number;
  readonly config: Partial<LookConfig> | undefined;
  readonly focused: boolean;
  readonly badge: CardBadge;
  readonly badgeText: string | null;
  readonly cta: string;
  readonly copy: LookCopy;
  readonly onOpen: (look: LookId, rect: CardRect | null) => void;
}) {
  const { t, weekday, dayMonth } = useI18n();
  const { dayDate } = useClock();
  const screen = useWindowDimensions();
  const { palette: own } = useLookPreview(look, hour, config);
  const def = lookById(look);
  const variant = configFor(look, config).v;
  const swatches = swatchesFor(look, variant);
  const colours = badgeColours(badge, own.accent);
  const name = copy.name(look);
  const scale = width / screen.width;

  const active = useSharedValue(focused);
  useEffect(() => active.set(focused), [active, focused]);

  const frame = useRef<HostInstance>(null);
  const open = () => {
    const node = frame.current;
    if (!node) return onOpen(look, null);
    node.measureInWindow((x, y, w, h) => onOpen(look, { x, y, width: w, height: h }));
  };

  return (
    <PressScale
      accessibilityRole="button"
      accessibilityLabel={name}
      accessibilityHint={copy.tag(look)}
      scaleTo={0.985}
      inScroll
      onPress={open}
      style={{ width, height, borderRadius: 32, boxShadow: own.cardShadow }}
    >
      <View
        ref={frame}
        collapsable={false}
        style={{ flex: 1, borderRadius: 32, overflow: 'hidden', backgroundImage: own.sky }}
      >
        <Sky
          look={look}
          hour={hour}
          serious={false}
          active={active}
          preview={{ width, height }}
          {...(config ? { config } : {})}
        />
        {/* The date and the clock where Today has them, shrunk with the sky. */}
        <View
          pointerEvents="none"
          style={[
            styles.screen,
            { width: screen.width, height: screen.height, transform: [{ scale }] },
          ]}
        >
          <View style={{ position: 'absolute', left: 26, top: 238, gap: 12 }}>
            <Text
              style={{
                ...mono(12, 400, 0.14),
                textTransform: 'uppercase',
                color: own.inkSoft,
              }}
            >
              {`${weekday(dayDate)} · ${dayMonth(dayDate)}`}
            </Text>
            <Text
              style={{
                ...leading(display(64, 400, -0.02, own.dispFont), 64, true),
                fontVariant: ['tabular-nums'],
                color: own.ink,
              }}
            >
              {clockOf(hour)}
            </Text>
          </View>
        </View>

        <View pointerEvents="none" style={styles.top}>
          {badgeText ? (
            <View style={[styles.pill, { paddingHorizontal: 11, backgroundColor: colours.bg }]}>
              <Text style={{ ...body(12, 700), color: colours.fg }}>{badgeText}</Text>
            </View>
          ) : (
            <View />
          )}
          {isScene(look) ? (
            <View
              style={[
                styles.pill,
                {
                  paddingLeft: 8,
                  paddingRight: 11,
                  backgroundColor: 'rgba(10,8,16,.5)',
                  flexDirection: 'row',
                  gap: 4,
                },
              ]}
            >
              <Symbol name="smartphone" size={15} color="#ffffff" />
              <Text style={{ ...body(11.5, 700), color: '#ffffff' }}>{t('looks.card.moves')}</Text>
            </View>
          ) : null}
        </View>

        <View
          style={{
            position: 'absolute',
            left: 14,
            right: 14,
            bottom: 14,
            borderRadius: 22,
            paddingTop: 16,
            paddingHorizontal: 16,
            paddingBottom: 14,
            backgroundColor: own.cell,
            boxShadow: own.cardShadow,
            gap: 12,
          }}
        >
          <View style={{ gap: 5 }}>
            <Text
              numberOfLines={1}
              style={{ ...leading(display(30, 500, -0.01, def.font), 31.5, true), color: own.ink }}
            >
              {name}
            </Text>
            <Text numberOfLines={2} style={{ ...body(13.5), lineHeight: 18.9, color: own.inkSoft }}>
              {copy.tag(look)}
            </Text>
          </View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 1 }}>
              {swatches.slice(0, 3).map((colour, i) => (
                <View
                  key={i}
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 9,
                    marginLeft: i === 0 ? 0 : -5,
                    backgroundColor: colour,
                    boxShadow: `0 0 0 2px ${own.cell}`,
                  }}
                />
              ))}
              <Text
                numberOfLines={1}
                style={{ ...body(12.5, 600), marginLeft: 8, flexShrink: 1, color: own.inkSoft }}
              >
                {copy.variant(look, variant)}
              </Text>
            </View>
            <View
              style={{
                height: 38,
                paddingHorizontal: 15,
                borderRadius: 99,
                backgroundColor: own.ink,
                justifyContent: 'center',
              }}
            >
              <Text numberOfLines={1} style={{ ...body(13.5, 700), color: own.cell }}>
                {cta}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </PressScale>
  );
});

const styles = StyleSheet.create({
  screen: { position: 'absolute', left: 0, top: 0, transformOrigin: '0 0' },
  top: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  pill: { height: 26, borderRadius: 99, alignItems: 'center', justifyContent: 'center' },
});
