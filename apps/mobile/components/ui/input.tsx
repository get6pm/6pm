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
        'web:flex h-11 web:w-full rounded-md border border-input bg-background px-3 web:py-2 text-sm lg:text-sm native:text-base native:leading-[1.25] text-foreground placeholder:text-muted-foreground web:ring-offset-background file:border-0 file:bg-transparent file:font-medium web:focus-visible:outline-none web:focus-visible:ring-2 font-sans web:focus-visible:ring-ring web:focus-visible:ring-offset-2',
        props.editable === false && 'opacity-50 web:cursor-not-allowed',
        className,
      )}
      placeholderClassName={cn(
        'text-muted-foreground font-sans',
        placeholderClassName,
      )}
      {...props}
    />
  )
})

Input.displayName = 'Input'

export { Input }
