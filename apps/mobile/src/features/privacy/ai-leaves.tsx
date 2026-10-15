import { Text, View } from 'react-native';

import { useI18n } from '../../i18n/i18n';
import { Symbol } from '../../ui/icons/symbol';
import { body } from '../../ui/type/fonts';
import type { AiInks } from './ai-choice';
import type { AiMode } from './ai-mode';

const SERVER = [
  'privacy.leaves.server.ask',
  'privacy.leaves.server.lines',
  'privacy.leaves.server.receipts',
  'privacy.leaves.server.voice',
] as const;
const DEVICE = [
  'privacy.leaves.device.none',
  'privacy.leaves.device.network',
  'privacy.leaves.device.emails',
] as const;

/** What leaves the phone in the chosen mode, line by line, under the choice in Settings. */
export function AiLeaves({ mode, inks }: { readonly mode: AiMode; readonly inks: AiInks }) {
  const { t } = useI18n();
  return (
    <View style={{ gap: 8, paddingHorizontal: 6 }}>
      <Text style={{ ...body(13, 600), color: inks.inkSoft }}>{t('privacy.leaves.title')}</Text>
      {(mode === 'device' ? DEVICE : SERVER).map((key, i) => (
        <View key={key} style={{ flexDirection: 'row', gap: 8 }}>
          <Symbol
            name={mode === 'device' && i === 0 ? 'lock' : 'north_east'}
            size={16}
            color={inks.inkSoft}
            style={{ marginTop: 1 }}
          />
          <Text style={{ ...body(13.5), lineHeight: 18.9, color: inks.ink, flex: 1 }}>
            {t(key)}
          </Text>
        </View>
      ))}
    </View>
  );
}
