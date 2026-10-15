import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

import { shareCardInk } from '@6pm/theme';

import { useI18n } from '../../../i18n/i18n';
import { Symbol } from '../../../ui/icons/symbol';
import type { SymbolName } from '../../../ui/icons/symbols.generated';
import { body } from '../../../ui/type/fonts';
import { BankReceipt, useReceiptAmount } from './bank-receipt';
import { Phone } from './device';
import { bankInk, iosInk } from './frame-ink';
import { GlyphTile } from './ios-parts';
import { Reveal, TapFlash, Touch } from './moving-parts';
import { SixPmIcon } from './shortcuts-chrome';

interface FrameProps {
  readonly t: SharedValue<number>;
  readonly scale: number;
}

const SHARE_BUTTON = { x: 109, y: 803 } as const;

/** The receipt in the bank app; the finger taps Share. */
export function ReceiptShareFrame({ t, scale }: FrameProps) {
  return (
    <Phone t={t} scale={scale} dark>
      <BankReceipt t={t} flashAt={0.5} />
      <Touch
        t={t}
        stops={[
          { at: 0.2, x: 280, y: 560 },
          { at: 0.5, ...SHARE_BUTTON, tap: true },
        ]}
      />
    </Phone>
  );
}

/** One app in the share sheet's row. */
function ShareApp({ label, children }: { readonly label: string; readonly children: ReactNode }) {
  return (
    <View style={{ width: 78, alignItems: 'center', gap: 7 }}>
      {children}
      <Text numberOfLines={1} style={{ ...body(12), color: iosInk.label }}>
        {label}
      </Text>
    </View>
  );
}

/** The share sheet rises over the receipt; the finger taps 6pm in the app row. */
export function ShareSheetFrame({ t, scale }: FrameProps) {
  const { t: tr } = useI18n();
  const apps: readonly { label: string; glyph: SymbolName; color: string }[] = [
    { label: tr('capture.walk.ios.messages'), glyph: 'chat', color: iosInk.green },
    { label: tr('capture.walk.ios.mail'), glyph: 'mail', color: iosInk.blue },
    { label: 'Zalo', glyph: 'forum', color: iosInk.blue },
  ];
  const sheetTop = 430;
  return (
    <Phone t={t} scale={scale} dark>
      <BankReceipt t={t} flashAt={-1} />
      <Reveal
        t={t}
        from={0.04}
        to={0.14}
        style={{ position: 'absolute', inset: 0, backgroundColor: iosInk.dim }}
      />
      <Reveal t={t} from={0.04} to={0.18} dy={460} style={{ position: 'absolute', inset: 0 }}>
        <View
          style={{
            position: 'absolute',
            left: 8,
            right: 8,
            top: sheetTop,
            bottom: 8,
            borderRadius: 44,
            backgroundColor: iosInk.grouped,
            paddingTop: 22,
          }}
        >
          <View
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 22 }}
          >
            <View
              style={{ width: 44, height: 56, borderRadius: 8, backgroundColor: bankInk.header }}
            />
            <View style={{ gap: 2 }}>
              <Text style={{ ...body(16, 600), color: iosInk.label }}>
                {tr('capture.walk.ios.image')}
              </Text>
              <Text style={{ ...body(14), color: iosInk.secondary }}>JPEG · 412 KB</Text>
            </View>
          </View>
          <View style={{ height: 0.6, backgroundColor: iosInk.separator, marginVertical: 18 }} />
          <View style={{ flexDirection: 'row', paddingHorizontal: 12 }}>
            {apps.slice(0, 2).map((app) => (
              <ShareApp key={app.label} label={app.label}>
                <GlyphTile glyph={app.glyph} color={app.color} size={62} />
              </ShareApp>
            ))}
            <ShareApp label="6pm">
              <View>
                <SixPmIcon size={62} />
                <Reveal
                  t={t}
                  from={0.5}
                  to={0.56}
                  style={{
                    position: 'absolute',
                    inset: -5,
                    borderRadius: 19,
                    borderWidth: 3,
                    borderColor: iosInk.blue,
                  }}
                />
              </View>
            </ShareApp>
            {apps.slice(2).map((app) => (
              <ShareApp key={app.label} label={app.label}>
                <GlyphTile glyph={app.glyph} color={app.color} size={62} />
              </ShareApp>
            ))}
          </View>
          <View style={{ margin: 16, marginTop: 22, borderRadius: 22, backgroundColor: iosInk.bg }}>
            {[tr('capture.walk.ios.copy'), tr('capture.walk.ios.saveImage')].map((label, k) => (
              <View
                key={label}
                style={{
                  height: 52,
                  justifyContent: 'center',
                  paddingHorizontal: 16,
                  borderTopWidth: k === 0 ? 0 : 0.6,
                  borderTopColor: iosInk.separator,
                }}
              >
                <Text style={{ ...body(17), color: iosInk.label }}>{label}</Text>
              </View>
            ))}
          </View>
        </View>
      </Reveal>
      <Touch
        t={t}
        stops={[
          { at: 0.26, x: 300, y: 720 },
          { at: 0.5, x: 8 + 12 + 78 * 2 + 39, y: sheetTop + 22 + 56 + 37 + 31, tap: true },
        ]}
      />
    </Phone>
  );
}

