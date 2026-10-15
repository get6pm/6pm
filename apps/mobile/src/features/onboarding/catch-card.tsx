import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { Symbol } from '../../ui/icons/symbol';
import { PressScale } from '../../ui/primitives/press-scale';
import { body } from '../../ui/type/fonts';
import type { OnboardingPalette } from './onboarding-palette';

export interface CatchStatus {
  readonly label: string;
  /** Works already (green), or takes a minute to set up. */
  readonly ready: boolean;
}

export interface CatchAction {
  readonly label: string;
  /** The warm accent, for a set-up still to do. */
  readonly accent: boolean;
  readonly onPress: () => void;
}

/**
 * One way of catching spending: its live picture, its name, a line on what it does for you, and
 * at the foot whether it works already, with a button to see or set it up where there is one.
 */
export function CatchCard({
  pal,
  width,
  demo,
  title,
  text,
  status,
  action,
}: {
  readonly pal: OnboardingPalette;
  readonly width: number;
  readonly demo: ReactNode;
  readonly title: string;
  readonly text: string;
  readonly status: CatchStatus;
  readonly action?: CatchAction;
}) {
  const ink = status.ready ? pal.okInk : pal.inkSoft;
  return (
    <View
      style={{
        width,
        borderRadius: 28,
        backgroundColor: pal.cell,
        boxShadow: pal.cardShadow,
        padding: 10,
        gap: 12,
      }}
    >
      {demo}
      <View style={{ paddingHorizontal: 8, gap: 4 }}>
        <Text style={{ ...body(18, 650, -0.015), color: pal.ink }}>{title}</Text>
        <Text style={{ ...body(13.5), lineHeight: 18.9, color: pal.inkSoft }}>{text}</Text>
      </View>
      <View style={{ flex: 1 }} />
      <View style={{ flexDirection: 'row', gap: 8, marginHorizontal: 6, marginBottom: 6 }}>
        <View
          style={{
            flex: 1,
            height: 42,
            borderRadius: 99,
            paddingHorizontal: 12,
            backgroundColor: status.ready ? pal.greenSoft : pal.chipBg,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <Symbol name={status.ready ? 'check_circle' : 'schedule'} size={18} color={ink} />
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.85}
            style={{ ...body(13.5, 650), color: ink, flexShrink: 1 }}
          >
            {status.label}
          </Text>
        </View>
        {action ? (
          <PressScale scaleTo={0.95} accessibilityRole="button" onPress={action.onPress}>
            <View
              style={{
                height: 42,
                borderRadius: 99,
                paddingLeft: 16,
                paddingRight: 10,
                backgroundColor: action.accent ? pal.accent : pal.btnBg,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <Text style={{ ...body(14, 700), color: action.accent ? pal.onAccent : pal.btnFg }}>
                {action.label}
              </Text>
              <Symbol
                name="chevron_right"
                size={18}
                color={action.accent ? pal.onAccent : pal.btnFg}
              />
            </View>
          </PressScale>
        ) : null}
      </View>
    </View>
  );
}
