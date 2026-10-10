import { Text, View } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';

import { needsReview } from '@6pm/domain';

import { useMoney, useMoneyActions } from '../data/money-provider';
import { InboxRow } from '../features/inbox/inbox-row';
import { useSpendRows } from '../features/today/use-spend-rows';
import { useI18n } from '../i18n/i18n';
import { haptics } from '../ui/haptics';
import { SheetScreen } from '../ui/navigation/sheet-screen';
import { PressScale } from '../ui/primitives/press-scale';
import { useTheme } from '../ui/theme/theme';
import { body, display } from '../ui/type/fonts';
import { Companion } from '../ui/companion/companion';

export default function Inbox() {
  const { palette } = useTheme();
  const { t, weekday } = useI18n();
  const snap = useMoney();
  const actions = useMoneyActions();
  // Oldest first: the order they were caught in.
  const waiting = snap.cycleSpends.filter(needsReview).slice().reverse();
  const todays = useSpendRows(
    waiting.filter((s) => s.day === snap.today),
    { category: false },
  );
  const earlier = useSpendRows(
    waiting.filter((s) => s.day < snap.today),
    { category: false },
  );
  const keep = (id: string) => {
    haptics.tap();
    void actions.setStatus(id, 'kept');
  };
  const keepAll = () => {
    haptics.success();
    for (const s of waiting) void actions.setStatus(s.id, 'kept');
  };
  const section = (label: string, rows: typeof todays) =>
    rows.length === 0 ? null : (
      <View style={{ gap: 8 }}>
        <Text
          style={{
            ...body(13, 600, 0.04),
            textTransform: 'uppercase',
            color: palette.inkSoft,
            paddingHorizontal: 6,
          }}
        >
          {label}
        </Text>
        <Animated.View
          layout={LinearTransition.springify().damping(22).stiffness(240)}
          style={{
            borderRadius: 26,
            backgroundColor: palette.cell,
            boxShadow: palette.cardShadow,
            overflow: 'hidden',
          }}
        >
          {rows.map((row) => (
            <InboxRow key={row.id} row={row} keepLabel={t('inbox.keep')} onKeep={keep} />
          ))}
        </Animated.View>
      </View>
    );

  return (
    <SheetScreen title={t('inbox.title')}>
      {waiting.length === 0 ? (
        <View style={{ alignItems: 'center', gap: 10, paddingVertical: 60, paddingHorizontal: 20 }}>
          <Companion size={76} mood="happy" />
          <Text style={{ ...display(34), color: palette.ink }}>{t('inbox.empty.title')}</Text>
          <Text style={{ ...body(15), color: palette.inkSoft, textAlign: 'center' }}>
            {t('inbox.empty.sub')}
          </Text>
        </View>
      ) : (
        <>
          {section(t('inbox.today', { weekday: weekday(new Date()) }), todays)}
          {section(
            t('inbox.afterClose', { weekday: weekday(new Date(Date.now() - 864e5)) }),
            earlier,
          )}
          <View style={{ gap: 12, alignItems: 'center' }}>
            <PressScale
              scaleTo={0.97}
              accessibilityRole="button"
              onPress={keepAll}
              style={{
                alignSelf: 'stretch',
                height: 52,
                borderRadius: 99,
                backgroundColor: palette.btnBg,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ ...body(17, 650), color: palette.btnFg }}>
                {t('inbox.confirmAll', { count: waiting.length })}
              </Text>
            </PressScale>
            <Text style={{ ...body(13), color: palette.inkSoft }}>{t('inbox.orAtSix')}</Text>
          </View>
        </>
      )}
    </SheetScreen>
  );
}
