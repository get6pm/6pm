import { useNavigation } from 'expo-router';
import type { NativeStackNavigationProp } from 'expo-router/native-stack';
import type { ParamListBase } from 'expo-router/react-navigation';
import { type RefObject, useEffect } from 'react';

/**
 * Puts the caret in `input` once its screen has finished presenting, so the keyboard is up and
 * ready the moment the sheet settles. Focusing while the native sheet is still rising (as
 * `autoFocus` does) makes the two animations fight; waiting for the stack's `transitionEnd` lets
 * the keyboard rise right behind the sheet, on the system's own curve. Only for screens whose
 * first action is typing; `enabled` false leaves the keyboard down.
 */
export function useFocusOnPresent(
  input: RefObject<{ readonly focus: () => void } | null>,
  enabled = true,
) {
  const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();
  useEffect(() => {
    if (!enabled) return;
    return navigation.addListener('transitionEnd', (event) => {
      if (!event.data.closing) input.current?.focus();
    });
  }, [navigation, input, enabled]);
}
