import { useColorPalette } from '@/hooks/use-color-palette'
import { useColorScheme } from '@/hooks/useColorScheme'
import { LinearGradient } from 'expo-linear-gradient'

export function FooterGradient() {
  const { colorScheme } = useColorScheme()
  const { getColor } = useColorPalette()

  return (
    <LinearGradient
      colors={[
        colorScheme === 'dark' ? 'transparent' : '#ffffff00',
        getColor('--background'),
      ]}
      className="absolute right-0 bottom-0 left-0 h-40"
      pointerEvents="none"
    />
  )
}
