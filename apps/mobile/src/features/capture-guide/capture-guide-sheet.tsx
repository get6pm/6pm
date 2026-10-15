import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { Linking, ScrollView, Share, Text, View } from 'react-native';
import Animated, { Easing, Keyframe } from 'react-native-reanimated';

import { curves } from '@6pm/theme';

import { useI18n } from '../../i18n/i18n';
import { useCompanionToast } from '../companion/use-companion-toast';
import { CategoryTile } from '../../ui/category-tile';
import { haptics } from '../../ui/haptics';
import { Symbol } from '../../ui/icons/symbol';
import { SheetFrame } from '../../ui/navigation/sheet-frame';
import { PressScale } from '../../ui/primitives/press-scale';
import { useTheme } from '../../ui/theme/theme';
import { body, display } from '../../ui/type/fonts';
import { captureColours } from './capture-colours';
import { HowItWorks } from './guide-how';
import { GuideSample, GuideSection, GuideTip, type LiveChip } from './guide-sections';
import type { CaptureSource } from './source-status';
import { useCaptureSources } from './use-capture-sources';
import { WALLET_SHORTCUT_URL } from './wallet-shortcut';

/** The prototype's `screenIn`: up 12 pt from 98.5 %, over 0.35 s on the entrance curve. */
const screenIn = new Keyframe({
  0: { opacity: 0, transform: [{ translateY: 12 }, { scale: 0.985 }] },
  100: {
    opacity: 1,
    transform: [{ translateY: 0 }, { scale: 1 }],
    easing: Easing.bezier(...curves.enter),
  },
}).duration(350);

