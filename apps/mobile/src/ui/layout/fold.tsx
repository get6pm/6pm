import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useWindowDimensions } from 'react-native';
import { useSharedValue, type SharedValue } from 'react-native-reanimated';

import { fold, type FoldSnapshot } from '../../../modules/fold';
import { foldForm, type FoldForm } from './fold-form';

const NO_FOLD: FoldSnapshot = { hinge: 'unknown', angle: null, divisions: [], occlusions: [] };

interface FoldState {
  readonly snapshot: FoldSnapshot;
  /** The hinge angle on the UI thread, for motion that follows the fold; -1 without a hinge. */
  readonly angle: SharedValue<number>;
}

const FoldContext = createContext<FoldState | null>(null);

/** Follows the iPhone Duo's hinge and regions for the whole app; a plain phone reports no fold. */
export function FoldProvider({ children }: { readonly children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<FoldSnapshot>(() => fold?.current() ?? NO_FOLD);
  const angle = useSharedValue(snapshot.angle ?? -1);

  useEffect(() => {
    if (!fold) return;
    const subscription = fold.addListener('onFold', (next) => {
      angle.set(next.angle ?? -1);
      setSnapshot(next);
    });
    return () => subscription.remove();
  }, [angle]);

  const value = useMemo(() => ({ snapshot, angle }), [snapshot, angle]);
  return <FoldContext.Provider value={value}>{children}</FoldContext.Provider>;
}

export function useFold(): FoldState {
  const state = useContext(FoldContext);
  if (!state) throw new Error('useFold needs a FoldProvider');
  return state;
}

/** The layout for the way the phone is held right now (see `foldForm`). */
export function useFoldForm(): FoldForm {
  const { snapshot } = useFold();
  const { width, height } = useWindowDimensions();
  return useMemo(() => foldForm(snapshot, { width, height }), [snapshot, width, height]);
}
