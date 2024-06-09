import { Switch as NativeSwitch, useColorScheme } from 'react-native'

import { theme } from '../lib/theme'

function Switch({
  ...props
}: React.ComponentPropsWithoutRef<typeof NativeSwitch>) {
  const colorScheme = useColorScheme()
  const currentTheme = colorScheme === 'dark' ? theme.dark : theme.light

  const trackColor = props.trackColor || {
    false: currentTheme.background,
    true: currentTheme.foreground,
  }
  const thumbColor = props.thumbColor || currentTheme.background
  const iosBackgroundColor =
    props.ios_backgroundColor || currentTheme.background

  return (
    <NativeSwitch
      trackColor={trackColor}
      thumbColor={thumbColor}
      ios_backgroundColor={iosBackgroundColor}
      {...props}
    />
  )
}

export { Switch }