/** One way's guide: its status, three steps, what lands in the Inbox, a tip and its actions. */
export function CaptureGuideSheet({ source }: { readonly source: CaptureSource }) {
  const { palette } = useTheme();
  const { t } = useI18n();
  const router = useRouter();
  const { sources, emailAddress } = useCaptureSources();
  const colours = captureColours(palette);
  const view = sources.find((s) => s.source === source);
  const actions = useGuideActions(source, view?.on ?? false, emailAddress);
  // Receipt email's first step shows the address itself; tapping it offers the share sheet.
  const addressChip: LiveChip | null =
    source === 'email' && emailAddress !== null
      ? {
          text: emailAddress,
          label: t('receiptEmail.share'),
          onPress: () => {
            haptics.tap();
            void Share.share({ message: emailAddress }).catch(() => undefined);
          },
        }
      : null;
  // Every way is always listed; this only satisfies the type.
  if (!view) return null;
  const { guide } = view;

  const header = (
    <View style={{ paddingTop: 8, paddingHorizontal: 14, paddingBottom: 6, gap: 6 }}>
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
      <View style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ ...body(17, 650), color: palette.ink }}>{view.name}</Text>
        <PressScale
          accessibilityRole="button"
          onPress={() => router.back()}
          hitSlop={8}
          style={{
            position: 'absolute',
            left: 0,
            paddingVertical: 8,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <Symbol name="chevron_left" size={26} color={palette.ink} style={{ marginLeft: -4 }} />
          <Text style={{ ...body(17, 500), color: palette.ink }}>{t('capture.guide.back')}</Text>
        </PressScale>
        <PressScale
          accessibilityRole="button"
          onPress={() => router.dismissTo('/')}
          hitSlop={8}
          style={{ position: 'absolute', right: 0, paddingVertical: 8, paddingHorizontal: 4 }}
        >
          <Text style={{ ...body(17, 650), color: palette.ink }}>{t('common.done')}</Text>
        </PressScale>
      </View>
    </View>
  );

  return (
    <SheetFrame header={header}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <Animated.View
          entering={screenIn}
          style={{ paddingTop: 6, paddingHorizontal: 16, paddingBottom: 44, gap: 24 }}
        >
          <View style={{ gap: 14, paddingTop: 6, paddingHorizontal: 4 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <CategoryTile icon={guide.icon} hue={guide.hue} size={60} radius={20} glyph={32} />
              <View
                style={{
                  height: 28,
                  paddingLeft: 9,
                  paddingRight: 11,
                  borderRadius: 99,
                  backgroundColor: view.on ? colours.okBg : colours.warnBg,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <View
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: 3.5,
                    backgroundColor: view.on ? colours.ok : colours.warn,
                  }}
                />
                <Text style={{ ...body(12.5, 700), color: view.on ? colours.ok : colours.warn }}>
                  {view.status}
                </Text>
              </View>
            </View>
            <Text style={{ ...display(31, 500, -0.015), lineHeight: 33.5, color: palette.ink }}>
              {t(guide.headline)}
            </Text>
          </View>

          <HowItWorks
            source={source}
            guide={guide}
            addressChip={addressChip}
            emailAddress={emailAddress}
          />

          <GuideSection title={t('capture.guide.lands')}>
            <GuideSample guide={guide} />
            <Text
              style={{
                ...body(13),
                lineHeight: 18.2,
                color: palette.inkSoft,
                paddingHorizontal: 6,
              }}
            >
              {t('capture.guide.landsNote')}
            </Text>
          </GuideSection>

          <GuideTip text={t(guide.tip)} />

          {actions.length > 0 ? (
            <View style={{ gap: 10 }}>
              {actions.map((action) => (
                <PressScale
                  key={action.label}
                  accessibilityRole="button"
                  onPress={action.run}
                  style={{
                    height: 56,
                    borderRadius: 99,
                    backgroundColor: action.accent ? palette.accent : palette.btnBg,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text
                    style={{
                      ...body(17, 650),
                      color: action.accent ? colours.onAccent : palette.btnFg,
                    }}
                  >
                    {action.label}
                  </Text>
                </PressScale>
              ))}
            </View>
          ) : null}
        </Animated.View>
      </ScrollView>
    </SheetFrame>
  );
}

interface GuideAction {
  readonly label: string;
  /** The orange button: only while the Wallet automation is still off. */
  readonly accent: boolean;
  readonly run: () => void;
}

function openUrl(url: string): void {
  haptics.tap();
  void Linking.openURL(url).catch(() => undefined);
}

/**
 * The buttons under each guide. Pinning in the share row and the Wallet automation are the user's
 * to set in iOS, so those open the share sheet and the Shortcuts app; while the automation is off,
 * the 6pm shortcut it runs is offered first. Receipt email copies the address, and has no button
 * until the server has given one.
 */
function useGuideActions(
  source: CaptureSource,
  on: boolean,
  emailAddress: string | null,
): readonly GuideAction[] {
  const { t } = useI18n();
  const router = useRouter();
  const say = useCompanionToast();
  switch (source) {
    case 'share':
      return [
        {
          label: t('capture.share.action'),
          accent: false,
          run: () => {
            haptics.tap();
            void Share.share({ message: t('capture.share.pinText') }).catch(() => undefined);
          },
        },
      ];
    case 'email':
      if (emailAddress === null) return [];
      return [
        {
          label: t('receiptEmail.copy'),
          accent: false,
          run: () => {
            haptics.tap();
            void Clipboard.setStringAsync(emailAddress)
              .then(() => say('copied'))
              .catch(() => undefined);
          },
        },
      ];
    case 'scan':
      return [
        {
          label: t('capture.scan.action'),
          accent: false,
          run: () => {
            haptics.tap();
            router.push('/scan');
          },
        },
      ];
    case 'wallet': {
      const shortcuts: GuideAction = {
        label: t(on ? 'capture.wallet.actionOn' : 'capture.wallet.actionOff'),
        accent: false,
        run: () => openUrl('shortcuts://'),
      };
      if (on) return [shortcuts];
      return [
        {
          label: t('capture.wallet.actionAdd'),
          accent: true,
          run: () => openUrl(WALLET_SHORTCUT_URL),
        },
        shortcuts,
      ];
    }
    case 'widgets':
      return [
        {
          label: t('capture.widgets.action'),
          accent: false,
          run: () => {
            haptics.tap();
            router.back();
          },
        },
      ];
  }
}
