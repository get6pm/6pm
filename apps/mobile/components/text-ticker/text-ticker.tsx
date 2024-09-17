import { cn } from '@/lib/utils'
import React, { useState } from 'react'
import { type TextStyle, TouchableOpacity } from 'react-native'
import Animated, {
  LinearTransition,
  SlideInDown,
  SlideOutDown,
} from 'react-native-reanimated'
import { Text } from '../ui/text'

function formatNumberWithCommas(formatter: Intl.NumberFormat, num: number) {
  const formattedNum = formatter.format(num)
  const result: { value: string; key: string }[] = []
  let commaCount = 0

  for (let i = 0; i < formattedNum.length; i++) {
    const char = formattedNum[i]
    // We want to count the number of commas because we would like to
    // keep the index of the digits the same.
    if (char === ',') {
      result.push({ value: char, key: `comma-${i}` })

      commaCount++
    } else {
      result.push({ value: char, key: `digit-${i - commaCount}` })
    }
  }

  return result
}

type TextTickerProps = {
  style?: TextStyle
  className?: string
  onChangeText?: (text: string) => void
  value: string | number
  formatter?: Intl.NumberFormat
  autoFocus?: boolean
  suffix?: string
  suffixClassName?: string
  onPressSuffix?: () => void
}

export function TextTicker({
  style,
  className,
  value = '0',
  formatter = new Intl.NumberFormat('en-US'),
  suffix,
  suffixClassName,
  onPressSuffix,
}: TextTickerProps) {
  const initialFontSize = style?.fontSize ?? 68
  const animationDuration = 300
  const [fontSize, setFontSize] = useState(initialFontSize)

  const formattedNumbers = React.useMemo(() => {
    return formatNumberWithCommas(formatter, parseFloat(String(value) || '0'))
  }, [value, formatter])

  return (
    <Animated.View
      style={{
        height: fontSize * 1.2,
      }}
      className="w-full"
    >
      {/* Using a dummy Text to let React Native do the math for the font size,
      in case the text will not fit on a single line. */}
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        className={cn(
          className,
          'absolute right-0 left-0 text-center opacity-0',
        )}
        style={{
          fontSize: initialFontSize,
          lineHeight: initialFontSize,
          top: -10000,
        }}
        onTextLayout={(e) => {
          setFontSize(Math.round(e.nativeEvent.lines[0].ascender))
        }}
      >
        {formattedNumbers.map((x) => x.value).join('')}
        {suffix}
      </Text>
      <Animated.View className="w-full flex-1 flex-row items-end justify-center overflow-hidden">
        {formattedNumbers.map((formattedNumber) => {
          return (
            <Animated.View
              layout={LinearTransition.duration(animationDuration)}
              key={formattedNumber.key}
              entering={SlideInDown.duration(
                animationDuration,
              ).withInitialValues({
                originY: initialFontSize / 2,
              })}
              exiting={SlideOutDown.duration(
                animationDuration,
              ).withInitialValues({
                transform: [{ translateY: -initialFontSize / 2 }],
              })}
            >
              <Animated.Text
                style={[style, { fontSize }]}
                className={cn(className, 'font-semiBold')}
              >
                {formattedNumber.value}
              </Animated.Text>
            </Animated.View>
          )
        })}
        {!!suffix && (
          <Animated.View
            layout={LinearTransition.duration(animationDuration)}
            style={{ marginBottom: fontSize / 6 }}
          >
            <TouchableOpacity activeOpacity={0.8} onPress={onPressSuffix}>
              <Animated.Text
                style={{ fontSize: fontSize / 3 }}
                className={cn(
                  suffixClassName,
                  'font-medium text-muted-foreground',
                )}
              >
                {suffix}
              </Animated.Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </Animated.View>
    </Animated.View>
  )
}