/** 6pm's card reads the receipt; the finger taps Confirm and it is in the Inbox. */
export function ShareCardFrame({ t, scale }: FrameProps) {
  const { t: tr } = useI18n();
  const amount = useReceiptAmount();
  const ink = shareCardInk;
  return (
    <Phone t={t} scale={scale} dark>
      <BankReceipt t={t} flashAt={-1} />
      <View style={{ position: 'absolute', inset: 0, backgroundColor: ink.scrim }} />
      <Reveal
        t={t}
        from={0.04}
        to={0.2}
        dy={420}
        style={{ position: 'absolute', left: 8, right: 8, bottom: 8 }}
      >
        <View
          style={{
            borderRadius: 44,
            backgroundColor: ink.sheet,
            padding: 22,
            paddingTop: 12,
            gap: 16,
          }}
        >
          <View
            style={{
              alignSelf: 'center',
              width: 36,
              height: 5,
              borderRadius: 3,
              backgroundColor: ink.grabber,
            }}
          />
          <Text style={{ ...body(17, 650), color: ink.ink }}>{tr('native.share.title')}</Text>
          <Text style={{ ...body(52, 650), color: ink.ink }}>{amount}</Text>
          <View style={{ borderRadius: 20, backgroundColor: ink.rows, paddingHorizontal: 16 }}>
            {[
              [tr('native.share.to'), 'Circle K'],
              [tr('native.share.when'), '16:40'],
            ].map(([k, v], i) => (
              <View
                key={k}
                style={{
                  height: 50,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderTopWidth: i === 0 ? 0 : 0.6,
                  borderTopColor: ink.hair,
                }}
              >
                <Text style={{ ...body(16), color: ink.soft }}>{k}</Text>
                <Text style={{ ...body(16, 600), color: ink.ink }}>{v}</Text>
              </View>
            ))}
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View
              style={{
                flex: 1,
                height: 54,
                borderRadius: 27,
                backgroundColor: ink.editBg,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ ...body(16, 600), color: ink.ink }}>{tr('native.share.edit')}</Text>
            </View>
            <View
              style={{
                flex: 2,
                height: 54,
                borderRadius: 27,
                backgroundColor: ink.ink,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ ...body(17, 650), color: ink.confirmFg }}>
                {tr('native.share.confirm')}
              </Text>
              <TapFlash t={t} at={0.55} radius={27} />
            </View>
          </View>
        </View>
      </Reveal>
      <Reveal t={t} from={0.6} to={0.7} out style={{ position: 'absolute', inset: 0 }} />
      <Reveal
        t={t}
        from={0.62}
        to={0.72}
        fromScale={0.8}
        style={{ position: 'absolute', top: 70, alignSelf: 'center' }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            height: 44,
            paddingHorizontal: 18,
            borderRadius: 22,
            backgroundColor: iosInk.label,
          }}
        >
          <Symbol name="inbox" size={20} color={iosInk.bg} />
          <Text style={{ ...body(15, 600), color: iosInk.bg }}>
            {tr('capture.walk.share.inInbox')}
          </Text>
        </View>
      </Reveal>
      <Touch
        t={t}
        stops={[
          { at: 0.3, x: 300, y: 600 },
          { at: 0.55, x: 270, y: 874 - 8 - 22 - 27, tap: true },
        ]}
      />
    </Phone>
  );
}
