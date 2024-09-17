import { type ColorKey, Palette, themeVariables } from '@/lib/theme'
import { useUserSettingsStore } from '@/stores/user-settings/store'
import { FeatureFlag, useFeatureFlag } from './use-feature-flag'
import { useColorScheme } from './useColorScheme'

export function useColorPalette() {
  const preferredPalette = useUserSettingsStore().preferredPalette
  const { colorScheme } = useColorScheme()
  const isDynamicColorPaletteEnabled = useFeatureFlag(
    FeatureFlag.DynamicColorPalette,
  )

  const colorPalette =
    themeVariables[
      isDynamicColorPaletteEnabled ? preferredPalette : Palette.Default
    ][colorScheme ?? 'light']

  const getColor = (colorKey: ColorKey) => {
    return `hsl(${colorPalette[colorKey]})`
  }

  return {
    colorPalette,
    getColor,
  }
}
