import * as Clipboard from 'expo-clipboard';
import { Linking, Text, View } from 'react-native';
import Animated, { Easing, FadeInDown, FadeOut } from 'react-native-reanimated';

import { FORWARDING_PROVIDER_NAMES, isForwardingConfirmUrl } from '@6pm/domain';
import { curves } from '@6pm/theme';

import { useI18n } from '../../i18n/i18n';
import { haptics } from '../../ui/haptics';
import { Symbol } from '../../ui/icons/symbol';
import { PressScale } from '../../ui/primitives/press-scale';
import { useTheme } from '../../ui/theme/theme';
import { useToast } from '../../ui/toast/toast-host';
import { body, mono, tabular } from '../../ui/type/fonts';
import { useForwardingCheck } from './forwarding-check';

/** Rises in on the entrance curve; fades out once the person is done. */
const cardIn = FadeInDown.duration(350).easing(Easing.bezier(...curves.enter));
const cardOut = FadeOut.duration(200);

/**
 * A mail service asking to confirm forwarding to this phone's address: who is asking, the code
 * large enough to read across to a computer, Copy, the service's confirm page, and Done. Renders
 * nothing when no check is waiting.
 */
export function ForwardingCheckCard() {
  const { check, dismiss } = useForwardingCheck();
  const { palette } = useTheme();
  const { t } = useI18n();
  const toast = useToast();
  if (check === null) return null;

  const provider = FORWARDING_PROVIDER_NAMES[check.provider];
  // The wire schema already refused any other link; checked again where it is opened.
  const confirmUrl =
    check.confirmUrl !== null && isForwardingConfirmUrl(check.provider, check.confirmUrl)
      ? check.confirmUrl
      : null;
  const copy = () => {
    haptics.tap();
    void Clipboard.setStringAsync(check.code)
      .then(() => toast(t('receiptEmail.check.copied')))
      .catch(() => undefined);
  };
  const open = () => {
    if (confirmUrl === null) return;
    haptics.tap();
    Linking.openURL(confirmUrl).catch(() => toast(t('receiptEmail.check.openFailed')));
  };
  const done = () => {
    haptics.tap();
    dismiss();
  };

  return (
    <Animated.View
      key={check.id}
      entering={cardIn}
      exiting={cardOut}
      style={{
        borderRadius: 26,
        backgroundColor: palette.cell,
        boxShadow: palette.cardShadow,
        padding: 16,
        gap: 14,
      }}
    >
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: palette.btnBg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Symbol name="forward_to_inbox" size={16} color={palette.btnFg} />
        </View>
        <Text
          accessibilityRole="header"
          style={{ flex: 1, ...body(15.5, 600), lineHeight: 20.9, color: palette.ink }}
        >
          {check.address !== null
            ? t('receiptEmail.check.title', { provider, address: check.address })
            : t('receiptEmail.check.titleNoAddress', { provider })}
        </Text>
      </View>

      <View style={{ gap: 6 }}>
        <Text
          style={{ ...mono(11.5, 500, 0.08), textTransform: 'uppercase', color: palette.inkSoft }}
        >
          {t('receiptEmail.check.code')}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Text
            selectable
            style={{ flex: 1, ...mono(30, 600, 0.06), ...tabular, color: palette.ink }}
          >
            {check.code}
          </Text>
          <PressScale
            accessibilityRole="button"
            accessibilityLabel={t('receiptEmail.check.copyLabel')}
            onPress={copy}
            hitSlop={6}
            style={{
              height: 32,
              paddingLeft: 9,
              paddingRight: 12,
              borderRadius: 10,
              backgroundColor: palette.chipBg,
              borderWidth: 0.5,
              borderColor: palette.hair,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <Symbol name="content_copy" size={16} color={palette.ink} />
            <Text style={{ ...body(13.5, 600), color: palette.ink }}>
              {t('receiptEmail.check.copy')}
            </Text>
          </PressScale>
        </View>
      </View>

      <Text style={{ ...body(13.5), lineHeight: 18.5, color: palette.inkSoft }}>
        {t('receiptEmail.check.hint', { provider })}
      </Text>

      <View style={{ gap: 8 }}>
        {confirmUrl !== null ? (
          <PressScale
            accessibilityRole="link"
            scaleTo={0.97}
            onPress={open}
            style={{
              height: 50,
              borderRadius: 99,
              backgroundColor: palette.btnBg,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <Text style={{ ...body(16, 650), color: palette.btnFg }}>
              {t('receiptEmail.check.open')}
            </Text>
            <Symbol name="open_in_new" size={18} color={palette.btnFg} />
          </PressScale>
        ) : null}
        <PressScale
          accessibilityRole="button"
          scaleTo={0.97}
          onPress={done}
          style={{
            height: 50,
            borderRadius: 99,
            borderWidth: 1,
            borderColor: palette.inkSoft,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ ...body(16, 600), color: palette.ink }}>
            {t('receiptEmail.check.done')}
          </Text>
        </PressScale>
      </View>
    </Animated.View>
  );
}
