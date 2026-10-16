import { useCallback, useState } from 'react';
import type { LayoutChangeEvent } from 'react-native';

/**
 * The width a view is actually given, for drawings sized to it inside a sheet. A sheet is the
 * window's width on a phone, but iOS shows it narrower on a wide screen (the iPhone Duo opened),
 * so the window cannot stand in for it. `estimate` is used until the first layout, when `ready`
 * is false and the drawing should stay hidden.
 */
export function useMeasuredWidth(estimate: number) {
  const [measured, setMeasured] = useState<number | null>(null);
  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const next = e.nativeEvent.layout.width;
    setMeasured((current) => (current === next ? current : next));
  }, []);
  return { width: measured ?? estimate, ready: measured !== null, onLayout };
}
