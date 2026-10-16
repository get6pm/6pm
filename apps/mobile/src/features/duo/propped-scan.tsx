import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeIn, ReduceMotion, ZoomIn } from 'react-native-reanimated';

import { formatVnd } from '@6pm/domain';

import { useI18n } from '../../i18n/i18n';
import { Symbol } from '../../ui/icons/symbol';
import type { Half } from '../../ui/layout/fold-form';
import { useDesignInsets } from '../../ui/layout/design-insets';
import { GlassButton } from '../../ui/primitives/glass-button';
import { body, display, leading, mono, tabular } from '../../ui/type/fonts';
import { dots } from '../diary/diary-colours';
import { scanColours as c } from '../scan/scan-colours';
import type { Payment } from '../scan/use-scan';

const FRAME = 190;
const CORNER = 30;
const receiptIn = ZoomIn.duration(350).reduceMotion(ReduceMotion.System);

/**
 * The top half of Scan to pay with the iPhone Duo standing: the inner camera, a frame to hold the
 * stall's QR up to, and the way out. Once a payment is under way the camera gives way to a
 * receipt the seller can read from across the counter, green once it is paid.
 */
export function ProppedTop({
  half,
  camera,
  looking,
  payment,
  paid,
  closeLabel,
  onClose,
}: {
  readonly half: Half;
  readonly camera: ReactNode;
  readonly looking: boolean;
  readonly payment: Payment | null;
  readonly paid: boolean;
  readonly closeLabel: string;
  readonly onClose: () => void;
}) {
  const { t } = useI18n();
  const { insets } = useDesignInsets();
  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: half.y,
        height: half.height,
        overflow: 'hidden',
        backgroundColor: c.page,
      }}
    >
      {payment ? null : camera}
      <View
        pointerEvents="box-none"
        style={{ position: 'absolute', left: 20, top: Math.max(18, insets.top), zIndex: 2 }}
      >
        <GlassButton icon="close" label={closeLabel} onPress={onClose} />
      </View>
      {payment ? (
        <Animated.View
          key={paid ? 'paid' : 'paying'}
          entering={receiptIn}
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 }}
        >
          {paid ? <Symbol name="check_circle" size={44} fill={1} color={dots.under} /> : null}
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            style={{
              ...leading(display(96, 500, -0.03), 96, true),
              ...tabular,
              color: paid ? dots.under : c.text,
              paddingHorizontal: 24,
            }}
          >
            {formatVnd(payment.amount)}
          </Text>
          <Text style={{ ...body(18, 600), color: c.hint }}>
            {paid ? t('duo.scan.paid') : t('duo.scan.to', { payee: payment.payee })}
          </Text>
        </Animated.View>
      ) : looking ? (
        <Animated.View
          entering={FadeIn.duration(300)}
          pointerEvents="none"
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 }}
        >
          <Text style={{ ...mono(11, 400, 0.16), textTransform: 'uppercase', color: c.hint }}>
            {t('duo.scan.camera')}
          </Text>
          <View style={{ width: FRAME, height: FRAME }}>
            {(
              [
                { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 18 },
                {
                  top: 0,
                  right: 0,
                  borderTopWidth: 4,
                  borderRightWidth: 4,
                  borderTopRightRadius: 18,
                },
                {
                  bottom: 0,
                  left: 0,
                  borderBottomWidth: 4,
                  borderLeftWidth: 4,
                  borderBottomLeftRadius: 18,
                },
                {
                  bottom: 0,
                  right: 0,
                  borderBottomWidth: 4,
                  borderRightWidth: 4,
                  borderBottomRightRadius: 18,
                },
              ] as const
            ).map((corner, k) => (
              <View
                key={k}
                style={{
                  position: 'absolute',
                  width: CORNER,
                  height: CORNER,
                  borderColor: c.frame,
                  ...corner,
                }}
              />
            ))}
          </View>
          <Text style={{ ...body(15, 600), color: c.text }}>{t('duo.scan.looking')}</Text>
        </Animated.View>
      ) : null}
    </View>
  );
}

/** The flat half while the camera looks: how to hold the phone, and typing it instead. */
export function ProppedHint({
  typeLabel,
  onType,
}: {
  readonly typeLabel: string;
  readonly onType: () => void;
}) {
  const { t } = useI18n();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 18, padding: 28 }}>
      <Text
        style={{ ...leading(display(26, 500, -0.01), 31), color: c.cardInk, textAlign: 'center' }}
      >
        {t('duo.scan.stand')}
      </Text>
      <Text onPress={onType} style={{ ...body(15, 650), color: c.cardSoft }}>
        {typeLabel}
      </Text>
    </View>
  );
}
