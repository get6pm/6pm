import { Text, View } from 'react-native';

import type { LookConfig, LookId } from '@6pm/theme';

import { useI18n } from '../../i18n/i18n';
import { Companion } from '../../ui/companion/companion';
import { Symbol } from '../../ui/icons/symbol';
import { PressScale } from '../../ui/primitives/press-scale';
import { body, display, leading } from '../../ui/type/fonts';
import { LookSkyPreview } from '../looks/look-sky-preview';
import type { MaxFrom } from './max-context';
import { MaxGlow } from './max-glow';
import { Floating, HeroArt } from './max-hero-art';
import { SCENE_LOOKS } from './products';
import { MAX_CREAM, MAX_FONT, MAX_INK, MAX_PAGE } from './max-colours';

const CARD = { width: 116, height: 174 };
/** How far the glow reaches down the page behind the headline and the tiles. */
const GLOW = 560;

/** The three living scenes fan out above the wordmark: x, y, tilt, stacking, and float period. */
const FAN = [
  { look: SCENE_LOOKS[0], x: -98, y: 16, rotate: -10, z: 1, seconds: 5.2 },
  { look: SCENE_LOOKS[1], x: 0, y: 0, rotate: 0, z: 2, seconds: 4.6 },
  { look: SCENE_LOOKS[2], x: 98, y: 16, rotate: 10, z: 1, seconds: 5.8 },
] as const;

/**
 * The top of the Max sheet (prototype `App:1048-1079`): the paid skies blurred into a glow that
 * fades down behind the page, a picture of the reason it was opened (the living scenes, live,
 * with the companion, for the looks), the grabber, the close button and the wordmark.
 */
export function MaxHero({
  from,
  hour,
  configs,
  safe,
  onClose,
}: {
  readonly from: MaxFrom;
  readonly hour: number;
  readonly configs: Readonly<Partial<Record<LookId, Partial<LookConfig>>>>;
  readonly safe: string;
  readonly onClose: () => void;
}) {
  const { t } = useI18n();
  return (
    <View style={{ height: 300, zIndex: 0 }}>
      <View
        pointerEvents="none"
        style={{ position: 'absolute', left: -50, right: -50, top: -50, height: GLOW }}
      >
        <MaxGlow hour={hour} configs={configs} blur={44} saturation={1.3} opacity={0.7} inset={0} />
      </View>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          height: GLOW,
          backgroundImage:
            'radial-gradient(80% 45% at 50% 22%, rgba(15,12,20,0) 0%, rgba(15,12,20,.4) 100%)',
        }}
      />
      {/* The prototype masks the glow out from halfway down; on the page's own colour that is
          the page colour coming in. */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: -50,
          right: -50,
          top: -50,
          height: GLOW,
          backgroundImage: `linear-gradient(180deg, rgba(15,12,20,0) 45%, ${MAX_PAGE} 100%)`,
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 8,
          alignSelf: 'center',
          width: 36,
          height: 5,
          borderRadius: 9,
          backgroundColor: 'rgba(255,255,255,.4)',
        }}
      />
      <PressScale
        accessibilityRole="button"
        accessibilityLabel={t('max.close')}
        scaleTo={0.92}
        onPress={onClose}
        hitSlop={8}
        style={{
          position: 'absolute',
          zIndex: 3,
          top: 16,
          right: 16,
          width: 34,
          height: 34,
          borderRadius: 17,
          backgroundColor: 'rgba(10,8,16,.45)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Symbol name="close" size={19} color="#ffffff" />
      </PressScale>

      {from === 'looks' ? (
        <>
          <View
            pointerEvents="none"
            style={{ position: 'absolute', left: '50%', top: 36, width: 0, height: 0 }}
          >
            {FAN.map(({ look, x, y, rotate, z, seconds }) => (
              <View
                key={look}
                style={{
                  position: 'absolute',
                  left: x - CARD.width / 2,
                  top: y,
                  width: CARD.width,
                  height: CARD.height,
                  zIndex: z,
                  transform: [{ rotate: `${rotate}deg` }],
                }}
              >
                <Floating seconds={seconds} style={{ flex: 1 }}>
                  <View
                    style={{
                      flex: 1,
                      borderRadius: 24,
                      overflow: 'hidden',
                      boxShadow: '0 22px 44px rgba(0,0,0,.55)',
                    }}
                  >
                    <LookSkyPreview
                      look={look}
                      hour={hour}
                      config={configs[look]}
                      width={CARD.width}
                      height={CARD.height}
                      running
                      lift={40}
                    />
                    <View
                      pointerEvents="none"
                      style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        bottom: 0,
                        left: 0,
                        borderRadius: 24,
                        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.16)',
                      }}
                    />
                  </View>
                </Floating>
              </View>
            ))}
          </View>
          <View
            pointerEvents="none"
            style={{ position: 'absolute', left: '50%', bottom: 44, marginLeft: -44, zIndex: 3 }}
          >
            <Companion size={88} mood="happy" form="max" />
          </View>
        </>
      ) : (
        <HeroArt from={from} safe={safe} />
      )}

      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 14,
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 9,
        }}
      >
        <Text style={{ ...leading(display(32, 700, -0.03, MAX_FONT), 32), color: MAX_CREAM }}>
          6pm
        </Text>
        <View
          style={{
            height: 24,
            paddingHorizontal: 9,
            borderRadius: 8,
            backgroundColor: MAX_CREAM,
            justifyContent: 'center',
          }}
        >
          <Text style={{ ...body(13, 800, 0.12), color: MAX_INK }}>MAX</Text>
        </View>
      </View>
    </View>
  );
}
