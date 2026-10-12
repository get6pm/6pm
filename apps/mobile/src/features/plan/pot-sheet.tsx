import { useState, type ReactNode } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { formatShort } from '@6pm/domain';
import { categoryTile } from '@6pm/theme';

import { useI18n } from '../../i18n/i18n';
import { haptics } from '../../ui/haptics';
import { Symbol } from '../../ui/icons/symbol';
import type { SymbolName } from '../../ui/icons/symbols.generated';
import { SheetFrame } from '../../ui/navigation/sheet-frame';
import { PressScale } from '../../ui/primitives/press-scale';
import { useTheme } from '../../ui/theme/theme';
import { body, families } from '../../ui/type/fonts';
import { PotIconPicker, PotTemplates, RoundButton, type PotDraft } from './new-pot-picker';
import { stepGoal } from './plan-view';
import { PotCard, potRow, SheetHeader, StepperRow } from './pot-rows';

/** What a pot's sheet edits: how it looks and what it is saving for. */
export interface PotFields {
  readonly name: string;
  readonly icon: SymbolName;
  readonly hue: number;
  readonly goal: number;
}

// A text field takes no font axes: the display face at its weight, size and tracking.
const NAME_SIZE = 30;

export interface PotSheetProps {
  readonly title: string;
  readonly placeholder: string;
  readonly fields: PotFields;
  readonly onChange: (patch: Partial<PotFields>) => void;
  /** Starting points under the name until it is filled in: new pots only. */
  readonly onTemplate?: ((draft: PotDraft) => void) | undefined;
  /** "Needed by": the month, or null for no date; chevrons step it. */
  readonly month: string | null;
  readonly monthLabel: string;
  readonly canEarlier: boolean;
  readonly canLater: boolean;
  readonly onStepMonth: (by: 1 | -1) => void;
  /** More rows on the card (a goal's share, pause). */
  readonly rows?: ReactNode;
  readonly summary: { readonly title: string; readonly sub: string };
  readonly cta: {
    readonly label: string;
    readonly enabled: boolean;
    readonly onPress: () => void;
  };
  /** Under the button: delete. */
  readonly footer?: ReactNode;
}

/**
 * The sheet a pot or goal is made and edited on: name it, pick its icon and colour, set the goal
 * and the month it is needed by. What it will set aside, and what that does to a day, update live.
 */
export function PotSheet(props: PotSheetProps) {
  const { fields, onChange, cta } = props;
  const { palette } = useTheme();
  const { t, language } = useI18n();
  const [picking, setPicking] = useState(false);
  const named = fields.name.trim().length > 0;
  const tile = categoryTile(fields.hue);
  const ready = named && cta.enabled;
  const button = useAnimatedStyle(() => ({
    opacity: withTiming(ready ? 1 : 0.35, { duration: 200 }),
  }));

  return (
    <SheetFrame header={<SheetHeader title={props.title} />}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: 14,
          paddingHorizontal: 18,
          paddingBottom: 28,
          gap: 20,
        }}
      >
        <View style={{ alignItems: 'center', gap: 12 }}>
          <PressScale
            accessibilityRole="button"
            accessibilityLabel={t('plan.pot.pickIcon')}
            accessibilityState={{ expanded: picking }}
            onPress={() => {
              haptics.tick();
              setPicking((p) => !p);
            }}
            style={{
              width: 76,
              height: 76,
              borderRadius: 26,
              experimental_backgroundImage: `linear-gradient(155deg, ${tile.from} 0%, ${tile.to} 100%)`,
              boxShadow:
                'inset 0 1px 0 rgba(255,255,255,.55), inset 0 -2px 0 rgba(60,20,40,.08), 0 8px 20px rgba(30,10,40,.22)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Symbol name={fields.icon} size={40} fill={1} weight={500} color={tile.glyph} />
            <View
              style={{
                position: 'absolute',
                right: -5,
                bottom: -5,
                width: 26,
                height: 26,
                borderRadius: 13,
                backgroundColor: palette.btnBg,
                boxShadow: `0 0 0 3px ${palette.sheetSolid}`,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Symbol name={picking ? 'check' : 'edit'} size={15} color={palette.btnFg} />
            </View>
          </PressScale>
          <TextInput
            value={fields.name}
            onChangeText={(name) => onChange({ name })}
            placeholder={props.placeholder}
            placeholderTextColor={palette.inkSoft}
            returnKeyType="done"
            style={{
              alignSelf: 'stretch',
              textAlign: 'center',
              padding: 0,
              fontFamily: families.display,
              fontSize: NAME_SIZE,
              fontWeight: '500',
              letterSpacing: -0.015 * NAME_SIZE,
              color: palette.ink,
            }}
          />
        </View>

        {picking ? <PotIconPicker draft={fields} onChange={onChange} /> : null}
        {!picking && !named && props.onTemplate ? <PotTemplates onPick={props.onTemplate} /> : null}

        <PotCard>
          <StepperRow
            first
            label={t('plan.pot.goal')}
            value={formatShort(fields.goal, language)}
            lessLabel={t('plan.pot.less')}
            moreLabel={t('plan.pot.more')}
            width={64}
            onStep={(by) => onChange({ goal: stepGoal(fields.goal, by) })}
          />
          <View style={[potRow, { borderTopWidth: 0.5, borderColor: palette.hair }]}>
            <Text style={{ ...body(16), flex: 1, color: palette.ink }}>
              {t('plan.pot.neededBy')}
            </Text>
            <RoundButton
              icon="chevron_left"
              filled={false}
              dim={!props.canEarlier}
              label={t('plan.pot.earlier')}
              onPress={() => {
                haptics.tick();
                props.onStepMonth(-1);
              }}
            />
            <Text
              style={{ ...body(16, 650), minWidth: 96, textAlign: 'center', color: palette.ink }}
            >
              {props.monthLabel}
            </Text>
            <RoundButton
              icon="chevron_right"
              filled={false}
              dim={!props.canLater}
              label={t('plan.pot.later')}
              onPress={() => {
                haptics.tick();
                props.onStepMonth(1);
              }}
            />
          </View>
          {props.rows}
        </PotCard>

        <View style={{ alignItems: 'center', gap: 3, paddingHorizontal: 10 }}>
          <Text style={{ ...body(15.5, 650), color: palette.ink, textAlign: 'center' }}>
            {props.summary.title}
          </Text>
          <Text
            style={{ ...body(13), lineHeight: 18.2, color: palette.inkSoft, textAlign: 'center' }}
          >
            {props.summary.sub}
          </Text>
        </View>

        <Animated.View style={button}>
          <PressScale
            scaleTo={0.95}
            accessibilityRole="button"
            accessibilityState={{ disabled: !ready }}
            disabled={!ready}
            onPress={cta.onPress}
            style={{
              height: 56,
              borderRadius: 99,
              backgroundColor: palette.btnBg,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ ...body(17, 650), color: palette.btnFg }}>{cta.label}</Text>
          </PressScale>
        </Animated.View>
        {props.footer}
      </ScrollView>
    </SheetFrame>
  );
}
