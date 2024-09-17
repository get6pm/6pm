import { useFeatureFlag as usePostHogFeatureFlag } from 'posthog-react-native'

export enum FeatureFlag {
  DynamicColorPalette = 'dynamic-color-palette',
}

export function useFeatureFlag(flag: FeatureFlag) {
  return usePostHogFeatureFlag(flag)
}
