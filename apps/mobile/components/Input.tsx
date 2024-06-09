import { forwardRef } from 'react'
import { Text, TextInput, View } from 'react-native'

import { cn } from '../lib/utils'

export interface InputProps
  extends React.ComponentPropsWithoutRef<typeof TextInput> {
  label?: string
  labelClasses?: string
  inputClasses?: string
  leftSection?: React.ReactNode
  rightSection?: React.ReactNode
}
const Input = forwardRef<React.ElementRef<typeof TextInput>, InputProps>(
  // biome-ignore lint/correctness/noUnusedVariables: <explanation>
  ({ className, label, labelClasses, inputClasses, leftSection, rightSection, ...props }, ref) => (
    <View className={cn('flex flex-col gap-1.5', className)}>
      {label && <Text className={cn('text-base', labelClasses)}>{label}</Text>}
      <View>
        <TextInput
          className={cn(
            inputClasses,
            'border border-border placeholder-input py-2.5 px-4 rounded-lg font-sans',
          )}
          {...props}
        />
        {rightSection && (
          <View className="absolute right-2 top-1/2 transform -translate-y-1/2">
            {rightSection}
          </View>
        )}
      </View>
    </View>
  ),
)

export { Input }
