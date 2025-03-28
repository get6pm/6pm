import config from '@/constants/config'

export function getColorValue(color: string = 'gray') {
  if (color.startsWith('#') && color !== '#ccc') {
    return color
  }

  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  const colorFromConfig = (config.colors as any)[color]

  if (!colorFromConfig) {
    return config.colors.gray
  }

  return colorFromConfig
}
