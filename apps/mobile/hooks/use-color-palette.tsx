import { type ColorKey, themeVariables } from '@/lib/theme'
import { useUserSettingsStore } from '@/stores/user-settings/store'
// import { FeatureFlag, useFeatureFlag } from './use-feature-flag'
import { useColorScheme } from './useColorScheme'

type GetColorOptions = {
  alpha?: number
}

/**
 * Not able to use feature flag in burndown-chart somehow
 */
export function useColorPalette() {
  const preferredPalette = useUserSettingsStore().preferredPalette
  const { colorScheme } = useColorScheme()
  // const isDynamicColorPaletteEnabled = useFeatureFlag(
  //   FeatureFlag.DynamicColorPalette,
  // )

  const colorPalette =
    // isDynamicColorPaletteEnabled ? preferredPalette : Palette.Default
    themeVariables[preferredPalette][colorScheme ?? 'light']

  const getColor = (colorKey: ColorKey, options?: GetColorOptions) => {
    const { alpha = 1 } = options ?? {}
    return `hsla(${colorPalette[colorKey]?.replaceAll(' ', ', ')}, ${alpha})`
  }

  return {
    colorPalette,
    getColor,
  }
}
