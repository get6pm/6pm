import * as Clipboard from 'expo-clipboard';
import { useRef, useState } from 'react';
import { Linking, Modal, ScrollView, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import type { StringKey } from '@6pm/i18n';

import { useI18n } from '../../i18n/i18n';
import { haptics } from '../../ui/haptics';
import { Symbol } from '../../ui/icons/symbol';
import { PressScale } from '../../ui/primitives/press-scale';
import { useTheme } from '../../ui/theme/theme';
import { body, display, leading, mono } from '../../ui/type/fonts';
import { captureColours } from '../capture-guide/capture-colours';
import { GuideSection } from '../capture-guide/guide-sections';
import { useWalkthroughSteps } from '../capture-guide/guide-walkthroughs';
import { Walkthrough } from '../capture-guide/walkthrough/walkthrough';
import { WALLET_SHORTCUT_URL } from '../capture-guide/wallet-shortcut';
import { useReceiptAddress } from '../receipt-email/receipt-address';
import type { WalkedWay } from './catch-ways';

const WORDS = {
  share: {
    title: 'onboarding.catch.share.title',
    headline: 'capture.share.headline',
    time: 'capture.share.time',
  },
  wallet: {
    title: 'onboarding.catch.wallet.title',
    headline: 'capture.wallet.headline',
    time: 'capture.wallet.time',
  },
  email: {
    title: 'onboarding.catch.email.title',
    headline: 'capture.email.headline',
    time: 'capture.email.time',
  },
} as const satisfies Readonly<
  Record<WalkedWay, { title: StringKey; headline: StringKey; time: StringKey }>
>;

/**
 * A way's drawn walkthrough, over onboarding in a native sheet, with what it needs to get going:
 * Shortcuts for the Wallet automation, the user's own address for receipt email. It is a sheet of
 * onboarding's own, not the capture guide's route, so closing it always lands back on this step.
 */
export function CatchSetupSheet({
  way,
  onClose,
}: {
  readonly way: WalkedWay | null;
  readonly onClose: () => void;
}) {
  // Keeps the way on show while the sheet slides away.
  const shown = useRef(way);
  if (way !== null) shown.current = way;
  const current = shown.current;
  return (
    <Modal
      visible={way !== null}
      animationType="slide"
      presentationStyle="pageSheet"
      allowSwipeDismissal
      onRequestClose={onClose}
    >
      {current === 'email' ? (
        <EmailSetup onClose={onClose} />
      ) : current !== null ? (
        <SetupBody way={current} emailAddress={null} onClose={onClose} />
      ) : null}
    </Modal>
  );
}

/** Asking for the address only once the user opens this: a phone that never does registers none. */
function EmailSetup({ onClose }: { readonly onClose: () => void }) {
  const emailAddress = useReceiptAddress();
  return <SetupBody way="email" emailAddress={emailAddress} onClose={onClose} />;
}

function SetupBody({
  way,
  emailAddress,
  onClose,
}: {
  readonly way: WalkedWay;
  readonly emailAddress: string | null;
  readonly onClose: () => void;
}) {
  const { palette } = useTheme();
  const { t } = useI18n();
  const steps = useWalkthroughSteps(way, emailAddress);
  const words = WORDS[way];
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: palette.sheetSolid }}>
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
          <Text style={{ ...body(17, 650), color: palette.ink }}>{t(words.title)}</Text>
          <PressScale
            accessibilityRole="button"
            onPress={onClose}
            hitSlop={8}
            style={{ position: 'absolute', right: 0, paddingVertical: 8, paddingHorizontal: 4 }}
          >
            <Text style={{ ...body(17, 650), color: palette.ink }}>{t('common.done')}</Text>
          </PressScale>
        </View>
      </View>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingTop: 6, paddingHorizontal: 16, paddingBottom: 44, gap: 22 }}>
          <Text
            style={{
              ...leading(display(29, 500, -0.015), 32),
              color: palette.ink,
              paddingHorizontal: 4,
            }}
          >
            {t(words.headline)}
          </Text>
          <GuideSection title={t('capture.guide.howItWorks')} note={t(words.time)}>
            <Walkthrough steps={steps} />
          </GuideSection>
          {way === 'wallet' ? (
            <View style={{ gap: 10 }}>
              <SheetButton
                label={t('capture.wallet.actionAdd')}
                accent
                onPress={() => void Linking.openURL(WALLET_SHORTCUT_URL).catch(() => undefined)}
              />
              <SheetButton
                label={t('capture.wallet.actionOff')}
                accent={false}
                onPress={() => void Linking.openURL('shortcuts://').catch(() => undefined)}
              />
            </View>
          ) : null}
          {way === 'email' ? <AddressBlock address={emailAddress} /> : null}
          <Text
            style={{
              ...body(13),
              lineHeight: 18.2,
              color: palette.inkSoft,
              textAlign: 'center',
              paddingHorizontal: 12,
            }}
          >
            {t('onboarding.catch.setup.later')}
          </Text>
        </View>
      </ScrollView>
    </GestureHandlerRootView>
  );
}

/** The user's forwarding address and a button to copy it, or a line saying it needs a network. */
function AddressBlock({ address }: { readonly address: string | null }) {
  const { palette } = useTheme();
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  if (address === null) {
    return (
      <Text style={{ ...body(15), color: palette.inkSoft, textAlign: 'center' }}>
        {t('receiptEmail.offline')}
      </Text>
    );
  }
  return (
    <View style={{ gap: 12 }}>
      <Text
        selectable
        style={{ ...mono(14, 400), color: palette.ink, textAlign: 'center' }}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {address}
      </Text>
      <SheetButton
        label={copied ? t('onboarding.catch.setup.copied') : t('receiptEmail.copy')}
        icon={copied ? 'check' : 'content_copy'}
        accent={false}
        onPress={() =>
          void Clipboard.setStringAsync(address)
            .then(() => setCopied(true))
            .catch(() => undefined)
        }
      />
    </View>
  );
}

function SheetButton({
  label,
  icon,
  accent,
  onPress,
}: {
  readonly label: string;
  readonly icon?: 'check' | 'content_copy';
  readonly accent: boolean;
  readonly onPress: () => void;
}) {
  const { palette } = useTheme();
  const fg = accent ? captureColours(palette).onAccent : palette.btnFg;
  return (
    <PressScale
      scaleTo={0.97}
      accessibilityRole="button"
      onPress={() => {
        haptics.tap();
        onPress();
      }}
      style={{
        height: 56,
        borderRadius: 99,
        backgroundColor: accent ? palette.accent : palette.btnBg,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
      }}
    >
      {icon ? <Symbol name={icon} size={20} color={fg} /> : null}
      <Text style={{ ...body(17, 650), color: fg }}>{label}</Text>
    </PressScale>
  );
}
