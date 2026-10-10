import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { aboutPerDay, formatShort, potMonthlyNeed } from '@6pm/domain';
import { categoryTile } from '@6pm/theme';

import { useMoney } from '../data/money-provider';
import { usePlanActions } from '../data/plan-actions';
import {
  PotIconPicker,
  PotTemplates,
  RoundButton,
  type PotDraft,
} from '../features/plan/new-pot-picker';
import { usePlanFormat } from '../features/plan/plan-format';
import { potMonthAt, stepPotMonth, POT_MONTHS_AHEAD } from '../features/plan/plan-view';
import { useI18n } from '../i18n/i18n';
import { useCompanionToast } from '../features/companion/use-companion-toast';
import { haptics } from '../ui/haptics';
import { Symbol } from '../ui/icons/symbol';
import { SheetFrame } from '../ui/navigation/sheet-frame';
import { PressScale } from '../ui/primitives/press-scale';
import { useTheme } from '../ui/theme/theme';
import { body, display, families, tabular } from '../ui/type/fonts';

const GOAL_STEP = 500_000;
// A text field takes no font axes: the display face at its weight, size and tracking.
const NAME_SIZE = 30;
const LAST_AHEAD = POT_MONTHS_AHEAD[POT_MONTHS_AHEAD.length - 1] ?? 8;

/**
 * New pot: name it (or start from a template), pick its icon and colour, set a goal and the month
 * it is needed by. The monthly set-aside it will take, and what that does to a day, update live.
 */
export default function NewPot() {
  const router = useRouter();
  const { palette } = useTheme();
  const { t } = useI18n();
  const say = useCompanionToast();
  const snap = useMoney();
  const actions = usePlanActions();
  const format = usePlanFormat(snap.today);
  const [draft, setDraft] = useState<PotDraft>({
    name: '',
    icon: 'celebration',
    hue: 85,
    goal: 2_000_000,
    ahead: 3,
  });
  const [picking, setPicking] = useState(false);
  const change = (patch: Partial<PotDraft>) => setDraft((d) => ({ ...d, ...patch }));
  const named = draft.name.trim().length > 0;
  const month = potMonthAt(snap.today, draft.ahead);
  const monthly = potMonthlyNeed(draft.goal, 0, draft.ahead || null);
  const tile = categoryTile(draft.hue);
  const cta = useAnimatedStyle(() => ({
    opacity: withTiming(named ? 1 : 0.35, { duration: 200 }),
  }));

  const start = async () => {
    if (!named) return;
    await actions.createPot({
      name: draft.name,
      icon: draft.icon,
      hue: draft.hue,
      goal: draft.goal,
      neededBy: month,
    });
    haptics.success();
    router.back();
    say('potMade');
  };

  const header = (
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
        <Text style={{ ...body(17, 650), color: palette.ink }}>{t('plan.occasions.newPot')}</Text>
        <View style={{ width: 70 }} />
      </View>
    </View>
  );

  const row = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    minHeight: 58,
  } as const;

  return (
    <SheetFrame header={header}>
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
            <Symbol name={draft.icon} size={40} fill={1} weight={500} color={tile.glyph} />
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
            value={draft.name}
            onChangeText={(name) => change({ name })}
            placeholder={t('plan.pot.placeholder')}
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

        {picking ? <PotIconPicker draft={draft} onChange={change} /> : null}
        {!picking && !named ? <PotTemplates onPick={setDraft} /> : null}

        <View
          style={{
            borderRadius: 22,
            backgroundColor: palette.cell,
            boxShadow: palette.cardShadow,
            overflow: 'hidden',
          }}
        >
          <View style={row}>
            <Text style={{ ...body(16), flex: 1, color: palette.ink }}>{t('plan.pot.goal')}</Text>
            <RoundButton
              icon="remove"
              filled
              label={t('plan.pot.less')}
              onPress={() => {
                haptics.tick();
                change({ goal: Math.max(GOAL_STEP, draft.goal - GOAL_STEP) });
              }}
            />
            <Text
              style={{
                ...display(24, 500),
                ...tabular,
                minWidth: 64,
                textAlign: 'center',
                color: palette.ink,
              }}
            >
              {formatShort(draft.goal)}
            </Text>
            <RoundButton
              icon="add"
              filled
              label={t('plan.pot.more')}
              onPress={() => {
                haptics.tick();
                change({ goal: draft.goal + GOAL_STEP });
              }}
            />
          </View>
          <View style={[row, { borderTopWidth: 0.5, borderColor: palette.hair }]}>
            <Text style={{ ...body(16), flex: 1, color: palette.ink }}>
              {t('plan.pot.neededBy')}
            </Text>
            <RoundButton
              icon="chevron_left"
              filled={false}
              dim={draft.ahead === 0}
              label={t('plan.pot.earlier')}
              onPress={() => {
                haptics.tick();
                change({ ahead: stepPotMonth(draft.ahead, -1) });
              }}
            />
            <Text
              style={{ ...body(16, 650), minWidth: 96, textAlign: 'center', color: palette.ink }}
            >
              {month ? format.monthLong(month) : t('plan.pot.noDate')}
            </Text>
            <RoundButton
              icon="chevron_right"
              filled={false}
              dim={draft.ahead >= LAST_AHEAD}
              label={t('plan.pot.later')}
              onPress={() => {
                haptics.tick();
                change({ ahead: stepPotMonth(draft.ahead, 1) });
              }}
            />
          </View>
        </View>

        <View style={{ alignItems: 'center', gap: 3, paddingHorizontal: 10 }}>
          <Text style={{ ...body(15.5, 650), color: palette.ink, textAlign: 'center' }}>
            {month
              ? t('plan.pot.sumMonthly', { amount: formatShort(monthly) })
              : t('plan.pot.sumNone')}
          </Text>
          <Text
            style={{ ...body(13), lineHeight: 18.2, color: palette.inkSoft, textAlign: 'center' }}
          >
            {month
              ? t('plan.pot.sumMonthlySub', {
                  amount: formatShort(aboutPerDay(monthly, snap.cycle.daysLeft)),
                })
              : t('plan.pot.sumNoneSub')}
          </Text>
        </View>

        <Animated.View style={cta}>
          <PressScale
            scaleTo={0.95}
            accessibilityRole="button"
            accessibilityState={{ disabled: !named }}
            onPress={() => void start()}
            style={{
              height: 56,
              borderRadius: 99,
              backgroundColor: palette.btnBg,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ ...body(17, 650), color: palette.btnFg }}>{t('plan.pot.start')}</Text>
          </PressScale>
        </Animated.View>
      </ScrollView>
    </SheetFrame>
  );
}
