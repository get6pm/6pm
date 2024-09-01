import { cn } from '@/lib/utils'
import { useController } from 'react-hook-form'
import { Text, View } from 'react-native'
import { Label } from '../ui/label'
import { Switch } from '../ui/switch'

type BooleanFieldProps = {
  name: string
  label?: string
  disabled?: boolean
  wrapperClassName?: string
  className?: string
}

export const BooleanField = ({
  name,
  label,
  className,
  wrapperClassName,
  disabled,
}: BooleanFieldProps) => {
  const {
    field: { onChange, value },
    fieldState,
  } = useController({ name })
  return (
    <View className={cn('gap-1', wrapperClassName)}>
      <View className="flex-row items-center gap-4">
        {!!label && (
          <Label
            nativeID={`label-${name}`}
            onPress={() => {
              onChange(!value)
            }}
          >
            {label}
          </Label>
        )}
        <Switch
          className={cn(className)}
          checked={value}
          disabled={disabled}
          onCheckedChange={onChange}
          nativeID={`label-${name}`}
        />
      </View>
      {!!fieldState.error && (
        <Text className="text-destructive">{fieldState.error.message}</Text>
      )}
    </View>
  )
}
