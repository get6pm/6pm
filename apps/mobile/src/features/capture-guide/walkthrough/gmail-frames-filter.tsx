import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { useI18n } from '../../../i18n/i18n';
import { Symbol } from '../../../ui/icons/symbol';
import { body } from '../../../ui/type/fonts';
import { Browser } from './device';
import { gmailInk } from './frame-ink';
import { GmailBar, GmailButton, GmailField, InboxLines, type GmailFrameProps } from './gmail-parts';
import { GmailCheck } from './gmail-settings';
import { Reveal, TapFlash, Touch, Typed } from './moving-parts';

const URL = 'mail.google.com';
/** Receipt senders 6pm reads, as a Gmail search. */
const SENDERS = 'grab.com OR shopee.vn OR be.com.vn';

/** A labelled line of the search options panel. */
function OptionLine({
  label,
  children,
}: {
  readonly label: string;
  readonly children?: ReactNode;
}) {
  return (
    <View style={{ height: 40, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <Text style={{ ...body(14), color: gmailInk.secondary, width: 110 }}>{label}</Text>
      <View
        style={{
          flex: 1,
          height: 32,
          borderBottomWidth: 1,
          borderBottomColor: gmailInk.line,
          justifyContent: 'center',
        }}
      >
        {children}
      </View>
    </View>
  );
}

/** The panel under the search box, with From filled and Create filter. */
function SearchOptions({
  t,
  typeAt,
}: {
  readonly t: GmailFrameProps['t'];
  readonly typeAt?: number;
}) {
  const { t: tr } = useI18n();
  return (
    <View
      style={{
        backgroundColor: gmailInk.surface,
        borderRadius: 12,
        padding: 20,
        gap: 2,
        boxShadow: '0 6px 24px rgba(0,0,0,0.18)',
      }}
    >
      <OptionLine label={tr('capture.walk.gmail.from')}>
        {typeAt === undefined ? (
          <Text numberOfLines={1} style={{ ...body(14), color: gmailInk.label }}>
            {SENDERS}
          </Text>
        ) : (
          <Typed
            t={t}
            from={typeAt}
            to={typeAt + 0.2}
            text={SENDERS}
            width={250}
            style={{ ...body(14), color: gmailInk.label }}
          />
        )}
      </OptionLine>
      <OptionLine label={tr('capture.walk.gmail.subject')} />
      <OptionLine label={tr('capture.walk.gmail.hasWords')} />
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: 16,
          marginTop: 14,
        }}
      >
        <View
          style={{
            height: 32,
            paddingHorizontal: 10,
            borderRadius: 16,
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          <TapFlash t={t} at={0.68} radius={16} />
          <Text style={{ ...body(14, 600), color: gmailInk.blue }}>
            {tr('capture.walk.gmail.createFilter')}
          </Text>
        </View>
        <GmailButton t={t} label={tr('capture.walk.gmail.search')} filled />
      </View>
    </View>
  );
}

/** The search box's options: the senders go in From, then Create filter. */
export function GmailFilterFrame({ t, scale }: GmailFrameProps) {
  return (
    <Browser t={t} scale={scale} url={URL}>
      <GmailBar t={t} optionsAt={0.2} />
      <InboxLines />
      <Reveal
        t={t}
        from={0.22}
        to={0.3}
        dy={-12}
        style={{ position: 'absolute', top: 60, left: 150, right: 60 }}
      >
        <SearchOptions t={t} typeAt={0.34} />
      </Reveal>
      <Touch
        t={t}
        stops={[
          { at: 0.06, x: 300, y: 400 },
          { at: 0.2, x: 461, y: 32, tap: true },
          { at: 0.32, x: 330, y: 100, tap: true },
          { at: 0.68, x: 359, y: 238, tap: true },
        ]}
      />
    </Browser>
  );
}

/** Forward it to is ticked, the 6pm address chosen, and Create filter clicked. */
export function GmailForwardItFrame({ t, scale, address }: GmailFrameProps) {
  const { t: tr } = useI18n();
  return (
    <Browser t={t} scale={scale} url={URL}>
      <GmailBar
        t={t}
        query={
          <Text
            numberOfLines={1}
            style={{ ...body(15), color: gmailInk.label }}
          >{`from:(${SENDERS})`}</Text>
        }
      />
      <InboxLines />
      <View style={{ position: 'absolute', top: 60, left: 120, right: 30 }}>
        <View
          style={{
            backgroundColor: gmailInk.surface,
            borderRadius: 12,
            padding: 20,
            gap: 8,
            boxShadow: '0 6px 24px rgba(0,0,0,0.18)',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Symbol name="arrow_back" size={20} color={gmailInk.secondary} />
            <Text style={{ flex: 1, ...body(13), color: gmailInk.secondary }}>
              {tr('capture.walk.gmail.whenArrives')}
            </Text>
          </View>
          <GmailCheck t={t} label={tr('capture.walk.gmail.skipInbox')} />
          <GmailCheck t={t} label={tr('capture.walk.gmail.markRead')} />
          <GmailCheck t={t} label={tr('capture.walk.gmail.forwardIt')} at={0.22} />
          <View style={{ marginLeft: 32 }}>
            <GmailField>
              <Reveal
                t={t}
                from={0.42}
                to={0.46}
                style={{ flexDirection: 'row', alignItems: 'center' }}
              >
                <Text numberOfLines={1} style={{ flex: 1, ...body(14), color: gmailInk.label }}>
                  {address}
                </Text>
              </Reveal>
              <Symbol
                name="expand_more"
                size={20}
                color={gmailInk.secondary}
                style={{ position: 'absolute', right: 8 }}
              />
            </GmailField>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 }}>
            <GmailButton
              t={t}
              label={tr('capture.walk.gmail.createFilter')}
              filled
              clickAt={0.66}
            />
          </View>
        </View>
      </View>
      <Touch
        t={t}
        stops={[
          { at: 0.06, x: 300, y: 440 },
          { at: 0.22, x: 148, y: 213, tap: true },
          { at: 0.4, x: 358, y: 259, tap: true },
          { at: 0.66, x: 484, y: 317, tap: true },
        ]}
      />
    </Browser>
  );
}
