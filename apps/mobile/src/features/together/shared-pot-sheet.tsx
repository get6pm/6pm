import { randomUUID } from 'expo-crypto';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import {
  formatShort,
  moneyDayOf,
  sharedPotProgress,
  sharedTopUp,
  stepContribution,
  type SharedContribution,
  type TogetherState,
} from '@6pm/domain';

import { useMoney } from '../../data/money-provider';
import { useI18n } from '../../i18n/i18n';
import { CategoryTile } from '../../ui/category-tile';
import { haptics } from '../../ui/haptics';
import { isSymbolName } from '../../ui/icons/symbol';
import { SheetScreen } from '../../ui/navigation/sheet-screen';
import { PressScale } from '../../ui/primitives/press-scale';
import { useTheme } from '../../ui/theme/theme';
import { useToast } from '../../ui/toast/toast-host';
import { body, display } from '../../ui/type/fonts';
import { BackupButton, BackupNote } from '../backup/backup-parts';
import { usePlanFormat } from '../plan/plan-format';
import { PotCard, StepperRow } from '../plan/pot-rows';
import { TOP_UP } from '../plan/plan-view';
import { ActionRow, RowCard } from './together-parts';
import { useTogether, useTogetherRun } from './together-provider';
import { partnerOf } from './together-state';
import { useArmed } from './use-armed';

/**
 * One shared pot: how full it is, what to add, who put in what (the person can take back their
 * own), and editing or deleting it. A pot the partner deleted says so.
 */
export function SharedPotSheet() {
  const { id = '' } = useLocalSearchParams<{ id?: string }>();
  const { t, language } = useI18n();
  const { palette } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const run = useTogetherRun();
  const { state } = useTogether();
  const { armed, confirm } = useArmed<'delete'>();
  const pot = state.pair?.pots.find((p) => p.id === id);
  const [amount, setAmount] = useState(TOP_UP);
  const short = (n: number) => formatShort(n, language);

  if (pot === undefined || state.me === null) {
    return (
      <SheetScreen title={t('together.pots.title')} gap={12}>
        <BackupNote>{t('together.pot.gone')}</BackupNote>
      </SheetScreen>
    );
  }
  const me = state.me;
  const progress = sharedPotProgress(pot.goal, pot.contributions);
  const toAdd = sharedTopUp(pot.goal, progress.saved, amount);

  const add = () => {
    if (toAdd === 0) return;
    haptics.tap();
    void run({
      kind: 'addContribution',
      id: randomUUID(),
      potId: pot.id,
      amount: toAdd,
      addedAt: new Date().toISOString(),
    }).then((ok) => ok && haptics.success());
  };
  const remove = () => {
    if (!confirm('delete')) return;
    void run({ kind: 'deletePot', id: pot.id }).then((ok) => {
      if (!ok) return;
      router.back();
      toast(t('together.pot.deleted', { name: pot.name }));
    });
  };

  return (
    <SheetScreen title={pot.name} gap={12}>
      <View style={{ alignItems: 'center', gap: 10, paddingVertical: 6 }}>
        <CategoryTile
          icon={isSymbolName(pot.icon) ? pot.icon : 'group'}
          hue={pot.hue}
          size={64}
          radius={22}
          glyph={34}
        />
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
          <Text style={{ ...display(40, 500, -0.02), color: palette.ink }}>
            {short(progress.saved)}
          </Text>
          <Text style={{ ...body(15, 600), color: palette.inkSoft }}>
            {t('plan.occasions.of', { amount: short(pot.goal) })}
          </Text>
        </View>
      </View>

      {progress.full ? null : (
        <>
          <PotCard>
            <StepperRow
              first
              label={t('together.pot.amount')}
              value={short(amount)}
              lessLabel={t('plan.pot.less')}
              moreLabel={t('plan.pot.more')}
              dimLess={amount <= TOP_UP / 2}
              dimMore={amount >= progress.left}
              width={72}
              onStep={(by) => setAmount((a) => stepContribution(a, by))}
            />
          </PotCard>
          <BackupButton
            primary
            label={t('together.pot.addButton', { amount: short(toAdd) })}
            onPress={add}
          />
        </>
      )}

      <Entries
        state={state}
        contributions={pot.contributions}
        onTakeBack={(c) => void run({ kind: 'removeContribution', id: c.id })}
        meId={me.id}
      />

      <RowCard>
        <ActionRow
          icon="edit"
          label={t('together.pot.edit')}
          first
          onPress={() => {
            haptics.tick();
            router.push(`/new-shared-pot?id=${pot.id}` as Href);
          }}
        />
      </RowCard>
      <BackupButton
        danger
        label={armed === 'delete' ? t('together.pot.deleteConfirm') : t('together.pot.delete')}
        onPress={remove}
      />
    </SheetScreen>
  );
}

/** "Who put in what": newest first, each with who and the day; the person's own can be taken back. */
function Entries({
  state,
  contributions,
  meId,
  onTakeBack,
}: {
  readonly state: TogetherState;
  readonly contributions: readonly SharedContribution[];
  readonly meId: string;
  readonly onTakeBack: (c: SharedContribution) => void;
}) {
  const { t, language } = useI18n();
  const { palette } = useTheme();
  const format = usePlanFormat(useMoney().today);
  const partner = partnerOf(state);
  const who = (memberId: string) =>
    memberId === meId
      ? t('together.you')
      : memberId === partner?.id
        ? (partner.name ?? t('together.partner'))
        : t('together.partner');
  const list = [...contributions].reverse();
  return (
    <View style={{ gap: 8 }}>
      <Text
        style={{
          ...body(13, 600, 0.06),
          textTransform: 'uppercase',
          color: palette.inkSoft,
          paddingHorizontal: 6,
        }}
      >
        {t('together.pot.entries')}
      </Text>
      {list.length === 0 ? (
        <BackupNote>{t('together.pot.empty')}</BackupNote>
      ) : (
        <RowCard>
          {list.map((c, i) => (
            <View
              key={c.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                marginLeft: 14,
                paddingRight: 14,
                paddingVertical: 12,
                borderTopWidth: i === 0 ? 0 : 0.5,
                borderTopColor: palette.hair,
              }}
            >
              <Text style={{ flex: 1, ...body(15), color: palette.ink }}>
                {t('together.pot.entry', {
                  who: who(c.memberId),
                  day: format.dayMonth(moneyDayOf(new Date(c.addedAt))),
                })}
              </Text>
              <Text style={{ ...body(15, 650), color: palette.ink, fontVariant: ['tabular-nums'] }}>
                {formatShort(c.amount, language)}
              </Text>
              {c.memberId === meId ? (
                <PressScale
                  accessibilityRole="button"
                  accessibilityLabel={t('together.pot.takeBackLabel', {
                    amount: formatShort(c.amount, language),
                  })}
                  onPress={() => {
                    haptics.tap();
                    onTakeBack(c);
                  }}
                  style={{
                    height: 28,
                    paddingHorizontal: 10,
                    borderRadius: 99,
                    backgroundColor: palette.chipBg,
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ ...body(12.5, 650), color: palette.ink }}>
                    {t('together.pot.takeBack')}
                  </Text>
                </PressScale>
              ) : null}
            </View>
          ))}
        </RowCard>
      )}
    </View>
  );
}
