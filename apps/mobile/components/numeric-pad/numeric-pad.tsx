import { cn } from '@/lib/utils'
import { DeleteIcon } from 'lucide-react-native'
import { View } from 'react-native'
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
    onValueChange?.(0)
  }

  return (
    <View
      className={cn(
        'flex-wrap bg-card flex-row border-t border-border items-center content-center p-2',
        className,
      )}
      style={{ paddingBottom: bottom }}
    >
      {buttonKeys.map((buttonKey) => (
        <View key={buttonKey} className="w-[33.33%] p-2">
          <Button
            disabled={disabled}
            onPress={() => handleKeyPress(buttonKey)}
            variant="ghost"
            size="lg"
          >
            <Text className="!text-2xl">{buttonKey}</Text>
          </Button>
        </View>
      ))}
      <View className="w-[33.33%] p-2">
        <Button
          disabled={disabled}
          onPress={handleDelete}
          onLongPress={handleClear}
          variant="secondary"
          size="lg"
        >
          <DeleteIcon className="size-8 text-primary" />
        </Button>
      </View>
    </View>
  )
}
