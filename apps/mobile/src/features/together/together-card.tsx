import { useRouter, type Href } from 'expo-router';
import { Text, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';

import type { PayCycle } from '@6pm/domain';

import { useI18n } from '../../i18n/i18n';
import { haptics } from '../../ui/haptics';
import { Symbol } from '../../ui/icons/symbol';
import { PressScale } from '../../ui/primitives/press-scale';
import { useTheme } from '../../ui/theme/theme';
import { body } from '../../ui/type/fonts';
import type { PlanColours } from '../plan/plan-colours';
import { useEntitlement } from '../purchases/purchases-provider';
import { SharedJar, JAR_H, JAR_W } from './shared-jar';
import { MaxLock, TogetherAvatars } from './together-avatars';
import { useTogether } from './together-provider';
import { initialOf, partnerOf } from './together-state';

const GAP = 10;
export const togetherRoutes = {
  manage: '/together' as Href,
  newPot: '/new-shared-pot' as Href,
};

/**
 * Plan · Occasions' "Budget together" card (`App:375-380`), and the shared pots under it once
 * there are any. Without Max, and not already in Budget together, it carries the MAX lock and
 * opens the Max sheet; otherwise it opens Budget together.
 */
export function TogetherSection({
  cycle,
  colours,
}: {
  readonly cycle: PayCycle;
  readonly colours: PlanColours;
}) {
  const { palette } = useTheme();
  const { t } = useI18n();
  const router = useRouter();
  const { max } = useEntitlement();
  const { state } = useTogether();
  const { me, pair } = state;
  const partner = partnerOf(state);
  const pots = pair?.pots ?? [];
  // Someone who joined from an invite, or started before Max lapsed, keeps their way in.
  const locked = !max && me === null;
  const sub = locked
    ? t('together.card.subOff')
    : partner !== null
      ? t('together.card.subPaired', {
          count: pots.length,
          name: partner.name ?? t('together.partner'),
        })
      : t('together.card.subOn');

  const open = () => {
    haptics.tap();
    if (locked) router.push({ pathname: '/max', params: { from: 'shared' } });
    else router.push(togetherRoutes.manage);
  };

  return (
    // No reveal: the prototype draws this card plain, after the Occasions section.
    <View style={{ gap: GAP }}>
      <PressScale
        accessibilityRole="button"
        accessibilityLabel={t('together.card.open')}
        scaleTo={0.98}
        onPress={open}
        style={{
          borderRadius: 26,
          backgroundColor: palette.cell,
          boxShadow: palette.cardShadow,
          paddingVertical: 14,
          paddingRight: 14,
          paddingLeft: 16,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
        }}
      >
        <TogetherAvatars
          me={initialOf(me?.name ?? t('together.you'))}
          partner={partner === null ? null : initialOf(partner.name ?? t('together.partner'))}
          ring={palette.cell}
          dashLine={colours.dashLine}
        />
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <Text style={{ ...body(16, 650), color: palette.ink }}>{t('together.title')}</Text>
          <Text style={{ ...body(12.5), lineHeight: 16.9, color: palette.inkSoft }}>{sub}</Text>
        </View>
        {locked ? (
          <MaxLock />
        ) : (
          <Symbol name="chevron_right" size={20} color={palette.ink} style={{ opacity: 0.35 }} />
        )}
      </PressScale>

      {me !== null && pots.length > 0 ? (
        <ScrollView
          horizontal
          scrollsToTop={false}
          showsHorizontalScrollIndicator={false}
          snapToInterval={JAR_W + GAP}
          decelerationRate="fast"
          style={{ marginHorizontal: -16, flexGrow: 0 }}
          contentContainerStyle={{
            gap: GAP,
            paddingHorizontal: 16,
            paddingTop: 2,
            paddingBottom: 14,
          }}
        >
          {pots.map((pot) => (
            <SharedJar
              key={pot.id}
              pot={pot}
              me={me}
              partner={partner}
              cycle={cycle}
              colours={colours}
            />
          ))}
          <NewSharedPot dashLine={colours.dashLine} />
        </ScrollView>
      ) : null}
    </View>
  );
}

/** The dashed "New shared pot" card at the end of the strip, as "New pot" is drawn. */
function NewSharedPot({ dashLine }: { readonly dashLine: string }) {
  const { palette } = useTheme();
  const { t } = useI18n();
  const router = useRouter();
  return (
    <PressScale
      accessibilityRole="button"
      onPress={() => {
        haptics.tap();
        router.push(togetherRoutes.newPot);
      }}
      style={{
        width: JAR_W,
        height: JAR_H,
        borderRadius: 26,
        borderWidth: 1.5,
        borderStyle: 'dashed',
        borderColor: dashLine,
        padding: 14,
        justifyContent: 'space-between',
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 14,
          backgroundColor: palette.chipBg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Symbol name="add" size={24} color={palette.ink} />
      </View>
      <View style={{ gap: 4 }}>
        <Text style={{ ...body(16, 650), color: palette.ink }}>{t('together.newPot')}</Text>
        <Text style={{ ...body(12.5), lineHeight: 16.9, color: palette.inkSoft }}>
          {t('together.newPotSub')}
        </Text>
      </View>
    </PressScale>
  );
}
