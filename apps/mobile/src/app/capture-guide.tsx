import { useLocalSearchParams } from 'expo-router';

import { CaptureGuideSheet } from '../features/capture-guide/capture-guide-sheet';
import { captureSourceOf } from '../features/capture-guide/source-status';

/** How one way of catching spending works: `/capture-guide?source=wallet`. */
export default function CaptureGuide() {
  const { source } = useLocalSearchParams<{ source?: string | string[] }>();
  return <CaptureGuideSheet source={captureSourceOf(source)} />;
}
