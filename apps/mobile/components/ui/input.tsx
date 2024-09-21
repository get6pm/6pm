import { cn } from '@/lib/utils'
import * as React from 'react'
import { TextInput } from 'react-native'

const Input = React.forwardRef<
  React.ElementRef<typeof TextInput>,
  React.ComponentPropsWithoutRef<typeof TextInput>
>(({ className, placeholderClassName, ...props }, ref) => {
  return (
    <TextInput
      ref={ref}
      className={cn(
        'web:flex h-11 web:w-full rounded-md border border-input bg-background px-3 web:py-2 font-regular native:text-base text-foreground text-sm native:leading-[1.25] web:ring-offset-background file:border-0 file:bg-transparent file:font-medium web:focus-visible:outline-none web:focus-visible:ring-2 web:focus-visible:ring-ring web:focus-visible:ring-offset-2 lg:text-sm',
        props.editable === false && 'web:cursor-not-allowed opacity-50',
        className,
      )}
      placeholderClassName={cn(
        'font-regular text-muted-foreground',
        placeholderClassName,
      )}
      {...props}
    />
  )
})

Input.displayName = 'Input'

export { Input }
