import { Text, View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { useI18n } from '../../i18n/i18n';
import { Symbol } from '../../ui/icons/symbol';
import { PressScale } from '../../ui/primitives/press-scale';
import { body, tabular } from '../../ui/type/fonts';
import { RowCheck } from '../banks/bank-picker-parts';
import type { AiInks } from './ai-choice';
import type { LocalModel } from './ai-mode';

/** Where a model's download stands, as the row shows it. */
export type ModelRowState =
  | { readonly kind: 'none' }
  | { readonly kind: 'downloading'; readonly progress: number }
  | { readonly kind: 'verifying' }
  | { readonly kind: 'ready' }
  | { readonly kind: 'failed' };

/** "2.4", "2,4": a size in GB with the language's decimal mark. */
function gigabytes(bytes: number, language: string): string {
  const text = (bytes / 1e9).toFixed(1);
  return language === 'vi' ? text.replace('.', ',') : text;
}

function Pill({
  label,
  icon,
  accent,
  inks,
  onPress,
}: {
  readonly label: string;
  readonly icon?: 'download' | 'delete';
  readonly accent?: boolean;
  readonly inks: AiInks;
  readonly onPress: () => void;
}) {
  return (
    <PressScale scaleTo={0.95} accessibilityRole="button" onPress={onPress}>
      <View
        style={{
          height: 32,
          borderRadius: 99,
          paddingHorizontal: 12,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          backgroundColor: accent ? inks.accent : inks.chipBg,
        }}
      >
        {icon ? <Symbol name={icon} size={16} color={accent ? inks.onAccent : inks.ink} /> : null}
        <Text style={{ ...body(13.5, 650), color: accent ? inks.onAccent : inks.ink }}>
          {label}
        </Text>
      </View>
    </PressScale>
  );
}

/**
 * One local model: the round check that picks it, its name, what it is best at and its size, and
 * its download on the right (a button, the percentage over a thin bar, a check when ready). A row
 * highlights under the finger, as list rows do; only its buttons sink.
 */
export function ModelRow({
  model,
  on,
  state,
  inks,
  onPick,
  onDownload,
  onDelete,
}: {
  readonly model: LocalModel;
  readonly on: boolean;
  readonly state: ModelRowState;
  readonly inks: AiInks;
  readonly onPick: () => void;
  readonly onDownload: () => void;
  /** Settings offers to delete a downloaded model; onboarding does not. */
  readonly onDelete?: () => void;
}) {
  const { t, language } = useI18n();
  const progress = state.kind === 'downloading' ? state.progress : state.kind === 'none' ? 0 : 1;
  // The bar grows from the left on the UI thread, never by changing its width.
  const bar = useAnimatedStyle(() => ({
    transform: [{ scaleX: withTiming(progress, { duration: 300 }) }],
  }));
  const busy = state.kind === 'downloading' || state.kind === 'verifying';
  return (
    <PressScale
      highlight
      onPress={onPick}
      accessibilityRole="radio"
      accessibilityState={{ checked: on }}
      style={{ paddingVertical: 12, paddingHorizontal: 14, gap: 8 }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <RowCheck on={on} inks={inks} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ ...body(16, 600), color: inks.ink }}>{model.name}</Text>
          <Text style={{ ...body(13), color: inks.inkSoft }}>
            {t(`privacy.model.${model.strength}`)} ·{' '}
            {t('privacy.model.size', { size: gigabytes(model.bytes, language) })}
          </Text>
        </View>
        {state.kind === 'none' ? (
          <Pill
            label={t('privacy.model.download')}
            icon="download"
            inks={inks}
            onPress={onDownload}
          />
        ) : state.kind === 'failed' ? (
          <Pill label={t('privacy.model.failed')} accent inks={inks} onPress={onDownload} />
        ) : state.kind === 'ready' ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Symbol name="check_circle" size={18} color={inks.okInk} />
              <Text style={{ ...body(13.5, 650), color: inks.okInk }}>
                {t('privacy.model.ready')}
              </Text>
            </View>
            {onDelete ? (
              <PressScale scaleTo={0.9} accessibilityRole="button" onPress={onDelete}>
                <Symbol name="delete" size={20} color={inks.inkSoft} />
              </PressScale>
            ) : null}
          </View>
        ) : (
          <Text style={{ ...body(13.5, 650), ...tabular, color: inks.inkSoft }}>
            {state.kind === 'verifying'
              ? t('privacy.model.verifying')
              : t('privacy.model.downloading', { percent: Math.round(state.progress * 100) })}
          </Text>
        )}
      </View>
      {busy ? (
        <View style={{ height: 3, borderRadius: 2, backgroundColor: inks.hair, marginLeft: 36 }}>
          <Animated.View
            style={[{ height: 3, borderRadius: 2, backgroundColor: inks.accent }, bar]}
          />
        </View>
      ) : null}
    </PressScale>
  );
}
