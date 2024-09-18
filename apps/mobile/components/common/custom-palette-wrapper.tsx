import { useColorPalette } from '@/hooks/use-color-palette'
import { vars } from 'nativewind'
import { View, type ViewProps } from 'react-native'

export function CustomPaletteWrapper(props: ViewProps) {
  const { colorPalette } = useColorPalette()

  return (
    <View {...props} style={[{ flex: 1 }, props.style, vars(colorPalette)]} />
  )
}
