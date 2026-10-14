import { View } from 'react-native';

import { useI18n } from '../../../i18n/i18n';
import { Symbol } from '../../../ui/icons/symbol';
import { body } from '../../../ui/type/fonts';
import { Phone } from './device';
import { iosInk } from './frame-ink';
import { Magnifier } from './ios-parts';
import { Reveal, TapFlash, Touch, Typed } from './moving-parts';
import { EditorBar, EditorCard, SixPmIcon } from './shortcuts-chrome';
import { LogSpendCard, TriggerCard, type FieldState } from './shortcuts-cards';
import { DockedDrawer, DrawerItem } from './shortcuts-drawer';
import { Keyboard, VariableSheet, VariablesBar } from './shortcuts-variables';
import type { FrameProps } from './wallet-frames-library';

const FULL = { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } as const;

/** Where "Log in 6pm" sits under the trigger, and its rows' centres. */
const CARD_TOP = 251;

const AMOUNT_Y = CARD_TOP + 80;

const WHERE_Y = CARD_TOP + 124;

const PICK_Y = { merchant: 754, amount: 806 } as const;

/** The trigger at the top of the editor, as every later step shows it. */
function Trigger() {
  return (
    <EditorCard top={143}>
      <TriggerCard />
    </EditorCard>
  );
}

/** The drawer's search finds "Log in 6pm"; tapped, it goes under the trigger. */
export function AddActionFrame({ t, scale }: FrameProps) {
  const { t: tr } = useI18n();
  const name = tr('native.intents.logSpend.title');
  return (
    <Phone t={t} scale={scale} background={iosInk.grouped}>
      <EditorBar name={tr('capture.walk.ios.newShortcut')} icon={false} />
      <Trigger />
      <Reveal t={t} from={0.62} to={0.72} dy={-16} style={FULL}>
        <EditorCard top={CARD_TOP}>
          <LogSpendCard t={t} />
        </EditorCard>
      </Reveal>
      <Reveal t={t} from={0.14} to={0.2} out style={FULL}>
        <DockedDrawer />
      </Reveal>
      <Reveal t={t} from={0.16} to={0.24} style={FULL}>
        <Reveal t={t} from={0.6} to={0.68} out dy={300} style={FULL}>
          <View
            style={{
              position: 'absolute',
              top: 70,
              left: 0,
              right: 0,
              bottom: 0,
              borderTopLeftRadius: 40,
              borderTopRightRadius: 40,
              backgroundColor: iosInk.grouped,
              boxShadow: iosInk.shadow,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                margin: 16,
                marginTop: 10,
              }}
            >
              <View
                style={{
                  flex: 1,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: iosInk.fill,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  paddingHorizontal: 14,
                }}
              >
                <Magnifier color={iosInk.label} />
                <Typed
                  t={t}
                  from={0.26}
                  to={0.42}
                  text={name}
                  width={150}
                  style={{ ...body(17), color: iosInk.label }}
                />
              </View>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: iosInk.bg,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Symbol name="close" size={22} color={iosInk.label} />
              </View>
            </View>
            <Reveal t={t} from={0.42} to={0.48}>
              <View>
                <DrawerItem name={name} icon={<SixPmIcon size={30} />} />
                <View
                  style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    left: 12,
                    right: 12,
                    borderRadius: 22,
                    overflow: 'hidden',
                  }}
                >
                  <TapFlash t={t} at={0.56} />
                </View>
              </View>
            </Reveal>
            <Keyboard />
          </View>
        </Reveal>
      </Reveal>
      <Touch
        t={t}
        stops={[
          { at: 0.06, x: 280, y: 560 },
          { at: 0.14, x: 180, y: 818, tap: true },
          { at: 0.5, x: 200, y: 330 },
          { at: 0.56, x: 270, y: 156, tap: true },
        ]}
      />
    </Phone>
  );
}

/**
 * One field filled from the tap: the finger taps the field, Transaction above the keyboard, the
 * blue token, then the part to get; the token takes that part's name.
 */
export function FillFieldFrame({
  t,
  scale,
  field,
}: FrameProps & { readonly field: 'amount' | 'where' }) {
  const { t: tr } = useI18n();
  const transaction = tr('capture.walk.ios.transaction');
  const amountToken = tr('capture.walk.ios.amount');
  const merchantToken = tr('capture.walk.ios.merchant');
  const filling: FieldState = {
    token: field === 'amount' ? amountToken : merchantToken,
    first: transaction,
    at: 0.32,
    pickAt: 0.62,
  };
  const y = field === 'amount' ? AMOUNT_Y : WHERE_Y;
  return (
    <Phone t={t} scale={scale} background={iosInk.grouped}>
      <EditorBar name={tr('native.intents.logSpend.title')} />
      <Trigger />
      <EditorCard top={CARD_TOP}>
        <LogSpendCard
          t={t}
          amount={field === 'amount' ? filling : { token: amountToken }}
          where={field === 'where' ? filling : { token: null }}
        />
      </EditorCard>
      <Reveal t={t} from={0.12} to={0.18} style={FULL}>
        <Reveal t={t} from={0.36} to={0.42} out style={FULL}>
          <VariablesBar t={t} flashAt={0.3} />
        </Reveal>
      </Reveal>
      <Reveal t={t} from={0.12} to={0.18} out style={FULL}>
        <DockedDrawer />
      </Reveal>
      <Reveal t={t} from={0.44} to={0.52} dy={460} style={FULL}>
        <Reveal t={t} from={0.62} to={0.7} out dy={460} style={FULL}>
          <VariableSheet t={t} picked={field === 'amount' ? 'amount' : 'merchant'} />
        </Reveal>
      </Reveal>
      <Reveal t={t} from={0.66} to={0.72} style={FULL}>
        <DockedDrawer />
      </Reveal>
      <Touch
        t={t}
        stops={[
          { at: 0.04, x: 250, y: 620 },
          { at: 0.12, x: 320, y, tap: true },
          { at: 0.3, x: 250, y: 823, tap: true },
          { at: 0.42, x: 320, y, tap: true },
          { at: 0.6, x: 200, y: field === 'amount' ? PICK_Y.amount : PICK_Y.merchant, tap: true },
        ]}
      />
    </Phone>
  );
}
