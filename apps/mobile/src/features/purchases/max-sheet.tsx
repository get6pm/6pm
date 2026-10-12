import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, ScrollView, Text, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';

import { formatShort } from '@6pm/domain';

import { useDay } from '../../data/money-provider';
import { useI18n } from '../../i18n/i18n';
import { haptics } from '../../ui/haptics';
import { Symbol } from '../../ui/icons/symbol';
import { PressScale } from '../../ui/primitives/press-scale';
import { useClock } from '../../ui/theme/clock';
import { useToast } from '../../ui/toast/toast-host';
import { BalancedText } from '../../ui/type/balanced-text';
import { body, display } from '../../ui/type/fonts';
import { useCompanionToast } from '../companion/use-companion-toast';
import { useLookSettings, useLookSettingsStore } from '../looks/look-settings-provider';
import { canUseLook } from './entitlement';
import { MaxHero } from './max-hero';
import { parseMaxFrom } from './max-context';
import { MaxFooter } from './max-footer';
import { MaxTiles } from './max-tiles';
import { trialDaysFor, yearlySavingPercent } from './max-pricing';
import { MaxSheetFrame } from './max-sheet-frame';
import { LEGAL_LINKS, MAX_PLANS, PAID_LOOKS, PRESELECTED_MAX_PLAN, type MaxPlan } from './products';
import { usePurchases } from './purchases-provider';
import { useMaxStatusLine } from './use-max-status-line';
import { MAX_CREAM, MAX_FONT, MAX_GOLD, MAX_SOFT } from './max-colours';

/**
 * The 6pm Max sheet (prototype `App:994-1068`). It opens for a reason (`from`), which leads the
 * tiles and the headline. Prices, the yearly saving and the trial all come from the store; what
 * the store has not told us is left out, and the button waits.
 */
