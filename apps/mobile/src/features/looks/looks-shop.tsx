import { useRouter } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { formatShort } from '@6pm/domain';
import type { LookId } from '@6pm/theme';

import { useDay } from '../../data/money-provider';
import { useI18n } from '../../i18n/i18n';
import { haptics } from '../../ui/haptics';
import { SheetFrame } from '../../ui/navigation/sheet-frame';
import { PressScale } from '../../ui/primitives/press-scale';
import { useClock } from '../../ui/theme/clock';
import { useTheme } from '../../ui/theme/theme';
import { BalancedText } from '../../ui/type/balanced-text';
import { body, display } from '../../ui/type/fonts';
import { useCompanionToast } from '../companion/use-companion-toast';
import { useToast } from '../../ui/toast/toast-host';
import { resolveLook } from '../purchases/entitlement';
import { isPaidLook } from '../purchases/products';
import { usePurchases } from '../purchases/purchases-provider';
import { cardBadge, isScene, SHOP_ORDER } from './look-catalogue';
import { lookCopy } from './look-copy';
import { LookCard } from './look-card';
import { useLookSettings, useLookSettingsStore } from './look-settings-provider';
import { BackSheetHeader } from './sheet-header';
import { ShopMaxCard } from './shop-max-card';

const GAP = 12;

/** The Looks sheet (prototype `App:857-912`): the Max card, every look drawn live, Restore. */
export function LooksShop() {
  const router = useRouter();
  const { palette } = useTheme();
  const { t, language } = useI18n();
  const { hour } = useClock();
  const toast = useToast();
  const say = useCompanionToast();
  const day = useDay();
  const { customer, offerings, loadOfferings, busy, restore } = usePurchases();
  const { look, config, tryOn } = useLookSettings();
  const store = useLookSettingsStore();
  const copy = useMemo(() => lookCopy(t), [t]);
  const worn = resolveLook(look, customer);
  const safe = formatShort(Math.max(0, day?.safe ?? 0), language);

  // The offerings load at launch; opening the shop asks again if the store did not answer then.
  useEffect(() => loadOfferings(), [loadOfferings]);

  const open = (id: LookId) => {
    haptics.tick();
    // Wear it before the sheet opens so its first frame is already in the look.
    store.setTryOn(id);
    router.push({ pathname: '/look/[id]', params: { id } });
  };

  const doRestore = async () => {
    haptics.tap();
    const outcome = await restore();
    if (outcome.kind === 'found') {
      haptics.success();
      say('restored');
    } else toast(outcome.kind === 'none' ? t('looks.restore.none') : t('looks.restore.failed'));
  };

  const rows: LookId[][] = [];
  const classic = SHOP_ORDER.filter((id) => !isScene(id));
  for (let i = 0; i < classic.length; i += 2) rows.push(classic.slice(i, i + 2));
  for (const id of SHOP_ORDER.filter(isScene)) rows.push([id]);

  const card = (id: LookId) => (
    <LookCard
      key={id}
      look={id}
      badge={cardBadge(id, worn, customer)}
      offer={isPaidLook(id) ? offerings?.looks[id] : undefined}
      hour={hour}
      config={config[id]}
      safe={safe}
      copy={copy}
      onPress={() => open(id)}
    />
  );

  return (
    // While a look is tried on its sheet sits over this one; the shop steps out of the way.
    <View style={{ flex: 1, opacity: tryOn ? 0 : 1 }} pointerEvents={tryOn ? 'none' : 'auto'}>
      <SheetFrame
        header={
          <BackSheetHeader
            title={t('looks.title')}
            backLabel={t('looks.back')}
            onBack={() => {
              haptics.tap();
              router.replace('/settings');
            }}
            onDone={() => {
              haptics.tap();
              router.dismissAll();
            }}
          />
        }
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingTop: 4,
            paddingHorizontal: 16,
            paddingBottom: 44,
            gap: 20,
          }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ paddingTop: 4, paddingHorizontal: 6, gap: 8 }}>
            <BalancedText
              accessibilityRole="header"
              style={{ ...display(31, 500, -0.01), lineHeight: 32.9, color: palette.ink }}
            >
              {t('looks.heading')}
            </BalancedText>
            <Text style={{ ...body(14.5), lineHeight: 21, color: palette.inkSoft }}>
              {t('looks.intro')}
            </Text>
          </View>
          <ShopMaxCard
            customer={customer}
            offerings={offerings}
            hour={hour}
            configs={config}
            onPress={() => {
              haptics.tick();
              router.push({ pathname: '/max', params: { from: 'looks' } });
            }}
          />
          <View style={{ gap: GAP }}>
            {rows.map((row) => (
              <View key={row.join()} style={{ flexDirection: 'row', gap: GAP }}>
                {row.map(card)}
              </View>
            ))}
          </View>
          <PressScale
            accessibilityRole="button"
            disabled={busy}
            onPress={() => void doRestore()}
            style={{
              alignSelf: 'center',
              height: 40,
              paddingHorizontal: 14,
              justifyContent: 'center',
            }}
          >
            <Text style={{ ...body(14, 600), color: palette.inkSoft }}>{t('looks.restore')}</Text>
          </PressScale>
        </ScrollView>
      </SheetFrame>
    </View>
  );
}
