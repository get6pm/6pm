import { cn } from '@/lib/utils'
import * as Haptics from 'expo-haptics'
import { DeleteIcon } from 'lucide-react-native'
import { View } from 'react-native'
import Animated from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Button } from '../ui/button'
import { Text } from '../ui/text'

const buttonKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '000', '0']

type NumericPadProps = {
  disabled?: boolean
  value: number
  onValueChange?: (value: number) => void
  maxValue?: number
  className?: string
}

export function NumericPad({
  disabled,
  value = 0,
  onValueChange,
  maxValue = 9999999999,
  className,
}: NumericPadProps) {
  const { bottom } = useSafeAreaInsets()

  function handleKeyPress(key: string) {
    let newValue: number

    if (key === '000') {
      newValue = value * 1000
    } else {
      newValue = value * 10 + Number(key)
    }

    if (newValue > maxValue) {
      return
    }

    onValueChange?.(newValue)
  }

  function handleDelete() {
    const newValue = Math.floor(value / 10)
    onValueChange?.(newValue)
  }

  function handleClear() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    onValueChange?.(0)
  }

  return (
    <Animated.View
      className={cn(
        'flex-row flex-wrap content-center items-center border-border border-t bg-background px-2 py-1.5',
        className,
      )}
      style={{ paddingBottom: bottom }}
    >
      {buttonKeys.map((buttonKey) => (
        <View key={buttonKey} className="w-[33.33%] p-1.5">
          <Button
            disabled={disabled}
            onPress={() => handleKeyPress(buttonKey)}
            variant="ghost"
            size="lg"
            onPressIn={Haptics.selectionAsync}
          >
            <Text className="!text-2xl font-semiBold">{buttonKey}</Text>
          </Button>
        </View>
      ))}
      <View className="w-[33.33%] p-1.5">
        <Button
          disabled={disabled}
          onPress={handleDelete}
          onLongPress={handleClear}
          variant="secondary"
          size="lg"
          onPressIn={Haptics.selectionAsync}
        >
          <DeleteIcon className="size-7 text-secondary-foreground" />
        </Button>
      </View>
    </Animated.View>
  )
}