export function MaxSheet() {
  const router = useRouter();
  const params = useLocalSearchParams<{ from?: string }>();
  const from = parseMaxFrom(params.from);
  const { t, language } = useI18n();
  const toast = useToast();
  const say = useCompanionToast();
  const { hour } = useClock();
  const day = useDay();
  const {
    customer,
    offerings,
    offeringsStatus,
    loadOfferings,
    busy,
    buy,
    restore,
    manageSubscription,
  } = usePurchases();
  const { config } = useLookSettings();
  const lookStore = useLookSettingsStore();
  const on = customer.max.active;
  const safe = formatShort(Math.max(0, day?.safe ?? 0), language);
  const statusLine = useMaxStatusLine(customer);

  const [chosen, setChosen] = useState<MaxPlan | null>(null);
  useEffect(() => loadOfferings(), [loadOfferings]);
  // The yearly plan is the one the sheet opens on, if the store sells it.
  const plan: MaxPlan =
    chosen ??
    (offerings?.max[PRESELECTED_MAX_PLAN]
      ? PRESELECTED_MAX_PLAN
      : (MAX_PLANS.find((p) => offerings?.max[p]) ?? PRESELECTED_MAX_PLAN));
  const offer = offerings?.max[plan];
  const trial = offerings ? trialDaysFor(offerings, plan) : null;
  const saving = offerings ? yearlySavingPercent(offerings) : null;

  const close = () => {
    haptics.tap();
    router.back();
  };

  const start = async () => {
    if (on) return close();
    if (!offer) return;
    haptics.tap();
    const outcome = await buy(offer.productId);
    if (outcome.kind === 'failed') return toast(t('max.failed'));
    if (outcome.kind !== 'purchased') return;
    haptics.success();
    // A look that was being tried on stays on: Max made it the customer's.
    const tried = lookStore.getSnapshot().tryOn;
    const worn =
      tried !== null && lookStore.setLook(tried, (id) => canUseLook(id, outcome.customer));
    router.replace({
      pathname: '/max-welcome',
      params: { from, ...(worn && tried ? { look: tried } : {}) },
    });
  };

  const doRestore = async () => {
    haptics.tap();
    const outcome = await restore();
    if (outcome.kind === 'found') {
      haptics.success();
      say('restored');
    } else toast(outcome.kind === 'none' ? t('looks.restore.none') : t('looks.restore.failed'));
  };

  const open = (url: string) => {
    Linking.openURL(url).catch(() => toast(t('looks.restore.failed')));
  };

  const head = on
    ? t('max.head.on')
    : from === 'looks'
      ? t('max.head.looks')
      : t(`max.head.${from}`);
  const sub = on
    ? t('max.sub.on')
    : from === 'looks'
      ? t('max.sub.looks', { count: PAID_LOOKS.length })
      : t(`max.sub.${from}`);

  const cta = on
    ? t('max.cta.done')
    : busy
      ? t('max.cta.waiting')
      : trial !== null
        ? t('max.cta.trial', { count: trial })
        : t('max.cta.subscribe');
  const ctaOff = !on && (busy || !offer);
  const terms = on
    ? (statusLine ?? '')
    : offer
      ? trial !== null
        ? plan === 'yearly'
          ? t('max.terms.trialYear', { count: trial, price: offer.priceText })
          : t('max.terms.trialMonth', { count: trial, price: offer.priceText })
        : plan === 'yearly'
          ? t('max.terms.year', { price: offer.priceText })
          : t('max.terms.month', { price: offer.priceText })
      : offeringsStatus === 'unavailable'
        ? t('max.terms.storeOff')
        : '';

  return (
    <MaxSheetFrame>
      {(drag) => (
        <View style={{ flex: 1 }}>
          <ScrollView style={{ flex: 1 }} bounces={false} showsVerticalScrollIndicator={false}>
            <GestureDetector gesture={drag}>
              <View>
                <MaxHero hour={hour} configs={config} safe={safe} onClose={close} />
              </View>
            </GestureDetector>
            <View style={{ paddingTop: 10, paddingHorizontal: 18, paddingBottom: 20, gap: 20 }}>
              <View style={{ alignItems: 'center', gap: 6 }}>
                <BalancedText
                  accessibilityRole="header"
                  style={{
                    ...display(28, 500, -0.01, MAX_FONT),
                    lineHeight: 30.2,
                    textAlign: 'center',
                    color: MAX_CREAM,
                  }}
                >
                  {head}
                </BalancedText>
                <Text
                  style={{
                    ...body(14),
                    lineHeight: 20.3,
                    textAlign: 'center',
                    color: MAX_SOFT,
                    maxWidth: 300,
                  }}
                >
                  {sub}
                </Text>
              </View>
              <MaxTiles from={from} on={on} hour={hour} configs={config} safe={safe} />
              <View
                style={{
                  flexDirection: 'row',
                  gap: 10,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 12,
                }}
              >
                <Symbol name="favorite" size={16} fill={1} color={MAX_GOLD} />
                <Text
                  style={{
                    ...body(12.5),
                    lineHeight: 17.5,
                    textAlign: 'center',
                    color: 'rgba(246,239,230,.6)',
                    flexShrink: 1,
                  }}
                >
                  {t('max.free')}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 4 }}>
                {[
                  { label: t('max.restore'), onPress: () => void doRestore() },
                  { label: t('max.terms'), onPress: () => open(LEGAL_LINKS.terms) },
                  { label: t('max.privacy'), onPress: () => open(LEGAL_LINKS.privacy) },
                ].map(({ label, onPress }) => (
                  <PressScale
                    key={label}
                    accessibilityRole="link"
                    disabled={busy}
                    onPress={onPress}
                    style={{ height: 34, paddingHorizontal: 10, justifyContent: 'center' }}
                  >
                    <Text style={{ ...body(12.5, 600), color: 'rgba(246,239,230,.5)' }}>
                      {label}
                    </Text>
                  </PressScale>
                ))}
              </View>
            </View>
          </ScrollView>

          <MaxFooter
            on={on}
            plan={plan}
            offerings={offerings}
            saving={saving}
            cta={cta}
            ctaOff={ctaOff}
            busy={busy}
            terms={terms}
            onPlan={setChosen}
            onStart={() => void start()}
            onManage={() => {
              haptics.tap();
              manageSubscription().catch(() => toast(t('looks.restore.failed')));
            }}
          />
        </View>
      )}
    </MaxSheetFrame>
  );
}
