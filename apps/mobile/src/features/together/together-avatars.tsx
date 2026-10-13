import { Text, View } from 'react-native';

import { togetherInk } from '@6pm/theme';

import { useI18n } from '../../i18n/i18n';
import { Symbol } from '../../ui/icons/symbol';
import { useTheme } from '../../ui/theme/theme';
import { body } from '../../ui/type/fonts';

const SIZE = 36;

function Face({ letter, fill, ring }: { letter: string; fill: string; ring: string }) {
  return (
    <View
      style={{
        width: SIZE,
        height: SIZE,
        borderRadius: SIZE / 2,
        backgroundColor: fill,
        boxShadow: `0 0 0 2px ${ring}`,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ ...body(15, 700), color: togetherInk.ink }}>{letter}</Text>
    </View>
  );
}

/**
 * The two overlapping rounds on the Budget together card (`App:376`): the person's initial, then
 * the partner's, or a dashed "add" round while there is no partner yet.
 */
export function TogetherAvatars({
  me,
  partner,
  ring,
  dashLine,
}: {
  readonly me: string;
  /** The partner's initial, or null for the dashed invite round. */
  readonly partner: string | null;
  /** The surface the rounds sit on: their 2 pt ring. */
  readonly ring: string;
  readonly dashLine: string;
}) {
  const { palette } = useTheme();
  return (
    <View style={{ flexDirection: 'row', flexShrink: 0 }}>
      <Face letter={me} fill={togetherInk.me} ring={ring} />
      <View style={{ marginLeft: -10 }}>
        {partner === null ? (
          <View
            style={{
              width: SIZE,
              height: SIZE,
              borderRadius: SIZE / 2,
              backgroundColor: palette.chipBg,
              borderWidth: 1.5,
              borderStyle: 'dashed',
              borderColor: dashLine,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Symbol name="add" size={18} color={palette.ink} />
          </View>
        ) : (
          <Face letter={partner} fill={togetherInk.partner} ring={ring} />
        )}
      </View>
    </View>
  );
}

/** The MAX lock badge, as the prototype draws it beside a Max feature. */
export function MaxLock() {
  const { palette } = useTheme();
  const { t } = useI18n();
  return (
    <View
      style={{
        height: 20,
        paddingLeft: 5,
        paddingRight: 7,
        borderRadius: 6,
        backgroundColor: palette.ink,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        flexShrink: 0,
      }}
    >
      <Symbol name="lock" size={12} fill={1} color={palette.sheetSolid} />
      <Text style={{ ...body(10, 800, 0.1), color: palette.sheetSolid }}>
        {t('plan.occasions.max')}
      </Text>
    </View>
  );
}
