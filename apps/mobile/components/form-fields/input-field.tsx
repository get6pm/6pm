import { cn } from '@/lib/utils'
import { useController } from 'react-hook-form'
import { Text, type TextInputProps, View, type TextInput } from 'react-native'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { forwardRef } from 'react'

type InputFieldProps = TextInputProps & {
  name: string
  label?: string
  leftSection?: React.ReactNode
  rightSection?: React.ReactNode
}

export const InputField = forwardRef(
  (
    {
      name,
      label,
      leftSection,
      rightSection,
      className,
      ...props
    }: InputFieldProps,
    ref: React.Ref<TextInput>,
  ) => {
    const {
      field: { onChange, onBlur, value },
      fieldState,
    } = useController({ name })
    return (
      <View className="gap-1">
        {!!label && <Label nativeID={`label-${name}`}>{label}</Label>}
        <View>
          {leftSection && (
            <View className="absolute z-10 top-1/2 transform -translate-y-1/2">
              {leftSection}
            </View>
          )}
          <Input
            ref={ref}
            onChangeText={onChange}
            onBlur={onBlur}
            value={value}
            className={cn(
              className,
              leftSection && 'pl-10',
              rightSection && 'pr-10',
            )}
            {...props}
          />
          {rightSection && (
            <View className="absolute right-2 top-1/2 transform -translate-y-1/2">
              {rightSection}
            </View>
          )}
        </View>
        {!!fieldState.error && (
          <Text className="text-destructive">{fieldState.error.message}</Text>
        )}
      </View>
    )
  },
)
