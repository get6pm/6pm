import { useState } from 'react';
import { Text, View } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';

import { useI18n } from '../../i18n/i18n';
import { Symbol } from '../../ui/icons/symbol';
import { PressScale } from '../../ui/primitives/press-scale';
import { useTheme } from '../../ui/theme/theme';
import { body, tabular } from '../../ui/type/fonts';
import { SpendRow, type SpendRowView } from './spend-row';

const SHOWN = 4;
const layout = LinearTransition.springify().damping(22).stiffness(240);

/** "Today": the Inbox row when something waits, then the day's spends, newest first. */
export function TodayList({
  rows,
  waiting,
  spentLabel,
  onOpenInbox,
  onOpenSpend,
  onConfirm,
  onDelete,
}: {
  readonly rows: readonly SpendRowView[];
  readonly waiting: number;
  readonly spentLabel: string;
  readonly onOpenInbox: () => void;
  readonly onOpenSpend: (id: string) => void;
  readonly onConfirm: (id: string) => void;
  readonly onDelete: (id: string) => void;
}) {
  const { palette } = useTheme();
  const { t } = useI18n();
  const [all, setAll] = useState(false);
  const shown = all ? rows : rows.slice(0, SHOWN);

  return (
    <View style={{ gap: 10 }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          paddingHorizontal: 6,
        }}
      >
        <Text style={{ ...body(20, 700, -0.02), color: palette.ink }}>{t('today.list.title')}</Text>
        <Text style={{ ...body(14, 500), ...tabular, color: palette.inkSoft }}>
          {t('today.list.spent', { amount: spentLabel })}
        </Text>
      </View>
      <Animated.View
        layout={layout}
        style={{
          borderRadius: 26,
          backgroundColor: palette.cell,
          boxShadow: palette.cardShadow,
          overflow: 'hidden',
        }}
      >
        {waiting > 0 ? (
          <PressScale
            scaleTo={0.98}
            onPress={onOpenInbox}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              paddingVertical: 12,
              paddingLeft: 16,
              paddingRight: 14,
              borderBottomWidth: 0.5,
              borderBottomColor: palette.hair,
              backgroundColor: palette.dark ? 'rgba(255,133,82,.10)' : 'rgba(255,133,82,.14)',
            }}
          >
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: palette.accent,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Symbol name="inbox" size={21} color="#2a1424" />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ ...body(16, 600), color: palette.ink }}>
                {t('today.inbox.waiting', { count: waiting })}
              </Text>
              <Text style={{ ...body(13), color: palette.inkSoft }}>{t('today.inbox.sub')}</Text>
            </View>
            <Symbol name="chevron_right" size={22} color={palette.ink} style={{ opacity: 0.45 }} />
          </PressScale>
        ) : null}
        {rows.length === 0 ? (
          <Text style={{ ...body(15), lineHeight: 21.75, color: palette.inkSoft, padding: 18 }}>
            {t('today.list.empty')}
          </Text>
        ) : null}
        {shown.map((row) => (
          <SpendRow
            key={row.id}
            row={row}
            confirmLabel={t('today.row.confirm')}
            deleteLabel={t('today.row.delete')}
            onConfirm={onConfirm}
            onDelete={onDelete}
            onOpen={onOpenSpend}
          />
        ))}
        {rows.length > SHOWN ? (
          <PressScale
            scaleTo={1}
            onPress={() => setAll((v) => !v)}
            style={{
              height: 48,
              borderTopWidth: 0.5,
              borderTopColor: palette.hair,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
            }}
          >
            <Text style={{ ...body(14, 600), color: palette.inkSoft }}>
              {all ? t('today.list.showLess') : t('today.list.showAll', { count: rows.length })}
            </Text>
            <Symbol name={all ? 'expand_less' : 'expand_more'} size={18} color={palette.inkSoft} />
          </PressScale>
        ) : null}
      </Animated.View>
    </View>
  );
}
