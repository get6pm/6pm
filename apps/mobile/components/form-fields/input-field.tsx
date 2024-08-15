import { cn } from '@/lib/utils'
import { forwardRef } from 'react'
import { useController } from 'react-hook-form'
import { Text, type TextInput, type TextInputProps, View } from 'react-native'
import { Input } from '../ui/input'
import { Label } from '../ui/label'

type InputFieldProps = TextInputProps & {
  name: string
  label?: string
  leftSection?: React.ReactNode
  rightSection?: React.ReactNode
  disabled?: boolean
  wrapperClassName?: string
}

export const InputField = forwardRef(
  (
    {
      name,
      label,
      leftSection,
      rightSection,
      className,
      wrapperClassName,
      disabled,
      ...props
    }: InputFieldProps,
    ref: React.Ref<TextInput>,
  ) => {
    const {
      field: { onChange, onBlur, value },
      fieldState,
    } = useController({ name })
    return (
      <View className={cn('gap-1', wrapperClassName)}>
        {!!label && <Label nativeID={`label-${name}`}>{label}</Label>}
        <View>
          {leftSection && (
            <View className="absolute top-0 z-10">{leftSection}</View>
          )}
          <Input
            ref={ref}
            onChangeText={onChange}
            onBlur={onBlur}
            value={value?.toString()}
            className={cn(
              className,
              leftSection && 'pl-10',
              rightSection && 'pr-10',
            )}
            editable={!disabled}
            {...props}
          />
          {rightSection && (
            <View className="absolute top-0 right-2">{rightSection}</View>
          )}
        </View>
        {!!fieldState.error && (
          <Text className="text-destructive">{fieldState.error.message}</Text>
        )}
      </View>
    )
  },
)
