import { useController } from 'react-hook-form'
import { Text, View } from 'react-native'
import { Input, type InputProps } from '../Input'

type InputFieldProps = InputProps & {
  name: string
  label?: string
}

export const InputField: React.FC<InputFieldProps> = ({
  name,
  label,
  ...props
}) => {
  const {
    field: { onChange, onBlur, value },
    fieldState,
  } = useController({ name })
  return (
    <View className="gap-1">
      {!!label && <Text className="font-sans text-sm text-primary">{label}</Text>}
      <Input onChangeText={onChange} onBlur={onBlur} value={value} {...props} />
      {!!fieldState.error && (
        <Text className="text-destructive">{fieldState.error.message}</Text>
      )}
    </View>
  )
}
