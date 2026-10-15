import { useLocalSearchParams } from 'expo-router';

import { CaptureGuideSheet } from '../features/capture-guide/capture-guide-sheet';
import { captureSourceOf } from '../features/capture-guide/source-status';
import { WidgetsGuideSheet } from '../features/widgets-guide/widgets-guide-sheet';

/**
 * How one way of catching spending works: `/capture-guide?source=wallet`. Widgets & controls has
 * its own guide, which draws every place 6pm lives outside the app.
 */
export default function CaptureGuide() {
  const { source } = useLocalSearchParams<{ source?: string | string[] }>();
  const way = captureSourceOf(source);
  if (way === 'widgets') return <WidgetsGuideSheet />;
  return <CaptureGuideSheet source={way} />;
}
