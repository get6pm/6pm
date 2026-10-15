import { Text, View } from 'react-native';

import { useI18n } from '../../../i18n/i18n';
import { body } from '../../../ui/type/fonts';
import { Browser } from './device';
import { gmailInk } from './frame-ink';
import {
  FULL,
  GmailBar,
  GmailButton,
  GmailField,
  InboxLines,
  type GmailFrameProps,
} from './gmail-parts';
import { SettingsTabs } from './gmail-settings';
import { Reveal, Touch, Typed } from './moving-parts';

const URL = 'mail.google.com';

/** The gear opens Quick settings; the pointer clicks See all settings. */
export function GmailSettingsFrame({ t, scale }: GmailFrameProps) {
  const { t: tr } = useI18n();
  return (
    <Browser t={t} scale={scale} url={URL}>
      <GmailBar t={t} gearAt={0.24} />
      <InboxLines />
      <Reveal
        t={t}
        from={0.26}
        to={0.36}
        dx={220}
        style={{ position: 'absolute', top: 64, right: 0, bottom: 0, width: 260 }}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: gmailInk.surface,
            borderTopLeftRadius: 16,
            padding: 18,
            gap: 16,
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          }}
        >
          <Text style={{ ...body(17, 500), color: gmailInk.label }}>
            {tr('capture.walk.gmail.quickSettings')}
          </Text>
          <GmailButton t={t} label={tr('capture.walk.gmail.seeAll')} clickAt={0.62} />
          {[0.8, 0.6, 0.7, 0.5].map((w, k) => (
            <View
              key={k}
              style={{
                height: 9,
                width: `${w * 100}%`,
                borderRadius: 5,
                backgroundColor: gmailInk.line,
              }}
            />
          ))}
        </View>
      </Reveal>
      <Touch
        t={t}
        stops={[
          { at: 0.08, x: 300, y: 300 },
          { at: 0.24, x: 527, y: 32, tap: true },
          { at: 0.62, x: 440, y: 141, tap: true },
        ]}
      />
    </Browser>
  );
}

/** Forwarding and POP/IMAP, then Add a forwarding address. */
export function GmailForwardingTabFrame({ t, scale }: GmailFrameProps) {
  const { t: tr } = useI18n();
  return (
    <Browser t={t} scale={scale} url={`${URL}/#settings`}>
      <GmailBar t={t} />
      <SettingsTabs t={t} at={0.28} />
      <View
        style={{
          marginHorizontal: 14,
          backgroundColor: gmailInk.surface,
          borderBottomLeftRadius: 16,
          borderBottomRightRadius: 16,
          padding: 18,
          height: 360,
        }}
      >
        <View
          style={{
            height: 1,
            backgroundColor: gmailInk.line,
            marginHorizontal: -18,
            marginBottom: 20,
          }}
        />
        <Reveal t={t} from={0.3} to={0.38} style={{ flexDirection: 'row', gap: 20 }}>
          <Text style={{ ...body(15, 600), color: gmailInk.label, width: 110 }}>
            {tr('capture.walk.gmail.forwardingHead')}
          </Text>
          <GmailButton t={t} label={tr('capture.walk.gmail.addAddress')} clickAt={0.62} />
        </Reveal>
        <Reveal t={t} from={0.34} to={0.42} style={{ marginTop: 34, gap: 14 }}>
          {[0.9, 0.7, 0.8].map((w, k) => (
            <View
              key={k}
              style={{
                height: 9,
                width: `${w * 100}%`,
                borderRadius: 5,
                backgroundColor: gmailInk.line,
              }}
            />
          ))}
        </Reveal>
      </View>
      <Touch
        t={t}
        stops={[
          { at: 0.08, x: 200, y: 420 },
          { at: 0.28, x: 120, y: 182, tap: true },
          { at: 0.62, x: 272, y: 260, tap: true },
        ]}
      />
    </Browser>
  );
}

/** The address dialog: the address is pasted, Next, then Proceed in Gmail's second box. */
export function GmailAddAddressFrame({ t, scale, address }: GmailFrameProps) {
  const { t: tr } = useI18n();
  return (
    <Browser t={t} scale={scale} url={`${URL}/#settings/fwdandpop`}>
      <GmailBar t={t} />
      <SettingsTabs t={t} at={-1} />
      <View style={{ ...FULL, backgroundColor: 'rgba(0,0,0,0.35)' }} />
      <Reveal
        t={t}
        from={0.02}
        to={0.1}
        fromScale={0.94}
        style={{ position: 'absolute', top: 180, left: 50, right: 50 }}
      >
        <Reveal t={t} from={0.44} to={0.5} out>
          <View
            style={{ backgroundColor: gmailInk.surface, borderRadius: 12, padding: 24, gap: 16 }}
          >
            <Text style={{ ...body(19, 500), color: gmailInk.label }}>
              {tr('capture.walk.gmail.addAddress')}
            </Text>
            <Text style={{ ...body(14), color: gmailInk.secondary }}>
              {tr('capture.walk.gmail.enterAddress')}
            </Text>
            <GmailField>
              <Typed
                t={t}
                from={0.18}
                to={0.26}
                text={address}
                width={380}
                style={{ ...body(14), color: gmailInk.label }}
              />
            </GmailField>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10 }}>
              <GmailButton t={t} label={tr('capture.walk.gmail.cancel')} />
              <GmailButton t={t} label={tr('capture.walk.gmail.next')} filled clickAt={0.42} />
            </View>
          </View>
        </Reveal>
      </Reveal>
      <Reveal
        t={t}
        from={0.46}
        to={0.54}
        fromScale={0.94}
        style={{ position: 'absolute', top: 250, left: 90, right: 90 }}
      >
        <View
          style={{
            backgroundColor: gmailInk.surface,
            borderRadius: 12,
            padding: 20,
            gap: 18,
            boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
          }}
        >
          <View
            style={{ height: 9, width: '90%', borderRadius: 5, backgroundColor: gmailInk.line }}
          />
          <Text numberOfLines={1} style={{ ...body(14, 600), color: gmailInk.label }}>
            {address}
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10 }}>
            <GmailButton t={t} label={tr('capture.walk.gmail.cancel')} />
            <GmailButton t={t} label={tr('capture.walk.gmail.proceed')} filled clickAt={0.68} />
          </View>
        </View>
      </Reveal>
      <Touch
        t={t}
        stops={[
          { at: 0.12, x: 300, y: 300 },
          { at: 0.16, x: 300, y: 300, tap: true },
          { at: 0.42, x: 492, y: 357, tap: true },
          { at: 0.68, x: 440, y: 350, tap: true },
        ]}
      />
    </Browser>
  );
}
