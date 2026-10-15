import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { useI18n } from '../../../i18n/i18n';
import { Symbol } from '../../../ui/icons/symbol';
import type { SymbolName } from '../../../ui/icons/symbols.generated';
import { body } from '../../../ui/type/fonts';
import { WALLET_SHORTCUT_NAME } from '../wallet-shortcut';
import { Phone } from './device';
import { iosInk } from './frame-ink';
import { GlassButton, LargeTitle } from './ios-parts';
import { Reveal, TapFlash, Touch } from './moving-parts';
import { LogShortcutIcon, SixPmIcon } from './shortcuts-chrome';
import type { FrameProps } from './wallet-frames-library';

const FULL = { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } as const;

/** The Add Shortcut button's centre on the sheet. */
const ADD_Y = 774;

/** A shortcut's tile in All Shortcuts: its colour, glyph and name. */
function Tile({
  color,
  glyph,
  name,
}: {
  readonly color: string;
  readonly glyph: SymbolName;
  readonly name: string;
}) {
  return (
    <View
      style={{
        width: 179,
        height: 110,
        borderRadius: 24,
        backgroundColor: color,
        padding: 14,
        justifyContent: 'space-between',
      }}
    >
      <Symbol name={glyph} size={28} color={iosInk.bg} fill={1} />
      <Text numberOfLines={1} style={{ ...body(16, 600), color: iosInk.bg }}>
        {name}
      </Text>
    </View>
  );
}

/** The sheet a shared shortcut's link opens: its icon, name, actions and Add Shortcut. */
function AddSheet({ flash }: { readonly flash: ReactNode }) {
  const { t } = useI18n();
  return (
    <View
      style={{
        position: 'absolute',
        top: 330,
        left: 8,
        right: 8,
        bottom: 8,
        borderRadius: 44,
        backgroundColor: iosInk.bg,
        boxShadow: iosInk.shadow,
        alignItems: 'center',
        paddingTop: 28,
        paddingHorizontal: 24,
      }}
    >
      <LogShortcutIcon size={76} />
      <Text style={{ ...body(24, 700), color: iosInk.label, marginTop: 14 }}>
        {WALLET_SHORTCUT_NAME}
      </Text>
      <View
        style={{
          alignSelf: 'stretch',
          marginTop: 22,
          height: 56,
          borderRadius: 18,
          backgroundColor: iosInk.grouped,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingHorizontal: 14,
        }}
      >
        <SixPmIcon size={30} />
        <Text style={{ ...body(17, 600), color: iosInk.label }}>
          {t('native.intents.logSpend.title')}
        </Text>
      </View>
      <View
        style={{
          position: 'absolute',
          left: 24,
          right: 24,
          bottom: 66,
          height: 52,
          borderRadius: 26,
          backgroundColor: iosInk.blue,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        <Text style={{ ...body(17, 600), color: iosInk.bg }}>
          {t('capture.walk.ios.addShortcut')}
        </Text>
        {flash}
      </View>
      <Text style={{ position: 'absolute', bottom: 30, ...body(17), color: iosInk.blue }}>
        {t('capture.walk.ios.dontAdd')}
      </Text>
    </View>
  );
}

/** The link opens Add Shortcut over All Shortcuts; tapped, "Log to 6pm" joins the list. */
export function AddShortcutFrame({ t, scale }: FrameProps) {
  const { t: tr } = useI18n();
  return (
    <Phone t={t} scale={scale} background={iosInk.grouped}>
      <LargeTitle
        title={tr('capture.walk.ios.allShortcuts')}
        left={<GlassButton glyph="chevron_left" />}
        right={<GlassButton glyph="add" />}
      />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, margin: 16 }}>
        <Tile color={iosInk.teal} glyph="home" name={tr('capture.walk.ios.shortcutA')} />
        <Tile
          color={iosInk.purple}
          glyph="local_laundry_service"
          name={tr('capture.walk.ios.shortcutB')}
        />
        <Reveal t={t} from={0.58} to={0.68} fromScale={0.6}>
          <Tile color={iosInk.logTile} glyph="layers" name={WALLET_SHORTCUT_NAME} />
        </Reveal>
      </View>
      <Reveal t={t} from={0.04} to={0.14} style={FULL}>
        <Reveal t={t} from={0.48} to={0.56} out style={[FULL, { backgroundColor: iosInk.dim }]} />
      </Reveal>
      <Reveal t={t} from={0.04} to={0.16} dy={540} style={FULL}>
        <Reveal t={t} from={0.48} to={0.56} out dy={540} style={FULL}>
          <AddSheet flash={<TapFlash t={t} at={0.46} />} />
        </Reveal>
      </Reveal>
      <Touch
        t={t}
        stops={[
          { at: 0.12, x: 260, y: 640 },
          { at: 0.46, x: 201, y: ADD_Y, tap: true },
        ]}
      />
    </Phone>
  );
}
