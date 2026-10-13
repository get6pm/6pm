import type { ReactNode } from 'react';
import { View, type ColorValue } from 'react-native';

import { useTheme } from '../theme/theme';

/**
 * The inside of a native sheet (`sheet` presentation): the header on top, the body filling the
 * rest, on the solid sheet colour. The sheet itself gives the drag, the dimming and the corners.
 *
 * The views stay un-flattened on purpose: when a ScrollView sits directly in the sheet's root,
 * react-native-screens stretches it over the whole sheet, under the header. Kept inside the body,
 * the ScrollView is laid out by flexbox and still pulls the sheet down from its top edge.
 */
export function SheetFrame({
  header,
  children,
  background,
}: {
  /** The top: grabber and title row. */
  readonly header?: ReactNode;
  readonly children: ReactNode;
  /** A sheet with its own colour (the Max sheet is always dark). */
  readonly background?: ColorValue;
}) {
  const { palette } = useTheme();
  return (
    <View
      collapsable={false}
      style={{ flex: 1, backgroundColor: background ?? palette.sheetSolid }}
    >
      {header === undefined ? null : <View collapsable={false}>{header}</View>}
      <View collapsable={false} style={{ flex: 1 }}>
        {children}
      </View>
    </View>
  );
}
