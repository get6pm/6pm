import { createContext, use, useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { Text } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';

import { haptics } from '../haptics';
import { Symbol } from '../icons/symbol';
import { useDesignInsets } from '../layout/design-insets';
import { PressScale } from '../primitives/press-scale';
import { useTheme } from '../theme/theme';
import { body } from '../type/fonts';

interface UndoOffer {
  readonly key: number;
  readonly text: string;
  readonly actionLabel: string;
  readonly undo: () => void;
}

const UNDO_MS = 5000;
const UndoContext = createContext<
  ((text: string, actionLabel: string, undo: () => void) => void) | null
>(null);

/**
 * The undo pill: "Deleted Phở Hòa · Undo", above the tab bar for five seconds. One at a time; a new
 * offer replaces the last (the last one's change stays).
 */
export function UndoHost({ children }: { readonly children: ReactNode }) {
  const { palette } = useTheme();
  const { bottom } = useDesignInsets();
  const [offer, setOffer] = useState<UndoOffer | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const counter = useRef(0);

  const show = useCallback((text: string, actionLabel: string, undo: () => void) => {
    clearTimeout(timer.current);
    counter.current += 1;
    setOffer({ key: counter.current, text, actionLabel, undo });
    timer.current = setTimeout(() => setOffer(null), UNDO_MS);
  }, []);

  const value = useMemo(() => show, [show]);

  return (
    <UndoContext value={value}>
      {children}
      {offer ? (
        <Animated.View
          key={offer.key}
          entering={FadeInDown.duration(300)}
          exiting={FadeOutDown.duration(200)}
          style={{
            position: 'absolute',
            left: 16,
            right: 16,
            bottom: bottom(102),
            height: 52,
            borderRadius: 18,
            backgroundColor: palette.btnBg,
            boxShadow: '0 12px 30px rgba(10,5,20,.3)',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            paddingLeft: 16,
            paddingRight: 6,
          }}
        >
          <Symbol name="delete" size={20} color={palette.btnFg} />
          <Text numberOfLines={1} style={{ ...body(15, 500), color: palette.btnFg, flex: 1 }}>
            {offer.text}
          </Text>
          <PressScale
            accessibilityRole="button"
            onPress={() => {
              clearTimeout(timer.current);
              haptics.tap();
              offer.undo();
              setOffer(null);
            }}
            style={{ height: 40, paddingHorizontal: 14, justifyContent: 'center' }}
          >
            <Text
              style={{ ...body(15, 700), color: palette.btnFg, textDecorationLine: 'underline' }}
            >
              {offer.actionLabel}
            </Text>
          </PressScale>
        </Animated.View>
      ) : null}
    </UndoContext>
  );
}

/** Offers an undo for a change that has already been saved. */
export function useOfferUndo() {
  const show = use(UndoContext);
  if (!show) throw new Error('useOfferUndo needs an UndoHost above it');
  return show;
}
