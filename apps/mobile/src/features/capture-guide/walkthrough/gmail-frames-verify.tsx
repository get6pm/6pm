import { Text, View } from 'react-native';

import { useI18n } from '../../../i18n/i18n';
import { Symbol } from '../../../ui/icons/symbol';
import { body } from '../../../ui/type/fonts';
import { Browser } from './device';
import { gmailInk } from './frame-ink';
import { GmailBar, GmailButton, GmailField, type GmailFrameProps } from './gmail-parts';
import { SettingsTabs } from './gmail-settings';
import { Reveal, Touch, Typed } from './moving-parts';

const URL = 'mail.google.com';

const CODE = '482917305';

/** The confirmation code goes next to Verify; the address shows as verified. */
export function GmailVerifyFrame({ t, scale, address }: GmailFrameProps) {
  const { t: tr } = useI18n();
  return (
    <Browser t={t} scale={scale} url={`${URL}/#settings/fwdandpop`}>
      <GmailBar t={t} />
      <SettingsTabs t={t} at={-1} />
      <View
        style={{
          marginHorizontal: 14,
          backgroundColor: gmailInk.surface,
          borderBottomLeftRadius: 16,
          borderBottomRightRadius: 16,
          padding: 18,
          gap: 16,
        }}
      >
        <View
          style={{
            height: 1,
            backgroundColor: gmailInk.line,
            marginHorizontal: -18,
            marginBottom: 4,
          }}
        />
        <Text style={{ ...body(15, 600), color: gmailInk.label }}>
          {tr('capture.walk.gmail.forwardingHead')}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View
            style={{
              width: 18,
              height: 18,
              borderRadius: 9,
              borderWidth: 5,
              borderColor: gmailInk.blue,
            }}
          />
          <Text style={{ ...body(14), color: gmailInk.label }}>
            {tr('capture.walk.gmail.disable')}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View
            style={{
              width: 18,
              height: 18,
              borderRadius: 9,
              borderWidth: 2,
              borderColor: gmailInk.secondary,
            }}
          />
          <Text numberOfLines={1} style={{ flexShrink: 1, ...body(14), color: gmailInk.secondary }}>
            {`${tr('capture.walk.gmail.forwardTo')} ${address}`}
          </Text>
        </View>
        <View style={{ borderRadius: 10, backgroundColor: gmailInk.bg, padding: 14, gap: 12 }}>
          <Text
            numberOfLines={1}
            style={{ ...body(14, 600), color: gmailInk.label }}
          >{`${tr('capture.walk.gmail.verify')} ${address}`}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <GmailField width={190}>
              <Reveal t={t} from={0.14} to={0.18} out style={{ position: 'absolute', left: 10 }}>
                <Text style={{ ...body(14), color: gmailInk.secondary }}>
                  {tr('capture.walk.gmail.code')}
                </Text>
              </Reveal>
              <Typed
                t={t}
                from={0.18}
                to={0.4}
                text={CODE}
                width={86}
                style={{ ...body(14), color: gmailInk.label }}
              />
            </GmailField>
            <GmailButton t={t} label={tr('capture.walk.gmail.verify')} clickAt={0.56} />
            <Reveal t={t} from={0.6} to={0.68} fromScale={0.5}>
              <Symbol name="check_circle" size={26} color={gmailInk.green} fill={1} />
            </Reveal>
          </View>
        </View>
      </View>
      <Touch
        t={t}
        stops={[
          { at: 0.06, x: 400, y: 460 },
          { at: 0.14, x: 130, y: 398, tap: true },
          { at: 0.56, x: 285, y: 398, tap: true },
        ]}
      />
    </Browser>
  );
}
