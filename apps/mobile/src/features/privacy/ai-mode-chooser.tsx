import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { localModelNative } from '../../../modules/local-model';
import { useI18n } from '../../i18n/i18n';
import { haptics } from '../../ui/haptics';
import { body } from '../../ui/type/fonts';
import type { DownloadState } from '../local-model/download-state';
import { useModelDownload } from '../local-model/use-model-download';
import { ModeCard, type AiInks } from './ai-choice';
import {
  modelsFor,
  readLocalModel,
  writeLocalModel,
  type AiMode,
  type LocalModel,
  type LocalModelId,
} from './ai-mode';
import { ModelRow, type ModelRowState } from './model-row';
import { setAiMode, useAiMode } from './use-ai-mode';

function rowState(state: DownloadState): ModelRowState {
  switch (state.kind) {
    case 'idle':
      return { kind: 'none' };
    case 'downloading':
      return { kind: 'downloading', progress: state.progress };
    case 'verifying':
    case 'ready':
      return { kind: state.kind };
    case 'failed':
      return { kind: 'failed' };
  }
}

/** One model's row with its own live download. */
function DownloadRow({
  model,
  on,
  inks,
  onPick,
  canDelete,
}: {
  readonly model: LocalModel;
  readonly on: boolean;
  readonly inks: AiInks;
  readonly onPick: () => void;
  readonly canDelete: boolean;
}) {
  const download = useModelDownload(model.id);
  return (
    <ModelRow
      model={model}
      on={on}
      state={rowState(download.state)}
      inks={inks}
      onPick={onPick}
      onDownload={() => {
        haptics.tap();
        onPick();
        void download.start();
      }}
      {...(canDelete ? { onDelete: () => void download.remove() } : {})}
    />
  );
}

/**
 * Where 6pm's AI runs, chosen in onboarding and in Settings: the two places as cards, and in
 * on-device mode the models this phone has the memory for, each with its download. The mode
 * changes at once: on-device mode works without a model (the rules and the catalogue answer),
 * and a downloaded model makes its answers better.
 */
export function AiModeChooser({
  inks,
  canDelete = false,
}: {
  readonly inks: AiInks;
  /** Settings offers to delete a downloaded model. */
  readonly canDelete?: boolean;
}) {
  const db = useSQLiteContext();
  const { t } = useI18n();
  const mode = useAiMode();
  const models = modelsFor(localModelNative?.memoryGb() ?? 0);
  const [picked, setPicked] = useState<LocalModelId | null>(
    () => readLocalModel(db) ?? models[0]?.id ?? null,
  );

  const choose = (next: AiMode) => {
    if (next === mode) return;
    haptics.tap();
    setAiMode(db, next);
    if (next === 'device' && picked !== null) writeLocalModel(db, picked);
  };
  const pick = (id: LocalModelId) => {
    if (id !== picked) haptics.tap();
    setPicked(id);
    writeLocalModel(db, id);
  };

  return (
    <View style={{ gap: 10 }}>
      <ModeCard mode="server" on={mode === 'server'} inks={inks} onPress={() => choose('server')} />
      <ModeCard
        mode="device"
        on={mode === 'device'}
        disabled={models.length === 0}
        inks={inks}
        onPress={() => choose('device')}
      />
      {mode === 'device' && models.length > 0 ? (
        <Animated.View
          entering={FadeIn.duration(220)}
          exiting={FadeOut.duration(160)}
          style={{ gap: 8, paddingTop: 8 }}
        >
          <Text style={{ ...body(13, 600), color: inks.inkSoft, paddingHorizontal: 6 }}>
            {t('privacy.ai.models')}
          </Text>
          <View
            style={{
              borderRadius: 22,
              backgroundColor: inks.cell,
              boxShadow: inks.cardShadow,
              overflow: 'hidden',
            }}
          >
            {models.map((model, i) => (
              <View
                key={model.id}
                style={i === 0 ? undefined : { borderTopWidth: 0.5, borderTopColor: inks.hair }}
              >
                <DownloadRow
                  model={model}
                  on={picked === model.id}
                  inks={inks}
                  onPick={() => pick(model.id)}
                  canDelete={canDelete}
                />
              </View>
            ))}
          </View>
          <Text style={{ ...body(12.5), color: inks.inkSoft, paddingHorizontal: 6 }}>
            {t('privacy.model.later')}
          </Text>
        </Animated.View>
      ) : null}
    </View>
  );
}
