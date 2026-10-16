import { requireNativeView, requireOptionalNativeModule } from 'expo';
import type { ComponentType } from 'react';
import type { NativeSyntheticEvent, ViewProps } from 'react-native';

export interface DropTextViewProps extends ViewProps {
  readonly onDropText: (event: NativeSyntheticEvent<{ readonly text: string }>) => void;
  readonly onDragOver: (event: NativeSyntheticEvent<{ readonly over: boolean }>) => void;
}

/**
 * A view other apps' text can be dropped on (`modules/drop-text/ios`), or null where it is not
 * built in: tests, and other platforms.
 */
export const DropTextView: ComponentType<DropTextViewProps> | null = requireOptionalNativeModule(
  'DropText',
)
  ? requireNativeView<DropTextViewProps>('DropText')
  : null;
